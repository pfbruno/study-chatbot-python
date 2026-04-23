import json
import sys
from pathlib import Path
from typing import Any, Dict, List


def score_question(question: Dict[str, Any]) -> int:
    score = 0

    statement = question.get("statement") or ""
    options = question.get("options") or {}
    answer = question.get("answer")
    assets = question.get("assets") or []
    language = (question.get("language") or "").strip().lower()
    subject = (question.get("subject") or "").strip().lower()

    if statement:
        score += len(statement)

    if isinstance(options, dict):
        for value in options.values():
            if isinstance(value, str):
                score += len(value)

    if answer:
        score += 1000

    if assets:
        score += 100

    # Preferência explícita por Inglês nas questões de língua estrangeira
    if language == "ingles" or subject == "inglês":
        score += 5000
    elif language == "espanhol" or subject == "espanhol":
        score -= 5000

    return score


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: python scripts/deduplicate_enem_year.py <ano>")
        return 1

    year = int(sys.argv[1])
    file_path = Path(f"data/exams/questions/enem/{year}.json")

    data = json.loads(file_path.read_text(encoding="utf-8"))
    questions: List[Dict[str, Any]] = data.get("questions", [])

    grouped: Dict[int, List[Dict[str, Any]]] = {}

    for question in questions:
        number = question.get("number")
        if not isinstance(number, int):
            continue
        grouped.setdefault(number, []).append(question)

    deduplicated: List[Dict[str, Any]] = []
    removed_numbers: List[int] = []

    for number in sorted(grouped.keys()):
        items = grouped[number]
        if len(items) == 1:
            deduplicated.append(items[0])
            continue

        best = max(items, key=score_question)
        deduplicated.append(best)
        removed_numbers.append(number)

    deduplicated.sort(key=lambda item: item["number"])
    data["questions"] = deduplicated
    data["question_count"] = len(deduplicated)
    data["total_questions"] = len(deduplicated)

    file_path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Arquivo normalizado: {file_path}")
    print(f"Questões finais: {len(deduplicated)}")
    print(
        "Duplicidades removidas em: "
        + (", ".join(map(str, removed_numbers)) if removed_numbers else "nenhuma")
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())