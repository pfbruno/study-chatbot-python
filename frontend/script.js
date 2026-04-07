const sendBtn = document.getElementById("send-btn");
const statsBtn = document.getElementById("stats-btn");
const questionInput = document.getElementById("question");
const responseBox = document.getElementById("response");
const statsBox = document.getElementById("stats");

const API_URL = "http://127.0.0.1:8000";

sendBtn.addEventListener("click", async () => {
  const question = questionInput.value.trim();

  if (!question) {
    responseBox.textContent = "Digite uma pergunta antes de enviar.";
    return;
  }

  responseBox.textContent = "Carregando resposta...";

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    responseBox.textContent = data.response;
  } catch (error) {
    responseBox.textContent = "Erro ao conectar com a API.";
  }
});

statsBtn.addEventListener("click", async () => {
  statsBox.textContent = "Carregando estatísticas...";

  try {
    const res = await fetch(`${API_URL}/stats`);
    const data = await res.json();

    statsBox.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    statsBox.textContent = "Erro ao buscar estatísticas.";
  }
});