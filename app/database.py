from __future__ import annotations

import os
from contextlib import closing
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

import psycopg
from psycopg.rows import dict_row

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não configurada. Configure a URL interna do PostgreSQL no Render.")

USER_PUBLIC_FIELDS = """
id,
name,
email,
plan,
subscription_status,
current_period_end,
is_active,
created_at,
updated_at,
stripe_customer_id,
stripe_subscription_id,
stripe_price_id,
stripe_checkout_session_id,
plan_updated_at
"""

USER_AUTH_FIELDS = """
id,
name,
email,
password_hash,
password_salt,
plan,
subscription_status,
current_period_end,
is_active,
created_at,
updated_at,
stripe_customer_id,
stripe_subscription_id,
stripe_price_id,
stripe_checkout_session_id,
plan_updated_at
"""

STRIPE_USER_COLUMNS: dict[str, str] = {
    "subscription_status": "TEXT NOT NULL DEFAULT 'inactive'",
    "current_period_end": "TEXT",
    "stripe_customer_id": "TEXT",
    "stripe_subscription_id": "TEXT",
    "stripe_price_id": "TEXT",
    "stripe_checkout_session_id": "TEXT",
    "plan_updated_at": "TEXT",
}


def connect() -> psycopg.Connection:
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row,
        connect_timeout=15,
        application_name="studypro-api",
    )


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _row_to_dict(row: dict | None) -> dict | None:
    return dict(row) if row else None


def get_db_path() -> str:
    parsed = urlparse(DATABASE_URL)
    host = parsed.hostname or "unknown-host"
    db_name = parsed.path.lstrip("/") or "unknown-db"
    return f"postgresql://{host}/{db_name}"


def cleanup_expired_auth_tokens() -> int:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                DELETE FROM auth_tokens
                WHERE revoked_at IS NOT NULL OR expires_at <= %s
                """,
                (_now_iso(),),
            )
            deleted_rows = cursor.rowcount or 0
        conn.commit()
    return int(deleted_rows)


def revoke_all_user_auth_tokens(user_id: int) -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE auth_tokens
                SET revoked_at = %s
                WHERE user_id = %s AND revoked_at IS NULL
                """,
                (_now_iso(), user_id),
            )
        conn.commit()


def _ensure_user_billing_columns(cursor: psycopg.Cursor) -> None:
    for column_name, column_type in STRIPE_USER_COLUMNS.items():
        cursor.execute(
            f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {column_name} {column_type}"
        )


def create_table() -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS interactions (
                    id BIGSERIAL PRIMARY KEY,
                    question TEXT NOT NULL,
                    category TEXT NOT NULL,
                    response TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id BIGSERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    password_salt TEXT NOT NULL,
                    plan TEXT NOT NULL DEFAULT 'free',
                    subscription_status TEXT NOT NULL DEFAULT 'inactive',
                    current_period_end TEXT,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            _ensure_user_billing_columns(cursor)

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS auth_tokens (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    token TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    revoked_at TEXT
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS user_daily_usage (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    usage_date TEXT NOT NULL,
                    simulations_generated INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, usage_date)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS guest_daily_usage (
                    id BIGSERIAL PRIMARY KEY,
                    guest_key TEXT NOT NULL,
                    usage_date TEXT NOT NULL,
                    simulations_generated INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(guest_key, usage_date)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS stripe_webhook_events (
                    id BIGSERIAL PRIMARY KEY,
                    event_id TEXT NOT NULL UNIQUE,
                    event_type TEXT NOT NULL,
                    processed_at TEXT NOT NULL
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS simulations_v2 (
                    id BIGSERIAL PRIMARY KEY,
                    owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    title TEXT NOT NULL,
                    exam_type TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    subject TEXT,
                    question_count INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS simulation_ratings_v2 (
                    id BIGSERIAL PRIMARY KEY,
                    simulation_id BIGINT NOT NULL REFERENCES simulations_v2(id) ON DELETE CASCADE,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(simulation_id, user_id)
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS simulation_attempts_v2 (
                    id BIGSERIAL PRIMARY KEY,
                    simulation_id BIGINT NOT NULL REFERENCES simulations_v2(id) ON DELETE CASCADE,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    submitted_at TEXT NOT NULL,
                    average_time_seconds DOUBLE PRECISION NOT NULL,
                    correct_count INTEGER NOT NULL,
                    wrong_count INTEGER NOT NULL,
                    accuracy_rate DOUBLE PRECISION NOT NULL,
                    error_rate DOUBLE PRECISION NOT NULL
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS simulation_attempt_answers_v2 (
                    id BIGSERIAL PRIMARY KEY,
                    attempt_id BIGINT NOT NULL REFERENCES simulation_attempts_v2(id) ON DELETE CASCADE,
                    question_number INTEGER NOT NULL,
                    selected_option TEXT,
                    is_correct INTEGER NOT NULL,
                    time_spent_seconds DOUBLE PRECISION NOT NULL
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS hook_activity_events (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    event_type TEXT NOT NULL,
                    subject TEXT,
                    score_percentage DOUBLE PRECISION,
                    time_spent_seconds DOUBLE PRECISION,
                    metadata_json TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS hook_daily_goals (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    goal_date TEXT NOT NULL,
                    target_questions INTEGER NOT NULL DEFAULT 10,
                    target_simulations INTEGER NOT NULL DEFAULT 1,
                    target_exams INTEGER NOT NULL DEFAULT 1,
                    target_minutes INTEGER NOT NULL DEFAULT 30,
                    progress_questions INTEGER NOT NULL DEFAULT 0,
                    progress_simulations INTEGER NOT NULL DEFAULT 0,
                    progress_exams INTEGER NOT NULL DEFAULT 0,
                    progress_minutes INTEGER NOT NULL DEFAULT 0,
                    progress_review_completed INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, goal_date)
                )
                """
            )

            _create_indexes(cursor)
        conn.commit()

    cleanup_expired_auth_tokens()


def _create_indexes(cursor: psycopg.Cursor) -> None:
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at)"
    )
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan)")
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_active ON auth_tokens(token, revoked_at, expires_at)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_simulations_owner_created ON simulations_v2(owner_user_id, created_at)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_simulations_subject ON simulations_v2(subject)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_simulations_exam_year ON simulations_v2(exam_type, year)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_simulation_attempts_sim_submitted ON simulation_attempts_v2(simulation_id, submitted_at)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_simulation_attempts_user_submitted ON simulation_attempts_v2(user_id, submitted_at)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_simulation_answers_attempt_question ON simulation_attempt_answers_v2(attempt_id, question_number)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_hook_events_user_created ON hook_activity_events(user_id, created_at)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_hook_events_event_type ON hook_activity_events(event_type)"
    )


def save_interaction(question: str, category: str, response: str) -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO interactions (question, category, response, created_at)
                VALUES (%s, %s, %s, %s)
                """,
                (question, category, response, _now_iso()),
            )
        conn.commit()


def get_all_interactions() -> list[tuple[Any, ...]]:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, question, category, response, created_at
                FROM interactions
                ORDER BY id ASC
                """
            )
            data = cursor.fetchall()
    return [
        (
            row["id"],
            row["question"],
            row["category"],
            row["response"],
            row["created_at"],
        )
        for row in data
    ]


def get_recent_interactions(limit: int = 20) -> list[tuple[Any, ...]]:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, question, category, response, created_at
                FROM interactions
                ORDER BY id DESC
                LIMIT %s
                """,
                (limit,),
            )
            data = cursor.fetchall()
    ordered = data[::-1]
    return [
        (
            row["id"],
            row["question"],
            row["category"],
            row["response"],
            row["created_at"],
        )
        for row in ordered
    ]


def create_user(
    name: str,
    email: str,
    password_hash: str,
    password_salt: str,
    plan: str = "free",
) -> dict:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"""
                INSERT INTO users (
                    name,
                    email,
                    password_hash,
                    password_salt,
                    plan,
                    subscription_status,
                    is_active,
                    created_at,
                    updated_at,
                    plan_updated_at
                )
                VALUES (%s, %s, %s, %s, %s, 'inactive', 1, %s, %s, %s)
                RETURNING {USER_PUBLIC_FIELDS}
                """,
                (name, email, password_hash, password_salt, plan, now, now, now),
            )
            row = cursor.fetchone()
        conn.commit()
    return dict(row) if row else {}


def get_user_auth_by_email(email: str) -> dict | None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT {USER_AUTH_FIELDS} FROM users WHERE email = %s", (email,))
            row = cursor.fetchone()
    return _row_to_dict(row)


def get_user_by_id(user_id: int) -> dict | None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(f"SELECT {USER_PUBLIC_FIELDS} FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
    return _row_to_dict(row)


def get_user_by_stripe_customer_id(stripe_customer_id: str) -> dict | None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"SELECT {USER_PUBLIC_FIELDS} FROM users WHERE stripe_customer_id = %s",
                (stripe_customer_id,),
            )
            row = cursor.fetchone()
    return _row_to_dict(row)


def update_user_plan(
    user_id: int,
    plan: str,
    subscription_status: str | None = None,
    current_period_end: str | None = None,
    stripe_customer_id: str | None = None,
    stripe_subscription_id: str | None = None,
    stripe_price_id: str | None = None,
    stripe_checkout_session_id: str | None = None,
) -> dict | None:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"""
                UPDATE users
                SET plan = %s,
                    subscription_status = COALESCE(%s, subscription_status),
                    current_period_end = COALESCE(%s, current_period_end),
                    updated_at = %s,
                    plan_updated_at = %s,
                    stripe_customer_id = COALESCE(%s, stripe_customer_id),
                    stripe_subscription_id = COALESCE(%s, stripe_subscription_id),
                    stripe_price_id = COALESCE(%s, stripe_price_id),
                    stripe_checkout_session_id = COALESCE(%s, stripe_checkout_session_id)
                WHERE id = %s
                RETURNING {USER_PUBLIC_FIELDS}
                """,
                (
                    plan,
                    subscription_status,
                    current_period_end,
                    now,
                    now,
                    stripe_customer_id,
                    stripe_subscription_id,
                    stripe_price_id,
                    stripe_checkout_session_id,
                    user_id,
                ),
            )
            row = cursor.fetchone()
        conn.commit()
    return _row_to_dict(row)


def store_checkout_session_for_user(
    user_id: int,
    stripe_checkout_session_id: str,
    stripe_customer_id: str | None = None,
    stripe_price_id: str | None = None,
) -> dict | None:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"""
                UPDATE users
                SET updated_at = %s,
                    stripe_checkout_session_id = %s,
                    stripe_customer_id = COALESCE(%s, stripe_customer_id),
                    stripe_price_id = COALESCE(%s, stripe_price_id)
                WHERE id = %s
                RETURNING {USER_PUBLIC_FIELDS}
                """,
                (now, stripe_checkout_session_id, stripe_customer_id, stripe_price_id, user_id),
            )
            row = cursor.fetchone()
        conn.commit()
    return _row_to_dict(row)


def clear_user_subscription(user_id: int) -> dict | None:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"""
                UPDATE users
                SET plan = 'free',
                    subscription_status = 'inactive',
                    current_period_end = NULL,
                    updated_at = %s,
                    plan_updated_at = %s,
                    stripe_subscription_id = NULL
                WHERE id = %s
                RETURNING {USER_PUBLIC_FIELDS}
                """,
                (now, now, user_id),
            )
            row = cursor.fetchone()
        conn.commit()
    return _row_to_dict(row)


def create_auth_token(user_id: int, token: str, expires_at: str) -> None:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE auth_tokens
                SET revoked_at = %s
                WHERE user_id = %s AND revoked_at IS NULL
                """,
                (now, user_id),
            )
            cursor.execute(
                """
                INSERT INTO auth_tokens (user_id, token, created_at, expires_at, revoked_at)
                VALUES (%s, %s, %s, %s, NULL)
                """,
                (user_id, token, now, expires_at),
            )
        conn.commit()


def revoke_auth_token(token: str) -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE auth_tokens
                SET revoked_at = %s
                WHERE token = %s AND revoked_at IS NULL
                """,
                (_now_iso(), token),
            )
        conn.commit()


def get_user_by_token(token: str) -> dict | None:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                    users.id,
                    users.name,
                    users.email,
                    users.plan,
                    users.subscription_status,
                    users.current_period_end,
                    users.is_active,
                    users.created_at,
                    users.updated_at,
                    users.stripe_customer_id,
                    users.stripe_subscription_id,
                    users.stripe_price_id,
                    users.stripe_checkout_session_id,
                    users.plan_updated_at
                FROM auth_tokens
                INNER JOIN users ON users.id = auth_tokens.user_id
                WHERE auth_tokens.token = %s
                  AND auth_tokens.revoked_at IS NULL
                  AND auth_tokens.expires_at > %s
                  AND users.is_active = 1
                """,
                (token, now),
            )
            row = cursor.fetchone()
    return _row_to_dict(row)


def get_auth_token_record(token: str) -> dict | None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, user_id, token, created_at, expires_at, revoked_at
                FROM auth_tokens
                WHERE token = %s
                """,
                (token,),
            )
            row = cursor.fetchone()
    return _row_to_dict(row)


def get_user_usage(user_id: int, usage_date: str) -> dict:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT user_id, usage_date, simulations_generated
                FROM user_daily_usage
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
        "simulations_generated": 0,
    }


def increment_user_simulation_usage(user_id: int, usage_date: str) -> dict:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_daily_usage (
                    user_id,
                    usage_date,
                    simulations_generated,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, 1, %s, %s)
                ON CONFLICT(user_id, usage_date) DO UPDATE SET
                    simulations_generated = user_daily_usage.simulations_generated + 1,
                    updated_at = EXCLUDED.updated_at
                RETURNING user_id, usage_date, simulations_generated
                """,
                (user_id, usage_date, now, now),
            )
            row = cursor.fetchone()
        conn.commit()
    return dict(row) if row else {
        "user_id": user_id,
        "usage_date": usage_date,
        "simulations_generated": 0,
    }


def get_guest_usage(guest_key: str, usage_date: str) -> dict:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT guest_key, usage_date, simulations_generated
                FROM guest_daily_usage
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
        "simulations_generated": 0,
    }


def increment_guest_simulation_usage(guest_key: str, usage_date: str) -> dict:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO guest_daily_usage (
                    guest_key,
                    usage_date,
                    simulations_generated,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, 1, %s, %s)
                ON CONFLICT(guest_key, usage_date) DO UPDATE SET
                    simulations_generated = guest_daily_usage.simulations_generated + 1,
                    updated_at = EXCLUDED.updated_at
                RETURNING guest_key, usage_date, simulations_generated
                """,
                (guest_key, usage_date, now, now),
            )
            row = cursor.fetchone()
        conn.commit()
    return dict(row) if row else {
        "guest_key": guest_key,
        "usage_date": usage_date,
        "simulations_generated": 0,
    }


def is_stripe_event_processed(event_id: str) -> bool:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT 1 FROM stripe_webhook_events WHERE event_id = %s LIMIT 1",
                (event_id,),
            )
            row = cursor.fetchone()
    return row is not None


def mark_stripe_event_processed(event_id: str, event_type: str) -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO stripe_webhook_events (event_id, event_type, processed_at)
                VALUES (%s, %s, %s)
                ON CONFLICT(event_id) DO NOTHING
                """,
                (event_id, event_type, _now_iso()),
            )
        conn.commit()


def create_simulation_v2(
    owner_user_id: int,
    title: str,
    exam_type: str,
    year: int,
    question_count: int,
    subject: str | None = None,
) -> dict:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO simulations_v2 (
                    owner_user_id,
                    title,
                    exam_type,
                    year,
                    subject,
                    question_count,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (owner_user_id, title, exam_type, year, subject, question_count, now, now),
            )
            inserted = cursor.fetchone()
            simulation_id = int(inserted["id"])
            cursor.execute(
                """
                SELECT
                    simulations_v2.id,
                    simulations_v2.owner_user_id,
                    simulations_v2.title,
                    simulations_v2.exam_type,
                    simulations_v2.year,
                    simulations_v2.subject,
                    simulations_v2.question_count,
                    simulations_v2.created_at,
                    simulations_v2.updated_at,
                    COALESCE(AVG(simulation_ratings_v2.rating), 0) AS rating_avg,
                    COALESCE(COUNT(simulation_ratings_v2.id), 0) AS rating_count
                FROM simulations_v2
                LEFT JOIN simulation_ratings_v2
                    ON simulation_ratings_v2.simulation_id = simulations_v2.id
                WHERE simulations_v2.id = %s
                GROUP BY simulations_v2.id
                """,
                (simulation_id,),
            )
            row = cursor.fetchone()
        conn.commit()
    return _row_to_dict(row) or {}


def rate_simulation_v2(simulation_id: int, user_id: int, rating: int) -> dict | None:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM simulations_v2 WHERE id = %s", (simulation_id,))
            simulation_exists = cursor.fetchone()
            if not simulation_exists:
                return None
            cursor.execute(
                """
                INSERT INTO simulation_ratings_v2 (
                    simulation_id,
                    user_id,
                    rating,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT(simulation_id, user_id) DO UPDATE SET
                    rating = EXCLUDED.rating,
                    updated_at = EXCLUDED.updated_at
                """,
                (simulation_id, user_id, rating, now, now),
            )
            cursor.execute(
                """
                SELECT
                    simulations_v2.id,
                    simulations_v2.owner_user_id,
                    simulations_v2.title,
                    simulations_v2.exam_type,
                    simulations_v2.year,
                    simulations_v2.subject,
                    simulations_v2.question_count,
                    simulations_v2.created_at,
                    simulations_v2.updated_at,
                    COALESCE(AVG(simulation_ratings_v2.rating), 0) AS rating_avg,
                    COALESCE(COUNT(simulation_ratings_v2.id), 0) AS rating_count
                FROM simulations_v2
                LEFT JOIN simulation_ratings_v2
                    ON simulation_ratings_v2.simulation_id = simulations_v2.id
                WHERE simulations_v2.id = %s
                GROUP BY simulations_v2.id
                """,
                (simulation_id,),
            )
            row = cursor.fetchone()
        conn.commit()
    return _row_to_dict(row)


def list_simulations_v2(subject: str | None = None) -> list[dict]:
    from app.repositories_simulation import list_simulations_v2_repo
    return list_simulations_v2_repo(subject=subject)


def create_simulation_attempt_v2(simulation_id: int, user_id: int, answers: list[dict]) -> dict | None:
    if not answers:
        raise ValueError("É necessário enviar pelo menos uma resposta.")
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM simulations_v2 WHERE id = %s", (simulation_id,))
            simulation_exists = cursor.fetchone()
            if not simulation_exists:
                return None
            total = len(answers)
            correct_count = sum(1 for answer in answers if bool(answer["is_correct"]))
            wrong_count = total - correct_count
            total_time = sum(float(answer["time_spent_seconds"]) for answer in answers)
            average_time_seconds = total_time / total
            accuracy_rate = correct_count / total
            error_rate = wrong_count / total
            now = _now_iso()
            cursor.execute(
                """
                INSERT INTO simulation_attempts_v2 (
                    simulation_id,
                    user_id,
                    submitted_at,
                    average_time_seconds,
                    correct_count,
                    wrong_count,
                    accuracy_rate,
                    error_rate
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    simulation_id,
                    user_id,
                    now,
                    average_time_seconds,
                    correct_count,
                    wrong_count,
                    accuracy_rate,
                    error_rate,
                ),
            )
            inserted = cursor.fetchone()
            attempt_id = int(inserted["id"])
            cursor.executemany(
                """
                INSERT INTO simulation_attempt_answers_v2 (
                    attempt_id,
                    question_number,
                    selected_option,
                    is_correct,
                    time_spent_seconds
                )
                VALUES (%s, %s, %s, %s, %s)
                """,
                [
                    (
                        attempt_id,
                        int(answer["question_number"]),
                        answer["selected_option"],
                        1 if bool(answer["is_correct"]) else 0,
                        float(answer["time_spent_seconds"]),
                    )
                    for answer in answers
                ],
            )
        conn.commit()
    return {
        "attempt_id": attempt_id,
        "simulation_id": simulation_id,
        "average_time_seconds": average_time_seconds,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "accuracy_rate": accuracy_rate,
        "error_rate": error_rate,
    }


def get_simulation_analytics_v2(simulation_id: int, period_days: int | None = None, subject: str | None = None) -> dict | None:
    from app.repositories_simulation import get_simulation_analytics_v2_repo
    return get_simulation_analytics_v2_repo(simulation_id=simulation_id, period_days=period_days, subject=subject)


def record_hook_activity_event(
    user_id: int,
    event_type: str,
    subject: str | None = None,
    score_percentage: float | None = None,
    time_spent_seconds: float | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    from app.repositories_hook import record_hook_activity_event_repo
    record_hook_activity_event_repo(
        user_id=user_id,
        event_type=event_type,
        subject=subject,
        score_percentage=score_percentage,
        time_spent_seconds=time_spent_seconds,
        metadata=metadata,
    )


def mark_hook_review_goal_completed(user_id: int) -> None:
    now = _now_iso()
    goal_date = datetime.now(UTC).date().isoformat()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO hook_daily_goals (user_id, goal_date, created_at, updated_at, progress_review_completed)
                VALUES (%s, %s, %s, %s, 1)
                ON CONFLICT(user_id, goal_date) DO UPDATE SET
                    progress_review_completed = 1,
                    updated_at = EXCLUDED.updated_at
                """,
                (user_id, goal_date, now, now),
            )
        conn.commit()


def get_hook_daily_goal(user_id: int, goal_date: str | None = None) -> dict:
    from app.repositories_hook import get_hook_daily_goal_repo
    return get_hook_daily_goal_repo(user_id=user_id, goal_date=goal_date)


def get_hook_recent_events(user_id: int, days: int = 7) -> list[dict]:
    from app.repositories_hook import get_hook_recent_events_repo
    return get_hook_recent_events_repo(user_id=user_id, days=days)


def get_hook_streak_stats(user_id: int) -> dict:
    from app.repositories_hook import get_hook_streak_stats_repo
    return get_hook_streak_stats_repo(user_id=user_id)
