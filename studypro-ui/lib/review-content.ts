export type ReviewCard = {
  id: string
  subject: string
  questionNumber: number
  front: string
  back: string
}

export type ReviewSummaryPayload = {
  title: string
  subtitle: string
  revisionSummary: string
  weakestSubjects: Array<{
    subject: string
    accuracy: number
    correct: number
    wrong: number
    blank: number
  }>
  generatedAt: string
}

type ReviewSimulationQuestion = {
  number: number
  subject: string
  statement: string
  options: Record<string, string>
}

type ReviewSourceData = {
  simulation: {
    title: string
    exam_type: string
    year: number
    questions?: ReviewSimulationQuestion[]
  }
  result: {
    total_questions: number
    correct_answers: number
    wrong_answers: number
    unanswered_count: number
    score_percentage: number
    subjects_summary: Array<{
      subject: string
      total: number
      correct: number
      wrong: number
      blank: number
      accuracy_percentage: number
    }>
    results_by_question: Array<{
      question_number: number
      subject: string
      user_answer: string | null
      correct_answer: string
      status: "correct" | "wrong" | "blank"
    }>
  }
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function stripMediaAndLinks(value: string) {
  return normalizeWhitespace(
    value
      .replace(/!\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi, " ")
      .replace(/\[(?:imagem|Imagem)[^\]]*?(https?:\/\/[^\]\s]+\.(?:png|jpg|jpeg|webp|gif|svg))\s*\]/gi, " ")
      .replace(/https?:\/\/[^\s]+/gi, " ")
  )
}

function shorten(value: string, max = 180) {
  const normalized = normalizeWhitespace(value)
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max).trim()}...`
}

function firstSentence(value: string) {
  const normalized = stripMediaAndLinks(value)
  const match = normalized.match(/(.+?[.!?])(\\s|$)/)
  if (match?.[1]) return shorten(match[1], 180)
  return shorten(normalized, 180)
}

function extractFormula(value: string) {
  const cleaned = stripMediaAndLinks(value)
  const lines = cleaned
    .split(/[.;:]/)
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean)

  const formulaLike = lines.find((line) => {
    return (
      /[=Δ∆]/.test(line) ||
      /\\bvm\\b|\\bvelocidade média\\b|\\bdensidade\\b|\\bforça\\b|\\benergia\\b/i.test(line) ||
      /[a-zA-Z0-9)]\\s*\\/\\s*[a-zA-Z0-9(]/.test(line)
    )
  })

  return formulaLike ? shorten(formulaLike, 120) : ""
}

function extractQuestionCue(statement: string, subject: string) {
  const cleaned = stripMediaAndLinks(statement)

  if (!cleaned) {
    return `Qual era a ideia central desta questão de ${subject}?`
  }

  const base = firstSentence(cleaned)
  return shorten(base, 150)
}

function getQuestionByNumber(
  data: ReviewSourceData,
  questionNumber: number
): ReviewSimulationQuestion | undefined {
  return data.simulation.questions?.find((item) => item.number === questionNumber)
}

function getCorrectOptionText(
  question: ReviewSimulationQuestion | undefined,
  letter: string | null
) {
  if (!question || !letter) return ""
  return question.options?.[letter] ?? ""
}

function buildDirectExplanation(
  subject: string,
  statement: string,
  correctOptionText: string,
  correctLetter: string
) {
  const formula = extractFormula(correctOptionText)
  const cue = extractQuestionCue(statement, subject)

  if (formula) {
    return [
      `Conceito cobrado: ${cue}`,
      `Gabarito: alternativa ${correctLetter}.`,
      `Ponto central da resolução: ${formula}.`,
      `Memorização objetiva: quando a alternativa correta traz uma relação matemática ou física explícita, o foco do seu cartão deve ser a fórmula e o significado dos termos.`,
    ].join("\n")
  }

  const optionSentence = firstSentence(correctOptionText)

  return [
    `Conceito cobrado: ${cue}`,
    `Gabarito: alternativa ${correctLetter}.`,
    `Explicação direta: ${optionSentence || "A resposta correta depende do conceito central apresentado no enunciado."}`,
    `Memorização objetiva: o seu resumo deve guardar a ideia correta em linguagem curta, sem orientação genérica de estudo.`,
  ].join("\n")
}

export function buildReviewSummary(data: ReviewSourceData): ReviewSummaryPayload {
  const weakestSubjects = [...(data.result.subjects_summary ?? [])]
    .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)
    .slice(0, 4)
    .map((item) => ({
      subject: item.subject,
      accuracy: item.accuracy_percentage,
      correct: item.correct,
      wrong: item.wrong,
      blank: item.blank,
    }))

  const focusQuestions = (data.result.results_by_question ?? [])
    .filter((item) => item.status === "wrong" || item.status === "blank")
    .slice(0, 5)

  const explanationBlocks = focusQuestions.map((item, index) => {
    const question = getQuestionByNumber(data, item.question_number)
    const correctText = getCorrectOptionText(question, item.correct_answer)

    return [
      `${index + 1}) Questão ${item.question_number} • ${item.subject}`,
      buildDirectExplanation(
        item.subject,
        question?.statement ?? "",
        correctText,
        item.correct_answer
      ),
    ].join("\n")
  })

  const revisionSummary =
    explanationBlocks.length > 0
      ? [
          `Este resumo foi gerado a partir das questões erradas e em branco do seu último simulado. A ideia aqui é explicar o conteúdo cobrado e registrar o ponto correto de forma objetiva.`,
          "",
          ...explanationBlocks,
        ].join("\n\n")
      : `Você não tem erros ou questões em branco suficientes no último simulado para montar um resumo explicativo.`

  return {
    title: `Resumo explicativo • ${data.simulation.title}`,
    subtitle:
      "Explicações curtas baseadas nas questões com erro ou em branco e no gabarito do último simulado.",
    revisionSummary,
    weakestSubjects,
    generatedAt: new Date().toISOString(),
  }
}

export function buildReviewFlashcards(data: ReviewSourceData): ReviewCard[] {
  const focusQuestions = (data.result.results_by_question ?? [])
    .filter((item) => item.status === "wrong" || item.status === "blank")
    .slice(0, 12)

  return focusQuestions.map((item) => {
    const question = getQuestionByNumber(data, item.question_number)
    const correctText = getCorrectOptionText(question, item.correct_answer)
    const formula = extractFormula(correctText)
    const cue = extractQuestionCue(question?.statement ?? "", item.subject)

    const front = formula
      ? `Questão ${item.question_number} • ${item.subject}: qual é a fórmula central?`
      : `Questão ${item.question_number} • ${item.subject}: ${cue}`

    const back = formula
      ? formula
      : firstSentence(correctText) ||
        `Alternativa correta: ${item.correct_answer}.`

    return {
      id: `${item.subject}-${item.question_number}`,
      subject: item.subject,
      questionNumber: item.question_number,
      front: shorten(front, 180),
      back: shorten(back, 220),
    }
  })
}