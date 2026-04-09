import os
import sqlite3
from datetime import UTC, datetime
from typing import Any

DB_PATH = os.path.join(os.getcwd(), "data", "chatbot.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


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

    conn.commit()
    conn.close()


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


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
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
        """,
        (name, email, password_hash, password_salt, plan, now, now),
    )

    user_id = cursor.lastrowid
    conn.commit()

    cursor.execute(
        """
        SELECT id, name, email, plan, is_active, created_at, updated_at
        FROM users
        WHERE id = ?
        """,
        (user_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {}


def get_user_auth_by_email(email: str) -> dict | None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, name, email, password_hash, password_salt, plan, is_active, created_at, updated_at
        FROM users
        WHERE email = ?
        """,
        (email,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> dict | None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, name, email, plan, is_active, created_at, updated_at
        FROM users
        WHERE id = ?
        """,
        (user_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_user_plan(user_id: int, plan: str) -> dict | None:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()

    cursor.execute(
        """
        UPDATE users
        SET plan = ?, updated_at = ?
        WHERE id = ?
        """,
        (plan, now, user_id),
    )
    conn.commit()

    cursor.execute(
        """
        SELECT id, name, email, plan, is_active, created_at, updated_at
        FROM users
        WHERE id = ?
        """,
        (user_id,),
    )
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


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
            users.updated_at
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
    return dict(row) if row else None


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
        ON CONFLICT(user_id, usage_date)
        DO UPDATE SET
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
        ON CONFLICT(guest_key, usage_date)
        DO UPDATE SET
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