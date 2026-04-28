from __future__ import annotations

import json
from contextlib import closing
from datetime import UTC, datetime
from typing import Any

from app.database import connect

ALLOWED_GENERATED_CONTENT_TYPES = {"review_summary", "flashcards"}


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def ensure_generated_content_tables() -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS generated_content_items (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    content_type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    source_type TEXT,
                    source_key TEXT,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, content_type, source_key)
                )
                """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_generated_content_user_type_created
                ON generated_content_items(user_id, content_type, created_at DESC)
                """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_generated_content_source_key
                ON generated_content_items(user_id, source_key)
                """
            )

        conn.commit()


def _validate_content_type(content_type: str) -> str:
    normalized = (content_type or "").strip().lower()
    if normalized not in ALLOWED_GENERATED_CONTENT_TYPES:
        raise ValueError("content_type inválido.")
    return normalized


def _serialize_row(row: dict | None) -> dict | None:
    if not row:
        return None

    payload = row.get("payload_json")
    parsed_payload: Any = None

    if isinstance(payload, str):
        try:
            parsed_payload = json.loads(payload)
        except json.JSONDecodeError:
            parsed_payload = None
    else:
        parsed_payload = payload

    return {
        "id": int(row["id"]),
        "user_id": int(row["user_id"]),
        "content_type": row["content_type"],
        "title": row["title"],
        "description": row.get("description"),
        "source_type": row.get("source_type"),
        "source_key": row.get("source_key"),
        "payload": parsed_payload,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def save_generated_content(
    *,
    user_id: int,
    content_type: str,
    title: str,
    payload: dict[str, Any] | list[Any],
    description: str | None = None,
    source_type: str | None = None,
    source_key: str | None = None,
) -> dict:
    ensure_generated_content_tables()

    normalized_type = _validate_content_type(content_type)
    normalized_title = (title or "").strip()
    if not normalized_title:
        raise ValueError("title é obrigatório.")

    payload_json = json.dumps(payload, ensure_ascii=False)
    now = _now_iso()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            if source_key:
                cursor.execute(
                    """
                    INSERT INTO generated_content_items (
                        user_id,
                        content_type,
                        title,
                        description,
                        source_type,
                        source_key,
                        payload_json,
                        created_at,
                        updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, content_type, source_key)
                    DO UPDATE SET
                        title = EXCLUDED.title,
                        description = EXCLUDED.description,
                        source_type = EXCLUDED.source_type,
                        payload_json = EXCLUDED.payload_json,
                        updated_at = EXCLUDED.updated_at
                    RETURNING *
                    """,
                    (
                        user_id,
                        normalized_type,
                        normalized_title,
                        description,
                        source_type,
                        source_key,
                        payload_json,
                        now,
                        now,
                    ),
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO generated_content_items (
                        user_id,
                        content_type,
                        title,
                        description,
                        source_type,
                        source_key,
                        payload_json,
                        created_at,
                        updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, NULL, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        user_id,
                        normalized_type,
                        normalized_title,
                        description,
                        source_type,
                        payload_json,
                        now,
                        now,
                    ),
                )

            row = cursor.fetchone()
        conn.commit()

    return _serialize_row(row) or {}


def list_generated_content(
    *,
    user_id: int,
    content_type: str | None = None,
    limit: int = 20,
) -> list[dict]:
    ensure_generated_content_tables()

    safe_limit = max(1, min(int(limit), 100))

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            if content_type:
                normalized_type = _validate_content_type(content_type)
                cursor.execute(
                    """
                    SELECT *
                    FROM generated_content_items
                    WHERE user_id = %s
                      AND content_type = %s
                    ORDER BY updated_at DESC, created_at DESC
                    LIMIT %s
                    """,
                    (user_id, normalized_type, safe_limit),
                )
            else:
                cursor.execute(
                    """
                    SELECT *
                    FROM generated_content_items
                    WHERE user_id = %s
                    ORDER BY updated_at DESC, created_at DESC
                    LIMIT %s
                    """,
                    (user_id, safe_limit),
                )

            rows = cursor.fetchall()

    return [_serialize_row(row) for row in rows if row]


def get_generated_content_by_id(*, user_id: int, content_id: int) -> dict | None:
    ensure_generated_content_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM generated_content_items
                WHERE user_id = %s
                  AND id = %s
                LIMIT 1
                """,
                (user_id, content_id),
            )
            row = cursor.fetchone()

    return _serialize_row(row)


def get_latest_generated_content(
    *,
    user_id: int,
    content_type: str,
) -> dict | None:
    ensure_generated_content_tables()
    normalized_type = _validate_content_type(content_type)

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM generated_content_items
                WHERE user_id = %s
                  AND content_type = %s
                ORDER BY updated_at DESC, created_at DESC
                LIMIT 1
                """,
                (user_id, normalized_type),
            )
            row = cursor.fetchone()

    return _serialize_row(row)