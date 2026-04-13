from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.database import connect


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def create_exam_tables() -> None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS exams_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            year INTEGER NOT NULL,
            title TEXT NOT NULL,
            total_questions INTEGER NOT NULL,
            has_answer_key INTEGER NOT NULL DEFAULT 0,
            official_page_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(source, year)
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS exam_days (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            day_order INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(exam_id, day_order),
            FOREIGN KEY (exam_id) REFERENCES exams_catalog(id) ON DELETE CASCADE
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS exam_booklets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_id INTEGER NOT NULL,
            color TEXT NOT NULL,
            pdf_url TEXT,
            answer_key_url TEXT,
            official_page_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(day_id, color),
            FOREIGN KEY (day_id) REFERENCES exam_days(id) ON DELETE CASCADE
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS exam_answer_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL UNIQUE,
            answers_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (exam_id) REFERENCES exams_catalog(id) ON DELETE CASCADE
        )
        """
    )
    conn.commit()
    conn.close()


def upsert_exam_structure(
    source: str,
    year: int,
    title: str,
    total_questions: int,
    has_answer_key: bool,
    official_page_url: str | None,
    days: list[dict[str, Any]],
    answer_key: list[str | None] | None = None,
) -> dict[str, Any]:
    now = _now_iso()
    conn = connect()
    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO exams_catalog (
            source, year, title, total_questions, has_answer_key, official_page_url, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(source, year) DO UPDATE SET
            title = excluded.title,
            total_questions = excluded.total_questions,
            has_answer_key = excluded.has_answer_key,
            official_page_url = excluded.official_page_url,
            updated_at = excluded.updated_at
        """,
        (
            source,
            year,
            title,
            total_questions,
            1 if has_answer_key else 0,
            official_page_url,
            now,
            now,
        ),
    )
    cursor.execute(
        "SELECT id FROM exams_catalog WHERE source = ? AND year = ?",
        (source, year),
    )
    exam_id = int(cursor.fetchone()[0])

    cursor.execute("DELETE FROM exam_booklets WHERE day_id IN (SELECT id FROM exam_days WHERE exam_id = ?)", (exam_id,))
    cursor.execute("DELETE FROM exam_days WHERE exam_id = ?", (exam_id,))

    for day in days:
        cursor.execute(
            """
            INSERT INTO exam_days (exam_id, label, day_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (exam_id, day["label"], int(day["order"]), now, now),
        )
        day_id = int(cursor.lastrowid)
        for booklet in day.get("booklets", []):
            cursor.execute(
                """
                INSERT INTO exam_booklets (day_id, color, pdf_url, answer_key_url, official_page_url, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    day_id,
                    booklet.get("color", "geral"),
                    booklet.get("pdf_url"),
                    booklet.get("answer_key_url"),
                    booklet.get("official_page_url"),
                    now,
                    now,
                ),
            )

    if answer_key:
        cursor.execute(
            """
            INSERT INTO exam_answer_keys (exam_id, answers_json, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(exam_id) DO UPDATE SET
                answers_json = excluded.answers_json,
                updated_at = excluded.updated_at
            """,
            (exam_id, json.dumps(answer_key), now, now),
        )

    conn.commit()
    conn.close()
    return {"id": exam_id, "source": source, "year": year}


def list_exams_structured(source: str | None = None) -> list[dict[str, Any]]:
    conn = connect()
    cursor = conn.cursor()
    if source:
        cursor.execute(
            "SELECT * FROM exams_catalog WHERE source = ? ORDER BY year DESC",
            (source,),
        )
    else:
        cursor.execute("SELECT * FROM exams_catalog ORDER BY source, year DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


def get_exam_structure(exam_id: int) -> dict[str, Any] | None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM exams_catalog WHERE id = ?", (exam_id,))
    exam = cursor.fetchone()
    if not exam:
        conn.close()
        return None

    exam_dict = dict(exam)
    cursor.execute("SELECT * FROM exam_days WHERE exam_id = ? ORDER BY day_order ASC", (exam_id,))
    days = [dict(row) for row in cursor.fetchall()]
    for day in days:
        cursor.execute("SELECT * FROM exam_booklets WHERE day_id = ? ORDER BY color ASC", (day["id"],))
        day["booklets"] = [dict(row) for row in cursor.fetchall()]

    cursor.execute("SELECT answers_json FROM exam_answer_keys WHERE exam_id = ?", (exam_id,))
    answer_key_row = cursor.fetchone()
    exam_dict["answer_key"] = json.loads(answer_key_row["answers_json"]) if answer_key_row else []
    exam_dict["days"] = days
    conn.close()
    return exam_dict
