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
                {"role": "system", "content": "Explique de forma simples e didática."},
                {"role": "user", "content": question}
            ],
            temperature=0.7,
        )

        return response.choices[0].message.content

    except Exception as e:
        return "Erro ao gerar resposta com IA."


def process_question(text: str) -> dict:
    category = classify_question(text)

    ai_response = generate_ai_response(text)

    formatted_response = f"Tema: {category}\n\nResposta:\n{ai_response}"

    save_interaction(text, category, formatted_response)

    return {
        "category": category,
        "explanation": ai_response,
        "summary": "Resposta gerada por IA",
        "study_tip": "Aprofunde com exercícios.",
        "formatted_response": formatted_response
    }