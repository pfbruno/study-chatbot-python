from chatbot import process_question
from database import create_table
from analytics import total_questions, questions_by_category, most_frequent_category


def show_stats():
    print("\n=== ESTATÍSTICAS ===")

    print(f"Total de perguntas: {total_questions()}")

    print("\nPerguntas por categoria:")
    for category, count in questions_by_category().items():
        print(f"- {category}: {count}")

    print(f"\nCategoria mais frequente: {most_frequent_category()}")
    print("====================\n")


def main():
    create_table()

    print("Study Chatbot iniciado.")
    print("Digite 'stats' para ver análise de dados.")
    print("Digite 'sair' para encerrar.\n")

    while True:
        user_input = input("Você: ")

        if user_input.lower() == "sair":
            break

        if user_input.lower() == "stats":
            show_stats()
            continue

        response = process_question(user_input)
        print(f"\nBot:\n{response}\n")


if __name__ == "__main__":
    main()