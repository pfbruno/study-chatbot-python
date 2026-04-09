import json
from collections import Counter
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent / "data" / "exams" / "questions"
VALID_ALTERNATIVES = {"A", "B", "C", "D", "E"}


def _question_file_path(exam_type: str, year: int) -> Path:
    return BASE_DIR / exam_type.lower() / f"{year}.json"


def load_question_bank(exam_type: str, year: int) -> dict:
    file_path = _question_file_path(exam_type, year)

    if not file_path.exists():
        raise FileNotFoundError(
            f"Banco de questões não encontrado para {exam_type.upper()} {year}."
        )

    with file_path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if "questions" not in data or not isinstance(data["questions"], list):
        raise ValueError("Arquivo de questões inválido: campo 'questions' ausente ou inválido.")

    _validate_questions(data["questions"])
    return data


def _validate_questions(questions: list[dict]) -> None:
    numbers_seen = set()

    for question in questions:
        number = question.get("number")
        subject = question.get("subject")
        statement = question.get("statement")
        options = question.get("options")
        answer = question.get("answer")
        annulled = bool(question.get("annulled", False))

        if not isinstance(number, int) or number <= 0:
            raise ValueError("Cada questão deve possuir 'number' inteiro maior que zero.")

        if number in numbers_seen:
            raise ValueError(f"Número de questão duplicado encontrado: {number}")
        numbers_seen.add(number)

        if not isinstance(subject, str) or not subject.strip():
            raise ValueError(f"A questão {number} possui 'subject' inválido.")

        if not isinstance(statement, str) or not statement.strip():
            raise ValueError(f"A questão {number} possui 'statement' inválido.")

        if not isinstance(options, dict):
            raise ValueError(f"A questão {number} possui 'options' inválido.")

        for alternative in ["A", "B", "C", "D", "E"]:
            if alternative not in options or not isinstance(options[alternative], str):
                raise ValueError(
                    f"A questão {number} deve possuir a alternativa {alternative}."
                )

        if not annulled:
            if answer not in VALID_ALTERNATIVES:
                raise ValueError(
                    f"A questão {number} possui 'answer' inválido. Use A, B, C, D ou E."
                )


def get_questions(exam_type: str, year: int, include_annulled: bool = False) -> list[dict]:
    data = load_question_bank(exam_type, year)
    questions = data["questions"]

    if include_annulled:
        return questions

    return [question for question in questions if not question.get("annulled", False)]


def get_question_bank_metadata(exam_type: str, year: int) -> dict:
    data = load_question_bank(exam_type, year)
    valid_questions = get_questions(exam_type, year, include_annulled=False)
    subject_counts = Counter(question["subject"] for question in valid_questions)

    return {
        "exam_type": data.get("exam_type", exam_type.lower()),
        "year": data.get("year", year),
        "title": data.get("title", f"{exam_type.upper()} {year}"),
        "total_questions_registered": len(data["questions"]),
        "total_valid_questions": len(valid_questions),
        "annulled_questions": len(data["questions"]) - len(valid_questions),
        "subjects": [
            {"name": subject, "count": count}
            for subject, count in sorted(subject_counts.items(), key=lambda item: item[0])
        ],
    }


def get_available_subjects(exam_type: str, year: int) -> list[str]:
    valid_questions = get_questions(exam_type, year, include_annulled=False)
    return sorted({question["subject"] for question in valid_questions})


def get_question_map(exam_type: str, year: int, include_annulled: bool = False) -> dict[int, dict]:
    questions = get_questions(exam_type, year, include_annulled=include_annulled)
    return {question["number"]: question for question in questions}