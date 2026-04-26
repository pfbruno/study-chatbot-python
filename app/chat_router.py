from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from fastapi import APIRouter, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field, field_validator

from app.chat_limits import (
    ensure_chat_usage_tables,
    get_guest_chat_usage,
    get_user_chat_usage,
    increment_guest_chat_usage,
    increment_user_chat_usage,
)
from app.chatbot import process_question
from app.database import (
    connect,
    get_hook_streak_stats,
    get_user_by_token,
    record_hook_activity_event,
)
from app.exams.service import get_recent_exam_attempts, get_user_exam_analytics
from app.repositories_gamification import (
    get_gamification_ranking,
    get_gamification_summary,
)

router = APIRouter(tags=["chat"])

FREE_DAILY_CHAT_LIMIT = 10
GUEST_DAILY_CHAT_LIMIT = 3

SUBJECT_MAP = {
    "biologia": "Biologia",
    "quimica": "Química",
    "fisica": "Física",
    "matematica": "Matemática",
    "portugues": "Português",
    "historia": "História",
    "geografia": "Geografia",
    "sociologia": "Sociologia",
    "filosofia": "Filosofia",
    "ingles": "Inglês",
    "espanhol": "Espanhol",
    "literatura": "Literatura",
    "redacao": "Redação",
}

ALLOWED_ACTIVITY_EVENTS = {
    "study_goal_selected",
    "study_session_started",
    "study_session_completed",
    "question_answered",
    "question_correct",
    "question_wrong",
    "question_skipped",
    "simulation_generated",
    "simulation_started",
    "simulation_completed",
    "simulation_abandoned",
    "exam_started",
    "exam_completed",
    "exam_corrected",
    "flashcard_reviewed",
    "flashcard_mastered",
    "summary_opened",
    "revision_session_completed",
    "mindmap_opened",
    "chat_question_sent",
    "chat_study_doubt_resolved",
    "chat_generated_simulation",
    "chat_generated_review",
    "study_plan_created",
    "study_plan_completed",
    "first_activity_of_day",
    "streak_day_registered",
    "streak_milestone_reached",
    "daily_goal_completed",
    "weekly_goal_completed",
    "xp_earned",
    "level_up",
    "achievement_unlocked",
    "challenge_completed",
    "reward_claimed",
    "ranking_position_improved",
    "top10_reached",
    "top3_reached",
}

_MONTH_LABELS = {
    1: "Jan",
    2: "Fev",
    3: "Mar",
    4: "Abr",
    5: "Mai",
    6: "Jun",
    7: "Jul",
    8: "Ago",
    9: "Set",
    10: "Out",
    11: "Nov",
    12: "Dez",
}

_WEEKDAY_LABELS = {
    0: "Seg",
    1: "Ter",
    2: "Qua",
    3: "Qui",
    4: "Sex",
    5: "Sáb",
    6: "Dom",
}


class ChatMessageRequest(BaseModel):
    question: str = Field(..., min_length=1)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("A pergunta não pode estar vazia.")
        return normalized


class ActivityEventRequest(BaseModel):
    event_type: str = Field(..., min_length=1, max_length=80)
    module: str = Field(..., min_length=1, max_length=80)
    subject: str | None = Field(default=None, max_length=120)
    score_percentage: float | None = Field(default=None, ge=0, le=100)
    time_spent_seconds: float | None = Field(default=None, ge=0)
    metadata_json: dict[str, Any] | None = None

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in ALLOWED_ACTIVITY_EVENTS:
            raise ValueError("event_type inválido.")
        return normalized

    @field_validator("module")
    @classmethod
    def validate_module(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("module inválido.")
        return normalized

    @field_validator("subject")
    @classmethod
    def validate_subject(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


def _now_utc() -> datetime:
    return datetime.now(UTC)


def _today_str() -> str:
    return _now_utc().date().isoformat()


def _strip_accents(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def _normalize_text(value: str) -> str:
    return _strip_accents(value).lower().strip()


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    prefix = "Bearer "
    if not authorization.startswith(prefix):
        return None

    token = authorization[len(prefix) :].strip()
    return token or None


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


def _get_current_user(authorization: str | None) -> dict | None:
    token = _extract_bearer_token(authorization)
    if not token:
        return None
    return get_user_by_token(token)


def _get_current_user_or_401(authorization: str | None) -> dict:
    user = _get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")
    return user


def _is_pro_user(user: dict) -> bool:
    if str(user.get("plan") or "").lower() != "pro":
        return False

    subscription_status = str(user.get("subscription_status") or "").lower()
    if subscription_status in {"active", "trialing", "past_due"}:
        return True

    current_period_end = _parse_iso_datetime(user.get("current_period_end"))
    return bool(current_period_end and current_period_end > _now_utc())


def _serialize_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "plan": user.get("plan", "free"),
        "subscription_status": user.get("subscription_status"),
        "current_period_end": user.get("current_period_end"),
        "is_active": bool(user.get("is_active", True)),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
    }


def _format_seconds_label(seconds: float | None) -> str:
    if seconds is None or seconds <= 0:
        return "N/D"

    total_seconds = int(round(seconds))
    minutes, secs = divmod(total_seconds, 60)
    return f"{minutes}:{secs:02d}"


def _safe_subject_breakdown(value: Any) -> list[dict]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]

    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [item for item in parsed if isinstance(item, dict)]
        except json.JSONDecodeError:
            return []

    return []


def _list_recent_simulation_attempts(user_id: int, limit: int = 40) -> list[dict]:
    conn = connect()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT
                simulation_attempts_v2.id,
                simulation_attempts_v2.simulation_id,
                simulation_attempts_v2.submitted_at,
                simulation_attempts_v2.average_time_seconds,
                simulation_attempts_v2.correct_count,
                simulation_attempts_v2.wrong_count,
                simulation_attempts_v2.accuracy_rate,
                simulation_attempts_v2.error_rate,
                simulations_v2.title,
                simulations_v2.exam_type,
                simulations_v2.year,
                simulations_v2.question_count,
                simulations_v2.subject
            FROM simulation_attempts_v2
            INNER JOIN simulations_v2
                ON simulations_v2.id = simulation_attempts_v2.simulation_id
            WHERE simulation_attempts_v2.user_id = %s
            ORDER BY simulation_attempts_v2.submitted_at DESC
            LIMIT %s
            """,
            (user_id, limit),
        )
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def _build_recent_history(
    exam_attempts: list[dict],
    simulation_attempts: list[dict],
) -> list[dict]:
    history: list[dict] = []

    for item in exam_attempts:
        created_at = item.get("submitted_at")
        parsed_dt = _parse_iso_datetime(created_at)
        history.append(
            {
                "id": f"exam-{item.get('id')}",
                "type": "prova",
                "name": item.get("title") or f"Prova {item.get('year')}",
                "score": round(float(item.get("score_percentage", 0)), 1),
                "avg": 58,
                "date": (
                    f"{_MONTH_LABELS.get(parsed_dt.month, parsed_dt.month)}/{parsed_dt.year}"
                    if parsed_dt
                    else "Sem data"
                ),
                "questions": int(item.get("total_questions", 0)),
                "created_at": created_at,
            }
        )

    for item in simulation_attempts:
        created_at = item.get("submitted_at")
        parsed_dt = _parse_iso_datetime(created_at)
        history.append(
            {
                "id": f"simulation-{item.get('id')}",
                "type": "simulado",
                "name": item.get("title") or f"Simulado {item.get('year')}",
                "score": round(float(item.get("accuracy_rate", 0)) * 100, 1),
                "avg": 58,
                "date": (
                    f"{_MONTH_LABELS.get(parsed_dt.month, parsed_dt.month)}/{parsed_dt.year}"
                    if parsed_dt
                    else "Sem data"
                ),
                "questions": int(item.get("correct_count", 0))
                + int(item.get("wrong_count", 0)),
                "created_at": created_at,
            }
        )

    history.sort(
        key=lambda entry: _parse_iso_datetime(entry.get("created_at"))
        or datetime.min.replace(tzinfo=UTC),
        reverse=True,
    )
    return history[:12]


def _build_evolution_data(history: list[dict]) -> list[dict]:
    buckets: dict[str, list[float]] = defaultdict(list)

    for item in history:
        parsed_dt = _parse_iso_datetime(item.get("created_at"))
        if not parsed_dt:
            continue

        key = f"{parsed_dt.year}-{parsed_dt.month:02d}"
        buckets[key].append(float(item.get("score", 0)))

    if not buckets:
        return []

    ordered_keys = sorted(buckets.keys())[-6:]
    data: list[dict] = []

    for key in ordered_keys:
        _, month_str = key.split("-")
        month_number = int(month_str)
        avg_score = round(sum(buckets[key]) / len(buckets[key]), 1)

        data.append(
            {
                "month": _MONTH_LABELS.get(month_number, month_str),
                "acerto": avg_score,
                "media": 58,
            }
        )

    return data


def _build_weekly_study_data(
    exam_attempts: list[dict],
    simulation_attempts: list[dict],
) -> list[dict]:
    today = _now_utc().date()
    ordered_days = [today - timedelta(days=offset) for offset in range(6, -1, -1)]

    buckets: dict[str, dict[str, Any]] = {
        day.isoformat(): {
            "day": _WEEKDAY_LABELS[day.weekday()],
            "tempo": 0,
            "questoes": 0,
        }
        for day in ordered_days
    }

    for item in exam_attempts:
        parsed_dt = _parse_iso_datetime(item.get("submitted_at"))
        if not parsed_dt:
            continue

        key = parsed_dt.date().isoformat()
        if key not in buckets:
            continue

        total_questions = int(item.get("total_questions", 0))
        time_spent_seconds = item.get("time_spent_seconds")
        estimated_seconds = (
            float(time_spent_seconds)
            if time_spent_seconds not in (None, "")
            else total_questions * 135
        )

        buckets[key]["questoes"] += total_questions
        buckets[key]["tempo"] += int(round(estimated_seconds / 60))

    for item in simulation_attempts:
        parsed_dt = _parse_iso_datetime(item.get("submitted_at"))
        if not parsed_dt:
            continue

        key = parsed_dt.date().isoformat()
        if key not in buckets:
            continue

        total_questions = int(item.get("correct_count", 0)) + int(
            item.get("wrong_count", 0)
        )
        avg_time_seconds = float(item.get("average_time_seconds", 135) or 135)
        total_seconds = avg_time_seconds * total_questions

        buckets[key]["questoes"] += total_questions
        buckets[key]["tempo"] += int(round(total_seconds / 60))

    return [buckets[day.isoformat()] for day in ordered_days]


def _build_subject_accuracy(
    exam_attempts: list[dict],
    simulation_attempts: list[dict],
) -> list[dict]:
    accumulator: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "subject": "",
            "correct": 0,
            "wrong": 0,
            "blank": 0,
            "questions": 0,
        }
    )

    for attempt in exam_attempts:
        for subject_data in _safe_subject_breakdown(attempt.get("subject_breakdown")):
            subject = str(subject_data.get("subject") or "Geral")
            bucket = accumulator[subject]
            bucket["subject"] = subject
            bucket["correct"] += int(subject_data.get("correct", 0))
            bucket["wrong"] += int(subject_data.get("wrong", 0))
            bucket["blank"] += int(subject_data.get("blank", 0))
            bucket["questions"] += int(subject_data.get("total", 0))

    for attempt in simulation_attempts:
        subject = str(attempt.get("subject") or "Simulado Misto")
        total_questions = int(attempt.get("correct_count", 0)) + int(
            attempt.get("wrong_count", 0)
        )

        bucket = accumulator[subject]
        bucket["subject"] = subject
        bucket["correct"] += int(attempt.get("correct_count", 0))
        bucket["wrong"] += int(attempt.get("wrong_count", 0))
        bucket["questions"] += total_questions

    rows: list[dict] = []

    for subject, values in accumulator.items():
        total_questions = max(1, int(values["questions"]))
        accuracy = round((int(values["correct"]) / total_questions) * 100, 1)
        platform_avg = round(max(35.0, min(80.0, accuracy - 12.0)), 1)

        rows.append(
            {
                "subject": subject,
                "acerto": accuracy,
                "media": platform_avg,
                "questions": int(values["questions"]),
                "correct": int(values["correct"]),
                "wrong": int(values["wrong"]),
                "blank": int(values["blank"]),
            }
        )

    rows.sort(key=lambda item: (item["acerto"], item["questions"]), reverse=True)
    return rows[:8]


def _build_hardest_questions(subject_accuracy: list[dict]) -> list[dict]:
    hardest = sorted(
        subject_accuracy, key=lambda item: (item["acerto"], item["questions"])
    )[:5]

    response: list[dict] = []
    for index, item in enumerate(hardest, start=1):
        response.append(
            {
                "id": f"S{index}",
                "subject": item["subject"],
                "topic": "Maior índice de erro recente",
                "accuracy": item["acerto"],
                "avgTime": "N/D",
            }
        )

    return response


def _build_analytics_payload(user: dict) -> dict:
    user_id = int(user["id"])

    exam_attempts = get_recent_exam_attempts(user_id=user_id, limit=40)
    simulation_attempts = _list_recent_simulation_attempts(user_id=user_id, limit=40)
    exam_overview = get_user_exam_analytics(user_id=user_id)
    streak_stats = get_hook_streak_stats(user_id=user_id)

    total_exam_questions = sum(int(item.get("total_questions", 0)) for item in exam_attempts)
    total_simulation_questions = sum(
        int(item.get("correct_count", 0)) + int(item.get("wrong_count", 0))
        for item in simulation_attempts
    )
    total_questions = total_exam_questions + total_simulation_questions

    total_exam_correct = sum(int(item.get("correct_answers", 0)) for item in exam_attempts)
    total_sim_correct = sum(int(item.get("correct_count", 0)) for item in simulation_attempts)
    total_correct = total_exam_correct + total_sim_correct

    total_exam_wrong = sum(int(item.get("wrong_answers", 0)) for item in exam_attempts)
    total_sim_wrong = sum(int(item.get("wrong_count", 0)) for item in simulation_attempts)
    total_wrong = total_exam_wrong + total_sim_wrong

    all_scores = [float(item.get("score_percentage", 0)) for item in exam_attempts] + [
        round(float(item.get("accuracy_rate", 0)) * 100, 1)
        for item in simulation_attempts
    ]

    avg_accuracy = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0.0

    total_exam_time = sum(
        float(item.get("time_spent_seconds", 0) or 0) for item in exam_attempts
    )
    total_sim_time = sum(
        (float(item.get("average_time_seconds", 0) or 0))
        * (int(item.get("correct_count", 0)) + int(item.get("wrong_count", 0)))
        for item in simulation_attempts
    )
    total_time_seconds = total_exam_time + total_sim_time

    avg_time_per_question_seconds = (
        round(total_time_seconds / total_questions, 2) if total_questions > 0 else None
    )

    total_sessions = len(exam_attempts) + len(simulation_attempts)
    avg_time_per_session_seconds = (
        round(total_time_seconds / total_sessions, 2) if total_sessions > 0 else None
    )

    subject_accuracy = _build_subject_accuracy(
        exam_attempts=exam_attempts,
        simulation_attempts=simulation_attempts,
    )
    hardest_questions = _build_hardest_questions(subject_accuracy)
    recent_history = _build_recent_history(
        exam_attempts=exam_attempts,
        simulation_attempts=simulation_attempts,
    )
    evolution_data = _build_evolution_data(recent_history)
    weekly_study_data = _build_weekly_study_data(
        exam_attempts=exam_attempts,
        simulation_attempts=simulation_attempts,
    )

    best_subject = subject_accuracy[0]["subject"] if subject_accuracy else "N/D"
    worst_subject = (
        sorted(subject_accuracy, key=lambda item: (item["acerto"], item["questions"]))[0]["subject"]
        if subject_accuracy
        else "N/D"
    )

    improvement = (
        round(evolution_data[-1]["acerto"] - evolution_data[0]["acerto"], 1)
        if len(evolution_data) >= 2
        else 0.0
    )

    streak_days = int(
        streak_stats.get("current_streak")
        or streak_stats.get("streak_days")
        or streak_stats.get("days")
        or 0
    )

    overall_stats = {
        "totalQuestions": total_questions,
        "totalSessions": total_sessions,
        "totalCorrect": total_correct,
        "totalWrong": total_wrong,
        "avgAccuracy": avg_accuracy,
        "platformAvg": 58,
        "avgTimePerQuestion": _format_seconds_label(avg_time_per_question_seconds),
        "avgTimePerSession": _format_seconds_label(avg_time_per_session_seconds),
        "streak": streak_days,
        "bestSubject": best_subject,
        "worstSubject": worst_subject,
        "improvement": improvement,
        "attemptsCount": int(exam_overview.get("attempts_count", 0)),
    }

    return {
        "user": _serialize_user(user),
        "overallStats": overall_stats,
        "evolutionData": evolution_data,
        "subjectAccuracy": subject_accuracy,
        "weeklyStudyData": weekly_study_data,
        "hardestQuestions": hardest_questions,
        "simuladoHistory": recent_history,
    }


def _build_guest_key(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "").strip()

    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return f"guest:{first_ip}"

    client_host = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "").strip()
    raw = f"{client_host}|{user_agent}"
    return "guest:" + hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _build_chat_status_for_user(user: dict) -> dict:
    usage_date = _today_str()
    usage = get_user_chat_usage(user["id"], usage_date)

    if _is_pro_user(user):
        return {
            "scope": "user",
            "plan": "pro",
            "usage_date": usage_date,
            "questions_asked_today": usage["questions_asked"],
            "daily_limit": None,
            "remaining_today": None,
            "can_ask": True,
        }

    remaining = max(0, FREE_DAILY_CHAT_LIMIT - usage["questions_asked"])
    return {
        "scope": "user",
        "plan": "free",
        "usage_date": usage_date,
        "questions_asked_today": usage["questions_asked"],
        "daily_limit": FREE_DAILY_CHAT_LIMIT,
        "remaining_today": remaining,
        "can_ask": remaining > 0,
    }


def _build_chat_status_for_guest(request: Request) -> dict:
    usage_date = _today_str()
    guest_key = _build_guest_key(request)
    usage = get_guest_chat_usage(guest_key, usage_date)

    remaining = max(0, GUEST_DAILY_CHAT_LIMIT - usage["questions_asked"])
    return {
        "scope": "guest",
        "plan": "guest",
        "usage_date": usage_date,
        "questions_asked_today": usage["questions_asked"],
        "daily_limit": GUEST_DAILY_CHAT_LIMIT,
        "remaining_today": remaining,
        "can_ask": remaining > 0,
    }


def _enforce_chat_entitlement(request: Request, authorization: str | None) -> dict:
    user = _get_current_user(authorization)

    if user:
        status = _build_chat_status_for_user(user)
        if not status["can_ask"]:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Você atingiu o limite diário do plano gratuito no chat. "
                    "Faça upgrade para continuar."
                ),
            )

        increment_user_chat_usage(user["id"], _today_str())
        updated_status = _build_chat_status_for_user(user)
        return {
            "authenticated": True,
            "user": _serialize_user(user),
            "usage": updated_status,
        }

    guest_status = _build_chat_status_for_guest(request)
    if not guest_status["can_ask"]:
        raise HTTPException(
            status_code=403,
            detail=(
                "Você atingiu o limite diário como convidado no chat. "
                "Crie uma conta ou faça upgrade para continuar."
            ),
        )

    increment_guest_chat_usage(_build_guest_key(request), _today_str())
    updated_guest_status = _build_chat_status_for_guest(request)
    return {
        "authenticated": False,
        "user": None,
        "usage": updated_guest_status,
    }


def _extract_simulation_action(question: str) -> dict | None:
    normalized = _normalize_text(question)

    if "simulado" not in normalized:
        return None

    question_count_match = re.search(r"(\d{1,3})\s+quest", normalized)
    if not question_count_match:
        return None

    question_count = int(question_count_match.group(1))
    if question_count <= 0:
        return None

    year_match = re.search(r"\b(20\d{2})\b", normalized)
    year = int(year_match.group(1)) if year_match else _now_utc().year - 1

    exam_type = "enem" if "enem" in normalized else "enem"

    subjects: list[str] = []
    for key, label in SUBJECT_MAP.items():
        if key in normalized:
            subjects.append(label)

    mode: Literal["balanced", "random"] = (
        "random"
        if (
            "aleatorio" in normalized
            or "aleatória" in normalized
            or "aleatorio" in normalized
        )
        else "balanced"
    )

    return {
        "type": "generate_simulation",
        "payload": {
            "exam_type": exam_type,
            "year": year,
            "question_count": question_count,
            "subjects": subjects or None,
            "mode": mode,
            "seed": None,
        },
    }


@router.get("/chat/entitlement")
def get_chat_entitlement(
    request: Request,
    authorization: str | None = Header(default=None),
) -> dict:
    ensure_chat_usage_tables()
    user = _get_current_user(authorization)

    if user:
        return {
            "authenticated": True,
            "user": _serialize_user(user),
            "usage": _build_chat_status_for_user(user),
        }

    return {
        "authenticated": False,
        "user": None,
        "usage": _build_chat_status_for_guest(request),
    }


@router.post("/chat/message")
def send_chat_message(
    payload: ChatMessageRequest,
    request: Request,
    authorization: str | None = Header(default=None),
) -> dict:
    ensure_chat_usage_tables()

    access = _enforce_chat_entitlement(request, authorization)
    action = _extract_simulation_action(payload.question)

    if action:
        simulation_payload = action["payload"]
        subject_label = (
            ", ".join(simulation_payload["subjects"])
            if simulation_payload["subjects"]
            else "todas as disciplinas disponíveis"
        )

        return {
            "kind": "action",
            "content": (
                f"Entendi. Vou gerar um simulado com "
                f"{simulation_payload['question_count']} questão(ões), "
                f"foco em {subject_label}, "
                f"prova {simulation_payload['exam_type'].upper()} "
                f"{simulation_payload['year']}."
            ),
            "action": action,
            "access": access,
        }

    result = process_question(payload.question)

    return {
        "kind": "assistant",
        "content": result["formatted_response"],
        "category": result["category"],
        "explanation": result["explanation"],
        "summary": result["summary"],
        "study_tip": result["study_tip"],
        "formatted_response": result["formatted_response"],
        "action": None,
        "access": access,
    }


@router.post("/activity/events", tags=["activity"])
def create_activity_event(
    payload: ActivityEventRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)

    metadata = dict(payload.metadata_json or {})
    metadata["module"] = payload.module

    record_hook_activity_event(
        user_id=user["id"],
        event_type=payload.event_type,
        subject=payload.subject,
        score_percentage=payload.score_percentage,
        time_spent_seconds=payload.time_spent_seconds,
        metadata=metadata,
    )

    return {
        "message": "Evento registrado com sucesso.",
        "user_id": user["id"],
        "event_type": payload.event_type,
        "module": payload.module,
        "created_at": _now_utc().isoformat(),
    }


@router.get("/analytics/overview", tags=["analytics"])
def get_analytics_overview(
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)
    return _build_analytics_payload(user)


@router.get("/gamification/summary", tags=["gamification"])
def get_summary(
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)
    return get_gamification_summary(user_id=user["id"], user_name=user["name"])


@router.get("/gamification/ranking", tags=["gamification"])
def get_ranking(
    scope: Literal["weekly", "monthly", "global"] = Query(default="weekly"),
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)
    return get_gamification_ranking(scope=scope, current_user_id=user["id"])