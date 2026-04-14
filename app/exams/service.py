from __future__ import annotations

from app.exams.collectors.enem import collect_enem_year
from app.exams.models import (
    create_exam_attempt,
    create_exam_tables,
    get_exam_analytics_overview,
    list_recent_exam_attempts,
    get_latest_exam_attempt,
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


def _infer_enem_subject(question_number: int) -> str:
    if question_number <= 45:
        return "linguagens"
    if question_number <= 90:
        return "humanas"
    if question_number <= 135:
        return "natureza"
    return "matematica"


def submit_exam_sheet(
    exam_id: int,
    answers: list[str | None],
    user_id: int | None = None,
    time_spent_seconds: float | None = None,
) -> dict:
def submit_exam_sheet(
    exam_id: int,
    answers: list[str | None],
    user_id: int | None = None,
    time_spent_seconds: float | None = None,
) -> dict:
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

    results_by_question = []
    subject_stats = {}

    for index, correct in enumerate(answer_key):
        question_number = index + 1
        subject = _infer_enem_subject(question_number)

        subject_stats.setdefault(subject, {
            "total": 0,
            "correct": 0,
            "wrong": 0,
            "blank": 0,
        })

        subject_stats[subject]["total"] += 1

        user_answer = answers[index]

        normalized_user = (
            user_answer.upper().strip()
            if isinstance(user_answer, str) and user_answer.strip()
            else None
        )

        normalized_correct = (
            correct.upper().strip()
            if isinstance(correct, str) and correct.strip()
            else None
        )

        if normalized_correct is None:
            annulled_count += 1
            results_by_question.append({
                "question_number": question_number,
                "user_answer": normalized_user,
                "correct_answer": None,
                "status": "annulled",
                "subject": subject,
            })
            continue

        if normalized_user is None:
            unanswered_count += 1
            subject_stats[subject]["blank"] += 1
            results_by_question.append({
                "question_number": question_number,
                "user_answer": None,
                "correct_answer": normalized_correct,
                "status": "blank",
                "subject": subject,
            })
            continue

        if normalized_user == normalized_correct:
            correct_answers += 1
            subject_stats[subject]["correct"] += 1
            status = "correct"
        else:
            wrong_answers += 1
            subject_stats[subject]["wrong"] += 1
            status = "wrong"

        results_by_question.append({
            "question_number": question_number,
            "user_answer": normalized_user,
            "correct_answer": normalized_correct,
            "status": status,
            "subject": subject,
        })

    valid_questions = len([item for item in answer_key if item is not None])
    score_percentage = round((correct_answers / valid_questions) * 100, 2) if valid_questions else 0.0

    subject_breakdown = [
        {
            "subject": subject,
            "accuracy": round((values["correct"] / max(1, values["total"])) * 100, 2),
            "correct": values["correct"],
            "wrong": values["wrong"],
            "blank": values["blank"],
            "total": values["total"],
        }
        for subject, values in subject_stats.items()
    ]

    wrong_questions = [
        item for item in results_by_question if item["status"] == "wrong"
    ]

    attempt_id = None
    if user_id:
        attempt_id = create_exam_attempt(
            exam_id=exam_id,
            user_id=user_id,
            score_percentage=score_percentage,
            correct_answers=correct_answers,
            wrong_answers=wrong_answers,
            unanswered_count=unanswered_count,
            total_questions=len(answer_key),
            answers=answers,
            subject_breakdown=subject_breakdown,
            wrong_questions=wrong_questions,
            time_spent_seconds=time_spent_seconds,
        )

    return {
        "attempt_id": attempt_id,
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
        "subject_breakdown": subject_breakdown,
        "wrong_questions": wrong_questions,
        "results_by_question": results_by_question,
    }


def get_exam_latest_attempt(exam_id: int, user_id: int) -> dict | None:
    create_exam_tables()
    return get_latest_exam_attempt(exam_id=exam_id, user_id=user_id)


def get_user_exam_analytics(user_id: int) -> dict:
    create_exam_tables()
    return get_exam_analytics_overview(user_id=user_id)


def get_recent_exam_attempts(user_id: int, limit: int = 5) -> list[dict]:
    create_exam_tables()
    return list_recent_exam_attempts(user_id=user_id, limit=limit)
        "results_by_question": results_by_question,
    }
