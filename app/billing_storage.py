from __future__ import annotations

import json
from contextlib import closing
from datetime import UTC, datetime
from typing import Any

from app.database import connect

DEFAULT_PROVIDER = "mercadopago"


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def ensure_billing_tables() -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS billing_provider_configs (
                    id BIGSERIAL PRIMARY KEY,
                    provider TEXT NOT NULL,
                    config_key TEXT NOT NULL,
                    config_value TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(provider, config_key)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS billing_subscriptions (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    provider TEXT NOT NULL DEFAULT 'mercadopago',
                    provider_plan_id TEXT,
                    provider_subscription_id TEXT UNIQUE,
                    external_reference TEXT UNIQUE,
                    payer_email TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    reason TEXT,
                    currency_id TEXT NOT NULL DEFAULT 'BRL',
                    transaction_amount NUMERIC(10,2) NOT NULL DEFAULT 29.00,
                    frequency INTEGER NOT NULL DEFAULT 1,
                    frequency_type TEXT NOT NULL DEFAULT 'months',
                    next_payment_date TEXT,
                    last_webhook_at TEXT,
                    raw_payload_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, provider)
                )
                """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_billing_provider_configs_provider_key
                ON billing_provider_configs(provider, config_key)
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user_provider
                ON billing_subscriptions(user_id, provider)
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_provider_subscription
                ON billing_subscriptions(provider_subscription_id)
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_external_reference
                ON billing_subscriptions(external_reference)
                """
            )

        conn.commit()


def get_provider_config(
    config_key: str,
    provider: str = DEFAULT_PROVIDER,
) -> str | None:
    ensure_billing_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT config_value
                FROM billing_provider_configs
                WHERE provider = %s AND config_key = %s
                LIMIT 1
                """,
                (provider, config_key),
            )
            row = cursor.fetchone()

    if not row:
        return None

    return row["config_value"]


def set_provider_config(
    config_key: str,
    config_value: str | None,
    provider: str = DEFAULT_PROVIDER,
) -> None:
    ensure_billing_tables()

    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO billing_provider_configs (
                    provider,
                    config_key,
                    config_value,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT(provider, config_key) DO UPDATE SET
                    config_value = EXCLUDED.config_value,
                    updated_at = EXCLUDED.updated_at
                """,
                (provider, config_key, config_value, now, now),
            )
        conn.commit()


def get_provider_config_map(
    provider: str = DEFAULT_PROVIDER,
) -> dict[str, str]:
    ensure_billing_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT config_key, config_value
                FROM billing_provider_configs
                WHERE provider = %s
                ORDER BY config_key ASC
                """,
                (provider,),
            )
            rows = cursor.fetchall()

    return {row["config_key"]: row["config_value"] for row in rows}


def get_billing_subscription_by_user_id(
    user_id: int,
    provider: str = DEFAULT_PROVIDER,
) -> dict | None:
    ensure_billing_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM billing_subscriptions
                WHERE user_id = %s AND provider = %s
                LIMIT 1
                """,
                (user_id, provider),
            )
            row = cursor.fetchone()

    return dict(row) if row else None


def get_billing_subscription_by_provider_subscription_id(
    provider_subscription_id: str,
    provider: str = DEFAULT_PROVIDER,
) -> dict | None:
    ensure_billing_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM billing_subscriptions
                WHERE provider_subscription_id = %s AND provider = %s
                LIMIT 1
                """,
                (provider_subscription_id, provider),
            )
            row = cursor.fetchone()

    return dict(row) if row else None


def upsert_billing_subscription(
    *,
    user_id: int,
    provider: str = DEFAULT_PROVIDER,
    provider_plan_id: str | None = None,
    provider_subscription_id: str | None = None,
    external_reference: str | None = None,
    payer_email: str | None = None,
    status: str = "pending",
    reason: str | None = None,
    currency_id: str = "BRL",
    transaction_amount: float = 29.0,
    frequency: int = 1,
    frequency_type: str = "months",
    next_payment_date: str | None = None,
    last_webhook_at: str | None = None,
    raw_payload: dict[str, Any] | None = None,
) -> dict:
    ensure_billing_tables()

    now = _now_iso()
    raw_payload_json = json.dumps(raw_payload, ensure_ascii=False) if raw_payload else None

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO billing_subscriptions (
                    user_id,
                    provider,
                    provider_plan_id,
                    provider_subscription_id,
                    external_reference,
                    payer_email,
                    status,
                    reason,
                    currency_id,
                    transaction_amount,
                    frequency,
                    frequency_type,
                    next_payment_date,
                    last_webhook_at,
                    raw_payload_json,
                    created_at,
                    updated_at
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT(user_id, provider) DO UPDATE SET
                    provider_plan_id = COALESCE(EXCLUDED.provider_plan_id, billing_subscriptions.provider_plan_id),
                    provider_subscription_id = COALESCE(EXCLUDED.provider_subscription_id, billing_subscriptions.provider_subscription_id),
                    external_reference = COALESCE(EXCLUDED.external_reference, billing_subscriptions.external_reference),
                    payer_email = COALESCE(EXCLUDED.payer_email, billing_subscriptions.payer_email),
                    status = COALESCE(EXCLUDED.status, billing_subscriptions.status),
                    reason = COALESCE(EXCLUDED.reason, billing_subscriptions.reason),
                    currency_id = COALESCE(EXCLUDED.currency_id, billing_subscriptions.currency_id),
                    transaction_amount = COALESCE(EXCLUDED.transaction_amount, billing_subscriptions.transaction_amount),
                    frequency = COALESCE(EXCLUDED.frequency, billing_subscriptions.frequency),
                    frequency_type = COALESCE(EXCLUDED.frequency_type, billing_subscriptions.frequency_type),
                    next_payment_date = COALESCE(EXCLUDED.next_payment_date, billing_subscriptions.next_payment_date),
                    last_webhook_at = COALESCE(EXCLUDED.last_webhook_at, billing_subscriptions.last_webhook_at),
                    raw_payload_json = COALESCE(EXCLUDED.raw_payload_json, billing_subscriptions.raw_payload_json),
                    updated_at = EXCLUDED.updated_at
                RETURNING *
                """,
                (
                    user_id,
                    provider,
                    provider_plan_id,
                    provider_subscription_id,
                    external_reference,
                    payer_email,
                    status,
                    reason,
                    currency_id,
                    transaction_amount,
                    frequency,
                    frequency_type,
                    next_payment_date,
                    last_webhook_at,
                    raw_payload_json,
                    now,
                    now,
                ),
            )
            row = cursor.fetchone()

        conn.commit()

    return dict(row)