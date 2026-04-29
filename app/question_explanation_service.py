from __future__ import annotations

from typing import Any

from app.chatbot import generate_ai_response


def get_trusted_sources(subject: str, exam_type: str) -> list[dict[str, str]]:
    normalized_subject = (subject or "").strip().lower()
    normalized_exam = (exam_type or "").strip().lower()

    sources: list[dict[str, str]] = []

    if normalized_exam == "enem":
        sources.append(
            {
                "title": "ENEM — Instituto Nacional de Estudos e Pesquisas Educacionais Anísio Teixeira",
                "url": "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem",
                "publisher": "INEP",
            }
        )
        sources.append(
            {
                "title": "Ministério da Educação",
                "url": "https://www.gov.br/mec/pt-br",
                "publisher": "MEC",
            }
        )

    if "matem" in normalized_subject:
        sources.append(
            {
                "title": "Khan Academy — Matemática",
                "url": "https://pt.khanacademy.org/math",
                "publisher": "Khan Academy",
            }
        )

    if "natureza" in normalized_subject or "biolog" in normalized_subject:
        sources.append(
            {
                "title": "Fiocruz — Portal de educação e divulgação científica",
                "url": "https://portal.fiocruz.br/",
                "publisher": "Fiocruz",
            }
        )

    if "lingu" in normalized_subject or "portugu" in normalized_subject or "redação" in normalized_subject:
        sources.append(
            {
                "title": "Portal da Língua Portuguesa",
                "url": "https://www.portaldalinguaportuguesa.org/",
                "publisher": "Instituto de Linguística Teórica e Computacional",
            }
        )

    if "humanas" in normalized_subject or "hist" in normalized_subject or "geo" in normalized_subject:
        sources.append(
            {
                "title": "IBGE Educa",
                "url": "https://educa.ibge.gov.br/",
                "publisher": "IBGE",
            }
        )

    seen: set[str] = set()
    unique_sources: list[dict[str, str]] = []

    for source in sources:
        url = source["url"]
        if url in seen:
            continue
        seen.add(url)
        unique_sources.append(source)

    return unique_sources[:4]


def _format_options(options: dict[str, Any]) -> str:
    lines: list[str] = []

    for key in sorted(options.keys()):
        value = options.get(key)
        if value is None:
            continue

        text = str(value).strip()
        if not text:
            continue

        lines.append(f"{key}) {text}")

    return "\n".join(lines)


def _fallback_explanation(
    *,
    subject: str,
    user_answer: str | None,
    correct_answer: str | None,
    status: str,
) -> str:
    user_answer_label = user_answer or "em branco"
    correct_answer_label = correct_answer or "não informado"

    if status == "blank":
        diagnosis = (
            "A questão ficou em branco. Isso geralmente indica dúvida conceitual, "
            "falta de tempo ou insegurança para escolher entre alternativas próximas."
        )
    else:
        diagnosis = (
            f"A resposta marcada foi {user_answer_label}, mas o gabarito é "
            f"{correct_answer_label}. A revisão deve focar na diferença entre a "
            "interpretação feita na alternativa escolhida e o conceito exigido pela questão."
        )

    return (
        f"Diagnóstico do erro:\n{diagnosis}\n\n"
        f"Conceito central:\nA questão pertence à área de {subject}. Leia o enunciado "
        "com atenção, identifique o comando principal e relacione os dados fornecidos "
        "com o conceito cobrado.\n\n"
        "Como resolver:\n"
        "1. Identifique exatamente o que o enunciado pede.\n"
        "2. Separe dados, conceitos e possíveis distrações do texto.\n"
        "3. Compare cada alternativa com o comando do enunciado.\n"
        f"4. Priorize a alternativa compatível com o gabarito: {correct_answer_label}.\n\n"
        "Como evitar esse erro:\n"
        "Monte uma anotação curta com o conceito cobrado, refaça questões semelhantes "
        "e registre por que a alternativa errada parecia atrativa."
    )


def build_question_explanation(
    *,
    source: str,
    exam_type: str,
    year: int | None,
    question_number: int,
    subject: str,
    statement: str,
    options: dict[str, Any],
    user_answer: str | None,
    correct_answer: str | None,
    status: str,
) -> dict:
    trusted_sources = get_trusted_sources(subject=subject, exam_type=exam_type)

    options_text = _format_options(options)

    source_lines = "\n".join(
        f"- {item['title']} ({item['publisher']}): {item['url']}"
        for item in trusted_sources
    )

    prompt = f"""
Você é um professor especialista em correção de questões para estudantes brasileiros.

Tarefa:
Gerar uma explicação completa, clara, didática e objetiva para uma questão que o aluno errou ou deixou em branco.

Regras obrigatórias:
- Responda em português do Brasil.
- Não invente gabarito.
- Use apenas o enunciado, alternativas, resposta do aluno, gabarito e conhecimento educacional consolidado.
- Não diga que consultou sites em tempo real.
- Use as fontes listadas apenas como referências confiáveis para aprofundamento.
- Não gere resumo geral nem flashcards.
- Explique a questão inteira, com foco no erro do aluno.
- Não use markdown excessivo.

Contexto:
Origem: {source}
Exame: {exam_type.upper()}
Ano: {year if year is not None else "não informado"}
Questão: {question_number}
Disciplina: {subject}
Status: {status}
Resposta do aluno: {user_answer or "em branco"}
Gabarito: {correct_answer or "não informado"}

Enunciado:
{statement}

Alternativas:
{options_text}

Fontes confiáveis para referência:
{source_lines}

Estrutura obrigatória da resposta:
1. Diagnóstico do erro
2. Conceito central cobrado
3. Resolução passo a passo
4. Por que o gabarito está correto
5. Por que a resposta do aluno está errada ou por que deixar em branco prejudicou
6. Como estudar esse tipo de questão
""".strip()

    ai_response = generate_ai_response(prompt)

    if not ai_response or ai_response.startswith("Erro IA") or ai_response.startswith("Erro IA HTTP"):
        ai_response = _fallback_explanation(
            subject=subject,
            user_answer=user_answer,
            correct_answer=correct_answer,
            status=status,
        )

    return {
        "explanation_text": ai_response.strip(),
        "sources": trusted_sources,
    }