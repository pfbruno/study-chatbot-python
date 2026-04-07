from app.intents import CATEGORIES
from app.database import save_interaction


def classify_question(text: str) -> str:
    text = text.lower()

    for category, keywords in CATEGORIES.items():
        for word in keywords:
            if word in text:
                return category

    return "geral"


def build_response_parts(category: str) -> dict:
    responses = {
        "programacao": {
            "explanation": "Esse tema envolve lógica, sintaxe e construção de soluções com código.",
            "summary": "Programação trabalha com instruções, estruturas e resolução de problemas computacionais.",
            "study_tip": "Revise funções, variáveis, estruturas condicionais e pratique exercícios simples."
        },
        "matematica": {
            "explanation": "Esse tema envolve raciocínio lógico, interpretação e aplicação de fórmulas.",
            "summary": "Matemática exige compreensão dos conceitos e treino constante com exercícios.",
            "study_tip": "Revise a teoria, resolva exemplos básicos e aumente a dificuldade gradualmente."
        },
        "biologia": {
            "explanation": "Esse tema envolve estruturas, processos vitais e organização dos seres vivos.",
            "summary": "Biologia estuda a vida em diferentes níveis, do molecular ao ecológico.",
            "study_tip": "Use mapas mentais, revise conceitos-chave e associe teoria com exemplos."
        },
        "vestibular": {
            "explanation": "Esse tema envolve estratégia de prova, revisão e foco nos conteúdos mais cobrados.",
            "summary": "Vestibular exige organização, prática e constância nos estudos.",
            "study_tip": "Monte um cronograma, resolva provas anteriores e revise seus erros."
        },
        "geral": {
            "explanation": "Não consegui identificar com precisão o tema da sua pergunta.",
            "summary": "A pergunta pode estar genérica ou curta demais.",
            "study_tip": "Tente reformular com mais contexto, por exemplo dizendo a disciplina ou o assunto."
        }
    }

    return responses[category]


def process_question(text: str) -> dict:
    category = classify_question(text)
    parts = build_response_parts(category)

    formatted_response = (
        f"Tema identificado: {category}\n\n"
        f"Explicação:\n{parts['explanation']}\n\n"
        f"Resumo:\n{parts['summary']}\n\n"
        f"Sugestão de estudo:\n{parts['study_tip']}"
    )

    save_interaction(text, category, formatted_response)

    return {
        "category": category,
        "explanation": parts["explanation"],
        "summary": parts["summary"],
        "study_tip": parts["study_tip"],
        "formatted_response": formatted_response
    }