import json
from collections import Counter
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent / "data" / "exams" / "questions"
VALID_ALTERNATIVES = {"A", "B", "C", "D", "E"}


def _exam_dir_path(exam_type: str) -> Path:
    return BASE_DIR / exam_type.lower()


def _question_file_path(exam_type: str, year: int) -> Path:
    return _exam_dir_path(exam_type) / f"{year}.json"


def list_available_question_bank_years(exam_type: str) -> list[int]:
    exam_dir = _exam_dir_path(exam_type)

    if not exam_dir.exists() or not exam_dir.is_dir():
        raise FileNotFoundError(
            f"Nenhum diretório de questões encontrado para {exam_type.upper()}."
        )

    years: list[int] = []
    for file_path in exam_dir.glob("*.json"):
        try:
            years.append(int(file_path.stem))
        except ValueError:
            continue

    years = sorted(set(years))
    if not years:
        raise FileNotFoundError(
            f"Nenhum banco de questões encontrado para {exam_type.upper()}."
        )

    return years


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

        if not annulled and answer not in VALID_ALTERNATIVES:
            raise ValueError(
                f"A questão {number} possui 'answer' inválido. Use A, B, C, D ou E."
            )


def _attach_source_metadata(question: dict, year: int) -> dict:
    enriched = dict(question)
    enriched["source_year"] = int(year)
    enriched["source_number"] = int(question["number"])
    enriched["source_ref"] = f"{year}:{question['number']}"
    return enriched


def get_questions(exam_type: str, year: int, include_annulled: bool = False) -> list[dict]:
    data = load_question_bank(exam_type, year)
    questions = data["questions"]

    if not include_annulled:
        questions = [question for question in questions if not question.get("annulled", False)]

    resolved_year = int(data.get("year", year))
    return [_attach_source_metadata(question, resolved_year) for question in questions]


def get_questions_for_years(
    exam_type: str,
    years: list[int],
    include_annulled: bool = False,
) -> list[dict]:
    all_questions: list[dict] = []

    for year in years:
        all_questions.extend(
            get_questions(exam_type, year, include_annulled=include_annulled)
        )

    return all_questions


def get_all_questions(exam_type: str, include_annulled: bool = False) -> list[dict]:
    years = list_available_question_bank_years(exam_type)
    return get_questions_for_years(
        exam_type,
        years,
        include_annulled=include_annulled,
    )


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


def get_aggregate_question_bank_metadata(exam_type: str) -> dict:
    years = list_available_question_bank_years(exam_type)
    valid_questions = get_all_questions(exam_type, include_annulled=False)
    subject_counts = Counter(question["subject"] for question in valid_questions)

    return {
        "exam_type": exam_type.lower(),
        "years": years,
        "title": f"{exam_type.upper()} • Banco consolidado",
        "total_valid_questions": len(valid_questions),
        "subjects": [
            {"name": subject, "count": count}
            for subject, count in sorted(subject_counts.items(), key=lambda item: item[0])
        ],
    }


def get_available_subjects(exam_type: str, year: int) -> list[str]:
    valid_questions = get_questions(exam_type, year, include_annulled=False)
    return sorted({question["subject"] for question in valid_questions})


def get_all_available_subjects(exam_type: str) -> list[str]:
    valid_questions = get_all_questions(exam_type, include_annulled=False)
    return sorted({question["subject"] for question in valid_questions})


def get_question_map(exam_type: str, year: int, include_annulled: bool = False) -> dict[int, dict]:
    questions = get_questions(exam_type, year, include_annulled=include_annulled)
    return {question["number"]: question for question in questions}


def get_question_map_for_years(
    exam_type: str,
    years: list[int],
    include_annulled: bool = False,
) -> dict[str, dict]:
    questions = get_questions_for_years(
        exam_type,
        years,
        include_annulled=include_annulled,
    )
    return {question["source_ref"]: question for question in questions}


def get_all_question_map(exam_type: str, include_annulled: bool = False) -> dict[str, dict]:
    questions = get_all_questions(exam_type, include_annulled=include_annulled)
    return {question["source_ref"]: question for question in questions}