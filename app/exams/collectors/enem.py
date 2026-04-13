from __future__ import annotations

import logging
import re
from urllib.request import Request, urlopen

from app.exams.parsers.enem_parser import parse_enem_year_links

LOGGER = logging.getLogger(__name__)

INEP_ENEM_URL = (
    "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos"
)


def fetch_html(url: str) -> str:
    request = Request(url, headers={"User-Agent": "StudyProBot/1.0"})
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="ignore")


def collect_enem_year(year: int) -> dict:
    html = fetch_html(INEP_ENEM_URL)
    links = parse_enem_year_links(html, INEP_ENEM_URL)
    year_pattern = re.compile(rf"\b{year}\b")
    year_links = [item for item in links if year_pattern.search(item["text"]) or year_pattern.search(item["url"])]

    if not year_links:
        raise ValueError(f"Nenhum link ENEM encontrado para {year}.")

    day1_booklets = []
    day2_booklets = []
    answer_key_links = []
    colors = ["azul", "amarelo", "branco", "rosa", "cinza"]

    for item in year_links:
        lower = item["text"].lower()
        color = next((color for color in colors if color in lower), "geral")
        payload = {
            "color": color,
            "pdf_url": item["url"],
            "answer_key_url": item["url"] if "gabarito" in lower else None,
            "official_page_url": INEP_ENEM_URL,
        }

        if "gabarito" in lower:
            answer_key_links.append(item["url"])
            continue

        if "2o dia" in lower or "2º dia" in lower or "dia 2" in lower:
            day2_booklets.append(payload)
        else:
            day1_booklets.append(payload)

    if not day1_booklets and not day2_booklets:
        raise ValueError(f"Não foi possível classificar os cadernos do ENEM {year}.")

    if not day1_booklets:
        day1_booklets = day2_booklets[:]
    if not day2_booklets:
        day2_booklets = day1_booklets[:]

    answer_key = [None] * 180
    LOGGER.info("ENEM %s coletado com %s links", year, len(year_links))

    return {
        "source": "enem",
        "year": year,
        "title": f"ENEM {year}",
        "total_questions": 180,
        "has_answer_key": bool(answer_key_links),
        "official_page_url": INEP_ENEM_URL,
        "days": [
            {"label": "1º dia", "order": 1, "booklets": day1_booklets},
            {"label": "2º dia", "order": 2, "booklets": day2_booklets},
        ],
        "answer_key": answer_key,
    }
