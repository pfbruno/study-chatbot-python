from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.chatbot import process_question
from app.database import create_table, get_recent_interactions
from app.analytics import total_questions, questions_by_category, most_frequent_category

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
        "formatted_response": result["formatted_response"]
    }


@app.get("/stats")
def stats():
    return {
        "total_questions": total_questions(),
        "questions_by_category": questions_by_category(),
        "most_frequent_category": most_frequent_category()
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
            "created_at": row[4]
        }
        for row in rows
    ]