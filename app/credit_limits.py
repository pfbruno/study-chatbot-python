from __future__ import annotations

from contextlib import closing
from datetime import UTC, datetime
from typing import Any

from app.database import connect

FREE_DAILY_CREDIT_LIMIT = 10
GUEST_DAILY_CREDIT_LIMIT = 3

ACTIVE_PRO_STATUSES = {"active", "trialing", "past_due"}


class DailyCreditLimitError(ValueError):
    pass


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _today_str() -> str:
    return datetime.now(UTC).date().isoformat()


def _parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(value)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=UTC)
        return parsed
    except (TypeError, ValueError):
        return None


def is_pro_user(user: dict | None) -> bool:
    if not user:
        return False

    if str(user.get("plan") or "").lower() != "pro":
        return False

    subscription_status = str(user.get("subscription_status") or "").lower()
    if subscription_status in ACTIVE_PRO_STATUSES:
        return True

    current_period_end = _parse_iso_datetime(user.get("current_period_end"))
    return bool(current_period_end and current_period_end > datetime.now(UTC))


def get_answer_credit_cost(answers: list[str | None]) -> int:
    return sum(
        1
        for answer in answers
        if isinstance(answer, str) and answer.strip()
    )


def ensure_daily_credit_tables() -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS user_daily_credit_usage (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    usage_date TEXT NOT NULL,
                    credits_used INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, usage_date)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS guest_daily_credit_usage (
                    id BIGSERIAL PRIMARY KEY,
                    guest_key TEXT NOT NULL,
                    usage_date TEXT NOT NULL,
                    credits_used INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(guest_key, usage_date)
                )
                """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_user_daily_credit_usage_user_date
                ON user_daily_credit_usage(user_id, usage_date)
                """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_guest_daily_credit_usage_guest_date
                ON guest_daily_credit_usage(guest_key, usage_date)
                """
            )

        conn.commit()


def _build_status(
    *,
    scope: str,
    plan: str,
    usage_date: str,
    credits_used: int,
    daily_limit: int | None,
) -> dict[str, Any]:
    remaining = None if daily_limit is None else max(0, daily_limit - credits_used)
    can_consume = True if daily_limit is None else remaining > 0

    return {
        "scope": scope,
        "plan": plan,
        "usage_date": usage_date,

        # Novo modelo.
        "credits_used_today": credits_used,
        "daily_credit_limit": daily_limit,
        "credits_remaining_today": remaining,
        "can_consume": can_consume,

        # Compatibilidade com telas antigas.
        "simulations_generated_today": credits_used,
        "questions_asked_today": credits_used,
        "daily_limit": daily_limit,
        "remaining_today": remaining,
        "can_generate": can_consume,
        "can_ask": can_consume,
    }


def get_user_daily_credit_usage(user_id: int, usage_date: str | None = None) -> dict:
    ensure_daily_credit_tables()
    usage_date = usage_date or _today_str()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT user_id, usage_date, credits_used
                FROM user_daily_credit_usage
                WHERE user_id = %s AND usage_date = %s
                """,
                (user_id, usage_date),
            )
            row = cursor.fetchone()

    if row:
        return dict(row)

    return {
        "user_id": user_id,
        "usage_date": usage_date,
        "credits_used": 0,
    }


def get_guest_daily_credit_usage(guest_key: str, usage_date: str | None = None) -> dict:
    ensure_daily_credit_tables()
    usage_date = usage_date or _today_str()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT guest_key, usage_date, credits_used
                FROM guest_daily_credit_usage
                WHERE guest_key = %s AND usage_date = %s
                """,
                (guest_key, usage_date),
            )
            row = cursor.fetchone()

    if row:
        return dict(row)

    return {
        "guest_key": guest_key,
        "usage_date": usage_date,
        "credits_used": 0,
    }


def build_user_daily_credit_status(
    user: dict,
    usage_date: str | None = None,
) -> dict[str, Any]:
    usage_date = usage_date or _today_str()
    usage = get_user_daily_credit_usage(int(user["id"]), usage_date)

    if is_pro_user(user):
        return _build_status(
            scope="user",
            plan="pro",
            usage_date=usage_date,
            credits_used=int(usage["credits_used"]),
            daily_limit=None,
        )

    return _build_status(
        scope="user",
        plan="free",
        usage_date=usage_date,
        credits_used=int(usage["credits_used"]),
        daily_limit=FREE_DAILY_CREDIT_LIMIT,
    )


def build_guest_daily_credit_status(
    guest_key: str,
    usage_date: str | None = None,
) -> dict[str, Any]:
    usage_date = usage_date or _today_str()
    usage = get_guest_daily_credit_usage(guest_key, usage_date)

    return _build_status(
        scope="guest",
        plan="guest",
        usage_date=usage_date,
        credits_used=int(usage["credits_used"]),
        daily_limit=GUEST_DAILY_CREDIT_LIMIT,
    )


def _limit_message(required: int, remaining: int) -> str:
    if required <= 1:
        return (
            "Você atingiu seu limite gratuito diário. "
            "Assine o Pro para continuar estudando sem limite ou volte amanhã."
        )

    return (
        f"Você precisa de {required} crédito(s), mas possui apenas "
        f"{remaining} crédito(s) gratuito(s) hoje. "
        "Assine o Pro para continuar estudando sem limite ou volte amanhã."
    )


def ensure_user_can_consume_credits(
    user: dict,
    usage_date: str | None = None,
    amount: int = 1,
) -> dict[str, Any]:
    usage_date = usage_date or _today_str()
    amount = max(0, int(amount))

    status = build_user_daily_credit_status(user, usage_date)

    if is_pro_user(user) or amount == 0:
        return status

    remaining = int(status["credits_remaining_today"] or 0)
    if amount > remaining:
        raise DailyCreditLimitError(_limit_message(amount, remaining))

    return status


def ensure_guest_can_consume_credits(
    guest_key: str,
    usage_date: str | None = None,
    amount: int = 1,
) -> dict[str, Any]:
    usage_date = usage_date or _today_str()
    amount = max(0, int(amount))

    status = build_guest_daily_credit_status(guest_key, usage_date)

    if amount == 0:
        return status

    remaining = int(status["credits_remaining_today"] or 0)
    if amount > remaining:
        raise DailyCreditLimitError(_limit_message(amount, remaining))

    return status


def consume_user_daily_credits(
    user: dict,
    usage_date: str | None = None,
    amount: int = 1,
) -> dict[str, Any]:
    usage_date = usage_date or _today_str()
    amount = max(0, int(amount))

    if is_pro_user(user) or amount == 0:
        return build_user_daily_credit_status(user, usage_date)

    ensure_daily_credit_tables()
    now = _now_iso()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_daily_credit_usage (
                    user_id,
                    usage_date,
                    credits_used,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, 0, %s, %s)
                ON CONFLICT(user_id, usage_date) DO NOTHING
                """,
                (int(user["id"]), usage_date, now, now),
            )

            cursor.execute(
                """
                SELECT credits_used
                FROM user_daily_credit_usage
                WHERE user_id = %s AND usage_date = %s
                FOR UPDATE
                """,
                (int(user["id"]), usage_date),
            )
            row = cursor.fetchone()
            used = int(row["credits_used"] if row else 0)
            remaining = max(0, FREE_DAILY_CREDIT_LIMIT - used)

            if amount > remaining:
                raise DailyCreditLimitError(_limit_message(amount, remaining))

            cursor.execute(
                """
                UPDATE user_daily_credit_usage
                SET credits_used = credits_used + %s,
                    updated_at = %s
                WHERE user_id = %s AND usage_date = %s
                """,
                (amount, now, int(user["id"]), usage_date),
            )

        conn.commit()

    return build_user_daily_credit_status(user, usage_date)


def consume_guest_daily_credits(
    guest_key: str,
    usage_date: str | None = None,
    amount: int = 1,
) -> dict[str, Any]:
    usage_date = usage_date or _today_str()
    amount = max(0, int(amount))

    if amount == 0:
        return build_guest_daily_credit_status(guest_key, usage_date)

    ensure_daily_credit_tables()
    now = _now_iso()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO guest_daily_credit_usage (
                    guest_key,
                    usage_date,
                    credits_used,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, 0, %s, %s)
                ON CONFLICT(guest_key, usage_date) DO NOTHING
                """,
                (guest_key, usage_date, now, now),
            )

            cursor.execute(
                """
                SELECT credits_used
                FROM guest_daily_credit_usage
                WHERE guest_key = %s AND usage_date = %s
                FOR UPDATE
                """,
                (guest_key, usage_date),
            )
            row = cursor.fetchone()
            used = int(row["credits_used"] if row else 0)
            remaining = max(0, GUEST_DAILY_CREDIT_LIMIT - used)

            if amount > remaining:
                raise DailyCreditLimitError(_limit_message(amount, remaining))

            cursor.execute(
                """
                UPDATE guest_daily_credit_usage
                SET credits_used = credits_used + %s,
                    updated_at = %s
                WHERE guest_key = %s AND usage_date = %s
                """,
                (amount, now, guest_key, usage_date),
            )

        conn.commit()

    return build_guest_daily_credit_status(guest_key, usage_date)
