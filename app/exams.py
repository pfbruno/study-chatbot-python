import json
import os
from pathlib import Path
from typing import Any


BASE_DIR = Path(os.getcwd()) / "data" / "exams"

EXAM_LABELS = {
    "enem": "ENEM",
    "ufrgs": "UFRGS",
    "ufsc": "UFSC",
    "fuvest": "FUVEST",
    "unicamp": "UNICAMP",
    "unesp": "UNESP",
    "outros": "Outros Vestibulares",
}


def ensure_exams_directory() -> None:
    BASE_DIR.mkdir(parents=True, exist_ok=True)


def _exam_file_path(exam_type: str, year: int) -> Path:
    return BASE_DIR / exam_type.lower() / f"{year}.json"


def _load_exam_file(exam_type: str, year: int) -> dict[str, Any]:
    file_path = _exam_file_path(exam_type, year)

    if not file_path.exists():
        raise FileNotFoundError(f"Prova não encontrada para {exam_type} {year}.")

    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    _validate_exam_payload(data, exam_type, year)
    return data


def _validate_exam_payload(data: dict[str, Any], exam_type: str, year: int) -> None:
    required_keys = ["title", "description", "institution", "year", "questions"]
    missing = [key for key in required_keys if key not in data]
    if missing:
        raise ValueError(
            f"Arquivo da prova {exam_type}/{year} inválido. Campos ausentes: {', '.join(missing)}"
        )

    if not isinstance(data["questions"], list) or len(data["questions"]) == 0:
        raise ValueError(f"A prova {exam_type}/{year} precisa ter pelo menos uma questão.")

    for index, question in enumerate(data["questions"], start=1):
        question_keys = ["statement", "options", "correct_answer"]
        missing_question_keys = [key for key in question_keys if key not in question]
        if missing_question_keys:
            raise ValueError(
                f"Questão {index} da prova {exam_type}/{year} inválida. "
                f"Campos ausentes: {', '.join(missing_question_keys)}"
            )

        if not isinstance(question["options"], list) or len(question["options"]) < 2:
            raise ValueError(
                f"Questão {index} da prova {exam_type}/{year} precisa ter pelo menos 2 alternativas."
            )

        correct_answer = question["correct_answer"]
        if not isinstance(correct_answer, int):
            raise ValueError(
                f"Questão {index} da prova {exam_type}/{year} precisa ter correct_answer inteiro."
            )

        if correct_answer < 0 or correct_answer >= len(question["options"]):
            raise ValueError(
                f"Questão {index} da prova {exam_type}/{year} possui correct_answer fora do intervalo."
            )


def list_exam_catalog() -> list[dict[str, Any]]:
    ensure_exams_directory()

    catalog: list[dict[str, Any]] = []

    for exam_dir in sorted([item for item in BASE_DIR.iterdir() if item.is_dir()], key=lambda path: path.name):
        exam_type = exam_dir.name.lower()
        years: list[dict[str, Any]] = []

        for exam_file in sorted(exam_dir.glob("*.json"), reverse=True):
            with open(exam_file, "r", encoding="utf-8") as file:
                data = json.load(file)

            questions = data.get("questions", [])
            years.append(
                {
                    "year": data.get("year"),
                    "title": data.get("title", f"{EXAM_LABELS.get(exam_type, exam_type.upper())} {exam_file.stem}"),
                    "description": data.get("description", ""),
                    "question_count": len(questions),
                }
            )

        catalog.append(
            {
                "key": exam_type,
                "label": EXAM_LABELS.get(exam_type, exam_type.upper()),
                "years": years,
            }
        )

    return catalog


def get_public_exam(exam_type: str, year: int) -> dict[str, Any]:
    data = _load_exam_file(exam_type, year)

    public_questions = []
    for index, question in enumerate(data["questions"], start=1):
        public_questions.append(
            {
                "id": index,
                "statement": question["statement"],
                "options": question["options"],
            }
        )

    return {
        "exam_type": exam_type.lower(),
        "title": data["title"],
        "description": data["description"],
        "institution": data["institution"],
        "year": data["year"],
        "question_count": len(public_questions),
        "questions": public_questions,
    }


def submit_exam_answers(exam_type: str, year: int, answers: list[int | None]) -> dict[str, Any]:
    data = _load_exam_file(exam_type, year)
    questions = data["questions"]

    if len(answers) != len(questions):
        raise ValueError(
            f"Quantidade de respostas enviada ({len(answers)}) difere da quantidade de questões ({len(questions)})."
        )

    correct_answers = 0
    unanswered_count = 0
    results_by_question = []

    for index, question in enumerate(questions):
        user_answer = answers[index]
        correct_answer = question["correct_answer"]

        if user_answer is None:
            unanswered_count += 1

        is_correct = user_answer == correct_answer
        if is_correct:
            correct_answers += 1

        results_by_question.append(
            {
                "question_number": index + 1,
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "is_correct": is_correct,
            }
        )

    total_questions = len(questions)
    score_percentage = round((correct_answers / total_questions) * 100, 2) if total_questions else 0.0

    return {
        "title": data["title"],
        "institution": data["institution"],
        "year": data["year"],
        "total_questions": total_questions,
        "correct_answers": correct_answers,
        "wrong_answers": total_questions - correct_answers - unanswered_count,
        "unanswered_count": unanswered_count,
        "score_percentage": score_percentage,
        "results_by_question": results_by_question,
    }