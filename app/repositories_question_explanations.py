from __future__ import annotations

import json
from contextlib import closing
from datetime import UTC, datetime
from typing import Any

from app.database import connect


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def ensure_question_explanation_tables() -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS question_explanations (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    source TEXT NOT NULL,
                    attempt_id TEXT NOT NULL,
                    question_key TEXT NOT NULL,
                    question_ref TEXT,
                    exam_type TEXT NOT NULL,
                    year INTEGER,
                    question_number INTEGER NOT NULL,
                    subject TEXT NOT NULL,
                    user_answer TEXT,
                    correct_answer TEXT,
                    explanation_text TEXT NOT NULL,
                    sources_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, source, attempt_id, question_key)
                )
                """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_question_explanations_user_attempt
                ON question_explanations(user_id, attempt_id, created_at DESC)
                """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_question_explanations_question
                ON question_explanations(user_id, source, question_key)
                """
            )

        conn.commit()


def build_question_key(
    *,
    question_ref: str | None,
    exam_type: str,
    year: int | None,
    question_number: int,
) -> str:
    if question_ref and question_ref.strip():
        return question_ref.strip()

    year_part = str(year) if year is not None else "unknown-year"
    return f"{exam_type.strip().lower()}:{year_part}:{question_number}"


def _serialize_row(row: dict | None) -> dict | None:
    if not row:
        return None

    sources_raw = row.get("sources_json")
    sources: list[dict[str, str]] = []

    if isinstance(sources_raw, str):
        try:
            parsed = json.loads(sources_raw)
            if isinstance(parsed, list):
                sources = [item for item in parsed if isinstance(item, dict)]
        except json.JSONDecodeError:
            sources = []
    elif isinstance(sources_raw, list):
        sources = sources_raw

    return {
        "id": int(row["id"]),
        "user_id": int(row["user_id"]),
        "source": row["source"],
        "attempt_id": row["attempt_id"],
        "question_key": row["question_key"],
        "question_ref": row.get("question_ref"),
        "exam_type": row["exam_type"],
        "year": row.get("year"),
        "question_number": int(row["question_number"]),
        "subject": row["subject"],
        "user_answer": row.get("user_answer"),
        "correct_answer": row.get("correct_answer"),
        "explanation_text": row["explanation_text"],
        "sources": sources,
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def get_question_explanation(
    *,
    user_id: int,
    source: str,
    attempt_id: str,
    question_key: str,
) -> dict | None:
    ensure_question_explanation_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM question_explanations
                WHERE user_id = %s
                  AND source = %s
                  AND attempt_id = %s
                  AND question_key = %s
                LIMIT 1
                """,
                (user_id, source, attempt_id, question_key),
            )
            row = cursor.fetchone()

    return _serialize_row(row)


def save_question_explanation(
    *,
    user_id: int,
    source: str,
    attempt_id: str,
    question_key: str,
    question_ref: str | None,
    exam_type: str,
    year: int | None,
    question_number: int,
    subject: str,
    user_answer: str | None,
    correct_answer: str | None,
    explanation_text: str,
    sources: list[dict[str, str]],
) -> dict:
    ensure_question_explanation_tables()

    now = _now_iso()
    sources_json = json.dumps(sources, ensure_ascii=False, separators=(",", ":"))

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO question_explanations (
                    user_id,
                    source,
                    attempt_id,
                    question_key,
                    question_ref,
                    exam_type,
                    year,
                    question_number,
                    subject,
                    user_answer,
                    correct_answer,
                    explanation_text,
                    sources_json,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (user_id, source, attempt_id, question_key)
                DO UPDATE SET
                    user_answer = EXCLUDED.user_answer,
                    correct_answer = EXCLUDED.correct_answer,
                    explanation_text = EXCLUDED.explanation_text,
                    sources_json = EXCLUDED.sources_json,
                    updated_at = EXCLUDED.updated_at
                RETURNING *
                """,
                (
                    user_id,
                    source,
                    attempt_id,
                    question_key,
                    question_ref,
                    exam_type,
                    year,
                    question_number,
                    subject,
                    user_answer,
                    correct_answer,
                    explanation_text,
                    sources_json,
                    now,
                    now,
                ),
            )
            row = cursor.fetchone()

        conn.commit()

    serialized = _serialize_row(row)
    if not serialized:
        raise RuntimeError("Falha ao salvar explicação da questão.")

    return serialized


def list_question_explanations_by_attempt(
    *,
    user_id: int,
    attempt_id: str,
) -> list[dict]:
    ensure_question_explanation_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT *
                FROM question_explanations
                WHERE user_id = %s
                  AND attempt_id = %s
                ORDER BY question_number ASC
                """,
                (user_id, attempt_id),
            )
            rows = cursor.fetchall()

    return [item for item in (_serialize_row(row) for row in rows) if item]