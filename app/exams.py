import json
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent.parent
CATALOG_PATH = BASE_DIR / "data" / "exams" / "catalog.json"


def load_exam_catalog() -> dict[str, Any]:
    if not CATALOG_PATH.exists():
        raise FileNotFoundError("Arquivo data/exams/catalog.json não encontrado.")

    with open(CATALOG_PATH, "r", encoding="utf-8") as file:
        return json.load(file)


def list_exam_types() -> list[dict[str, Any]]:
    catalog = load_exam_catalog()
    exams = catalog.get("exams", [])

    result = []
    for exam in exams:
        years = exam.get("years", [])
        result.append(
            {
                "key": exam["key"],
                "label": exam["label"],
                "years": [
                    {
                        "year": year["year"],
                        "title": year["title"],
                        "description": year.get("description", ""),
                        "question_count": year.get("question_count", 0),
                        "has_answer_key": bool(year.get("answer_key")),
                        "has_pdfs": bool(year.get("pdfs")),
                        "official_page_url": year.get("official_page_url"),
                    }
                    for year in sorted(years, key=lambda item: item["year"], reverse=True)
                ],
            }
        )

    return result


def get_exam_by_type_and_year(exam_type: str, year: int) -> dict[str, Any]:
    catalog = load_exam_catalog()
    exams = catalog.get("exams", [])

    for exam in exams:
        if exam["key"].lower() != exam_type.lower():
            continue

        for year_item in exam.get("years", []):
            if int(year_item["year"]) == int(year):
                return {
                    "exam_type": exam["key"],
                    "institution": exam["label"],
                    "year": year_item["year"],
                    "title": year_item["title"],
                    "description": year_item.get("description", ""),
                    "question_count": year_item.get("question_count", 0),
                    "pdfs": year_item.get("pdfs", []),
                    "has_answer_key": bool(year_item.get("answer_key")),
                    "official_page_url": year_item.get("official_page_url"),
                }

    raise FileNotFoundError(f"Prova não encontrada para {exam_type} {year}.")


def get_exam_with_answer_key(exam_type: str, year: int) -> dict[str, Any]:
    catalog = load_exam_catalog()
    exams = catalog.get("exams", [])

    for exam in exams:
        if exam["key"].lower() != exam_type.lower():
            continue

        for year_item in exam.get("years", []):
            if int(year_item["year"]) == int(year):
                return {
                    **year_item,
                    "institution": exam["label"],
                }

    raise FileNotFoundError(f"Prova não encontrada para {exam_type} {year}.")


def submit_exam_answers(exam_type: str, year: int, answers: list[str | None]) -> dict[str, Any]:
    exam = get_exam_with_answer_key(exam_type, year)
    answer_key = exam.get("answer_key", [])

    if not answer_key:
        raise ValueError("Esta prova ainda não possui gabarito cadastrado para correção automática.")

    if len(answers) != len(answer_key):
        raise ValueError(
            f"Quantidade de respostas enviada ({len(answers)}) difere da quantidade de questões ({len(answer_key)})."
        )

    correct_answers = 0
    wrong_answers = 0
    unanswered_count = 0
    annulled_count = 0
    results_by_question = []

    for index, correct in enumerate(answer_key):
        user_answer = answers[index]

        normalized_user_answer = user_answer.upper() if isinstance(user_answer, str) and user_answer.strip() else None
        normalized_correct = correct.upper() if isinstance(correct, str) and correct.strip() else None

        if normalized_correct is None:
            annulled_count += 1
            results_by_question.append(
                {
                    "question_number": index + 1,
                    "user_answer": normalized_user_answer,
                    "correct_answer": None,
                    "status": "annulled",
                }
            )
            continue

        if normalized_user_answer is None:
            unanswered_count += 1
            results_by_question.append(
                {
                    "question_number": index + 1,
                    "user_answer": None,
                    "correct_answer": normalized_correct,
                    "status": "blank",
                }
            )
            continue

        if normalized_user_answer == normalized_correct:
            correct_answers += 1
            status = "correct"
        else:
            wrong_answers += 1
            status = "wrong"

        results_by_question.append(
            {
                "question_number": index + 1,
                "user_answer": normalized_user_answer,
                "correct_answer": normalized_correct,
                "status": status,
            }
        )

    valid_questions = len([item for item in answer_key if item is not None])
    score_percentage = round((correct_answers / valid_questions) * 100, 2) if valid_questions else 0.0

    return {
        "title": exam["title"],
        "institution": exam["institution"],
        "year": exam["year"],
        "total_questions": len(answer_key),
        "valid_questions": valid_questions,
        "correct_answers": correct_answers,
        "wrong_answers": wrong_answers,
        "unanswered_count": unanswered_count,
        "annulled_count": annulled_count,
        "score_percentage": score_percentage,
        "results_by_question": results_by_question,
    }