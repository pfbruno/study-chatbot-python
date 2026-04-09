import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from typing import Literal

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.analytics import (
    most_frequent_category,
    questions_by_category,
    total_questions,
)
from app.chatbot import process_question
from app.database import (
    create_auth_token,
    create_table,
    create_user,
    get_guest_usage,
    get_recent_interactions,
    get_user_auth_by_email,
    get_user_by_id,
    get_user_by_token,
    get_user_usage,
    increment_guest_simulation_usage,
    increment_user_simulation_usage,
    revoke_auth_token,
    update_user_plan,
)
from app.exams import (
    get_exam_by_type_and_year,
    list_exam_types,
    submit_exam_answers,
)
from app.question_bank import get_question_bank_metadata
from app.simulations import generate_random_simulation, submit_random_simulation

FREE_DAILY_SIMULATION_LIMIT = 3
GUEST_DAILY_SIMULATION_LIMIT = 1
AUTH_TOKEN_TTL_DAYS = 30
ALLOWED_PLANS = {"free", "pro"}

app = FastAPI(
    title="Study Chatbot API",
    version="1.1.0",
    description=(
        "API do StudyPro para chat, provas, simulados e base SaaS inicial."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionInput(BaseModel):
    question: str = Field(..., min_length=1)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("A pergunta não pode estar vazia.")
        return normalized


class ExamSubmission(BaseModel):
    answers: list[str | None] = Field(..., min_length=1)


class RandomSimulationRequest(BaseModel):
    exam_type: str = Field(..., min_length=1)
    year: int = Field(..., ge=1900, le=2100)
    question_count: int = Field(..., gt=0)
    subjects: list[str] | None = None
    mode: Literal["random", "balanced"] = "balanced"
    seed: int | None = None

    @field_validator("exam_type")
    @classmethod
    def validate_exam_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("exam_type não pode ser vazio.")
        return normalized

    @field_validator("subjects")
    @classmethod
    def validate_subjects(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None

        normalized_subjects: list[str] = []
        seen: set[str] = set()

        for subject in value:
            normalized = subject.strip()
            if not normalized:
                continue

            subject_key = normalized.casefold()
            if subject_key in seen:
                continue

            seen.add(subject_key)
            normalized_subjects.append(normalized)

        return normalized_subjects or None


class RandomSimulationSubmission(BaseModel):
    exam_type: str = Field(..., min_length=1)
    year: int = Field(..., ge=1900, le=2100)
    question_numbers: list[int] = Field(..., min_length=1)
    answers: list[str | None] = Field(..., min_length=1)

    @field_validator("exam_type")
    @classmethod
    def validate_exam_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("exam_type não pode ser vazio.")
        return normalized


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 2:
            raise ValueError("Nome inválido.")
        return normalized

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class PlanUpdateRequest(BaseModel):
    plan: Literal["free", "pro"]


def _now_utc() -> datetime:
    return datetime.now(UTC)


def _today_str() -> str:
    return _now_utc().date().isoformat()


def _hash_password(password: str, salt_hex: str) -> str:
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt_hex),
        100_000,
    )
    return derived.hex()


def _create_password_credentials(password: str) -> tuple[str, str]:
    salt_hex = secrets.token_hex(16)
    password_hash = _hash_password(password, salt_hex)
    return password_hash, salt_hex


def _verify_password(password: str, stored_hash: str, stored_salt: str) -> bool:
    computed_hash = _hash_password(password, stored_salt)
    return hmac.compare_digest(computed_hash, stored_hash)


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    prefix = "Bearer "
    if not authorization.startswith(prefix):
        return None

    token = authorization[len(prefix):].strip()
    return token or None


def _serialize_user(user: dict) -> dict:
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "plan": user["plan"],
        "is_active": bool(user["is_active"]),
        "created_at": user["created_at"],
        "updated_at": user["updated_at"],
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


def _build_plan_status_for_user(user: dict) -> dict:
    usage_date = _today_str()
    usage = get_user_usage(user["id"], usage_date)

    if user["plan"] == "pro":
        return {
            "scope": "user",
            "plan": "pro",
            "usage_date": usage_date,
            "simulations_generated_today": usage["simulations_generated"],
            "daily_limit": None,
            "remaining_today": None,
            "can_generate": True,
        }

    remaining = max(
        0,
        FREE_DAILY_SIMULATION_LIMIT - usage["simulations_generated"],
    )
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
    remaining = max(
        0,
        GUEST_DAILY_SIMULATION_LIMIT - usage["simulations_generated"],
    )

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


@app.on_event("startup")
def startup_event() -> None:
    create_table()


@app.get("/", tags=["health"])
def read_root() -> dict:
    return {"message": "Study Chatbot API online"}


@app.post("/auth/register", tags=["auth"])
def register(payload: RegisterRequest) -> dict:
    existing_user = get_user_auth_by_email(payload.email)
    if existing_user:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado.")

    password_hash, password_salt = _create_password_credentials(payload.password)
    user = create_user(
        name=payload.name,
        email=payload.email,
        password_hash=password_hash,
        password_salt=password_salt,
        plan="free",
    )

    return {
        "message": "Usuário criado com sucesso.",
        "user": user,
    }


@app.post("/auth/login", tags=["auth"])
def login(payload: LoginRequest) -> dict:
    user = get_user_auth_by_email(payload.email)

    if not user or not bool(user["is_active"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    if not _verify_password(
        payload.password,
        user["password_hash"],
        user["password_salt"],
    ):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")

    token = secrets.token_urlsafe(48)
    expires_at = (_now_utc() + timedelta(days=AUTH_TOKEN_TTL_DAYS)).isoformat()
    create_auth_token(user["id"], token, expires_at)

    safe_user = get_user_by_id(user["id"])
    return {
        "message": "Login realizado com sucesso.",
        "token_type": "Bearer",
        "access_token": token,
        "expires_at": expires_at,
        "user": safe_user,
        "usage": _build_plan_status_for_user(safe_user) if safe_user else None,
    }


@app.get("/auth/me", tags=["auth"])
def auth_me(authorization: str | None = Header(default=None)) -> dict:
    user = _get_current_user_or_401(authorization)
    return {
        "user": _serialize_user(user),
        "usage": _build_plan_status_for_user(user),
    }


@app.post("/auth/logout", tags=["auth"])
def logout(authorization: str | None = Header(default=None)) -> dict:
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Token ausente.")

    revoke_auth_token(token)
    return {"message": "Logout realizado com sucesso."}


@app.patch("/billing/plan", tags=["billing"])
def update_plan(
    payload: PlanUpdateRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)

    if payload.plan not in ALLOWED_PLANS:
        raise HTTPException(status_code=400, detail="Plano inválido.")

    updated_user = update_user_plan(user["id"], payload.plan)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return {
        "message": "Plano atualizado com sucesso.",
        "user": updated_user,
        "usage": _build_plan_status_for_user(updated_user),
    }


@app.get("/simulados/entitlement", tags=["simulations"])
def get_simulation_entitlement(
    request: Request,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user(authorization)

    if user:
        return {
            "authenticated": True,
            "user": _serialize_user(user),
            "usage": _build_plan_status_for_user(user),
        }

    return {
        "authenticated": False,
        "user": None,
        "usage": _build_plan_status_for_guest(request),
    }


@app.post("/chat", tags=["chat"])
def chat(data: QuestionInput) -> dict:
    result = process_question(data.question)
    return {
        "question": data.question,
        "category": result["category"],
        "explanation": result["explanation"],
        "summary": result["summary"],
        "study_tip": result["study_tip"],
        "formatted_response": result["formatted_response"],
    }


@app.get("/stats", tags=["analytics"])
def stats() -> dict:
    return {
        "total_questions": total_questions(),
        "questions_by_category": questions_by_category(),
        "most_frequent_category": most_frequent_category(),
    }


@app.get("/history", tags=["analytics"])
def history() -> list[dict]:
    rows = get_recent_interactions(limit=20)
    return [
        {
            "id": row[0],
            "question": row[1],
            "category": row[2],
            "response": row[3],
            "created_at": row[4],
        }
        for row in rows
    ]


@app.get("/exams", tags=["exams"])
def get_exams() -> dict:
    return {"exam_types": list_exam_types()}


@app.get("/exams/{exam_type}/{year}", tags=["exams"])
def get_exam(exam_type: str, year: int) -> dict:
    try:
        return get_exam_by_type_and_year(exam_type, year)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/exams/{exam_type}/{year}/submit", tags=["exams"])
def submit_exam(exam_type: str, year: int, submission: ExamSubmission) -> dict:
    try:
        return submit_exam_answers(exam_type, year, submission.answers)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/simulados/config/{exam_type}/{year}", tags=["simulations"])
def get_simulation_config(exam_type: str, year: int) -> dict:
    try:
        return get_question_bank_metadata(exam_type, year)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/simulados/random", tags=["simulations"])
def create_random_simulation(
    payload: RandomSimulationRequest,
    request: Request,
    authorization: str | None = Header(default=None),
) -> dict:
    usage_context = _enforce_simulation_generation_entitlement(request, authorization)

    try:
        simulation = generate_random_simulation(
            exam_type=payload.exam_type,
            year=payload.year,
            question_count=payload.question_count,
            subjects=payload.subjects,
            mode=payload.mode,
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


@app.post("/simulados/submit", tags=["simulations"])
def submit_simulation(payload: RandomSimulationSubmission) -> dict:
    try:
        return submit_random_simulation(
            exam_type=payload.exam_type,
            year=payload.year,
            question_numbers=payload.question_numbers,
            answers=payload.answers,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc