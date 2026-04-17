import json
from pathlib import Path
from typing import Any, Dict, List

FILE_PATH = Path("data/exams/questions/enem/2022.json")


def score_question(question: Dict[str, Any]) -> int:
    score = 0

    statement = question.get("statement") or ""
    options = question.get("options") or {}
    answer = question.get("answer")
    assets = question.get("assets") or []

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

    return score


def main() -> int:
    data = json.loads(FILE_PATH.read_text(encoding="utf-8"))
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

    FILE_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Arquivo normalizado: {FILE_PATH}")
    print(f"Questões finais: {len(deduplicated)}")
    print(
        "Duplicidades removidas em: "
        + (", ".join(map(str, removed_numbers)) if removed_numbers else "nenhuma")
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
