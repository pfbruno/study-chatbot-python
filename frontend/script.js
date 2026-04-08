const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");
const statsBtn = document.getElementById("stats-btn");
const questionInput = document.getElementById("question");
const chatHistory = document.getElementById("chat-history");
const statsBox = document.getElementById("stats");
const chartCanvas = document.getElementById("stats-chart");

const API_URL = "https://study-chatbot-python.onrender.com";

let statsChart = null;

function scrollChatToBottom() {
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function saveChatToLocalStorage() {
  localStorage.setItem("study_chat_history", chatHistory.innerHTML);
}

function loadChatFromLocalStorage() {
  const saved = localStorage.getItem("study_chat_history");
  if (saved) {
    chatHistory.innerHTML = saved;
    scrollChatToBottom();
  }
}

function addMessage(text, type, isHtml = false) {
  const message = document.createElement("div");
  message.classList.add("message", type);

  if (isHtml) {
    message.innerHTML = text;
  } else {
    message.textContent = text;
  }

  chatHistory.appendChild(message);
  saveChatToLocalStorage();
  scrollChatToBottom();

  return message;
}

function formatBotResponse(data) {
  return `
<strong>Tema identificado:</strong> ${data.category}

<strong>Explicação:</strong>
${data.explanation}

<strong>Resumo:</strong>
${data.summary}

<strong>Sugestão de estudo:</strong>
${data.study_tip}
  `.trim();
}

async function sendQuestion() {
  const question = questionInput.value.trim();

  if (!question) return;

  addMessage(`Você: ${question}`, "user");
  questionInput.value = "";

  const loadingMessage = addMessage("Bot está digitando...", "bot");
  loadingMessage.classList.add("loading");

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const data = await res.json();

    loadingMessage.remove();
    addMessage(formatBotResponse(data), "bot", true);
  } catch (error) {
    loadingMessage.remove();
    addMessage("Erro ao conectar com a API.", "bot");
  }
}

function renderChart(categoryData) {
  const labels = Object.keys(categoryData);
  const values = Object.values(categoryData);

  if (statsChart) {
    statsChart.destroy();
  }

  statsChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Perguntas por categoria",
          data: values,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

async function loadStats() {
  statsBox.textContent = "Carregando estatísticas...";

  try {
    const res = await fetch(`${API_URL}/stats`);
    const data = await res.json();

    let formatted = `Total de perguntas: ${data.total_questions}\n\n`;
    formatted += "Perguntas por categoria:\n";

    for (let cat in data.questions_by_category) {
      formatted += `- ${cat}: ${data.questions_by_category[cat]}\n`;
    }

    formatted += `\nCategoria mais frequente: ${data.most_frequent_category ?? "Nenhuma"}`;

    statsBox.textContent = formatted;
    renderChart(data.questions_by_category);
  } catch (error) {
    statsBox.textContent = "Erro ao carregar estatísticas.";
  }
}

function clearChat() {
  chatHistory.innerHTML = "";
  localStorage.removeItem("study_chat_history");
}

sendBtn.addEventListener("click", sendQuestion);
statsBtn.addEventListener("click", loadStats);
clearBtn.addEventListener("click", clearChat);

questionInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendQuestion();
  }
});

loadChatFromLocalStorage();
loadStats();