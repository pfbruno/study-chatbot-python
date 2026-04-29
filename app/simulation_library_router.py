import hashlib
from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field, field_validator

from app.database import (
    get_guest_usage,
    get_user_by_token,
    get_user_usage,
    increment_guest_simulation_usage,
    increment_user_simulation_usage,
    record_hook_activity_event,
)
from app.question_explanation_service import build_question_explanation
from app.repositories_question_explanations import (
    build_question_key,
    get_question_explanation,
    list_question_explanations_by_attempt,
    save_question_explanation,
)
from app.simulations import (
    generate_library_simulation,
    get_ready_simulation_library,
    submit_library_simulation,
)

router = APIRouter(tags=["simulation-library"])

FREE_DAILY_SIMULATION_LIMIT = 3
GUEST_DAILY_SIMULATION_LIMIT = 1


class LibrarySimulationGenerateRequest(BaseModel):
    seed: int | None = None


class LibrarySimulationSubmission(BaseModel):
    exam_type: str = Field(..., min_length=1)
    question_refs: list[str] = Field(..., min_length=1)
    answers: list[str | None] = Field(..., min_length=1)

    @field_validator("exam_type")
    @classmethod
    def validate_exam_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("exam_type não pode ser vazio.")
        return normalized

    @field_validator("question_refs")
    @classmethod
    def validate_question_refs(cls, value: list[str]) -> list[str]:
        sanitized = [item.strip() for item in value if isinstance(item, str) and item.strip()]
        if not sanitized:
            raise ValueError("question_refs não pode ser vazio.")
        return sanitized


class QuestionExplanationGenerateRequest(BaseModel):
    source: Literal["simulation", "exam", "training"]
    attempt_id: str = Field(..., min_length=1, max_length=180)
    exam_type: str = Field(..., min_length=1, max_length=40)
    year: int | None = Field(default=None, ge=1900, le=2100)
    question_ref: str | None = Field(default=None, max_length=180)
    question_number: int = Field(..., ge=1)
    subject: str = Field(..., min_length=1, max_length=160)
    statement: str = Field(..., min_length=1)
    options: dict[str, str] = Field(default_factory=dict)
    user_answer: str | None = Field(default=None, max_length=12)
    correct_answer: str | None = Field(default=None, max_length=12)
    status: Literal["wrong", "blank"]

    @field_validator("attempt_id")
    @classmethod
    def validate_attempt_id(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("attempt_id inválido.")
        return normalized

    @field_validator("exam_type")
    @classmethod
    def validate_exam_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("exam_type inválido.")
        return normalized

    @field_validator("question_ref")
    @classmethod
    def validate_question_ref(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("subject")
    @classmethod
    def validate_subject(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("subject inválido.")
        return normalized

    @field_validator("user_answer")
    @classmethod
    def validate_user_answer(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        return normalized or None

    @field_validator("correct_answer")
    @classmethod
    def validate_correct_answer(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().upper()
        return normalized or None


def _now_utc() -> datetime:
    return datetime.now(UTC)


def _today_str() -> str:
    return _now_utc().date().isoformat()


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


def _serialize_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "email_verified": bool(user.get("email_verified", 0)),
        "plan": user.get("plan", "free"),
        "subscription_status": user.get("subscription_status", "inactive"),
        "current_period_end": user.get("current_period_end"),
        "is_active": bool(user.get("is_active", 1)),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
    }


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


def _build_entitlements_for_user(user: dict) -> dict:
    is_pro = _is_pro_user(user)
    return {
        "plan": "pro" if is_pro else "free",
        "is_pro": is_pro,
        "can_access_advanced_analytics": is_pro,
        "can_access_critical_questions": is_pro,
        "can_access_smart_insights": is_pro,
        "can_generate_advanced_simulations": is_pro,
        "can_compare_simulados_vs_provas": is_pro,
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


def _build_plan_status_for_user(user: dict) -> dict:
    usage_date = _today_str()
    usage = get_user_usage(user["id"], usage_date)

    if _is_pro_user(user):
        return {
            "scope": "user",
            "plan": "pro",
            "usage_date": usage_date,
            "simulations_generated_today": usage["simulations_generated"],
            "daily_limit": None,
            "remaining_today": None,
            "can_generate": True,
        }

    remaining = max(0, FREE_DAILY_SIMULATION_LIMIT - usage["simulations_generated"])
    return {
        "scope": "user",
        "plan": "free",
        "usage_date": usage_date,
        "simulations_generated_today": usage["simulations_generated"],
        "daily_limit": FREE_DAILY_SIMULATION_LIMIT,
        "remaining_today": remaining,
        "can_generate": remaining > 0,
    }


def _build_plan_status_for_guest(request: Request) -> dict:
    usage_date = _today_str()
    guest_key = _build_guest_key(request)
    usage = get_guest_usage(guest_key, usage_date)
    remaining = max(0, GUEST_DAILY_SIMULATION_LIMIT - usage["simulations_generated"])

    return {
        "scope": "guest",
        "plan": "guest",
        "usage_date": usage_date,
        "simulations_generated_today": usage["simulations_generated"],
        "daily_limit": GUEST_DAILY_SIMULATION_LIMIT,
        "remaining_today": remaining,
        "can_generate": remaining > 0,
    }


def _enforce_simulation_generation_entitlement(
    request: Request,
    authorization: str | None,
) -> dict:
    user = _get_current_user(authorization)

    if user:
        status = _build_plan_status_for_user(user)
        if not status["can_generate"]:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Limite diário do plano gratuito atingido. "
                    "Faça upgrade para o plano PRO."
                ),
            )

        increment_user_simulation_usage(user["id"], _today_str())
        updated_status = _build_plan_status_for_user(user)
        return {
            "auth_scope": "user",
            "user": _serialize_user(user),
            "usage": updated_status,
        }

    guest_status = _build_plan_status_for_guest(request)
    if not guest_status["can_generate"]:
        raise HTTPException(
            status_code=403,
            detail=(
                "Limite diário do modo convidado atingido. "
                "Crie uma conta para continuar."
            ),
        )

    increment_guest_simulation_usage(_build_guest_key(request), _today_str())
    updated_guest_status = _build_plan_status_for_guest(request)
    return {
        "auth_scope": "guest",
        "user": None,
        "usage": updated_guest_status,
    }


@router.get("/simulados/library")
def list_ready_simulation_library(
    exam_type: str = Query(default="enem"),
) -> dict:
    try:
        return get_ready_simulation_library(exam_type=exam_type)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/simulados/library/{preset_id}/generate")
def create_ready_simulation(
    preset_id: str,
    payload: LibrarySimulationGenerateRequest,
    request: Request,
    authorization: str | None = Header(default=None),
    exam_type: str = Query(default="enem"),
) -> dict:
    usage_context = _enforce_simulation_generation_entitlement(request, authorization)

    try:
        simulation = generate_library_simulation(
            exam_type=exam_type,
            preset_id=preset_id,
            seed=payload.seed,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    simulation["access"] = {
        "auth_scope": usage_context["auth_scope"],
        "usage": usage_context["usage"],
        "user": usage_context["user"],
    }

    return simulation


@router.post("/simulados/library/submit")
def submit_ready_simulation(
    payload: LibrarySimulationSubmission,
    authorization: str | None = Header(default=None),
) -> dict:
    try:
        result = submit_library_simulation(
            exam_type=payload.exam_type,
            question_refs=payload.question_refs,
            answers=payload.answers,
        )
        user = _get_current_user(authorization)
        if user:
            record_hook_activity_event(
                user_id=user["id"],
                event_type="simulation_completed",
                subject=result.get("title"),
                score_percentage=float(result.get("score_percentage", 0.0)),
                metadata={
                    "questions_answered": int(result.get("total_questions", 0)),
                    "minutes_studied": int(result.get("total_questions", 0) * 2),
                    "simulation_source": "library",
                },
            )
        return result
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/question-explanations/generate", tags=["question-explanations"])
def generate_question_explanation_endpoint(
    payload: QuestionExplanationGenerateRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)

    question_key = build_question_key(
        question_ref=payload.question_ref,
        exam_type=payload.exam_type,
        year=payload.year,
        question_number=payload.question_number,
    )

    existing = get_question_explanation(
        user_id=int(user["id"]),
        source=payload.source,
        attempt_id=payload.attempt_id,
        question_key=question_key,
    )

    if existing:
        return {
            "message": "Explicação já existente.",
            "item": existing,
        }

    generated = build_question_explanation(
        source=payload.source,
        exam_type=payload.exam_type,
        year=payload.year,
        question_number=payload.question_number,
        subject=payload.subject,
        statement=payload.statement,
        options=payload.options,
        user_answer=payload.user_answer,
        correct_answer=payload.correct_answer,
        status=payload.status,
    )

    item = save_question_explanation(
        user_id=int(user["id"]),
        source=payload.source,
        attempt_id=payload.attempt_id,
        question_key=question_key,
        question_ref=payload.question_ref,
        exam_type=payload.exam_type,
        year=payload.year,
        question_number=payload.question_number,
        subject=payload.subject,
        user_answer=payload.user_answer,
        correct_answer=payload.correct_answer,
        explanation_text=generated["explanation_text"],
        sources=generated["sources"],
    )

    return {
        "message": "Explicação gerada com sucesso.",
        "item": item,
    }


@router.get(
    "/question-explanations/by-attempt/{attempt_id}",
    tags=["question-explanations"],
)
def list_question_explanations_for_attempt_endpoint(
    attempt_id: str,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)

    return {
        "items": list_question_explanations_by_attempt(
            user_id=int(user["id"]),
            attempt_id=attempt_id,
        )
    }