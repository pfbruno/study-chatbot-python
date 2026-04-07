from app.intents import CATEGORIES
from app.database import save_interaction

def classify_question(text):
    text = text.lower()

    for category, keywords in CATEGORIES.items():
        for word in keywords:
            if word in text:
                return category

    return "geral"


def generate_response(category):
    responses = {
        "programacao": "Posso explicar conceitos de programação como funções, variáveis e lógica.",
        "matematica": "Posso ajudar com conceitos matemáticos e resolução de problemas.",
        "biologia": "Posso explicar conteúdos de biologia.",
        "vestibular": "Posso ajudar com estratégias de prova e revisão.",
        "geral": "Pode reformular sua pergunta? Quero te ajudar melhor."
    }

    return responses.get(category)


def process_question(text):
    category = classify_question(text)

    response = f"""
Tema identificado: {category}

Explicação:
{generate_response(category)}

Resumo:
Este tema pertence à área de {category}.

Sugestão de estudo:
Revisar conceitos básicos e praticar exercícios.
"""

    # salvar no banco
    save_interaction(text, category, response)

    return response