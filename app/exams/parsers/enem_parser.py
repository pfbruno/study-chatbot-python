from __future__ import annotations

import re
from urllib.parse import urljoin


def extract_links_from_html(html: str, base_url: str) -> list[dict[str, str]]:
    anchor_pattern = re.compile(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', re.I | re.S)
    links: list[dict[str, str]] = []
    for href, inner in anchor_pattern.findall(html):
        text = re.sub(r"<[^>]+>", "", inner).strip()
        links.append({"url": urljoin(base_url, href), "text": " ".join(text.split())})
    return links


def parse_enem_year_links(html: str, base_url: str) -> list[dict[str, str]]:
    links = extract_links_from_html(html, base_url)
    filtered = []
    for item in links:
        text_lower = item["text"].lower()
        url_lower = item["url"].lower()
        if not ("enem" in text_lower or "enem" in url_lower):
            continue
        if not (url_lower.endswith(".pdf") or "provas-e-gabaritos" in url_lower):
            continue
        filtered.append(item)
    return filtered
