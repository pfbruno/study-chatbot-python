const API_BASE_URL = "https://study-chatbot-python.onrender.com";
const STORAGE_KEY = "study_chatbot_messages";

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

let examCatalog = [];
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

  const userMessage = { sender: "user", text: question };
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

  const categories =
    data.questions_by_category ||
    data.category_counts ||
    data.categories ||
    {};

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

function getSelectedExamType() {
  return examCatalog.find((exam) => exam.key === selectedExamTypeKey) || null;
}

function renderExamTypes() {
  examTypeGrid.innerHTML = "";

  examCatalog.forEach((exam) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "exam-type-card";
    card.textContent = exam.label;

    if (selectedExamTypeKey === exam.key) {
      card.classList.add("active");
    }

    card.addEventListener("click", () => {
      selectExamType(exam.key);
    });

    examTypeGrid.appendChild(card);
  });
}

function renderExamYears() {
  examYearsGrid.innerHTML = "";
  examIntroCard.classList.add("hidden");
  examRunner.classList.add("hidden");
  examResultCard.classList.add("hidden");

  const examType = getSelectedExamType();

  if (!examType) {
    selectedExamLabel.textContent = "Selecione uma prova para visualizar os anos.";
    return;
  }

  selectedExamLabel.textContent = `Prova selecionada: ${examType.label}`;

  if (!examType.years || examType.years.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "Nenhum ano cadastrado ainda para esta prova.";
    examYearsGrid.appendChild(emptyMessage);
    return;
  }

  examType.years.forEach((yearItem) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "exam-year-card";
    card.textContent = yearItem.year;

    if (String(selectedExamYear) === String(yearItem.year)) {
      card.classList.add("active");
    }

    card.addEventListener("click", () => {
      selectExamYear(yearItem.year);
    });

    examYearsGrid.appendChild(card);
  });
}

function selectExamType(typeKey) {
  selectedExamTypeKey = typeKey;
  selectedExamYear = null;
  currentExam = null;
  currentQuestionIndex = 0;
  userAnswers = [];

  renderExamTypes();
  renderExamYears();
}

function selectExamYear(year) {
  selectedExamYear = year;
  renderExamYears();
  renderExamIntro();
}

function renderExamIntro() {
  const examType = getSelectedExamType();
  if (!examType || !selectedExamYear) return;

  const yearData = examType.years.find((item) => String(item.year) === String(selectedExamYear));
  if (!yearData) return;

  examIntroTitle.textContent = yearData.title;
  examIntroDescription.textContent = yearData.description || "Prova disponível para realização no site.";
  examMetaType.textContent = examType.label;
  examMetaYear.textContent = yearData.year;
  examMetaCount.textContent = `${yearData.question_count} questões`;

  examIntroCard.classList.remove("hidden");
}

async function loadExamCatalog() {
  try {
    const response = await fetch(`${API_BASE_URL}/exams`);
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    examCatalog = data.exam_types || [];

    renderExamTypes();

    if (examCatalog.length > 0) {
      selectExamType(examCatalog[0].key);
    }
  } catch (error) {
    examTypeGrid.innerHTML = `<p>Erro ao carregar catálogo de provas: ${error.message}</p>`;
    examYearsGrid.innerHTML = "";
  }
}

async function startExam() {
  if (!selectedExamTypeKey || !selectedExamYear) return;

  try {
    startExamBtn.disabled = true;

    const response = await fetch(`${API_BASE_URL}/exams/${selectedExamTypeKey}/${selectedExamYear}`);
    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    currentExam = await response.json();
    currentQuestionIndex = 0;
    userAnswers = new Array(currentExam.question_count).fill(null);

    examRunner.classList.remove("hidden");
    examResultCard.classList.add("hidden");

    renderCurrentQuestion();
  } catch (error) {
    alert(`Erro ao carregar prova: ${error.message}`);
  } finally {
    startExamBtn.disabled = false;
  }
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

async function finishExam() {
  if (!selectedExamTypeKey || !selectedExamYear || !currentExam) return;

  try {
    finishExamBtn.disabled = true;

    const response = await fetch(`${API_BASE_URL}/exams/${selectedExamTypeKey}/${selectedExamYear}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ answers: userAnswers })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}`);
    }

    const result = await response.json();

    resultScore.textContent = `${result.score_percentage}%`;
    resultDetails.textContent =
      `Você acertou ${result.correct_answers} de ${result.total_questions} questões. ` +
      `Erros: ${result.wrong_answers}. Em branco: ${result.unanswered_count}.`;

    examResultCard.classList.remove("hidden");
  } catch (error) {
    alert(`Erro ao finalizar prova: ${error.message}`);
  } finally {
    finishExamBtn.disabled = false;
  }
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
loadExamCatalog();
showView("chat");