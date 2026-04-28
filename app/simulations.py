import random
from collections import defaultdict
from datetime import UTC, datetime
from typing import Literal
from uuid import uuid4

from app.question_bank import (
    get_all_available_subjects,
    get_all_question_map,
    get_all_questions,
    get_question_bank_metadata,
    get_question_map,
    get_questions,
    list_available_question_bank_years,
)

SimulationMode = Literal["random", "balanced"]

READY_SIMULATION_LIBRARY = [
    {
        "id": "mix-10",
        "title": "Misto Rápido • 10 questões",
        "description": "Treino rápido com questões aleatórias do banco inteiro disponível.",
        "question_count": 10,
        "subjects": None,
        "mode": "random",
        "difficulty": "easy",
        "duration_minutes": 20,
        "tags": ["Misto", "Rápido", "Biblioteca"],
        "is_premium": False,
    },
    {
        "id": "math-15",
        "title": "Matemática • 15 questões",
        "description": "Treino pronto só de matemática usando todas as provas disponíveis.",
        "question_count": 15,
        "subjects": ["Matemática"],
        "mode": "random",
        "difficulty": "medium",
        "duration_minutes": 30,
        "tags": ["Matemática", "Foco", "Biblioteca"],
        "is_premium": False,
    },
    {
        "id": "humanas-15",
        "title": "Humanas • 15 questões",
        "description": "Treino pronto de Ciências Humanas usando todos os anos disponíveis.",
        "question_count": 15,
        "subjects": ["Ciências Humanas"],
        "mode": "random",
        "difficulty": "medium",
        "duration_minutes": 30,
        "tags": ["Humanas", "Foco", "Biblioteca"],
        "is_premium": False,
    },
    {
        "id": "natureza-15",
        "title": "Natureza • 15 questões",
        "description": "Treino pronto de Ciências da Natureza com mistura de todas as provas.",
        "question_count": 15,
        "subjects": ["Ciências da Natureza"],
        "mode": "random",
        "difficulty": "medium",
        "duration_minutes": 30,
        "tags": ["Natureza", "Foco", "Biblioteca"],
        "is_premium": False,
    },
    {
        "id": "linguagens-15",
        "title": "Linguagens • 15 questões",
        "description": "Treino pronto de Linguagens misturando questões de todos os anos disponíveis.",
        "question_count": 15,
        "subjects": ["Linguagens"],
        "mode": "random",
        "difficulty": "medium",
        "duration_minutes": 30,
        "tags": ["Linguagens", "Foco", "Biblioteca"],
        "is_premium": False,
    },
    {
        "id": "mix-20-balanced",
        "title": "Misto Balanceado • 20 questões",
        "description": "Sessão pronta e balanceada entre disciplinas usando o banco consolidado.",
        "question_count": 20,
        "subjects": None,
        "mode": "balanced",
        "difficulty": "medium",
        "duration_minutes": 40,
        "tags": ["Misto", "Balanceado", "Biblioteca"],
        "is_premium": False,
    },
    {
        "id": "mix-30-balanced",
        "title": "Misto Intensivo • 30 questões",
        "description": "Treino mais longo com mistura de todas as provas já cadastradas no site.",
        "question_count": 30,
        "subjects": None,
        "mode": "balanced",
        "difficulty": "hard",
        "duration_minutes": 60,
        "tags": ["Misto", "Intensivo", "Biblioteca"],
        "is_premium": True,
    },
]


def _normalize_exam_type(exam_type: str) -> str:
    return exam_type.strip().lower()


def _sanitize_subjects(subjects: list[str] | None) -> list[str] | None:
    if not subjects:
        return None

    sanitized: list[str] = []
    seen: set[str] = set()

    for subject in subjects:
        if not isinstance(subject, str):
            continue

        normalized = subject.strip()
        if not normalized:
            continue

        normalized_key = normalized.casefold()
        if normalized_key in seen:
            continue

        seen.add(normalized_key)
        sanitized.append(normalized)

    return sanitized or None


def _normalize_answer(answer: str | None) -> str | None:
    if answer is None:
        return None

    normalized = str(answer).strip().upper()
    return normalized if normalized else None


def _serialize_question(question: dict, display_number: int | None = None) -> dict:
    return {
        "number": display_number if display_number is not None else question["number"],
        "subject": question["subject"],
        "statement": question["statement"],
        "options": question["options"],
        "source_pdf_label": question.get("source_pdf_label"),
        "source_year": question.get("source_year"),
        "source_number": question.get("source_number", question["number"]),
        "source_ref": question.get("source_ref"),
    }


def _build_subject_summary(results: list[dict]) -> list[dict]:
    buckets: dict[str, dict] = defaultdict(
        lambda: {
            "subject": "",
            "total": 0,
            "correct": 0,
            "wrong": 0,
            "blank": 0,
            "accuracy_percentage": 0.0,
        }
    )

    for result in results:
        subject = result["subject"]
        bucket = buckets[subject]
        bucket["subject"] = subject
        bucket["total"] += 1

        status = result["status"]
        if status == "correct":
            bucket["correct"] += 1
        elif status == "wrong":
            bucket["wrong"] += 1
        elif status == "blank":
            bucket["blank"] += 1

    summary = []
    for subject in sorted(buckets.keys()):
        bucket = buckets[subject]
        total_answered = bucket["correct"] + bucket["wrong"]
        bucket["accuracy_percentage"] = round(
            (bucket["correct"] / total_answered) * 100, 2
        ) if total_answered else 0.0
        summary.append(bucket)

    return summary


def _validate_requested_subjects(
    selected_subjects: list[str] | None,
    available_subjects: list[str],
) -> None:
    if not selected_subjects:
        return

    available_map = {subject.casefold(): subject for subject in available_subjects}
    invalid_subjects = [
        subject for subject in selected_subjects if subject.casefold() not in available_map
    ]

    if invalid_subjects:
        raise ValueError(
            "Disciplinas inválidas para este banco de questões: "
            + ", ".join(sorted(invalid_subjects))
        )


def _resolve_subject_filter(
    selected_subjects: list[str] | None,
    available_subjects: list[str],
) -> list[str] | None:
    if not selected_subjects:
        return None

    available_map = {subject.casefold(): subject for subject in available_subjects}
    return [available_map[subject.casefold()] for subject in selected_subjects]


def _filter_questions_by_subjects(
    questions: list[dict],
    resolved_subjects: list[str] | None,
) -> list[dict]:
    if not resolved_subjects:
        return questions

    selected_subject_set = {subject.casefold() for subject in resolved_subjects}
    return [
        question
        for question in questions
        if question["subject"].casefold() in selected_subject_set
    ]


def _select_questions(
    valid_questions: list[dict],
    question_count: int,
    mode: SimulationMode,
    seed: int | None = None,
) -> list[dict]:
    if question_count <= 0:
        raise ValueError("A quantidade de questões deve ser maior que zero.")

    if not valid_questions:
        raise ValueError("Nenhuma questão válida encontrada para os filtros selecionados.")

    if question_count > len(valid_questions):
        raise ValueError(
            f"Quantidade solicitada ({question_count}) maior que o total de questões válidas disponíveis ({len(valid_questions)})."
        )

    rng = random.Random(seed)

    if mode == "random":
        selected_questions = rng.sample(valid_questions, question_count)

    elif mode == "balanced":
        buckets: dict[str, list[dict]] = defaultdict(list)

        for question in valid_questions:
            buckets[question["subject"]].append(question)

        for subject_questions in buckets.values():
            rng.shuffle(subject_questions)

        available_bucket_subjects = sorted(buckets.keys())
        if not available_bucket_subjects:
            raise ValueError("Nenhuma disciplina disponível para o modo balanceado.")

        base_amount = question_count // len(available_bucket_subjects)
        remainder = question_count % len(available_bucket_subjects)

        selected_questions: list[dict] = []

        for index, subject in enumerate(available_bucket_subjects):
            desired = base_amount + (1 if index < remainder else 0)
            take = min(desired, len(buckets[subject]))

            selected_questions.extend(buckets[subject][:take])
            buckets[subject] = buckets[subject][take:]

        missing = question_count - len(selected_questions)
        if missing > 0:
            leftovers: list[dict] = []
            for subject in available_bucket_subjects:
                leftovers.extend(buckets[subject])

            rng.shuffle(leftovers)
            selected_questions.extend(leftovers[:missing])

        if len(selected_questions) < question_count:
            raise ValueError("Não há questões suficientes para montar o simulado balanceado.")

    else:
        raise ValueError("Modo inválido. Use 'random' ou 'balanced'.")

    rng.shuffle(selected_questions)
    return selected_questions


def _get_ready_simulation_preset(preset_id: str) -> dict:
    normalized_id = preset_id.strip().lower()
    for preset in READY_SIMULATION_LIBRARY:
        if preset["id"] == normalized_id:
            return preset
    raise ValueError("Preset de simulado pronto não encontrado.")


def get_ready_simulation_library(exam_type: str = "enem") -> dict:
    normalized_exam_type = _normalize_exam_type(exam_type)
    years = list_available_question_bank_years(normalized_exam_type)
    all_questions = get_all_questions(normalized_exam_type, include_annulled=False)
    available_subjects = get_all_available_subjects(normalized_exam_type)

    items = []
    for preset in READY_SIMULATION_LIBRARY:
        filtered_pool = _filter_questions_by_subjects(all_questions, preset["subjects"])
        items.append(
            {
                "id": preset["id"],
                "title": preset["title"],
                "description": preset["description"],
                "exam_type": normalized_exam_type,
                "question_count": preset["question_count"],
                "subjects": preset["subjects"] or [],
                "mode": preset["mode"],
                "difficulty": preset["difficulty"],
                "duration_minutes": preset["duration_minutes"],
                "tags": preset["tags"],
                "is_premium": preset["is_premium"],
                "total_questions_pool": len(filtered_pool),
                "years_pool": years,
                "available_subjects": available_subjects,
                "is_available": len(filtered_pool) >= preset["question_count"],
            }
        )

    return {
        "exam_type": normalized_exam_type,
        "years_pool": years,
        "available_subjects": available_subjects,
        "items": items,
    }


def generate_random_simulation(
    exam_type: str,
    year: int,
    question_count: int,
    subjects: list[str] | None = None,
    mode: SimulationMode = "balanced",
    seed: int | None = None,
) -> dict:
    normalized_exam_type = _normalize_exam_type(exam_type)
    metadata = get_question_bank_metadata(normalized_exam_type, year)

    valid_questions = get_questions(
        normalized_exam_type,
        year,
        include_annulled=False,
    )

    available_subjects = [item["name"] for item in metadata["subjects"]]
    selected_subjects = _sanitize_subjects(subjects)

    _validate_requested_subjects(selected_subjects, available_subjects)
    resolved_subjects = _resolve_subject_filter(selected_subjects, available_subjects)
    valid_questions = _filter_questions_by_subjects(valid_questions, resolved_subjects)

    selected_questions = _select_questions(
        valid_questions=valid_questions,
        question_count=question_count,
        mode=mode,
        seed=seed,
    )

    selected_numbers = [question["number"] for question in selected_questions]
    selected_refs = [question["source_ref"] for question in selected_questions]
    selected_subjects_used = sorted({question["subject"] for question in selected_questions})

    return {
        "simulation_id": str(uuid4()),
        "simulation_source": "single_year",
        "generated_at": datetime.now(UTC).isoformat(),
        "exam_type": normalized_exam_type,
        "year": year,
        "year_label": str(year),
        "title": metadata["title"],
        "mode": mode,
        "requested_question_count": question_count,
        "generated_question_count": len(selected_questions),
        "filters": {
            "subjects": resolved_subjects or [],
            "mode": mode,
            "seed": seed,
        },
        "subjects_used": selected_subjects_used,
        "question_numbers": selected_numbers,
        "question_refs": selected_refs,
        "questions": [_serialize_question(question) for question in selected_questions],
    }


def generate_library_simulation(
    exam_type: str,
    preset_id: str,
    seed: int | None = None,
) -> dict:
    normalized_exam_type = _normalize_exam_type(exam_type)
    preset = _get_ready_simulation_preset(preset_id)

    years = list_available_question_bank_years(normalized_exam_type)
    valid_questions = get_all_questions(normalized_exam_type, include_annulled=False)
    available_subjects = get_all_available_subjects(normalized_exam_type)

    selected_subjects = _sanitize_subjects(preset["subjects"])
    _validate_requested_subjects(selected_subjects, available_subjects)
    resolved_subjects = _resolve_subject_filter(selected_subjects, available_subjects)
    valid_questions = _filter_questions_by_subjects(valid_questions, resolved_subjects)

    selected_questions = _select_questions(
        valid_questions=valid_questions,
        question_count=preset["question_count"],
        mode=preset["mode"],
        seed=seed,
    )

    selected_subjects_used = sorted({question["subject"] for question in selected_questions})
    question_refs = [question["source_ref"] for question in selected_questions]

    serialized_questions = [
        _serialize_question(question, display_number=index + 1)
        for index, question in enumerate(selected_questions)
    ]

    return {
        "simulation_id": str(uuid4()),
        "simulation_source": "library",
        "source_preset_id": preset["id"],
        "generated_at": datetime.now(UTC).isoformat(),
        "exam_type": normalized_exam_type,
        "year": years[-1],
        "year_label": f"{years[0]}–{years[-1]}" if len(years) > 1 else str(years[0]),
        "years_pool": years,
        "title": preset["title"],
        "description": preset["description"],
        "mode": preset["mode"],
        "requested_question_count": preset["question_count"],
        "generated_question_count": len(selected_questions),
        "filters": {
            "subjects": resolved_subjects or [],
            "mode": preset["mode"],
            "seed": seed,
        },
        "subjects_used": selected_subjects_used,
        "question_numbers": [index + 1 for index in range(len(selected_questions))],
        "question_refs": question_refs,
        "questions": serialized_questions,
    }


def submit_random_simulation(
    exam_type: str,
    year: int,
    question_numbers: list[int],
    answers: list[str | None],
) -> dict:
    if not question_numbers:
        raise ValueError("question_numbers não pode ser vazio.")

    if len(question_numbers) != len(answers):
        raise ValueError("question_numbers e answers devem ter o mesmo tamanho.")

    normalized_exam_type = _normalize_exam_type(exam_type)
    metadata = get_question_bank_metadata(normalized_exam_type, year)
    question_map = get_question_map(normalized_exam_type, year, include_annulled=False)

    seen_numbers: set[int] = set()
    duplicate_numbers = [
        number for number in question_numbers if number in seen_numbers or seen_numbers.add(number)
    ]

    if duplicate_numbers:
        duplicates_unique = sorted(set(duplicate_numbers))
        raise ValueError(
            "O envio contém questões duplicadas: "
            + ", ".join(str(number) for number in duplicates_unique)
        )

    results = []
    correct_answers = 0
    wrong_answers = 0
    unanswered_count = 0

    for question_number, user_answer in zip(question_numbers, answers):
        question = question_map.get(question_number)
        if not question:
            raise ValueError(f"Questão inválida ou anulada: {question_number}")

        normalized_answer = _normalize_answer(user_answer)
        correct_answer = question["answer"]

        if normalized_answer is None:
            status = "blank"
            unanswered_count += 1
        elif normalized_answer == correct_answer:
            status = "correct"
            correct_answers += 1
        else:
            status = "wrong"
            wrong_answers += 1

        results.append(
            {
                "question_number": question_number,
                "subject": question["subject"],
                "user_answer": normalized_answer,
                "correct_answer": correct_answer,
                "status": status,
                "source_year": question.get("source_year", year),
                "source_number": question.get("source_number", question_number),
                "source_ref": question.get("source_ref"),
            }
        )

    total_questions = len(question_numbers)
    valid_questions = total_questions
    score_percentage = round(
        (correct_answers / valid_questions) * 100, 2
    ) if valid_questions else 0.0

    return {
        "simulation_source": "single_year",
        "exam_type": normalized_exam_type,
        "year": year,
        "year_label": str(year),
        "title": metadata["title"],
        "total_questions": total_questions,
        "valid_questions": valid_questions,
        "correct_answers": correct_answers,
        "wrong_answers": wrong_answers,
        "unanswered_count": unanswered_count,
        "annulled_count": 0,
        "score_percentage": score_percentage,
        "subjects_summary": _build_subject_summary(results),
        "results_by_question": results,
    }


def submit_library_simulation(
    exam_type: str,
    question_refs: list[str],
    answers: list[str | None],
) -> dict:
    if not question_refs:
        raise ValueError("question_refs não pode ser vazio.")

    if len(question_refs) != len(answers):
        raise ValueError("question_refs e answers devem ter o mesmo tamanho.")

    normalized_exam_type = _normalize_exam_type(exam_type)
    question_map = get_all_question_map(normalized_exam_type, include_annulled=False)

    seen_refs: set[str] = set()
    duplicate_refs = [
        ref for ref in question_refs if ref in seen_refs or seen_refs.add(ref)
    ]

    if duplicate_refs:
        duplicates_unique = sorted(set(duplicate_refs))
        raise ValueError(
            "O envio contém referências de questão duplicadas: "
            + ", ".join(duplicates_unique)
        )

    results = []
    correct_answers = 0
    wrong_answers = 0
    unanswered_count = 0

    for index, (question_ref, user_answer) in enumerate(zip(question_refs, answers), start=1):
        question = question_map.get(question_ref)
        if not question:
            raise ValueError(f"Questão inválida ou ausente no banco consolidado: {question_ref}")

        normalized_answer = _normalize_answer(user_answer)
        correct_answer = question["answer"]

        if normalized_answer is None:
            status = "blank"
            unanswered_count += 1
        elif normalized_answer == correct_answer:
            status = "correct"
            correct_answers += 1
        else:
            status = "wrong"
            wrong_answers += 1

        results.append(
            {
                "question_number": index,
                "question_ref": question_ref,
                "subject": question["subject"],
                "user_answer": normalized_answer,
                "correct_answer": correct_answer,
                "status": status,
                "source_year": question["source_year"],
                "source_number": question["source_number"],
                "source_ref": question["source_ref"],
            }
        )

    total_questions = len(question_refs)
    valid_questions = total_questions
    score_percentage = round(
        (correct_answers / valid_questions) * 100, 2
    ) if valid_questions else 0.0

    years = list_available_question_bank_years(normalized_exam_type)

    return {
        "simulation_source": "library",
        "exam_type": normalized_exam_type,
        "year": years[-1],
        "year_label": f"{years[0]}–{years[-1]}" if len(years) > 1 else str(years[0]),
        "title": f"{normalized_exam_type.upper()} • Biblioteca pronta",
        "total_questions": total_questions,
        "valid_questions": valid_questions,
        "correct_answers": correct_answers,
        "wrong_answers": wrong_answers,
        "unanswered_count": unanswered_count,
        "annulled_count": 0,
        "score_percentage": score_percentage,
        "subjects_summary": _build_subject_summary(results),
        "results_by_question": results,
    }