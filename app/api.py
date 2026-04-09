from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.analytics import most_frequent_category, questions_by_category, total_questions
from app.chatbot import process_question
from app.database import create_table, get_recent_interactions
from app.exams import get_exam_by_type_and_year, list_exam_types, submit_exam_answers
from app.question_bank import get_question_bank_metadata
from app.simulations import generate_random_simulation, submit_random_simulation

app = FastAPI(title="Study Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class QuestionInput(BaseModel):
    question: str


class ExamSubmission(BaseModel):
    answers: list[str | None]


class RandomSimulationRequest(BaseModel):
    exam_type: str
    year: int
    question_count: int
    subjects: list[str] | None = None
    mode: Literal["random", "balanced"] = "balanced"
    seed: int | None = None


class RandomSimulationSubmission(BaseModel):
    exam_type: str
    year: int
    question_numbers: list[int]
    answers: list[str | None]


@app.on_event("startup")
def startup_event():
    create_table()


@app.get("/")
def read_root():
    return {"message": "Study Chatbot API online"}


@app.post("/chat")
def chat(data: QuestionInput):
    result = process_question(data.question)
    return {
        "question": data.question,
        "category": result["category"],
        "explanation": result["explanation"],
        "summary": result["summary"],
        "study_tip": result["study_tip"],
        "formatted_response": result["formatted_response"],
    }


@app.get("/stats")
def stats():
    return {
        "total_questions": total_questions(),
        "questions_by_category": questions_by_category(),
        "most_frequent_category": most_frequent_category(),
    }


@app.get("/history")
def history():
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


@app.get("/exams")
def get_exams():
    return {"exam_types": list_exam_types()}


@app.get("/exams/{exam_type}/{year}")
def get_exam(exam_type: str, year: int):
    try:
        return get_exam_by_type_and_year(exam_type, year)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/exams/{exam_type}/{year}/submit")
def submit_exam(exam_type: str, year: int, submission: ExamSubmission):
    try:
        return submit_exam_answers(exam_type, year, submission.answers)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/simulados/config/{exam_type}/{year}")
def get_simulation_config(exam_type: str, year: int):
    try:
        return get_question_bank_metadata(exam_type, year)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/simulados/random")
def create_random_simulation(payload: RandomSimulationRequest):
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


@app.post("/simulados/submit")
def submit_simulation(payload: RandomSimulationSubmission):
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