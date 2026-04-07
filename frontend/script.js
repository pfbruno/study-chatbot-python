const sendBtn = document.getElementById("send-btn");
const statsBtn = document.getElementById("stats-btn");
const questionInput = document.getElementById("question");
const chatHistory = document.getElementById("chat-history");
const statsBox = document.getElementById("stats");

const API_URL = "http://127.0.0.1:8000";

function addMessage(text, type) {
  const message = document.createElement("div");
  message.classList.add("message", type);
  message.textContent = text;
  chatHistory.appendChild(message);

  chatHistory.scrollTop = chatHistory.scrollHeight;
}

sendBtn.addEventListener("click", async () => {
  const question = questionInput.value.trim();

  if (!question) return;

  addMessage("Você: " + question, "user");
  questionInput.value = "";

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    addMessage(data.response, "bot");

  } catch (error) {
    addMessage("Erro ao conectar com a API.", "bot");
  }
});

statsBtn.addEventListener("click", async () => {
  statsBox.textContent = "Carregando...";

  try {
    const res = await fetch(`${API_URL}/stats`);
    const data = await res.json();

    let formatted = `Total: ${data.total_questions}\n\n`;

    for (let cat in data.questions_by_category) {
      formatted += `${cat}: ${data.questions_by_category[cat]}\n`;
    }

    formatted += `\nMais frequente: ${data.most_frequent_category}`;

    statsBox.textContent = formatted;

  } catch (error) {
    statsBox.textContent = "Erro ao carregar.";
  }
});