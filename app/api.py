from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.chatbot import process_question
from app.database import create_table
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
    response = process_question(data.question)
    return {
        "question": data.question,
        "response": response
    }


@app.get("/stats")
def stats():
    return {
        "total_questions": total_questions(),
        "questions_by_category": questions_by_category(),
        "most_frequent_category": most_frequent_category()
    }