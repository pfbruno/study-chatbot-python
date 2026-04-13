from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

from app.database import _now_iso, connect


def record_hook_activity_event_repo(
    user_id: int,
    event_type: str,
    subject: str | None = None,
    score_percentage: float | None = None,
    time_spent_seconds: float | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    now = _now_iso()
    goal_date = datetime.now(UTC).date().isoformat()

    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO hook_activity_events (
            user_id,
            event_type,
            subject,
            score_percentage,
            time_spent_seconds,
            metadata_json,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            event_type,
            subject,
            score_percentage,
            time_spent_seconds,
            json.dumps(metadata or {}),
            now,
        ),
    )

    cursor.execute(
        """
        INSERT INTO hook_daily_goals (
            user_id,
            goal_date,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, goal_date) DO NOTHING
        """,
        (user_id, goal_date, now, now),
    )

    progress_questions = int((metadata or {}).get("questions_answered", 0))
    progress_minutes = int((metadata or {}).get("minutes_studied", 0))
    progress_simulations = 1 if event_type == "simulation_completed" else 0
    progress_exams = 1 if event_type == "exam_completed" else 0
    progress_review = 1 if event_type == "mini_action_completed" else 0

    cursor.execute(
        """
        UPDATE hook_daily_goals
        SET progress_questions = progress_questions + ?,
            progress_minutes = progress_minutes + ?,
            progress_simulations = progress_simulations + ?,
            progress_exams = progress_exams + ?,
            progress_review_completed = CASE
                WHEN ? = 1 THEN 1
                ELSE progress_review_completed
            END,
            updated_at = ?
        WHERE user_id = ? AND goal_date = ?
        """,
        (
            progress_questions,
            progress_minutes,
            progress_simulations,
            progress_exams,
            progress_review,
            now,
            user_id,
            goal_date,
        ),
    )

    conn.commit()
    conn.close()


def get_hook_daily_goal_repo(user_id: int, goal_date: str | None = None) -> dict:
    target_date = goal_date or datetime.now(UTC).date().isoformat()
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT *
        FROM hook_daily_goals
        WHERE user_id = ? AND goal_date = ?
        """,
        (user_id, target_date),
    )
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)

    return {
        "user_id": user_id,
        "goal_date": target_date,
        "target_questions": 10,
        "target_simulations": 1,
        "target_exams": 1,
        "target_minutes": 30,
        "progress_questions": 0,
        "progress_simulations": 0,
        "progress_exams": 0,
        "progress_minutes": 0,
        "progress_review_completed": 0,
    }


def get_hook_recent_events_repo(user_id: int, days: int = 7) -> list[dict]:
    cutoff = (datetime.now(UTC) - timedelta(days=days)).isoformat()
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT *
        FROM hook_activity_events
        WHERE user_id = ? AND created_at >= ?
        ORDER BY created_at DESC
        """,
        (user_id, cutoff),
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_hook_streak_stats_repo(user_id: int) -> dict:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT DISTINCT substr(created_at, 1, 10) AS activity_date
        FROM hook_activity_events
        WHERE user_id = ?
        ORDER BY activity_date DESC
        """,
        (user_id,),
    )
    dates = [row["activity_date"] for row in cursor.fetchall()]
    conn.close()

    if not dates:
        return {
            "current_streak": 0,
            "best_streak": 0,
            "last_activity_date": None,
            "at_risk": True,
        }

    parsed = [datetime.fromisoformat(value).date() for value in dates]
    today = datetime.now(UTC).date()

    current_streak = 0
    cursor_date = today
    date_set = set(parsed)
    while cursor_date in date_set:
        current_streak += 1
        cursor_date -= timedelta(days=1)

    if current_streak == 0 and (today - parsed[0]).days <= 1:
        current_streak = 1

    best_streak = 0
    running = 0
    previous = None
    for day in sorted(date_set):
        if previous and (day - previous).days == 1:
            running += 1
        else:
            running = 1
        best_streak = max(best_streak, running)
        previous = day

    last_activity_date = parsed[0].isoformat()
    at_risk = (today - parsed[0]).days >= 1
    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "last_activity_date": last_activity_date,
        "at_risk": at_risk,
    }
