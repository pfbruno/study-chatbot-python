from __future__ import annotations

from app.exams.collectors.enem import collect_enem_year
from app.exams.models import (
    create_exam_tables,
    get_exam_structure,
    list_exams_structured,
    upsert_exam_structure,
)


def import_enem_year(year: int) -> dict:
    create_exam_tables()
    payload = collect_enem_year(year)
    return upsert_exam_structure(**payload)


def list_exams(source: str | None = None) -> list[dict]:
    create_exam_tables()
    return list_exams_structured(source=source)


def get_exam_details(exam_id: int) -> dict:
    create_exam_tables()
    exam = get_exam_structure(exam_id)
    if not exam:
        raise FileNotFoundError("Prova não encontrada.")
    return exam


def get_exam_answer_sheet(exam_id: int) -> dict:
    exam = get_exam_details(exam_id)
    return {
        "exam_id": exam_id,
        "total_questions": int(exam.get("total_questions", 0)),
        "options": ["A", "B", "C", "D", "E"],
    }


def submit_exam_sheet(exam_id: int, answers: list[str | None]) -> dict:
    exam = get_exam_details(exam_id)
    answer_key = exam.get("answer_key") or []

    if not answer_key:
        raise ValueError("Prova sem gabarito oficial cadastrado.")

    if len(answers) != len(answer_key):
        raise ValueError(
            f"Quantidade de respostas ({len(answers)}) difere do total ({len(answer_key)})."
        )

    correct_answers = 0
    wrong_answers = 0
    unanswered_count = 0
    annulled_count = 0
    results_by_question: list[dict] = []

    for index, correct in enumerate(answer_key):
        user_answer = answers[index]
        normalized_user = (
            user_answer.upper().strip() if isinstance(user_answer, str) and user_answer.strip() else None
        )
        normalized_correct = (
            correct.upper().strip() if isinstance(correct, str) and correct.strip() else None
        )

        if normalized_correct is None:
            annulled_count += 1
            results_by_question.append({
                "question_number": index + 1,
                "user_answer": normalized_user,
                "correct_answer": None,
                "status": "annulled",
            })
            continue

        if normalized_user is None:
            unanswered_count += 1
            results_by_question.append({
                "question_number": index + 1,
                "user_answer": None,
                "correct_answer": normalized_correct,
                "status": "blank",
            })
            continue

        status = "correct" if normalized_user == normalized_correct else "wrong"
        if status == "correct":
            correct_answers += 1
        else:
            wrong_answers += 1

        results_by_question.append({
            "question_number": index + 1,
            "user_answer": normalized_user,
            "correct_answer": normalized_correct,
            "status": status,
        })

    valid_questions = len([item for item in answer_key if item is not None])
    score_percentage = round((correct_answers / valid_questions) * 100, 2) if valid_questions else 0.0

    return {
        "exam_id": exam_id,
        "title": exam.get("title"),
        "institution": exam.get("source", "exam").upper(),
        "year": exam.get("year"),
        "total_questions": len(answer_key),
        "valid_questions": valid_questions,
        "correct_answers": correct_answers,
        "wrong_answers": wrong_answers,
        "unanswered_count": unanswered_count,
        "annulled_count": annulled_count,
        "score_percentage": score_percentage,
        "results_by_question": results_by_question,
    }
