import random
from collections import defaultdict
from typing import Literal

from app.question_bank import get_question_bank_metadata, get_question_map, get_questions


SimulationMode = Literal["random", "balanced"]


def _sanitize_subjects(subjects: list[str] | None) -> list[str] | None:
    if not subjects:
        return None

    sanitized = [subject.strip() for subject in subjects if isinstance(subject, str) and subject.strip()]
    return sanitized or None


def _serialize_question(question: dict) -> dict:
    return {
        "number": question["number"],
        "subject": question["subject"],
        "statement": question["statement"],
        "options": question["options"],
        "source_pdf_label": question.get("source_pdf_label"),
    }


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

    valid_questions = get_questions(exam_type, year, include_annulled=False)
    metadata = get_question_bank_metadata(exam_type, year)

    selected_subjects = _sanitize_subjects(subjects)

    if selected_subjects:
        valid_questions = [
            question for question in valid_questions if question["subject"] in selected_subjects
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

        available_subjects = sorted(buckets.keys())

        if not available_subjects:
            raise ValueError("Nenhuma disciplina disponível para o modo balanceado.")

        base_amount = question_count // len(available_subjects)
        remainder = question_count % len(available_subjects)

        selected_questions: list[dict] = []

        for index, subject in enumerate(available_subjects):
            desired = base_amount + (1 if index < remainder else 0)
            take = min(desired, len(buckets[subject]))
            selected_questions.extend(buckets[subject][:take])
            buckets[subject] = buckets[subject][take:]

        missing = question_count - len(selected_questions)

        if missing > 0:
            leftovers: list[dict] = []
            for subject in available_subjects:
                leftovers.extend(buckets[subject])

            rng.shuffle(leftovers)
            selected_questions.extend(leftovers[:missing])

        if len(selected_questions) < question_count:
            raise ValueError("Não há questões suficientes para montar o simulado balanceado.")

    else:
        raise ValueError("Modo inválido. Use 'random' ou 'balanced'.")

    rng.shuffle(selected_questions)

    return {
        "exam_type": exam_type.lower(),
        "year": year,
        "title": metadata["title"],
        "mode": mode,
        "requested_question_count": question_count,
        "generated_question_count": len(selected_questions),
        "subjects_used": sorted({question["subject"] for question in selected_questions}),
        "questions": [_serialize_question(question) for question in selected_questions],
    }


def submit_random_simulation(
    exam_type: str,
    year: int,
    question_numbers: list[int],
    answers: list[str | None],
) -> dict:
    if len(question_numbers) != len(answers):
        raise ValueError("question_numbers e answers devem ter o mesmo tamanho.")

    question_map = get_question_map(exam_type, year, include_annulled=False)

    results = []
    correct_answers = 0
    wrong_answers = 0
    unanswered_count = 0

    for question_number, user_answer in zip(question_numbers, answers):
        question = question_map.get(question_number)

        if not question:
            raise ValueError(f"Questão inválida ou anulada: {question_number}")

        correct_answer = question["answer"]

        if user_answer is None or str(user_answer).strip() == "":
            status = "blank"
            unanswered_count += 1
            normalized_answer = None
        else:
            normalized_answer = str(user_answer).strip().upper()

            if normalized_answer == correct_answer:
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
    score_percentage = (correct_answers / valid_questions * 100) if valid_questions else 0.0

    return {
        "exam_type": exam_type.lower(),
        "year": year,
        "total_questions": total_questions,
        "valid_questions": valid_questions,
        "correct_answers": correct_answers,
        "wrong_answers": wrong_answers,
        "unanswered_count": unanswered_count,
        "annulled_count": 0,
        "score_percentage": round(score_percentage, 2),
        "results_by_question": results,
    }