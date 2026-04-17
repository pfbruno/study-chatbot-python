from __future__ import annotations

from contextlib import closing
from datetime import UTC, datetime

from app.database import connect


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def ensure_chat_usage_tables() -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS user_chat_daily_usage (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    usage_date TEXT NOT NULL,
                    questions_asked INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, usage_date)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS guest_chat_daily_usage (
                    id BIGSERIAL PRIMARY KEY,
                    guest_key TEXT NOT NULL,
                    usage_date TEXT NOT NULL,
                    questions_asked INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(guest_key, usage_date)
                )
                """
            )
        conn.commit()


def get_user_chat_usage(user_id: int, usage_date: str) -> dict:
    ensure_chat_usage_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT user_id, usage_date, questions_asked
                FROM user_chat_daily_usage
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
        "questions_asked": 0,
    }


def increment_user_chat_usage(user_id: int, usage_date: str) -> dict:
    ensure_chat_usage_tables()
    now = _now_iso()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_chat_daily_usage (
                    user_id,
                    usage_date,
                    questions_asked,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, 1, %s, %s)
                ON CONFLICT(user_id, usage_date) DO UPDATE SET
                    questions_asked = user_chat_daily_usage.questions_asked + 1,
                    updated_at = EXCLUDED.updated_at
                RETURNING user_id, usage_date, questions_asked
                """,
                (user_id, usage_date, now, now),
            )
            row = cursor.fetchone()
        conn.commit()

    return dict(row) if row else {
        "user_id": user_id,
        "usage_date": usage_date,
        "questions_asked": 0,
    }


def get_guest_chat_usage(guest_key: str, usage_date: str) -> dict:
    ensure_chat_usage_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT guest_key, usage_date, questions_asked
                FROM guest_chat_daily_usage
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
        "questions_asked": 0,
    }


def increment_guest_chat_usage(guest_key: str, usage_date: str) -> dict:
    ensure_chat_usage_tables()
    now = _now_iso()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO guest_chat_daily_usage (
                    guest_key,
                    usage_date,
                    questions_asked,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, 1, %s, %s)
                ON CONFLICT(guest_key, usage_date) DO UPDATE SET
                    questions_asked = guest_chat_daily_usage.questions_asked + 1,
                    updated_at = EXCLUDED.updated_at
                RETURNING guest_key, usage_date, questions_asked
                """,
                (guest_key, usage_date, now, now),
            )
            row = cursor.fetchone()
        conn.commit()

    return dict(row) if row else {
        "guest_key": guest_key,
        "usage_date": usage_date,
        "questions_asked": 0,
    }