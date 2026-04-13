import hashlib
import hmac
import os
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import stripe
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
    clear_user_subscription,
    create_auth_token,
    create_simulation_attempt_v2,
    create_simulation_v2,
    create_table,
    create_user,
    get_guest_usage,
    get_recent_interactions,
    get_simulation_analytics_v2,
    get_user_auth_by_email,
    get_user_by_id,
    get_user_by_stripe_customer_id,
    get_user_by_token,
    get_user_usage,
    increment_guest_simulation_usage,
    increment_user_simulation_usage,
    is_stripe_event_processed,
    list_simulations_v2,
    mark_stripe_event_processed,
    rate_simulation_v2,
    revoke_auth_token,
    store_checkout_session_for_user,
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

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "").strip()
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "").strip()
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
FRONTEND_BASE_URL = os.getenv(
    "FRONTEND_BASE_URL",
    "https://study-chatbot-python-uksv.vercel.app",
).rstrip("/")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

app = FastAPI(
    title="Study Chatbot API",
    version="1.2.0",
    description="API do StudyPro para chat, provas, simulados e monetização com Stripe.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://study-chatbot-python-uksv.vercel.app",
        "http://localhost:3000",
    ],
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


class CheckoutSessionRequest(BaseModel):
    price_id: str | None = None

    @field_validator("price_id")
    @classmethod
    def normalize_price_id(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class SimulationV2CreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    exam_type: str = Field(..., min_length=1)
    year: int = Field(..., ge=1900, le=2100)
    subject: str | None = Field(default=None, max_length=120)
    question_count: int = Field(..., gt=0, le=300)


class SimulationV2RatingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)


class SimulationV2AttemptAnswerInput(BaseModel):
    question_number: int = Field(..., ge=1)
    selected_option: str | None = Field(default=None, max_length=8)
    is_correct: bool
    time_spent_seconds: float = Field(..., gt=0)


class SimulationV2AttemptRequest(BaseModel):
    answers: list[SimulationV2AttemptAnswerInput] = Field(..., min_length=1)


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


def _ensure_stripe_ready() -> None:
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="STRIPE_SECRET_KEY não configurada no backend.",
        )

    if not STRIPE_PRICE_ID:
        raise HTTPException(
            status_code=500,
            detail="STRIPE_PRICE_ID não configurada no backend.",
        )


def _get_checkout_price_id(payload: CheckoutSessionRequest | None) -> str:
    requested_price_id = payload.price_id if payload else None

    if requested_price_id and requested_price_id != STRIPE_PRICE_ID:
        raise HTTPException(
            status_code=400,
            detail="price_id inválido para este ambiente.",
        )

    return requested_price_id or STRIPE_PRICE_ID


def _extract_price_id_from_subscription(subscription: Any) -> str | None:
    items = subscription.get("items", {}).get("data", []) if subscription else []
    if not items:
        return None

    price = items[0].get("price") if isinstance(items[0], dict) else None
    if not isinstance(price, dict):
        return None

    price_id = price.get("id")
    return str(price_id) if price_id else None


def _extract_user_id_from_checkout_session(session: Any) -> int | None:
    client_reference_id = session.get("client_reference_id")
    if client_reference_id:
        try:
            return int(client_reference_id)
        except (TypeError, ValueError):
            pass

    metadata = session.get("metadata") or {}
    raw_user_id = metadata.get("user_id")
    if raw_user_id:
        try:
            return int(raw_user_id)
        except (TypeError, ValueError):
            return None

    return None


def _activate_user_pro_plan(
    user_id: int,
    stripe_customer_id: str | None = None,
    stripe_subscription_id: str | None = None,
    stripe_price_id: str | None = None,
    stripe_checkout_session_id: str | None = None,
) -> dict | None:
    return update_user_plan(
        user_id,
        "pro",
        stripe_customer_id=stripe_customer_id,
        stripe_subscription_id=stripe_subscription_id,
        stripe_price_id=stripe_price_id,
        stripe_checkout_session_id=stripe_checkout_session_id,
    )


def _sync_user_from_checkout_session(session: Any) -> dict | None:
    user_id = _extract_user_id_from_checkout_session(session)
    if user_id is None:
        raise HTTPException(
            status_code=400,
            detail="Sessão Stripe sem user_id válido em client_reference_id/metadata.",
        )

    stripe_customer_id = session.get("customer")
    stripe_subscription_id = session.get("subscription")
    stripe_price_id = None

    if stripe_subscription_id:
        subscription = stripe.Subscription.retrieve(stripe_subscription_id)
        stripe_price_id = _extract_price_id_from_subscription(subscription)

    return _activate_user_pro_plan(
        user_id=user_id,
        stripe_customer_id=str(stripe_customer_id) if stripe_customer_id else None,
        stripe_subscription_id=str(stripe_subscription_id) if stripe_subscription_id else None,
        stripe_price_id=stripe_price_id,
        stripe_checkout_session_id=str(session.get("id")),
    )


def _sync_user_from_subscription(subscription: Any) -> dict | None:
    stripe_customer_id = subscription.get("customer")
    user = None

    metadata = subscription.get("metadata") or {}
    raw_user_id = metadata.get("user_id")
    if raw_user_id:
        try:
            user = get_user_by_id(int(raw_user_id))
        except (TypeError, ValueError):
            user = None

    if not user and stripe_customer_id:
        user = get_user_by_stripe_customer_id(str(stripe_customer_id))

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado para a assinatura Stripe recebida.",
        )

    subscription_status = str(subscription.get("status") or "").lower()
    price_id = _extract_price_id_from_subscription(subscription)
    subscription_id = subscription.get("id")

    if subscription_status in {"active", "trialing"}:
        return _activate_user_pro_plan(
            user_id=user["id"],
            stripe_customer_id=str(stripe_customer_id) if stripe_customer_id else None,
            stripe_subscription_id=str(subscription_id) if subscription_id else None,
            stripe_price_id=price_id,
        )

    if subscription_status in {"canceled", "unpaid", "incomplete_expired"}:
        return clear_user_subscription(user["id"])

    return get_user_by_id(user["id"])


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


@app.post("/billing/checkout", tags=["billing"])
def create_checkout_session(
    payload: CheckoutSessionRequest | None = None,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)
    _ensure_stripe_ready()

    if user["plan"] == "pro":
        raise HTTPException(status_code=409, detail="Usuário já possui plano PRO ativo.")

    price_id = _get_checkout_price_id(payload)

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=f"{FRONTEND_BASE_URL}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_BASE_URL}/pricing?canceled=1",
            allow_promotion_codes=True,
            customer_email=user["email"],
            client_reference_id=str(user["id"]),
            metadata={
                "user_id": str(user["id"]),
                "user_email": user["email"],
                "target_plan": "pro",
            },
            subscription_data={
                "metadata": {
                    "user_id": str(user["id"]),
                    "user_email": user["email"],
                    "target_plan": "pro",
                }
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao criar sessão de checkout no Stripe: {exc}",
        ) from exc

    store_checkout_session_for_user(
        user_id=user["id"],
        stripe_checkout_session_id=str(session.get("id")),
        stripe_customer_id=str(session.get("customer")) if session.get("customer") else None,
        stripe_price_id=price_id,
    )

    checkout_url = session.get("url")
    if not checkout_url:
        raise HTTPException(
            status_code=500,
            detail="Stripe não retornou a URL de checkout.",
        )

    return {
        "message": "Sessão de checkout criada com sucesso.",
        "checkout_session_id": session.get("id"),
        "checkout_url": checkout_url,
    }


@app.post("/billing/webhook", tags=["billing"])
async def stripe_webhook(request: Request) -> dict:
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="STRIPE_SECRET_KEY não configurada no backend.",
        )

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail="STRIPE_WEBHOOK_SECRET não configurada no backend.",
        )

    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    if not signature:
        raise HTTPException(status_code=400, detail="Cabeçalho stripe-signature ausente.")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=signature,
            secret=STRIPE_WEBHOOK_SECRET,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Payload Stripe inválido.") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Assinatura Stripe inválida.") from exc

    event_id = str(event.get("id"))
    event_type = str(event.get("type"))

    if is_stripe_event_processed(event_id):
        return {"received": True, "duplicate": True}

    data_object = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        payment_status = str(data_object.get("payment_status") or "").lower()
        checkout_status = str(data_object.get("status") or "").lower()

        if checkout_status == "complete" and payment_status in {"paid", "no_payment_required"}:
            _sync_user_from_checkout_session(data_object)

    elif event_type in {"customer.subscription.created", "customer.subscription.updated"}:
        _sync_user_from_subscription(data_object)

    elif event_type == "customer.subscription.deleted":
        _sync_user_from_subscription(data_object)

    elif event_type == "invoice.paid":
        subscription_id = data_object.get("subscription")
        if subscription_id:
            subscription = stripe.Subscription.retrieve(subscription_id)
            _sync_user_from_subscription(subscription)

    mark_stripe_event_processed(event_id, event_type)
    return {"received": True, "event_type": event_type}


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


@app.get("/v2/simulados", tags=["simulations-v2"])
def list_advanced_simulations(subject: str | None = None) -> dict:
    return {"items": list_simulations_v2(subject=subject)}


@app.post("/v2/simulados", tags=["simulations-v2"])
def create_advanced_simulation(
    payload: SimulationV2CreateRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)
    created = create_simulation_v2(
        owner_user_id=user["id"],
        title=payload.title.strip(),
        exam_type=payload.exam_type.strip().lower(),
        year=payload.year,
        subject=payload.subject.strip() if payload.subject else None,
        question_count=payload.question_count,
    )
    return {"message": "Simulado criado com sucesso.", "item": created}


@app.post("/v2/simulados/{simulation_id}/rating", tags=["simulations-v2"])
def rate_advanced_simulation(
    simulation_id: int,
    payload: SimulationV2RatingRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)
    updated = rate_simulation_v2(
        simulation_id=simulation_id,
        user_id=user["id"],
        rating=payload.rating,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Simulado não encontrado.")
    return {"message": "Avaliação registrada com sucesso.", "item": updated}


@app.post("/v2/simulados/{simulation_id}/attempts", tags=["simulations-v2"])
def submit_advanced_simulation_attempt(
    simulation_id: int,
    payload: SimulationV2AttemptRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _get_current_user_or_401(authorization)
    created = create_simulation_attempt_v2(
        simulation_id=simulation_id,
        user_id=user["id"],
        answers=[answer.model_dump() for answer in payload.answers],
    )
    if not created:
        raise HTTPException(status_code=404, detail="Simulado não encontrado.")
    return {"message": "Tentativa registrada com sucesso.", "attempt": created}


@app.get("/v2/simulados/{simulation_id}/analytics", tags=["simulations-v2"])
def get_advanced_simulation_analytics(
    simulation_id: int,
    period_days: int | None = None,
    subject: str | None = None,
) -> dict:
    analytics = get_simulation_analytics_v2(
        simulation_id=simulation_id,
        period_days=period_days,
        subject=subject,
    )
    if not analytics:
        raise HTTPException(status_code=404, detail="Simulado não encontrado.")
    return analytics
