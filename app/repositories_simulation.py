from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from app.database import connect


def list_simulations_v2_repo(subject: str | None = None) -> list[dict]:
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
        query += " WHERE LOWER(simulations_v2.subject) = LOWER(%s) "
        params = (subject,)

    query += """
        GROUP BY simulations_v2.id
        ORDER BY rating_avg DESC, rating_count DESC, simulations_v2.created_at DESC
    """
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_simulation_analytics_v2_repo(
    simulation_id: int,
    period_days: int | None = None,
    subject: str | None = None,
) -> dict | None:
    conn = connect()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, subject FROM simulations_v2 WHERE id = %s",
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

    where_clause = "WHERE simulation_id = %s"
    attempt_params: list[Any] = [simulation_id]
    if period_cutoff:
        where_clause += " AND submitted_at >= %s"
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
        WHERE simulation_attempts_v2.simulation_id = %s
          AND selected_option IS NOT NULL
          AND selected_option != ''
    """
    answer_params: list[Any] = [simulation_id]
    if period_cutoff:
        answer_where += " AND simulation_attempts_v2.submitted_at >= %s"
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

    question_where = "WHERE simulation_attempts_v2.simulation_id = %s"
    question_params: list[Any] = [simulation_id]
    if period_cutoff:
        question_where += " AND simulation_attempts_v2.submitted_at >= %s"
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
