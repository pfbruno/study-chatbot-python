from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from app.analytics import (
    most_frequent_category,
    questions_by_category,
    total_questions,
)
from app.chatbot import process_question
from app.database import create_table, get_recent_interactions
from app.exams import (
    get_exam_by_type_and_year,
    list_exam_types,
    submit_exam_answers,
)
from app.question_bank import get_question_bank_metadata
from app.simulations import generate_random_simulation, submit_random_simulation

app = FastAPI(
    title="Study Chatbot API",
    version="1.0.0",
    description=(
        "API do StudyPro para chat, provas e simulados. "
        "Inclui geração de simulados, correção automática e estatísticas."
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
    question: str = Field(..., min_length=1, description="Pergunta enviada ao chatbot")

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("A pergunta não pode estar vazia.")
        return normalized


class ExamSubmission(BaseModel):
    answers: list[str | None] = Field(
        ...,
        min_length=1,
        description="Lista de respostas do usuário na ordem da prova",
    )


class RandomSimulationRequest(BaseModel):
    exam_type: str = Field(..., min_length=1, description="Tipo da prova, ex: enem")
    year: int = Field(..., ge=1900, le=2100, description="Ano da prova")
    question_count: int = Field(
        ...,
        gt=0,
        description="Quantidade de questões desejadas no simulado",
    )
    subjects: list[str] | None = Field(
        default=None,
        description="Lista opcional de disciplinas para filtrar o simulado",
    )
    mode: Literal["random", "balanced"] = Field(
        default="balanced",
        description="Modo de geração do simulado",
    )
    seed: int | None = Field(
        default=None,
        description="Semente opcional para reproduzir a seleção aleatória",
    )

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
        for subject in value:
            if subject is None:
                continue

            normalized = subject.strip()
            if normalized:
                normalized_subjects.append(normalized)

        return normalized_subjects or None


class RandomSimulationSubmission(BaseModel):
    exam_type: str = Field(..., min_length=1, description="Tipo da prova, ex: enem")
    year: int = Field(..., ge=1900, le=2100, description="Ano da prova")
    question_numbers: list[int] = Field(
        ...,
        min_length=1,
        description="Lista dos números das questões presentes no simulado",
    )
    answers: list[str | None] = Field(
        ...,
        min_length=1,
        description="Lista das respostas do usuário na mesma ordem de question_numbers",
    )

    @field_validator("exam_type")
    @classmethod
    def validate_exam_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("exam_type não pode ser vazio.")
        return normalized


@app.on_event("startup")
def startup_event() -> None:
    create_table()


@app.get("/", tags=["health"])
def read_root() -> dict:
    return {"message": "Study Chatbot API online"}


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
def create_random_simulation(payload: RandomSimulationRequest) -> dict:
    try:
        return generate_random_simulation(
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