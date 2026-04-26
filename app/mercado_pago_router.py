from __future__ import annotations

import os
from typing import Any, Literal

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.billing_storage import (
    ensure_billing_tables,
    get_provider_config,
    get_provider_config_map,
    set_provider_config,
)
from app.database import get_user_by_token
from app.mercado_pago import (
    MercadoPagoError,
    build_default_plan_bootstrap_payload,
    create_preapproval_plan,
    get_plan_defaults,
    get_preapproval_plan,
    get_public_config,
    mercado_pago_is_configured,
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