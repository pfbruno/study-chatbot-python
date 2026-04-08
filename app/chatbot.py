import os
import requests

from app.intents import CATEGORIES
from app.database import save_interaction

HF_API_KEY = os.getenv("HF_API_KEY")

API_URL = "https://router.huggingface.co/hf-inference/models/google/flan-t5-base"

headers = {
    "Authorization": f"Bearer {HF_API_KEY}"
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
        prompt = f"Explique de forma simples e didática, em português do Brasil: {question}"

        response = requests.post(
            API_URL,
            headers=headers,
            json={"inputs": prompt},
            timeout=60
        )

        # se a resposta não vier OK, mostra o texto bruto
        if response.status_code != 200:
            return f"Erro IA HTTP {response.status_code}: {response.text}"

        # tenta converter para JSON
        try:
            result = response.json()
        except Exception:
            return f"Erro IA: resposta inválida da API -> {response.text}"

        if isinstance(result, list) and len(result) > 0:
            return result[0].get("generated_text", "Sem resposta gerada.")

        if isinstance(result, dict):
            if "generated_text" in result:
                return result["generated_text"]
            if "error" in result:
                return f"Erro IA: {result['error']}"

        return f"Resposta inesperada da IA: {result}"

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
        "study_tip": "Aprofunde com exercícios.",
        "formatted_response": formatted_response
    }