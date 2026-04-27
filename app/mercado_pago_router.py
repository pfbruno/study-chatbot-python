from __future__ import annotations

import os
from datetime import UTC, datetime
from typing import Any, Literal

from fastapi import APIRouter, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field, field_validator

from app.billing_storage import (
    ensure_billing_tables,
    get_billing_subscription_by_external_reference,
    get_billing_subscription_by_provider_subscription_id,
    get_billing_subscription_by_user_id,
    get_provider_config,
    get_provider_config_map,
    set_provider_config,
    sync_user_subscription_state,
    upsert_billing_subscription,
)
from app.database import get_user_by_token
from app.mercado_pago import (
    MercadoPagoError,
    build_default_plan_bootstrap_payload,
    build_default_subscription_dates,
    create_preapproval,
    create_preapproval_plan,
    get_payment,
    get_plan_defaults,
    get_preapproval,
    get_preapproval_plan,
    get_public_config,
    mercado_pago_is_configured,
    update_preapproval,
    validate_webhook_signature,
)

router = APIRouter(tags=["billing-mercadopago"])

BILLING_ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.getenv("BILLING_ADMIN_EMAILS", "").split(",")
    if email.strip()
}
MERCADOPAGO_BOOTSTRAP_SECRET = os.getenv("MERCADOPAGO_BOOTSTRAP_SECRET", "").strip()


class MercadoPagoPlanBootstrapRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=120)
    transaction_amount: float | None = Field(default=None, gt=0)
    frequency: int | None = Field(default=None, ge=1, le=24)
    frequency_type: Literal["days", "months"] | None = None
    currency_id: str | None = Field(default=None, min_length=3, max_length=8)
    back_url: str | None = Field(default=None, max_length=255)
    force_recreate: bool = False

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("currency_id")
    @classmethod
    def validate_currency_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip().upper()


class CreateMercadoPagoSubscriptionRequest(BaseModel):
    card_token_id: str = Field(..., min_length=8, max_length=255)
    payer_email: str = Field(..., min_length=5, max_length=255)
    identification_type: str | None = Field(default=None, max_length=40)
    identification_number: str | None = Field(default=None, max_length=40)

    @field_validator("card_token_id")
    @classmethod
    def validate_card_token(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("card_token_id inválido.")
        return normalized

    @field_validator("payer_email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized:
            raise ValueError("payer_email inválido.")
        return normalized


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    prefix = "Bearer "
    if not authorization.startswith(prefix):
        return None

    token = authorization[len(prefix) :].strip()
    return token or None


def _serialize_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "plan": user.get("plan", "free"),
        "subscription_status": user.get("subscription_status", "inactive"),
        "current_period_end": user.get("current_period_end"),
        "is_active": bool(user.get("is_active", 1)),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
    }


def _get_current_user_or_401(authorization: str | None) -> dict:
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Token ausente ou inválido.")

    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")

    return user


def _enforce_bootstrap_permission(
    user: dict,
    bootstrap_secret: str | None,
) -> None:
    if MERCADOPAGO_BOOTSTRAP_SECRET:
        if bootstrap_secret != MERCADOPAGO_BOOTSTRAP_SECRET:
            raise HTTPException(
                status_code=403,
                detail="x-bootstrap-secret inválido para bootstrap do plano.",
            )

    if BILLING_ADMIN_EMAILS and str(user.get("email", "")).lower() not in BILLING_ADMIN_EMAILS:
        raise HTTPException(
            status_code=403,
            detail="Usuário sem permissão para bootstrap de billing.",
        )


def _get_stored_plan_data() -> dict[str, Any]:
    plan_id = get_provider_config("plan_id")
    plan_reason = get_provider_config("plan_reason")
    amount = get_provider_config("plan_amount")
    frequency = get_provider_config("plan_frequency")
    frequency_type = get_provider_config("plan_frequency_type")
    currency_id = get_provider_config("plan_currency_id")
    back_url = get_provider_config("plan_back_url")

    return {
        "plan_id": plan_id,
        "reason": plan_reason,
        "transaction_amount": float(amount) if amount else None,
        "frequency": int(frequency) if frequency else None,
        "frequency_type": frequency_type,
        "currency_id": currency_id,
        "back_url": back_url,
    }


def _normalize_subscription_status(value: str | None) -> str:
    normalized = str(value or "").strip().lower()
    if not normalized:
        return "pending"
    return normalized


def _derive_user_plan_from_subscription_status(status: str) -> tuple[str, str]:
    if status in {"authorized", "active"}:
        return "pro", "active"

    if status in {"paused", "pending"}:
        return "free", "pending"

    if status in {"cancelled", "canceled"}:
        return "free", "cancelled"

    return "free", status


def _sync_subscription_and_user(
    *,
    user_id: int,
    provider_plan_id: str | None,
    provider_subscription_id: str | None,
    external_reference: str | None,
    payer_email: str | None,
    status: str,
    reason: str | None,
    currency_id: str,
    transaction_amount: float,
    frequency: int,
    frequency_type: str,
    next_payment_date: str | None,
    payload: dict[str, Any],
    last_webhook_at: str | None = None,
) -> dict:
    normalized_status = _normalize_subscription_status(status)
    row = upsert_billing_subscription(
        user_id=user_id,
        provider_plan_id=provider_plan_id,
        provider_subscription_id=provider_subscription_id,
        external_reference=external_reference,
        payer_email=payer_email,
        status=normalized_status,
        reason=reason,
        currency_id=currency_id,
        transaction_amount=transaction_amount,
        frequency=frequency,
        frequency_type=frequency_type,
        next_payment_date=next_payment_date,
        last_webhook_at=last_webhook_at,
        raw_payload=payload,
    )

    user_plan, subscription_status = _derive_user_plan_from_subscription_status(
        normalized_status
    )
    sync_user_subscription_state(
        user_id=user_id,
        plan=user_plan,
        subscription_status=subscription_status,
        current_period_end=next_payment_date,
    )
    return row


def _sync_remote_subscription_payload(
    *,
    user_id: int,
    remote_subscription: dict[str, Any],
    last_webhook_at: str | None = None,
) -> dict:
    auto_recurring = remote_subscription.get("auto_recurring") or {}
    return _sync_subscription_and_user(
        user_id=user_id,
        provider_plan_id=remote_subscription.get("preapproval_plan_id"),
        provider_subscription_id=str(remote_subscription.get("id") or ""),
        external_reference=remote_subscription.get("external_reference"),
        payer_email=remote_subscription.get("payer_email"),
        status=str(remote_subscription.get("status") or "pending"),
        reason=remote_subscription.get("reason"),
        currency_id=str(auto_recurring.get("currency_id") or "BRL"),
        transaction_amount=float(auto_recurring.get("transaction_amount") or 29.0),
        frequency=int(auto_recurring.get("frequency") or 1),
        frequency_type=str(auto_recurring.get("frequency_type") or "months"),
        next_payment_date=remote_subscription.get("next_payment_date")
        or auto_recurring.get("end_date"),
        payload=remote_subscription,
        last_webhook_at=last_webhook_at,
    )


@router.get("/billing/public-config")
def get_billing_public_config() -> dict:
    ensure_billing_tables()

    public_config = get_public_config()
    stored_plan = _get_stored_plan_data()

    return {
        **public_config,
        "stored_plan": stored_plan,
        "config_map": get_provider_config_map(),
    }

@router.get("/billing/mercadopago/webhook/config")
def get_mercado_pago_webhook_config(
    authorization: str | None = Header(default=None),
    x_bootstrap_secret: str | None = Header(default=None),
) -> dict:
    ensure_billing_tables()

    user = _get_current_user_or_401(authorization)
    _enforce_bootstrap_permission(user, x_bootstrap_secret)

    backend_base_url = os.getenv(
        "BACKEND_BASE_URL",
        "https://study-chatbot-python.onrender.com",
    ).rstrip("/")

    return {
        "provider": "mercadopago",
        "webhook_url": f"{backend_base_url}/billing/mercadopago/webhook",
        "recommended_events": [
            "payment",
            "subscription_authorized_payment",
            "subscription_preapproval",
        ],
        "secret_configured": bool(os.getenv("MERCADOPAGO_WEBHOOK_SECRET", "").strip()),
        "message": (
            "Cadastre esta URL no painel do Mercado Pago e depois substitua "
            "MERCADOPAGO_WEBHOOK_SECRET pelo segredo real do webhook."
        ),
    }

@router.post("/billing/mercadopago/plan/bootstrap")
def bootstrap_mercado_pago_plan(
    payload: MercadoPagoPlanBootstrapRequest,
    authorization: str | None = Header(default=None),
    x_bootstrap_secret: str | None = Header(default=None),
) -> dict:
    ensure_billing_tables()

    user = _get_current_user_or_401(authorization)
    _enforce_bootstrap_permission(user, x_bootstrap_secret)

    if not mercado_pago_is_configured():
        raise HTTPException(
            status_code=500,
            detail=(
                "Mercado Pago não configurado. Defina "
                "MERCADOPAGO_ACCESS_TOKEN e MERCADOPAGO_PUBLIC_KEY."
            ),
        )

    stored_plan_id = get_provider_config("plan_id")
    if stored_plan_id and not payload.force_recreate:
        try:
            remote_plan = get_preapproval_plan(stored_plan_id)
        except MercadoPagoError as exc:
            raise HTTPException(
                status_code=exc.status_code or 502,
                detail=str(exc),
            ) from exc

        return {
            "message": "Plano Mercado Pago já existente.",
            "provider": "mercadopago",
            "plan_id": stored_plan_id,
            "plan": remote_plan,
            "user": _serialize_user(user),
        }

    overrides = payload.model_dump(exclude_none=True)
    bootstrap_defaults = build_default_plan_bootstrap_payload(overrides)
    plan_defaults = get_plan_defaults(overrides)

    try:
        created_plan = create_preapproval_plan(
            reason=bootstrap_defaults["reason"],
            transaction_amount=bootstrap_defaults["transaction_amount"],
            frequency=bootstrap_defaults["frequency"],
            frequency_type=bootstrap_defaults["frequency_type"],
            currency_id=bootstrap_defaults["currency_id"],
            back_url=bootstrap_defaults["back_url"],
        )
    except MercadoPagoError as exc:
        raise HTTPException(
            status_code=exc.status_code or 502,
            detail=str(exc),
        ) from exc

    created_plan_id = str(created_plan.get("id") or "").strip()
    if not created_plan_id:
        raise HTTPException(
            status_code=502,
            detail="Mercado Pago não retornou o id do plano criado.",
        )

    set_provider_config("plan_id", created_plan_id)
    set_provider_config("plan_reason", str(plan_defaults["reason"]))
    set_provider_config("plan_amount", str(plan_defaults["transaction_amount"]))
    set_provider_config("plan_frequency", str(plan_defaults["frequency"]))
    set_provider_config("plan_frequency_type", str(plan_defaults["frequency_type"]))
    set_provider_config("plan_currency_id", str(plan_defaults["currency_id"]))
    set_provider_config("plan_back_url", str(plan_defaults["back_url"]))

    return {
        "message": "Plano Mercado Pago criado com sucesso.",
        "provider": "mercadopago",
        "plan_id": created_plan_id,
        "plan": created_plan,
        "user": _serialize_user(user),
    }


@router.post("/billing/mercadopago/subscriptions")
def create_mercado_pago_subscription(
    payload: CreateMercadoPagoSubscriptionRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    ensure_billing_tables()
    user = _get_current_user_or_401(authorization)

    if not mercado_pago_is_configured():
        raise HTTPException(
            status_code=500,
            detail="Mercado Pago não configurado no backend.",
        )

    existing = get_billing_subscription_by_user_id(int(user["id"]))
    if existing and str(existing.get("status") or "").lower() in {"authorized", "active"}:
        return {
            "message": "Assinatura ativa já encontrada para este usuário.",
            "subscription": existing,
            "user": _serialize_user(user),
        }

    stored_plan_id = get_provider_config("plan_id")
    if not stored_plan_id:
        raise HTTPException(
            status_code=409,
            detail=(
                "O plano do Mercado Pago ainda não foi criado no backend. "
                "Execute o bootstrap do plano antes de criar a assinatura."
            ),
        )

    defaults = get_plan_defaults()
    dates = build_default_subscription_dates()
    external_reference = f"studypro-user-{user['id']}"

    try:
        created = create_preapproval(
            preapproval_plan_id=stored_plan_id,
            reason=defaults["reason"],
            external_reference=external_reference,
            payer_email=payload.payer_email,
            card_token_id=payload.card_token_id,
            transaction_amount=float(defaults["transaction_amount"]),
            currency_id=str(defaults["currency_id"]),
            frequency=int(defaults["frequency"]),
            frequency_type=str(defaults["frequency_type"]),
            back_url=str(defaults["back_url"]),
            start_date=dates["start_date"],
            end_date=dates["end_date"],
        )
    except MercadoPagoError as exc:
        raise HTTPException(
            status_code=exc.status_code or 502,
            detail=str(exc),
        ) from exc

    row = _sync_remote_subscription_payload(
        user_id=int(user["id"]),
        remote_subscription=created,
    )

    refreshed_user = get_user_by_token(_extract_bearer_token(authorization) or "")
    return {
        "message": "Assinatura criada com sucesso.",
        "provider": "mercadopago",
        "subscription": row,
        "remote_subscription": created,
        "user": _serialize_user(refreshed_user or user),
    }


@router.post("/billing/mercadopago/webhook")
async def mercado_pago_webhook(
    request: Request,
    data_id: str | None = Query(default=None, alias="data.id"),
    topic: str | None = Query(default=None),
    type_param: str | None = Query(default=None, alias="type"),
    x_signature: str | None = Header(default=None, alias="x-signature"),
    x_request_id: str | None = Header(default=None, alias="x-request-id"),
) -> dict:
    ensure_billing_tables()

    raw_query = request.url.query
    payload = await request.json()
    notification_type = str(
        payload.get("type") or type_param or topic or ""
    ).strip()
    resource_id = str(
        data_id or (payload.get("data") or {}).get("id") or ""
    ).strip()

    is_valid = validate_webhook_signature(
        x_signature=x_signature,
        x_request_id=x_request_id,
        raw_query_string=raw_query,
    )
    if not is_valid:
        raise HTTPException(status_code=401, detail="Webhook Mercado Pago inválido.")

    processed = False
    last_webhook_at = datetime.now(UTC).isoformat()

    if notification_type in {"subscription_preapproval", "subscription", "preapproval"} and resource_id:
        try:
            remote_subscription = get_preapproval(resource_id)
        except MercadoPagoError as exc:
            raise HTTPException(
                status_code=exc.status_code or 502,
                detail=str(exc),
            ) from exc

        external_reference = remote_subscription.get("external_reference")
        local_subscription = None
        if external_reference:
            local_subscription = get_billing_subscription_by_external_reference(
                str(external_reference)
            )
        if not local_subscription:
            local_subscription = get_billing_subscription_by_provider_subscription_id(
                str(remote_subscription.get("id") or "")
            )

        if local_subscription:
            _sync_remote_subscription_payload(
                user_id=int(local_subscription["user_id"]),
                remote_subscription=remote_subscription,
                last_webhook_at=last_webhook_at,
            )
            processed = True

    elif notification_type in {"payment", "subscription_authorized_payment"} and resource_id:
        try:
            payment = get_payment(resource_id)
        except MercadoPagoError as exc:
            raise HTTPException(
                status_code=exc.status_code or 502,
                detail=str(exc),
            ) from exc

        external_reference = str(payment.get("external_reference") or "").strip()
        local_subscription = (
            get_billing_subscription_by_external_reference(external_reference)
            if external_reference
            else None
        )
        if local_subscription:
            upsert_billing_subscription(
                user_id=int(local_subscription["user_id"]),
                provider_plan_id=local_subscription.get("provider_plan_id"),
                provider_subscription_id=local_subscription.get("provider_subscription_id"),
                external_reference=local_subscription.get("external_reference"),
                payer_email=local_subscription.get("payer_email"),
                status=local_subscription.get("status") or "pending",
                reason=local_subscription.get("reason"),
                currency_id=local_subscription.get("currency_id") or "BRL",
                transaction_amount=float(local_subscription.get("transaction_amount") or 29.0),
                frequency=int(local_subscription.get("frequency") or 1),
                frequency_type=local_subscription.get("frequency_type") or "months",
                next_payment_date=local_subscription.get("next_payment_date"),
                last_webhook_at=last_webhook_at,
                raw_payload={"payment": payment},
            )
            processed = True

    return {
        "message": "Webhook Mercado Pago recebido.",
        "processed": processed,
        "notification_type": notification_type,
        "resource_id": resource_id,
    }


@router.post("/billing/cancel")
def cancel_active_subscription(
    authorization: str | None = Header(default=None),
) -> dict:
    ensure_billing_tables()
    user = _get_current_user_or_401(authorization)

    local_subscription = get_billing_subscription_by_user_id(int(user["id"]))
    if not local_subscription or not local_subscription.get("provider_subscription_id"):
        raise HTTPException(
            status_code=404,
            detail="Nenhuma assinatura Mercado Pago encontrada para este usuário.",
        )

    subscription_id = str(local_subscription["provider_subscription_id"])

    try:
        updated = update_preapproval(subscription_id, {"status": "cancelled"})
    except MercadoPagoError as exc:
        raise HTTPException(
            status_code=exc.status_code or 502,
            detail=str(exc),
        ) from exc

    _sync_remote_subscription_payload(
        user_id=int(user["id"]),
        remote_subscription=updated,
    )

    refreshed_user = get_user_by_token(_extract_bearer_token(authorization) or "")
    return {
        "message": "Assinatura cancelada com sucesso.",
        "subscription": updated,
        "user": _serialize_user(refreshed_user or user),
    }


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    prefix = "Bearer "
    if not authorization.startswith(prefix):
        return None

    token = authorization[len(prefix) :].strip()
    return token or None