import random
from collections import defaultdict
from datetime import datetime, UTC
from typing import Literal
from uuid import uuid4

from app.question_bank import get_question_bank_metadata, get_question_map, get_questions

SimulationMode = Literal["random", "balanced"]


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


def _serialize_question(question: dict) -> dict:
    return {
        "number": question["number"],
        "subject": question["subject"],
        "statement": question["statement"],
        "options": question["options"],
        "source_pdf_label": question.get("source_pdf_label"),
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


def generate_random_simulation(
    exam_type: str,
    year: int,
    question_count: int,
    subjects: list[str] | None = None,
    mode: SimulationMode = "balanced",
    seed: int | None = None,
) -> dict:
    if question_count <= 0:
        raise ValueError("A quantidade de questões deve ser maior que zero.")

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

    if resolved_subjects:
        selected_subject_set = {subject.casefold() for subject in resolved_subjects}
        valid_questions = [
            question
            for question in valid_questions
            if question["subject"].casefold() in selected_subject_set
        ]

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

    selected_numbers = [question["number"] for question in selected_questions]
    selected_subjects_used = sorted({question["subject"] for question in selected_questions})

    return {
        "simulation_id": str(uuid4()),
        "generated_at": datetime.now(UTC).isoformat(),
        "exam_type": normalized_exam_type,
        "year": year,
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
        "questions": [_serialize_question(question) for question in selected_questions],
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
    duplicate_numbers = [number for number in question_numbers if number in seen_numbers or seen_numbers.add(number)]

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
            }
        )

    total_questions = len(question_numbers)
    valid_questions = total_questions
    score_percentage = round(
        (correct_answers / valid_questions) * 100, 2
    ) if valid_questions else 0.0

    return {
        "exam_type": normalized_exam_type,
        "year": year,
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