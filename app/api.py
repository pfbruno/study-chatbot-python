from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.analytics import most_frequent_category, questions_by_category, total_questions
from app.chatbot import process_question
from app.database import create_table, get_recent_interactions
from app.exams import ensure_exams_directory, get_public_exam, list_exam_catalog, submit_exam_answers


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
    answers: list[int | None]


@app.on_event("startup")
def startup_event():
    create_table()
    ensure_exams_directory()


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
    return {"exam_types": list_exam_catalog()}


@app.get("/exams/{exam_type}/{year}")
def get_exam(exam_type: str, year: int):
    try:
        return get_public_exam(exam_type, year)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/exams/{exam_type}/{year}/submit")
def submit_exam(exam_type: str, year: int, submission: ExamSubmission):
    try:
        return submit_exam_answers(exam_type, year, submission.answers)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))