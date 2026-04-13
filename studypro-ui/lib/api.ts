const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

type RequestOptions = RequestInit & {
  timeoutMs?: number
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 15000, headers, ...rest } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) {
      let message = `Erro ${response.status}`

      try {
        const errorData = await response.json()
        if (errorData?.detail) {
          message = Array.isArray(errorData.detail)
            ? errorData.detail.map((item: unknown) => String(item)).join(", ")
            : String(errorData.detail)
        }
      } catch {
        // mantém mensagem padrão
      }

      throw new Error(message)
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Tempo de resposta da API excedido.")
    }

    throw error instanceof Error
      ? error
      : new Error("Erro inesperado ao comunicar com a API.")
  } finally {
    clearTimeout(timeoutId)
  }
}

export type ExamYear = {
  year: number
  title: string
  description: string
  question_count: number
  has_answer_key: boolean
  has_pdfs: boolean
  official_page_url?: string | null
}

export type ExamType = {
  key: string
  label: string
  years: ExamYear[]
}

export type ExamsResponse = {
  exam_types: ExamType[]
}

export type ExamPdf = {
  label: string
  url: string
}

export type ExamDetail = {
  exam_type: string
  institution: string
  year: number
  title: string
  description: string
  question_count: number
  pdfs: ExamPdf[]
  has_answer_key: boolean
  official_page_url?: string | null
}

export type ExamQuestionResult = {
  question_number: number
  user_answer: string | null
  correct_answer: string | null
  status: "correct" | "wrong" | "blank" | "annulled"
}

export type ExamSubmissionResponse = {
  title: string
  institution: string
  year: number
  total_questions: number
  valid_questions: number
  correct_answers: number
  wrong_answers: number
  unanswered_count: number
  annulled_count: number
  score_percentage: number
  results_by_question: ExamQuestionResult[]
}

export type ChatRequest = {
  question: string
}

export type ChatResponse = {
  question: string
  category: string
  explanation: string
  summary: string
  study_tip: string
  formatted_response: string
}

export type StatsResponse = {
  total_questions: number
  questions_by_category: Record<string, number>
  most_frequent_category: string | null
}

export type HistoryItem = {
  id: number
  question: string
  category: string
  response: string
  created_at: string
}

export type SimulationV2ListItem = {
  id: number
  owner_user_id: number
  title: string
  exam_type: string
  year: number
  subject: string | null
  question_count: number
  rating_avg: number
  rating_count: number
}

export type SimulationV2ListResponse = {
  items: SimulationV2ListItem[]
}

export type SimulationV2QuestionAnalytics = {
  question_number: number
  average_time_seconds: number
  correct_rate: number
  difficulty: "easy" | "medium" | "hard"
}

export type SimulationV2AnalyticsResponse = {
  simulation_id: number
  subject: string | null
  period_days: number | null
  attempts_count: number
  average_time_seconds: number
  accuracy_rate: number
  error_rate: number
  most_marked_option: { option: string; count: number } | null
  questions: SimulationV2QuestionAnalytics[]
}

export function getApiBaseUrl() {
  return API_BASE_URL
}

export async function getExamTypes() {
  return apiFetch<ExamsResponse>("/exams")
}

export async function getExamByTypeAndYear(examType: string, year: number) {
  return apiFetch<ExamDetail>(`/exams/${encodeURIComponent(examType)}/${year}`)
}

export async function submitExamAnswers(
  examType: string,
  year: number,
  answers: Array<string | null>,
) {
  return apiFetch<ExamSubmissionResponse>(
    `/exams/${encodeURIComponent(examType)}/${year}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
    },
  )
}

export async function sendChatQuestion(payload: ChatRequest) {
  return apiFetch<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function getStats() {
  return apiFetch<StatsResponse>("/stats")
}

export async function getHistory() {
  return apiFetch<HistoryItem[]>("/history")
}

export async function getSimulationsV2(subject?: string) {
  const params = new URLSearchParams()
  if (subject) params.set("subject", subject)
  const suffix = params.toString() ? `?${params.toString()}` : ""
  return apiFetch<SimulationV2ListResponse>(`/v2/simulados${suffix}`)
}

export async function getSimulationAnalyticsV2(
  simulationId: number,
  options: { periodDays?: number; subject?: string } = {},
) {
  const params = new URLSearchParams()
  if (options.periodDays) params.set("period_days", String(options.periodDays))
  if (options.subject) params.set("subject", options.subject)
  const suffix = params.toString() ? `?${params.toString()}` : ""
  return apiFetch<SimulationV2AnalyticsResponse>(
    `/v2/simulados/${simulationId}/analytics${suffix}`,
  )
}
