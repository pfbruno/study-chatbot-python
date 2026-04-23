import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import urlencode
from urllib.request import Request, urlopen

EXAMS_URL = "https://api.enem.dev/v1/exams"
QUESTIONS_BASE_URL_TEMPLATE = "https://api.enem.dev/v1/exams/{year}/questions"
OFFICIAL_PAGE_URL_TEMPLATE = (
    "https://www.gov.br/inep/pt-br/areas-de-atuacao/"
    "avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/{year}"
)

PAGE_SIZE = 50

DISCIPLINE_MAP = {
    "linguagens": "Linguagens",
    "ciencias-humanas": "Ciências Humanas",
    "ciencias-da-natureza": "Ciências da Natureza",
    "ciencias-natureza": "Ciências da Natureza",
    "matematica": "Matemática",
    "humanas": "Ciências Humanas",
    "natureza": "Ciências da Natureza",
}

LANGUAGE_MAP = {
    "ingles": "Inglês",
    "espanhol": "Espanhol",
}


def http_get_json(url: str) -> Dict[str, Any] | List[Any]:
    req = Request(
        url,
        headers={
            "User-Agent": "StudyPro Importer/1.0",
            "Accept": "application/json",
        },
    )
    with urlopen(req, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def ensure_exam_exists(year: int) -> None:
    payload = http_get_json(EXAMS_URL)

    if not isinstance(payload, list):
        raise RuntimeError("Resposta inesperada ao listar provas.")

    years = {int(item["year"]) for item in payload if "year" in item}
    if year not in years:
        raise RuntimeError(
            f"A API não retornou a prova do ENEM {year} em /v1/exams."
        )


def build_questions_url(year: int, limit: int, offset: int) -> str:
    base = QUESTIONS_BASE_URL_TEMPLATE.format(year=year)
    return f"{base}?{urlencode({'limit': limit, 'offset': offset})}"


def fetch_all_questions_payload(year: int) -> Dict[str, Any]:
    offset = 0
    total = None
    all_questions: List[Dict[str, Any]] = []

    while True:
        url = build_questions_url(year, PAGE_SIZE, offset)
        payload = http_get_json(url)

        if not isinstance(payload, dict):
            raise RuntimeError("Resposta inesperada ao listar questões.")

        page_questions = payload.get("questions", [])
        metadata = payload.get("metadata", {})

        if not isinstance(page_questions, list):
            raise RuntimeError("Campo 'questions' inválido na resposta da API.")

        if total is None:
            total = int(metadata.get("total") or 0)
            if total <= 0:
                total = len(page_questions)

        if not page_questions:
            break

        all_questions.extend(page_questions)
        offset += len(page_questions)

        if len(all_questions) >= total:
            break

    return {
        "questions": all_questions,
        "metadata": {
            "total": total or len(all_questions),
        },
    }


def infer_day(index: int) -> int:
    return 1 if index <= 90 else 2


def normalize_discipline(raw: str) -> str:
    key = (raw or "").strip().lower()
    return DISCIPLINE_MAP.get(key, raw or "Geral")


def build_subject(question: Dict[str, Any]) -> str:
    language = (question.get("language") or "").strip().lower()
    if language in LANGUAGE_MAP:
        return LANGUAGE_MAP[language]
    return normalize_discipline(question.get("discipline") or "Geral")


def build_statement(question: Dict[str, Any]) -> str:
    parts: List[str] = []

    context = (question.get("context") or "").strip()
    intro = (question.get("alternativesIntroduction") or "").strip()

    if context:
        parts.append(context)
    if intro:
        parts.append(intro)

    statement = "\n\n".join(parts).strip()
    return statement or f"Questão {question.get('index')} - ENEM"


def build_options(question: Dict[str, Any]) -> Dict[str, str]:
    result: Dict[str, str] = {}

    for alt in question.get("alternatives", []):
        letter = (alt.get("letter") or "").strip().upper()
        if not letter:
            continue

        text = (alt.get("text") or "").strip()
        file_url = (alt.get("file") or "").strip()

        if text and file_url:
            result[letter] = f"{text}\n[imagem: {file_url}]"
        elif text:
            result[letter] = text
        elif file_url:
            result[letter] = f"[imagem: {file_url}]"
        else:
            result[letter] = "[alternativa sem conteúdo retornado pela API]"

    for key in ["A", "B", "C", "D", "E"]:
        if key not in result or not isinstance(result[key], str) or not result[key].strip():
            result[key] = "[alternativa ausente na API]"

    return result


def normalize_question(question: Dict[str, Any], year: int) -> Dict[str, Any]:
    index = int(question["index"])
    correct = (question.get("correctAlternative") or "").strip().upper() or None
    files = [item for item in question.get("files", []) if item]

    return {
        "number": index,
        "day": infer_day(index),
        "area": normalize_discipline(question.get("discipline") or "Geral"),
        "subject": build_subject(question),
        "topic": None,
        "statement": build_statement(question),
        "options": build_options(question),
        "answer": correct,
        "annulled": correct == "ANULADO",
        "source_pdf_label": f"ENEM {year} - Questão {index}",
        "assets": files,
        "language": (question.get("language") or None),
        "title": question.get("title"),
    }


def main() -> int:
    if len(sys.argv) != 2:
        print("Uso: python scripts/import_enem_year.py <ano>")
        return 1

    year = int(sys.argv[1])

    out_path = Path(f"data/exams/questions/enem/{year}.json")
    official_page_url = OFFICIAL_PAGE_URL_TEMPLATE.format(year=year)
    questions_base_url = QUESTIONS_BASE_URL_TEMPLATE.format(year=year)

    ensure_exam_exists(year)
    payload = fetch_all_questions_payload(year)

    questions_raw = payload.get("questions", [])
    metadata = payload.get("metadata", {})

    if not isinstance(questions_raw, list) or not questions_raw:
        raise RuntimeError("Nenhuma questão retornada pela API.")

    normalized_questions = [
        normalize_question(question, year) for question in questions_raw
    ]
    normalized_questions.sort(key=lambda item: item["number"])

    total = int(metadata.get("total") or len(normalized_questions))

    output = {
        "exam_type": "enem",
        "year": year,
        "title": f"ENEM {year}",
        "description": f"Prova oficial do ENEM {year} importada para base local reutilizável.",
        "question_count": total,
        "total_questions": total,
        "has_answer_key": True,
        "official_page_url": official_page_url,
        "imported_from": questions_base_url,
        "imported_at": datetime.now(timezone.utc).isoformat(),
        "questions": normalized_questions,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Arquivo gerado: {out_path}")
    print(f"Questões importadas: {len(normalized_questions)}")
    print(f"Total declarado pela API: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())