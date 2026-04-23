from __future__ import annotations

import hashlib
import re
import unicodedata
from datetime import UTC, datetime
from typing import Literal

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
from app.database import get_user_by_token
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


class ChatMessageRequest(BaseModel):
    question: str = Field(..., min_length=1)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("A pergunta não pode estar vazia.")
        return normalized


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

    token = authorization[len(prefix):].strip()
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
        if ("aleatorio" in normalized or "aleatória" in normalized or "aleatorio" in normalized)
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