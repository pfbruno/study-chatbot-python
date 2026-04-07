import os
from openai import OpenAI

from app.intents import CATEGORIES
from app.database import save_interaction

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def classify_question(text: str) -> str:
    text = text.lower()

    for category, keywords in CATEGORIES.items():
        for word in keywords:
            if word in text:
                return category

    return "geral"


def generate_ai_response(question: str) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Você é um professor didático, claro e objetivo. Explique em português do Brasil."
                },
                {
                    "role": "user",
                    "content": question
                }
            ],
            temperature=0.7,
        )

        return response.choices[0].message.content

    except Exception as e:
        return f"Erro IA: {str(e)}"


def process_question(text: str) -> dict:
    category = classify_question(text)
    ai_response = generate_ai_response(text)

    formatted_response = (
        f"Tema identificado: {category}\n\n"
        f"Explicação:\n{ai_response}\n\n"
        f"Resumo:\nResposta gerada por IA.\n\n"
        f"Sugestão de estudo:\nAprofunde o tema com exercícios e revisão."
    )

    save_interaction(text, category, formatted_response)

    return {
        "category": category,
        "explanation": ai_response,
        "summary": "Resposta gerada por IA.",
        "study_tip": "Aprofunde o tema com exercícios e revisão.",
        "formatted_response": formatted_response
    }