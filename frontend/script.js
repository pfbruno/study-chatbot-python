const API_BASE_URL = "https://study-chatbot-python.onrender.com";
const STORAGE_KEY = "study_chatbot_messages";

const EXAMS_DATA = {
  enem: {
    label: "ENEM",
    years: {
      2022: {
        title: "ENEM 2022",
        description: "Simulado inicial do ENEM com questões objetivas para treino no site.",
        questions: [
          {
            statement: "Na matemática básica, qual é o valor de 15% de 200?",
            options: ["20", "25", "30", "35"],
            answer: 2
          },
          {
            statement: "A fotossíntese ocorre principalmente em qual organela celular?",
            options: ["Mitocôndria", "Cloroplasto", "Lisossomo", "Ribossomo"],
            answer: 1
          },
          {
            statement: "A Revolução Francesa teve início em qual ano?",
            options: ["1789", "1776", "1804", "1815"],
            answer: 0
          }
        ]
      },
      2023: {
        title: "ENEM 2023",
        description: "Simulado com foco em interpretação, ciências da natureza e raciocínio lógico.",
        questions: [
          {
            statement: "Qual das alternativas apresenta uma fonte de energia renovável?",
            options: ["Petróleo", "Carvão mineral", "Energia solar", "Gás natural"],
            answer: 2
          },
          {
            statement: "Em uma progressão aritmética 2, 5, 8, 11, o próximo termo é:",
            options: ["12", "13", "14", "15"],
            answer: 2
          },
          {
            statement: "Na língua portuguesa, um texto dissertativo-argumentativo tem como principal objetivo:",
            options: [
              "Narrar uma história fictícia",
              "Defender um ponto de vista",
              "Descrever um cenário",
              "Listar dados sem análise"
            ],
            answer: 1
          }
        ]
      }
    }
  },
  ufrgs: {
    label: "UFRGS",
    years: {
      2022: {
        title: "Vestibular UFRGS 2022",
        description: "Simulado com questões em padrão objetivo para prática no portal.",
        questions: [
          {
            statement: "Qual é a capital do Rio Grande do Sul?",
            options: ["Caxias do Sul", "Pelotas", "Porto Alegre", "Santa Maria"],
            answer: 2
          },
          {
            statement: "O número atômico representa:",
            options: [
              "A soma de prótons e nêutrons",
              "A quantidade de elétrons em qualquer situação",
              "A quantidade de prótons no núcleo",
              "A massa molar do elemento"
            ],
            answer: 2
          },
          {
            statement: "Em uma função do 1º grau, o gráfico é representado por:",
            options: ["Parábola", "Reta", "Circunferência", "Hipérbole"],
            answer: 1
          }
        ]
      },
      2023: {
        title: "Vestibular UFRGS 2023",
        description: "Simulado introdutório com questões de humanas, exatas e linguagem.",
        questions: [
          {
            statement: "No contexto da geopolítica, a sigla ONU significa:",
            options: [
              "Organização das Nações Unidas",
              "Ordem Nacional Unificada",
              "Operação Nuclear Universal",
              "Organização Nativa Unilateral"
            ],
            answer: 0
          },
          {
            statement: "Qual é o resultado de 9²?",
            options: ["18", "72", "81", "99"],
            answer: 2
          },
          {
            statement: "Em biologia, a unidade básica da vida é:",
            options: ["Tecido", "Órgão", "Sistema", "Célula"],
            answer: 3
          }
        ]
      }
    }
  },
  ufsc: {
    label: "UFSC",
    years: {
      2022: {
        title: "Vestibular UFSC 2022",
        description: "Simulado inicial com questões de revisão para prática online.",
        questions: [
          {
            statement: "A água entra em ebulição ao nível do mar, em condições normais, a:",
            options: ["0 °C", "50 °C", "100 °C", "150 °C"],
            answer: 2
          },
          {
            statement: "Qual alternativa apresenta um verbo no infinitivo?",
            options: ["Correu", "Estudando", "Aprender", "Partimos"],
            answer: 2
          },
          {
            statement: "Em história do Brasil, a Proclamação da República ocorreu em:",
            options: ["1822", "1889", "1930", "1964"],
            answer: 1
          }
        ]
      },
      2023: {
        title: "Vestibular UFSC 2023",
        description: "Simulado online com foco em fundamentos cobrados em vestibulares.",
        questions: [
          {
            statement: "Qual alternativa apresenta apenas números primos?",
            options: ["2, 3 e 5", "4, 6 e 8", "9, 11 e 13", "10, 12 e 14"],
            answer: 0
          },
          {
            statement: "A camada da atmosfera mais próxima da superfície terrestre é a:",
            options: ["Estratosfera", "Mesosfera", "Troposfera", "Termosfera"],
            answer: 2
          },
          {
            statement: "Em física, a unidade de força no Sistema Internacional é:",
            options: ["Joule", "Pascal", "Watt", "Newton"],
            answer: 3
          }
        ]
      }
    }
  },
  outros: {
    label: "...",
    years: {}
  }
};

const questionInput = document.getElementById("question");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");
const statsBtn = document.getElementById("stats-btn");
const chatHistory = document.getElementById("chat-history");
const statsPre = document.getElementById("stats");
const chartCanvas = document.getElementById("stats-chart");

const chatTabBtn = document.getElementById("chat-tab-btn");
const examsTabBtn = document.getElementById("exams-tab-btn");
const chatView = document.getElementById("chat-view");
const examView = document.getElementById("exam-view");

const examTypeGrid = document.getElementById("exam-type-grid");
const examYearsGrid = document.getElementById("exam-years-grid");
const selectedExamLabel = document.getElementById("selected-exam-label");

const examIntroCard = document.getElementById("exam-intro-card");
const examIntroTitle = document.getElementById("exam-intro-title");
const examIntroDescription = document.getElementById("exam-intro-description");
const examMetaType = document.getElementById("exam-meta-type");
const examMetaYear = document.getElementById("exam-meta-year");
const examMetaCount = document.getElementById("exam-meta-count");
const startExamBtn = document.getElementById("start-exam-btn");

const examRunner = document.getElementById("exam-runner");
const runnerTitle = document.getElementById("runner-title");
const runnerSubtitle = document.getElementById("runner-subtitle");
const questionCounter = document.getElementById("question-counter");
const progressFill = document.getElementById("progress-fill");
const questionStatement = document.getElementById("question-statement");
const questionOptions = document.getElementById("question-options");
const prevQuestionBtn = document.getElementById("prev-question-btn");
const nextQuestionBtn = document.getElementById("next-question-btn");
const finishExamBtn = document.getElementById("finish-exam-btn");

const examResultCard = document.getElementById("exam-result-card");
const resultScore = document.getElementById("result-score");
const resultDetails = document.getElementById("result-details");
const restartExamBtn = document.getElementById("restart-exam-btn");

let statsChartInstance = null;

let selectedExamTypeKey = null;
let selectedExamYear = null;
let currentExam = null;
let currentQuestionIndex = 0;
let userAnswers = [];

function scrollChatToBottom() {
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInline(text) {
  let safe = escapeHtml(text);
  safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
  return safe;
}

function cleanRawResponse(text) {
  if (!text) return "";

  return text
    .replace(/^Tema identificado:\s*.*$/gim, "")
    .replace(/^Resumo:\s*Resposta gerada por IA\.?\s*$/gim, "")
    .replace(/^Sugestão de estudo:\s*.*$/gim, "")
    .replace(/^\s*Explicação:\s*$/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isMarkdownTableLine(line) {
  return line.includes("|");
}

function isSeparatorRow(line) {
  const cleaned = line.replace(/\|/g, "").replace(/:/g, "").trim();
  return cleaned.length > 0 && /^-+$/.test(cleaned.replace(/\s/g, ""));
}

function parseTableBlock(lines, startIndex) {
  const tableLines = [];
  let i = startIndex;

  while (i < lines.length && isMarkdownTableLine(lines[i])) {
    tableLines.push(lines[i]);
    i++;
  }

  if (tableLines.length < 2) {
    return { html: "", nextIndex: startIndex };
  }

  const rows = tableLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      let cleaned = line;
      if (cleaned.startsWith("|")) cleaned = cleaned.slice(1);
      if (cleaned.endsWith("|")) cleaned = cleaned.slice(0, -1);
      return cleaned.split("|").map((cell) => cell.trim());
    });

  const validRows = rows.filter((row, index) => {
    const originalLine = tableLines[index].trim();
    return !isSeparatorRow(originalLine);
  });

  if (validRows.length < 2) {
    return { html: "", nextIndex: startIndex };
  }

  const header = validRows[0];
  const body = validRows.slice(1);

  let html = '<div class="response-table-wrapper"><table class="response-table"><thead><tr>';
  header.forEach((cell) => {
    html += `<th>${formatInline(cell)}</th>`;
  });
  html += "</tr></thead><tbody>";

  body.forEach((row) => {
    html += "<tr>";
    row.forEach((cell) => {
      html += `<td>${formatInline(cell)}</td>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table></div>";

  return { html, nextIndex: i - 1 };
}

function formatBotResponse(rawText) {
  const cleaned = cleanRawResponse(rawText);
  if (!cleaned) {
    return "<p>Não foi possível gerar uma resposta.</p>";
  }

  const lines = cleaned.split("\n");
  let html = "";
  let currentListType = null;

  function closeList() {
    if (currentListType) {
      html += currentListType === "ol" ? "</ol>" : "</ul>";
      currentListType = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      closeList();
      continue;
    }

    if (isMarkdownTableLine(line) && i + 1 < lines.length && isMarkdownTableLine(lines[i + 1])) {
      closeList();
      const tableResult = parseTableBlock(lines, i);
      if (tableResult.html) {
        html += tableResult.html;
        i = tableResult.nextIndex;
        continue;
      }
    }

    const h1Match = line.match(/^#\s+(.*)$/);
    const h2Match = line.match(/^##\s+(.*)$/);
    const h3Match = line.match(/^###\s+(.*)$/);
    const h4Match = line.match(/^####\s+(.*)$/);

    if (h4Match) {
      closeList();
      html += `<h4>${formatInline(h4Match[1])}</h4>`;
      continue;
    }

    if (h3Match) {
      closeList();
      html += `<h3>${formatInline(h3Match[1])}</h3>`;
      continue;
    }

    if (h2Match) {
      closeList();
      html += `<h2>${formatInline(h2Match[1])}</h2>`;
      continue;
    }

    if (h1Match) {
      closeList();
      html += `<h1>${formatInline(h1Match[1])}</h1>`;
      continue;
    }

    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (currentListType !== "ul") {
        closeList();
        html += "<ul>";
        currentListType = "ul";
      }
      html += `<li>${formatInline(bulletMatch[1])}</li>`;
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (currentListType !== "ol") {
        closeList();
        html += "<ol>";
        currentListType = "ol";
      }
      html += `<li>${formatInline(orderedMatch[1])}</li>`;
      continue;
    }

    if (/^\*\*.*\*\*$/.test(line) && !line.includes("|")) {
      closeList();
      const title = line.replace(/^\*\*/, "").replace(/\*\*$/, "");
      html += `<h2>${formatInline(title)}</h2>`;
      continue;
    }

    closeList();
    html += `<p>${formatInline(line)}</p>`;
  }

  closeList();

  return html.trim() || "<p>Não foi possível gerar uma resposta.</p>";
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function getSavedMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addMessageToStorage(message) {
  const messages = getSavedMessages();
  messages.push(message);
  saveMessages(messages);
}

function renderMessage(message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", message.sender);

  const contentDiv = document.createElement("div");
  contentDiv.classList.add("message-content");

  if (message.sender === "bot") {
    contentDiv.innerHTML = formatBotResponse(message.text);
  } else {
    contentDiv.textContent = message.text;
  }

  messageDiv.appendChild(contentDiv);
  chatHistory.appendChild(messageDiv);
  scrollChatToBottom();
}

function loadSavedMessages() {
  const messages = getSavedMessages();
  chatHistory.innerHTML = "";
  messages.forEach((message) => renderMessage(message));
}

function showLoadingMessage() {
  const loadingDiv = document.createElement("div");
  loadingDiv.classList.add("message", "bot", "loading");
  loadingDiv.id = "loading-message";

  const contentDiv = document.createElement("div");
  contentDiv.classList.add("message-content");
  contentDiv.innerHTML = "<p>O chatbot está digitando...</p>";

  loadingDiv.appendChild(contentDiv);
  chatHistory.appendChild(loadingDiv);
  scrollChatToBottom();
}

function removeLoadingMessage() {
  const loadingDiv = document.getElementById("loading-message");
  if (loadingDiv) {
    loadingDiv.remove();
  }
}

async function sendQuestion() {
  const question = questionInput.value.trim();

  if (!question) return;

  const userMessage = {
    sender: "user",
    text: question
  };

  renderMessage(userMessage);
  addMessageToStorage(userMessage);

  questionInput.value = "";
  sendBtn.disabled = true;
  showLoadingMessage();

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const data = await response.json();

    const botText =
      data.explanation ||
      data.response ||
      data.answer ||
      data.message ||
      "Não foi possível gerar uma resposta.";

    removeLoadingMessage();

    const botMessage = {
      sender: "bot",
      text: botText
    };

    renderMessage(botMessage);
    addMessageToStorage(botMessage);
  } catch (error) {
    removeLoadingMessage();

    const botMessage = {
      sender: "bot",
      text: `Ocorreu um erro ao gerar a resposta: ${error.message}`
    };

    renderMessage(botMessage);
    addMessageToStorage(botMessage);
  } finally {
    sendBtn.disabled = false;
    questionInput.focus();
  }
}

function clearChat() {
  chatHistory.innerHTML = "";
  localStorage.removeItem(STORAGE_KEY);
}

async function loadStats() {
  try {
    statsPre.textContent = "Carregando estatísticas...";

    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const data = await response.json();

    statsPre.textContent = JSON.stringify(data, null, 2);
    renderStatsChart(data);
  } catch (error) {
    statsPre.textContent = `Erro ao carregar estatísticas: ${error.message}`;
  }
}

function renderStatsChart(data) {
  if (!chartCanvas) return;

  const categories = data.category_counts || data.categories || {};
  const labels = Object.keys(categories);
  const values = Object.values(categories);

  if (statsChartInstance) {
    statsChartInstance.destroy();
  }

  statsChartInstance = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Perguntas por tema",
          data: values,
          backgroundColor: [
            "rgba(59, 130, 246, 0.7)",
            "rgba(16, 185, 129, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(239, 68, 68, 0.7)",
            "rgba(139, 92, 246, 0.7)",
            "rgba(236, 72, 153, 0.7)"
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(139, 92, 246, 1)",
            "rgba(236, 72, 153, 1)"
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: "#111827"
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function showView(viewName) {
  const isChat = viewName === "chat";

  chatView.classList.toggle("active", isChat);
  examView.classList.toggle("active", !isChat);

  chatTabBtn.classList.toggle("active", isChat);
  examsTabBtn.classList.toggle("active", !isChat);

  chatTabBtn.classList.toggle("secondary", !isChat);
  examsTabBtn.classList.toggle("secondary", isChat);
}

function renderExamTypes() {
  examTypeGrid.innerHTML = "";

  Object.entries(EXAMS_DATA).forEach(([key, exam]) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "exam-type-card";
    card.textContent = exam.label;

    if (selectedExamTypeKey === key) {
      card.classList.add("active");
    }

    card.addEventListener("click", () => {
      selectExamType(key);
    });

    examTypeGrid.appendChild(card);
  });
}

function selectExamType(typeKey) {
  selectedExamTypeKey = typeKey;
  selectedExamYear = null;
  currentExam = null;
  userAnswers = [];
  currentQuestionIndex = 0;

  examIntroCard.classList.add("hidden");
  examRunner.classList.add("hidden");
  examResultCard.classList.add("hidden");

  renderExamTypes();
  renderExamYears();
}

function renderExamYears() {
  examYearsGrid.innerHTML = "";

  if (!selectedExamTypeKey) {
    selectedExamLabel.textContent = "Selecione uma prova para visualizar os anos.";
    return;
  }

  const examType = EXAMS_DATA[selectedExamTypeKey];
  const years = Object.keys(examType.years).sort((a, b) => Number(b) - Number(a));

  selectedExamLabel.textContent = `Prova selecionada: ${examType.label}`;

  if (years.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "Nenhum ano cadastrado ainda para esta prova.";
    examYearsGrid.appendChild(emptyMessage);
    return;
  }

  years.forEach((year) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "exam-year-card";
    card.textContent = year;

    if (selectedExamYear === year) {
      card.classList.add("active");
    }

    card.addEventListener("click", () => {
      selectExamYear(year);
    });

    examYearsGrid.appendChild(card);
  });
}

function selectExamYear(year) {
  selectedExamYear = year;
  const examType = EXAMS_DATA[selectedExamTypeKey];
  currentExam = examType.years[year];

  renderExamYears();
  renderExamIntro();
}

function renderExamIntro() {
  if (!currentExam) {
    examIntroCard.classList.add("hidden");
    return;
  }

  examIntroTitle.textContent = currentExam.title;
  examIntroDescription.textContent = currentExam.description;
  examMetaType.textContent = EXAMS_DATA[selectedExamTypeKey].label;
  examMetaYear.textContent = selectedExamYear;
  examMetaCount.textContent = `${currentExam.questions.length} questões`;

  examIntroCard.classList.remove("hidden");
  examRunner.classList.add("hidden");
  examResultCard.classList.add("hidden");
}

function startExam() {
  if (!currentExam) return;

  userAnswers = new Array(currentExam.questions.length).fill(null);
  currentQuestionIndex = 0;

  examRunner.classList.remove("hidden");
  examResultCard.classList.add("hidden");

  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  if (!currentExam) return;

  const totalQuestions = currentExam.questions.length;
  const question = currentExam.questions[currentQuestionIndex];

  runnerTitle.textContent = currentExam.title;
  runnerSubtitle.textContent = "Responda as questões diretamente no site.";
  questionCounter.textContent = `Questão ${currentQuestionIndex + 1} de ${totalQuestions}`;
  questionStatement.textContent = question.statement;

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  progressFill.style.width = `${progressPercent}%`;

  questionOptions.innerHTML = "";

  question.options.forEach((option, index) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "option-item";

    if (userAnswers[currentQuestionIndex] === index) {
      optionDiv.classList.add("selected");
    }

    optionDiv.addEventListener("click", () => {
      userAnswers[currentQuestionIndex] = index;
      renderCurrentQuestion();
    });

    const letter = document.createElement("div");
    letter.className = "option-letter";
    letter.textContent = String.fromCharCode(65 + index);

    const text = document.createElement("div");
    text.className = "option-text";
    text.textContent = option;

    optionDiv.appendChild(letter);
    optionDiv.appendChild(text);
    questionOptions.appendChild(optionDiv);
  });

  prevQuestionBtn.disabled = currentQuestionIndex === 0;
  nextQuestionBtn.disabled = currentQuestionIndex === totalQuestions - 1;
}

function goToPreviousQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderCurrentQuestion();
  }
}

function goToNextQuestion() {
  if (!currentExam) return;

  if (currentQuestionIndex < currentExam.questions.length - 1) {
    currentQuestionIndex++;
    renderCurrentQuestion();
  }
}

function finishExam() {
  if (!currentExam) return;

  let correctAnswers = 0;

  currentExam.questions.forEach((question, index) => {
    if (userAnswers[index] === question.answer) {
      correctAnswers++;
    }
  });

  const totalQuestions = currentExam.questions.length;
  const score = Math.round((correctAnswers / totalQuestions) * 100);

  resultScore.textContent = `${score}%`;
  resultDetails.textContent = `Você acertou ${correctAnswers} de ${totalQuestions} questões em ${currentExam.title}.`;

  examResultCard.classList.remove("hidden");
}

function restartExam() {
  startExam();
}

sendBtn.addEventListener("click", sendQuestion);
clearBtn.addEventListener("click", clearChat);
statsBtn.addEventListener("click", loadStats);

chatTabBtn.addEventListener("click", () => showView("chat"));
examsTabBtn.addEventListener("click", () => showView("exams"));

questionInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendQuestion();
  }
});

startExamBtn.addEventListener("click", startExam);
prevQuestionBtn.addEventListener("click", goToPreviousQuestion);
nextQuestionBtn.addEventListener("click", goToNextQuestion);
finishExamBtn.addEventListener("click", finishExam);
restartExamBtn.addEventListener("click", restartExam);

loadSavedMessages();
loadStats();
renderExamTypes();
renderExamYears();
showView("chat");