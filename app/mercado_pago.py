from __future__ import annotations

import json
import os
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

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
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"raw": raw}

        raise MercadoPagoError(
            payload.get("message")
            or payload.get("error")
            or "Erro ao comunicar com Mercado Pago.",
            status_code=exc.code,
            payload=payload,
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