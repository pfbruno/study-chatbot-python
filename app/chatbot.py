import os
import requests

from app.intents import CATEGORIES
from app.database import save_interaction

HF_API_KEY = os.getenv("HF_API_KEY")

API_URL = "https://router.huggingface.co/v1/chat/completions"

HEADERS = {
    "Authorization": f"Bearer {HF_API_KEY}",
    "Content-Type": "application/json"
}


def classify_question(text: str) -> str:
    text = text.lower()

    for category, keywords in CATEGORIES.items():
        for word in keywords:
            if word in text:
                return category

    return "geral"


def generate_ai_response(question: str) -> str:
    try:
        payload = {
            "model": "openai/gpt-oss-120b:fastest",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Você é um professor didático, claro e objetivo. "
                        "Responda sempre em português do Brasil."
                    )
                },
                {
                    "role": "user",
                    "content": question
                }
            ],
            "stream": False
        }

        response = requests.post(
            API_URL,
            headers=HEADERS,
            json=payload,
            timeout=60
        )

        if response.status_code != 200:
            return f"Erro IA HTTP {response.status_code}: {response.text}"

        result = response.json()

        return result["choices"][0]["message"]["content"]

    except Exception as e:
        return f"Erro IA: {str(e)}"


def process_question(text: str) -> dict:
    category = classify_question(text)
    ai_response = generate_ai_response(text)

    formatted_response = (
        f"Tema identificado: {category}\n\n"
        f"Explicação:\n{ai_response}\n\n"
        f"Resumo:\nResposta gerada por IA.\n\n"
        f"Sugestão de estudo:\nAprofunde com exercícios e revisão."
    )

    save_interaction(text, category, formatted_response)

    return {
        "category": category,
        "explanation": ai_response,
        "summary": "Resposta gerada por IA.",
        "study_tip": "Aprofunde com exercícios e revisão.",
        "formatted_response": formatted_response
    }