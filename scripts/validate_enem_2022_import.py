import json
from pathlib import Path

FILE_PATH = Path("data/exams/questions/enem/2022.json")

def main() -> int:
    data = json.loads(FILE_PATH.read_text(encoding="utf-8"))
    questions = data.get("questions", [])

    numbers = [q.get("number") for q in questions if isinstance(q.get("number"), int)]
    unique_numbers = sorted(set(numbers))

    duplicates = sorted({n for n in numbers if numbers.count(n) > 1})
    missing = [n for n in range(1, 181) if n not in unique_numbers]
    above_range = [n for n in unique_numbers if n > 180]

    print(f"Arquivo: {FILE_PATH}")
    print(f"Questões no JSON: {len(questions)}")
    print(f"Números únicos: {len(unique_numbers)}")
    print(f"Menor número: {min(unique_numbers) if unique_numbers else 'N/D'}")
    print(f"Maior número: {max(unique_numbers) if unique_numbers else 'N/D'}")
    print(f"Duplicados: {duplicates if duplicates else 'nenhum'}")
    print(f"Fora do intervalo 1..180: {above_range if above_range else 'nenhum'}")
    print(f"Faltando no intervalo 1..180: {missing if missing else 'nenhum'}")

    return 0

if __name__ == "__main__":
    raise SystemExit(main())