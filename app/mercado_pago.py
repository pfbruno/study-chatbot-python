from __future__ import annotations

import hashlib
import hmac
import json
import os
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import parse_qs
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

MERCADOPAGO_API_BASE = os.getenv("MERCADOPAGO_API_BASE", "https://api.mercadopago.com").rstrip("/")
MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "").strip()
MERCADOPAGO_PUBLIC_KEY = os.getenv("MERCADOPAGO_PUBLIC_KEY", "").strip()
MERCADOPAGO_WEBHOOK_SECRET = os.getenv("MERCADOPAGO_WEBHOOK_SECRET", "").strip()
MERCADOPAGO_PLAN_REASON = os.getenv("MERCADOPAGO_PLAN_REASON", "StudyPro Pro").strip()
MERCADOPAGO_PLAN_AMOUNT = float(os.getenv("MERCADOPAGO_PLAN_AMOUNT", "29.00").strip())
MERCADOPAGO_PLAN_FREQUENCY = int(os.getenv("MERCADOPAGO_PLAN_FREQUENCY", "1").strip())
MERCADOPAGO_PLAN_FREQUENCY_TYPE = os.getenv("MERCADOPAGO_PLAN_FREQUENCY_TYPE", "months").strip()
MERCADOPAGO_PLAN_CURRENCY_ID = os.getenv("MERCADOPAGO_PLAN_CURRENCY_ID", "BRL").strip()
FRONTEND_BASE_URL = os.getenv(
    "FRONTEND_BASE_URL",
    "https://study-chatbot-python-uksv.vercel.app",
).rstrip("/")


class MercadoPagoError(Exception):
    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        payload: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload or {}


def mercado_pago_is_configured() -> bool:
    return bool(MERCADOPAGO_ACCESS_TOKEN and MERCADOPAGO_PUBLIC_KEY)


def get_public_config() -> dict[str, Any]:
    return {
        "provider": "mercadopago",
        "public_key": MERCADOPAGO_PUBLIC_KEY,
        "is_configured": mercado_pago_is_configured(),
        "plan_defaults": {
            "reason": MERCADOPAGO_PLAN_REASON,
            "transaction_amount": MERCADOPAGO_PLAN_AMOUNT,
            "frequency": MERCADOPAGO_PLAN_FREQUENCY,
            "frequency_type": MERCADOPAGO_PLAN_FREQUENCY_TYPE,
            "currency_id": MERCADOPAGO_PLAN_CURRENCY_ID,
            "back_url": f"{FRONTEND_BASE_URL}/success?provider=mercadopago",
        },
    }


def _ensure_credentials() -> None:
    if not MERCADOPAGO_ACCESS_TOKEN:
        raise MercadoPagoError("MERCADOPAGO_ACCESS_TOKEN não configurado.")
    if not MERCADOPAGO_PUBLIC_KEY:
        raise MercadoPagoError("MERCADOPAGO_PUBLIC_KEY não configurado.")


def _request(
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    _ensure_credentials()

    url = f"{MERCADOPAGO_API_BASE}{path}"
    body = json.dumps(payload).encode("utf-8") if payload is not None else None

    request = Request(
        url=url,
        data=body,
        method=method.upper(),
        headers={
            "Authorization": f"Bearer {MERCADOPAGO_ACCESS_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = {"raw": raw}

        raise MercadoPagoError(
            parsed.get("message")
            or parsed.get("error")
            or "Erro ao comunicar com Mercado Pago.",
            status_code=exc.code,
            payload=parsed,
        ) from exc
    except URLError as exc:
        raise MercadoPagoError(f"Falha de conexão com Mercado Pago: {exc}") from exc


def get_plan_defaults(
    overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    overrides = overrides or {}

    return {
        "reason": overrides.get("reason") or MERCADOPAGO_PLAN_REASON,
        "transaction_amount": float(
            overrides.get("transaction_amount", MERCADOPAGO_PLAN_AMOUNT)
        ),
        "frequency": int(overrides.get("frequency", MERCADOPAGO_PLAN_FREQUENCY)),
        "frequency_type": str(
            overrides.get("frequency_type", MERCADOPAGO_PLAN_FREQUENCY_TYPE)
        ),
        "currency_id": overrides.get("currency_id") or MERCADOPAGO_PLAN_CURRENCY_ID,
        "back_url": overrides.get("back_url")
        or f"{FRONTEND_BASE_URL}/success?provider=mercadopago",
    }


def create_preapproval_plan(
    *,
    reason: str,
    transaction_amount: float,
    frequency: int,
    frequency_type: str,
    currency_id: str,
    back_url: str,
) -> dict[str, Any]:
    payload = {
        "reason": reason,
        "auto_recurring": {
            "frequency": frequency,
            "frequency_type": frequency_type,
            "transaction_amount": transaction_amount,
            "currency_id": currency_id,
        },
        "back_url": back_url,
        "status": "active",
    }
    return _request("POST", "/preapproval_plan", payload)


def get_preapproval_plan(plan_id: str) -> dict[str, Any]:
    if not plan_id:
        raise MercadoPagoError("plan_id ausente.")
    return _request("GET", f"/preapproval_plan/{plan_id}")


def build_default_plan_bootstrap_payload(
    overrides: dict[str, Any] | None = None,
) -> dict[str, Any]:
    defaults = get_plan_defaults(overrides)

    return {
        "reason": defaults["reason"],
        "transaction_amount": defaults["transaction_amount"],
        "frequency": defaults["frequency"],
        "frequency_type": defaults["frequency_type"],
        "currency_id": defaults["currency_id"],
        "back_url": defaults["back_url"],
    }


def build_default_subscription_dates() -> dict[str, str]:
    start_date = datetime.now(UTC) + timedelta(minutes=5)
    end_date = start_date + timedelta(days=365 * 5)

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
    }


def create_preapproval(
    *,
    preapproval_plan_id: str,
    reason: str,
    external_reference: str,
    payer_email: str,
    card_token_id: str,
    transaction_amount: float,
    currency_id: str,
    frequency: int,
    frequency_type: str,
    back_url: str,
    start_date: str,
    end_date: str,
) -> dict[str, Any]:
    payload = {
        "preapproval_plan_id": preapproval_plan_id,
        "reason": reason,
        "external_reference": external_reference,
        "payer_email": payer_email,
        "card_token_id": card_token_id,
        "auto_recurring": {
            "frequency": frequency,
            "frequency_type": frequency_type,
            "transaction_amount": transaction_amount,
            "currency_id": currency_id,
            "start_date": start_date,
            "end_date": end_date,
        },
        "back_url": back_url,
        "status": "authorized",
    }
    return _request("POST", "/preapproval", payload)


def get_preapproval(subscription_id: str) -> dict[str, Any]:
    if not subscription_id:
        raise MercadoPagoError("subscription_id ausente.")
    return _request("GET", f"/preapproval/{subscription_id}")


def update_preapproval(subscription_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    if not subscription_id:
        raise MercadoPagoError("subscription_id ausente.")
    return _request("PUT", f"/preapproval/{subscription_id}", payload)


def get_payment(payment_id: str) -> dict[str, Any]:
    if not payment_id:
        raise MercadoPagoError("payment_id ausente.")
    return _request("GET", f"/v1/payments/{payment_id}")


def extract_webhook_signature_parts(x_signature: str | None) -> tuple[str | None, str | None]:
    if not x_signature:
        return None, None

    ts = None
    v1 = None

    for part in x_signature.split(","):
        key_value = part.split("=", 1)
        if len(key_value) != 2:
            continue

        key = key_value[0].strip()
        value = key_value[1].strip()

        if key == "ts":
            ts = value
        elif key == "v1":
            v1 = value

    return ts, v1


def validate_webhook_signature(
    *,
    x_signature: str | None,
    x_request_id: str | None,
    raw_query_string: str,
    secret: str | None = None,
) -> bool:
    secret = (secret or MERCADOPAGO_WEBHOOK_SECRET or "").strip()

    if not secret:
        return True

    ts, received_hash = extract_webhook_signature_parts(x_signature)
    if not ts or not received_hash or not x_request_id:
        return False

    query_params = parse_qs(raw_query_string, keep_blank_values=True)
    data_id = query_params.get("data.id", [""])[0]
    if data_id and data_id.isalnum():
        data_id = data_id.lower()

    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    digest = hmac.new(
        secret.encode(),
        msg=manifest.encode(),
        digestmod=hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(digest, received_hash)