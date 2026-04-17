import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
from urllib.error import HTTPError
from urllib.request import Request, urlopen

EXAMS_URL = "https://api.enem.dev/v1/exams"
QUESTIONS_URL = "https://api.enem.dev/v1/exams/2022/questions"
QUESTIONS_URL_PAGED = "https://api.enem.dev/v1/exams/2022/questions?limit=180&offset=0"

OUT_PATH = Path("data/exams/questions/enem/2022.json")
OFFICIAL_PAGE_URL = "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2022"

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


def ensure_exam_exists() -> None:
    payload = http_get_json(EXAMS_URL)

    if not isinstance(payload, list):
        raise RuntimeError("Resposta inesperada ao listar provas.")

    years = {int(item["year"]) for item in payload if "year" in item}
    if 2022 not in years:
        raise RuntimeError("A API não retornou a prova do ENEM 2022 em /v1/exams.")


def fetch_questions_payload() -> Dict[str, Any]:
    try:
        payload = http_get_json(QUESTIONS_URL)
        if isinstance(payload, dict) and "questions" in payload:
            return payload
        raise RuntimeError("Resposta inesperada ao listar questões sem paginação.")
    except HTTPError as first_error:
        try:
            payload = http_get_json(QUESTIONS_URL_PAGED)
            if isinstance(payload, dict) and "questions" in payload:
                return payload
            raise RuntimeError("Resposta inesperada ao listar questões com paginação.")
        except Exception as second_error:
            raise RuntimeError(
                f"Falha ao importar questões do ENEM 2022. "
                f"Sem paginação: HTTP {getattr(first_error, 'code', 'erro')}. "
                f"Com paginação: {second_error}"
            ) from second_error


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
    return statement or f"Questão {question.get('index')} - ENEM 2022"


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
            result[letter] = ""

    return result


def normalize_question(question: Dict[str, Any]) -> Dict[str, Any]:
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
        "source_pdf_label": f"ENEM 2022 - Questão {index}",
        "assets": files,
        "language": (question.get("language") or None),
        "title": question.get("title"),
    }


def main() -> int:
    ensure_exam_exists()
    payload = fetch_questions_payload()

    questions_raw = payload.get("questions", [])
    metadata = payload.get("metadata", {})

    if not isinstance(questions_raw, list) or not questions_raw:
        raise RuntimeError("Nenhuma questão retornada pela API.")

    normalized_questions = [normalize_question(question) for question in questions_raw]
    normalized_questions.sort(key=lambda item: item["number"])

    total = int(metadata.get("total") or len(normalized_questions))

    output = {
        "exam_type": "enem",
        "year": 2022,
        "title": "ENEM 2022",
        "description": "Prova oficial do ENEM 2022 importada para base local reutilizável.",
        "question_count": total,
        "total_questions": total,
        "has_answer_key": True,
        "official_page_url": OFFICIAL_PAGE_URL,
        "imported_from": QUESTIONS_URL,
        "imported_at": datetime.now(timezone.utc).isoformat(),
        "questions": normalized_questions,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Arquivo gerado: {OUT_PATH}")
    print(f"Questões importadas: {len(normalized_questions)}")
    print(f"Total declarado pela API: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())