import os
import sqlite3
from datetime import UTC, datetime, timedelta
from typing import Any

DB_PATH = os.path.join(os.getcwd(), "data", "chatbot.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


USER_PUBLIC_FIELDS = """
id,
name,
email,
plan,
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
    "stripe_customer_id": "TEXT",
    "stripe_subscription_id": "TEXT",
    "stripe_price_id": "TEXT",
    "stripe_checkout_session_id": "TEXT",
    "plan_updated_at": "TEXT",
}


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _row_to_dict(row: sqlite3.Row | None) -> dict | None:
    return dict(row) if row else None


def _ensure_user_billing_columns(cursor: sqlite3.Cursor) -> None:
    cursor.execute("PRAGMA table_info(users)")
    existing_columns = {row[1] for row in cursor.fetchall()}

    for column_name, column_type in STRIPE_USER_COLUMNS.items():
        if column_name not in existing_columns:
            cursor.execute(
                f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
            )


def create_table() -> None:
    conn = connect()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            password_salt TEXT NOT NULL,
            plan TEXT NOT NULL DEFAULT 'free',
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            revoked_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS user_daily_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            usage_date TEXT NOT NULL,
            simulations_generated INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(user_id, usage_date),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS guest_daily_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id TEXT NOT NULL UNIQUE,
            event_type TEXT NOT NULL,
            processed_at TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS simulations_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            owner_user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            exam_type TEXT NOT NULL,
            year INTEGER NOT NULL,
            subject TEXT,
            question_count INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (owner_user_id) REFERENCES users(id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS simulation_ratings_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            simulation_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(simulation_id, user_id),
            FOREIGN KEY (simulation_id) REFERENCES simulations_v2(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS simulation_attempts_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            simulation_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            submitted_at TEXT NOT NULL,
            average_time_seconds REAL NOT NULL,
            correct_count INTEGER NOT NULL,
            wrong_count INTEGER NOT NULL,
            accuracy_rate REAL NOT NULL,
            error_rate REAL NOT NULL,
            FOREIGN KEY (simulation_id) REFERENCES simulations_v2(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS simulation_attempt_answers_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            attempt_id INTEGER NOT NULL,
            question_number INTEGER NOT NULL,
            selected_option TEXT,
            is_correct INTEGER NOT NULL,
            time_spent_seconds REAL NOT NULL,
            FOREIGN KEY (attempt_id) REFERENCES simulation_attempts_v2(id)
        )
        """
    )

    conn.commit()
    conn.close()


def save_interaction(question: str, category: str, response: str) -> None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO interactions (question, category, response, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (question, category, response, _now_iso()),
    )
    conn.commit()
    conn.close()


def get_all_interactions() -> list[tuple[Any, ...]]:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, question, category, response, created_at
        FROM interactions
        ORDER BY id ASC
        """
    )
    data = cursor.fetchall()
    conn.close()
    return [tuple(row) for row in data]


def get_recent_interactions(limit: int = 20) -> list[tuple[Any, ...]]:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, question, category, response, created_at
        FROM interactions
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,),
    )
    data = cursor.fetchall()
    conn.close()
    return [tuple(row) for row in data[::-1]]


def create_user(
    name: str,
    email: str,
    password_hash: str,
    password_salt: str,
    plan: str = "free",
) -> dict:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO users (
            name,
            email,
            password_hash,
            password_salt,
            plan,
            is_active,
            created_at,
            updated_at,
            plan_updated_at
        )
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
        """,
        (name, email, password_hash, password_salt, plan, now, now, now),
    )
    user_id = cursor.lastrowid
    conn.commit()

    cursor.execute(f"SELECT {USER_PUBLIC_FIELDS} FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {}


def get_user_auth_by_email(email: str) -> dict | None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(f"SELECT {USER_AUTH_FIELDS} FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def get_user_by_id(user_id: int) -> dict | None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(f"SELECT {USER_PUBLIC_FIELDS} FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def get_user_by_stripe_customer_id(stripe_customer_id: str) -> dict | None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT {USER_PUBLIC_FIELDS} FROM users WHERE stripe_customer_id = ?",
        (stripe_customer_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def update_user_plan(
    user_id: int,
    plan: str,
    stripe_customer_id: str | None = None,
    stripe_subscription_id: str | None = None,
    stripe_price_id: str | None = None,
    stripe_checkout_session_id: str | None = None,
) -> dict | None:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE users
        SET plan = ?,
            updated_at = ?,
            plan_updated_at = ?,
            stripe_customer_id = COALESCE(?, stripe_customer_id),
            stripe_subscription_id = COALESCE(?, stripe_subscription_id),
            stripe_price_id = COALESCE(?, stripe_price_id),
            stripe_checkout_session_id = COALESCE(?, stripe_checkout_session_id)
        WHERE id = ?
        """,
        (
            plan,
            now,
            now,
            stripe_customer_id,
            stripe_subscription_id,
            stripe_price_id,
            stripe_checkout_session_id,
            user_id,
        ),
    )
    conn.commit()
    cursor.execute(f"SELECT {USER_PUBLIC_FIELDS} FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def store_checkout_session_for_user(
    user_id: int,
    stripe_checkout_session_id: str,
    stripe_customer_id: str | None = None,
    stripe_price_id: str | None = None,
) -> dict | None:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE users
        SET updated_at = ?,
            stripe_checkout_session_id = ?,
            stripe_customer_id = COALESCE(?, stripe_customer_id),
            stripe_price_id = COALESCE(?, stripe_price_id)
        WHERE id = ?
        """,
        (now, stripe_checkout_session_id, stripe_customer_id, stripe_price_id, user_id),
    )
    conn.commit()
    cursor.execute(f"SELECT {USER_PUBLIC_FIELDS} FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def clear_user_subscription(user_id: int) -> dict | None:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE users
        SET plan = 'free',
            updated_at = ?,
            plan_updated_at = ?,
            stripe_subscription_id = NULL
        WHERE id = ?
        """,
        (now, now, user_id),
    )
    conn.commit()
    cursor.execute(f"SELECT {USER_PUBLIC_FIELDS} FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def create_auth_token(user_id: int, token: str, expires_at: str) -> None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO auth_tokens (user_id, token, created_at, expires_at, revoked_at)
        VALUES (?, ?, ?, ?, NULL)
        """,
        (user_id, token, _now_iso(), expires_at),
    )
    conn.commit()
    conn.close()


def revoke_auth_token(token: str) -> None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        UPDATE auth_tokens
        SET revoked_at = ?
        WHERE token = ? AND revoked_at IS NULL
        """,
        (_now_iso(), token),
    )
    conn.commit()
    conn.close()


def get_user_by_token(token: str) -> dict | None:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            users.id,
            users.name,
            users.email,
            users.plan,
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
        WHERE auth_tokens.token = ?
          AND auth_tokens.revoked_at IS NULL
          AND auth_tokens.expires_at > ?
          AND users.is_active = 1
        """,
        (token, now),
    )
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def get_user_usage(user_id: int, usage_date: str) -> dict:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT user_id, usage_date, simulations_generated
        FROM user_daily_usage
        WHERE user_id = ? AND usage_date = ?
        """,
        (user_id, usage_date),
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)

    return {
        "user_id": user_id,
        "usage_date": usage_date,
        "simulations_generated": 0,
    }


def increment_user_simulation_usage(user_id: int, usage_date: str) -> dict:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO user_daily_usage (
            user_id,
            usage_date,
            simulations_generated,
            created_at,
            updated_at
        )
        VALUES (?, ?, 1, ?, ?)
        ON CONFLICT(user_id, usage_date) DO UPDATE SET
            simulations_generated = simulations_generated + 1,
            updated_at = excluded.updated_at
        """,
        (user_id, usage_date, now, now),
    )
    conn.commit()

    cursor.execute(
        """
        SELECT user_id, usage_date, simulations_generated
        FROM user_daily_usage
        WHERE user_id = ? AND usage_date = ?
        """,
        (user_id, usage_date),
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else {
        "user_id": user_id,
        "usage_date": usage_date,
        "simulations_generated": 0,
    }


def get_guest_usage(guest_key: str, usage_date: str) -> dict:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT guest_key, usage_date, simulations_generated
        FROM guest_daily_usage
        WHERE guest_key = ? AND usage_date = ?
        """,
        (guest_key, usage_date),
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)

    return {
        "guest_key": guest_key,
        "usage_date": usage_date,
        "simulations_generated": 0,
    }


def increment_guest_simulation_usage(guest_key: str, usage_date: str) -> dict:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO guest_daily_usage (
            guest_key,
            usage_date,
            simulations_generated,
            created_at,
            updated_at
        )
        VALUES (?, ?, 1, ?, ?)
        ON CONFLICT(guest_key, usage_date) DO UPDATE SET
            simulations_generated = simulations_generated + 1,
            updated_at = excluded.updated_at
        """,
        (guest_key, usage_date, now, now),
    )
    conn.commit()

    cursor.execute(
        """
        SELECT guest_key, usage_date, simulations_generated
        FROM guest_daily_usage
        WHERE guest_key = ? AND usage_date = ?
        """,
        (guest_key, usage_date),
    )
    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else {
        "guest_key": guest_key,
        "usage_date": usage_date,
        "simulations_generated": 0,
    }


def is_stripe_event_processed(event_id: str) -> bool:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT 1 FROM stripe_webhook_events WHERE event_id = ? LIMIT 1",
        (event_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return row is not None


def mark_stripe_event_processed(event_id: str, event_type: str) -> None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT OR IGNORE INTO stripe_webhook_events (event_id, event_type, processed_at)
        VALUES (?, ?, ?)
        """,
        (event_id, event_type, _now_iso()),
    )
    conn.commit()
    conn.close()


def create_simulation_v2(
    owner_user_id: int,
    title: str,
    exam_type: str,
    year: int,
    question_count: int,
    subject: str | None = None,
) -> dict:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (owner_user_id, title, exam_type, year, subject, question_count, now, now),
    )
    simulation_id = cursor.lastrowid
    conn.commit()
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
        WHERE simulations_v2.id = ?
        GROUP BY simulations_v2.id
        """,
        (simulation_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row) or {}


def rate_simulation_v2(simulation_id: int, user_id: int, rating: int) -> dict | None:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM simulations_v2 WHERE id = ?", (simulation_id,))
    simulation_exists = cursor.fetchone()
    if not simulation_exists:
        conn.close()
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
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(simulation_id, user_id) DO UPDATE SET
            rating = excluded.rating,
            updated_at = excluded.updated_at
        """,
        (simulation_id, user_id, rating, now, now),
    )
    conn.commit()
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
        WHERE simulations_v2.id = ?
        GROUP BY simulations_v2.id
        """,
        (simulation_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return _row_to_dict(row)


def list_simulations_v2(subject: str | None = None) -> list[dict]:
    conn = connect()
    cursor = conn.cursor()
    query = """
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
    """
    params: tuple[Any, ...] = ()
    if subject:
        query += " WHERE LOWER(simulations_v2.subject) = LOWER(?) "
        params = (subject,)

    query += """
        GROUP BY simulations_v2.id
        ORDER BY rating_avg DESC, rating_count DESC, simulations_v2.created_at DESC
    """
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def create_simulation_attempt_v2(
    simulation_id: int,
    user_id: int,
    answers: list[dict],
) -> dict | None:
    if not answers:
        raise ValueError("É necessário enviar pelo menos uma resposta.")

    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM simulations_v2 WHERE id = ?", (simulation_id,))
    simulation_exists = cursor.fetchone()
    if not simulation_exists:
        conn.close()
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
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
    attempt_id = cursor.lastrowid

    cursor.executemany(
        """
        INSERT INTO simulation_attempt_answers_v2 (
            attempt_id,
            question_number,
            selected_option,
            is_correct,
            time_spent_seconds
        )
        VALUES (?, ?, ?, ?, ?)
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
    conn.close()

    return {
        "attempt_id": attempt_id,
        "simulation_id": simulation_id,
        "average_time_seconds": average_time_seconds,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "accuracy_rate": accuracy_rate,
        "error_rate": error_rate,
    }


def get_simulation_analytics_v2(
    simulation_id: int,
    period_days: int | None = None,
    subject: str | None = None,
) -> dict | None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, subject FROM simulations_v2 WHERE id = ?",
        (simulation_id,),
    )
    simulation = cursor.fetchone()
    if not simulation:
        conn.close()
        return None

    simulation_subject = (simulation["subject"] or "").strip()
    if subject and simulation_subject.lower() != subject.strip().lower():
        conn.close()
        return None

    period_cutoff: str | None = None
    if period_days is not None and period_days > 0:
        period_cutoff = (datetime.now(UTC) - timedelta(days=period_days)).isoformat()

    where_clause = "WHERE simulation_id = ?"
    attempt_params: list[Any] = [simulation_id]
    if period_cutoff:
        where_clause += " AND submitted_at >= ?"
        attempt_params.append(period_cutoff)

    cursor.execute(
        f"""
        SELECT
            COUNT(*) AS attempts_count,
            COALESCE(AVG(average_time_seconds), 0) AS average_time_seconds,
            COALESCE(AVG(accuracy_rate), 0) AS accuracy_rate,
            COALESCE(AVG(error_rate), 0) AS error_rate
        FROM simulation_attempts_v2
        {where_clause}
        """,
        tuple(attempt_params),
    )
    summary = dict(cursor.fetchone())

    answer_where = """
        WHERE simulation_attempts_v2.simulation_id = ?
          AND selected_option IS NOT NULL
          AND selected_option != ''
    """
    answer_params: list[Any] = [simulation_id]
    if period_cutoff:
        answer_where += " AND simulation_attempts_v2.submitted_at >= ?"
        answer_params.append(period_cutoff)

    cursor.execute(
        f"""
        SELECT
            selected_option,
            COUNT(*) AS marked_count
        FROM simulation_attempt_answers_v2
        INNER JOIN simulation_attempts_v2
            ON simulation_attempts_v2.id = simulation_attempt_answers_v2.attempt_id
        {answer_where}
        GROUP BY selected_option
        ORDER BY marked_count DESC
        LIMIT 1
        """,
        tuple(answer_params),
    )
    top_option = cursor.fetchone()

    question_where = "WHERE simulation_attempts_v2.simulation_id = ?"
    question_params: list[Any] = [simulation_id]
    if period_cutoff:
        question_where += " AND simulation_attempts_v2.submitted_at >= ?"
        question_params.append(period_cutoff)

    cursor.execute(
        f"""
        SELECT
            question_number,
            COALESCE(AVG(time_spent_seconds), 0) AS average_time_seconds,
            COALESCE(AVG(is_correct), 0) AS correct_rate
        FROM simulation_attempt_answers_v2
        INNER JOIN simulation_attempts_v2
            ON simulation_attempts_v2.id = simulation_attempt_answers_v2.attempt_id
        {question_where}
        GROUP BY question_number
        ORDER BY question_number ASC
        """,
        tuple(question_params),
    )
    per_question_rows = cursor.fetchall()
    conn.close()

    per_question: list[dict] = []
    for row in per_question_rows:
        correct_rate = float(row["correct_rate"])
        if correct_rate >= 0.75:
            difficulty = "easy"
        elif correct_rate >= 0.45:
            difficulty = "medium"
        else:
            difficulty = "hard"
        per_question.append(
            {
                "question_number": int(row["question_number"]),
                "average_time_seconds": float(row["average_time_seconds"]),
                "correct_rate": correct_rate,
                "difficulty": difficulty,
            }
        )

    return {
        "simulation_id": simulation_id,
        "subject": simulation_subject or None,
        "period_days": period_days,
        "attempts_count": int(summary["attempts_count"]),
        "average_time_seconds": float(summary["average_time_seconds"]),
        "accuracy_rate": float(summary["accuracy_rate"]),
        "error_rate": float(summary["error_rate"]),
        "most_marked_option": (
            {"option": top_option["selected_option"], "count": int(top_option["marked_count"])}
            if top_option
            else None
        ),
        "questions": per_question,
    }
