import json
import sys
from pathlib import Path

VALID_ANSWERS = {"A", "B", "C", "D", "E", None}

REQUIRED_TOP_LEVEL = {
    "exam_type",
    "year",
    "title",
    "questions",
}

REQUIRED_QUESTION_FIELDS = {
    "number",
    "subject",
    "statement",
    "options",
    "answer",
    "annulled",
}

VALID_OPTION_KEYS = {"A", "B", "C", "D", "E"}


def fail(message: str) -> None:
    print(f"[ERRO] {message}")
    sys.exit(1)


def warn(message: str) -> None:
    print(f"[AVISO] {message}")


def validate_file(path: Path) -> None:
    if not path.exists():
        fail(f"Arquivo não encontrado: {path}")

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"JSON inválido: {exc}")

    missing_top = REQUIRED_TOP_LEVEL - data.keys()
    if missing_top:
        fail(f"Campos obrigatórios ausentes no topo: {sorted(missing_top)}")

    if data["exam_type"] != "enem":
        fail("exam_type deve ser 'enem'")

    if data["year"] != 2022:
        fail("year deve ser 2022")

    if not isinstance(data["questions"], list):
        fail("'questions' deve ser uma lista")

    questions = data["questions"]

    if len(questions) != 180:
        warn(f"Esperado 180 questões, encontrado {len(questions)}")

    numbers_seen = set()
    annulled_count = 0

    for index, question in enumerate(questions, start=1):
        if not isinstance(question, dict):
            fail(f"Questão na posição {index} não é objeto JSON")

        missing_q = REQUIRED_QUESTION_FIELDS - question.keys()
        if missing_q:
            fail(
                f"Questão na posição {index} sem campos obrigatórios: {sorted(missing_q)}"
            )

        number = question["number"]
        if not isinstance(number, int):
            fail(f"Questão na posição {index}: 'number' deve ser inteiro")

        if number in numbers_seen:
            fail(f"Número de questão duplicado: {number}")
        numbers_seen.add(number)

        subject = question["subject"]
        if not isinstance(subject, str) or not subject.strip():
            fail(f"Questão {number}: 'subject' inválido")

        statement = question["statement"]
        if not isinstance(statement, str) or not statement.strip():
            fail(f"Questão {number}: 'statement' vazio")

        options = question["options"]
        if not isinstance(options, dict):
            fail(f"Questão {number}: 'options' deve ser objeto")

        option_keys = set(options.keys())
        if option_keys != VALID_OPTION_KEYS:
            fail(
                f"Questão {number}: opções devem conter exatamente A, B, C, D, E"
            )

        for key, value in options.items():
            if not isinstance(value, str) or not value.strip():
                fail(f"Questão {number}: opção {key} inválida")

        annulled = question["annulled"]
        if not isinstance(annulled, bool):
            fail(f"Questão {number}: 'annulled' deve ser boolean")

        answer = question["answer"]
        if answer not in VALID_ANSWERS:
            fail(f"Questão {number}: 'answer' inválido")

        if annulled:
            annulled_count += 1
            if answer is not None:
                warn(
                    f"Questão {number} marcada como anulada, mas 'answer' não está nulo"
                )
        else:
            if answer is None:
                fail(
                    f"Questão {number}: questão não anulada precisa de resposta A-E"
                )

    sorted_numbers = sorted(numbers_seen)
    if sorted_numbers and sorted_numbers != list(range(1, len(sorted_numbers) + 1)):
        warn(
            "A sequência dos números das questões não está contínua a partir de 1"
        )

    print("[OK] Estrutura validada com sucesso.")
    print(f"Total de questões: {len(questions)}")
    print(f"Questões anuladas: {annulled_count}")


if __name__ == "__main__":
    file_path = Path("data/exams/questions/enem/2022.json")
    validate_file(file_path)