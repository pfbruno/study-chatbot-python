from chatbot import process_question

def main():
    print("Study Chatbot iniciado. Digite 'sair' para encerrar.\n")

    while True:
        user_input = input("Você: ")

        if user_input.lower() == "sair":
            break

        response = process_question(user_input)
        print(f"\nBot:\n{response}\n")

if __name__ == "__main__":
    main()