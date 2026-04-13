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
  attempt_id?: number | null
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
  subject_breakdown?: Array<{
    subject: string
    accuracy: number
    correct: number
    wrong: number
    blank: number
    total: number
  }>
  wrong_questions?: Array<{
    question_number: number
    user_answer: string | null
    correct_answer: string | null
    status: string
    subject?: string
  }>
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
  premium_locked?: boolean
  premium_message?: string
  allowed_features?: {
    advanced_analytics: boolean
    critical_questions: boolean
    smart_insights: boolean
  }
}

export type BillingEntitlements = {
  is_pro: boolean
  can_access_advanced_analytics: boolean
  can_access_critical_questions: boolean
  can_access_smart_insights: boolean
  can_generate_advanced_simulations: boolean
  can_compare_simulados_vs_provas: boolean
}

export type BillingStatusResponse = {
  user: {
    id: number
    name: string
    email: string
    plan: "free" | "pro"
    subscription_status: string
    current_period_end: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  usage: {
    scope: "user"
    plan: "free" | "pro"
    usage_date: string
    simulations_generated_today: number
    daily_limit: number | null
    remaining_today: number | null
    can_generate: boolean
  }
  entitlements: BillingEntitlements
}

export type HookStatusResponse = {
  user: BillingStatusResponse["user"]
  streak: {
    current_streak: number
    best_streak: number
    last_activity_date: string | null
    at_risk: boolean
  }
  daily_goal: {
    goal_date: string
    target_questions: number
    target_simulations: number
    target_exams: number
    target_minutes: number
    progress_questions: number
    progress_simulations: number
    progress_exams: number
    progress_minutes: number
    progress_review_completed: number
  }
  entitlements: BillingEntitlements
}

export type HookNextActionResponse = {
  title: string
  description: string
  cta_label: string
  cta_href: string
  action_key: string
}

export type HookDailyGoalsResponse = {
  goal_date: string
  targets: {
    questions: number
    simulations: number
    exams: number
    minutes: number
  }
  progress: {
    questions: number
    simulations: number
    exams: number
    minutes: number
    review_completed: boolean
  }
  completion_ratio: number
}

export type HookWeeklySummaryResponse = {
  premium_locked: boolean
  summary: {
    total_questions: number
    simulations_completed: number
    exams_completed: number
    average_accuracy: number
    best_subject?: string | null
    worst_subject?: string | null
    average_time_minutes?: number
    week_streak: number
    recommendation: string
  }
  premium_message?: string
}

export type HookCriticalQuestionsResponse = {
  premium_locked: boolean
  premium_message?: string
  source_simulation_id: number | null
  most_wrong: SimulationV2QuestionAnalytics[]
  slowest: SimulationV2QuestionAnalytics[]
  hard: SimulationV2QuestionAnalytics[]
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
  token?: string,
) {
  return apiFetch<ExamSubmissionResponse>(
    `/exams/${encodeURIComponent(examType)}/${year}/submit`,
    {
      method: "POST",
      body: JSON.stringify({ answers }),
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

export async function getBillingStatus(token: string) {
  return apiFetch<BillingStatusResponse>("/billing/status", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getHookStatus(token: string) {
  return apiFetch<HookStatusResponse>("/v2/hook/status", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getHookNextAction(token: string) {
  return apiFetch<HookNextActionResponse>("/v2/hook/next-action", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getHookDailyGoals(token: string) {
  return apiFetch<HookDailyGoalsResponse>("/v2/hook/daily-goals", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getHookWeeklySummary(token: string) {
  return apiFetch<HookWeeklySummaryResponse>("/v2/hook/weekly-summary", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getHookCriticalQuestions(token: string) {
  return apiFetch<HookCriticalQuestionsResponse>("/v2/hook/critical-questions", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function completeHookMiniAction(token: string) {
  return apiFetch<{ message: string }>("/v2/hook/mini-action/complete", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
}

export type ExamV2ListItem = {
  id: number
  source: string
  year: number
  title: string
  total_questions: number
  has_answer_key: number
  official_page_url: string | null
}

export type ExamV2Structure = {
  id: number
  source: string
  year: number
  title: string
  total_questions: number
  days: Array<{
    id: number
    label: string
    day_order: number
    booklets: Array<{
      id: number
      color: string
      pdf_url: string | null
      answer_key_url: string | null
      official_page_url: string | null
    }>
  }>
  official_page_url: string | null
}

export async function listExamsV2(source?: string) {
  const suffix = source ? `?source=${encodeURIComponent(source)}` : ""
  return apiFetch<{ items: ExamV2ListItem[] }>(`/v2/exams${suffix}`)
}

export async function getExamV2Structure(examId: number) {
  return apiFetch<ExamV2Structure>(`/v2/exams/${examId}/structure`)
}

export async function submitExamV2Answers(examId: number, answers: Array<string | null>) {
  return apiFetch<ExamSubmissionResponse>(`/v2/exams/${examId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  })
}

export async function submitExamV2AnswersTimed(
  examId: number,
  answers: Array<string | null>,
  timeSpentSeconds: number,
  token?: string | null,
) {
  return apiFetch<ExamSubmissionResponse>(`/v2/exams/${examId}/submit`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: JSON.stringify({ answers, time_spent_seconds: timeSpentSeconds }),
  })
}

export type ExamAnalyticsOverviewResponse = {
  premium_locked: boolean
  premium_message?: string
  attempts_count: number
  average_score: number
  average_accuracy?: number
  average_error_rate?: number
  average_time_spent_seconds?: number
  best_exam?: { exam_id: number; score_percentage: number } | null
  worst_exam?: { exam_id: number; score_percentage: number } | null
  comparison?: {
    exam_average_score: number
    simulation_average_score: number
  }
}

export async function getExamAnalyticsOverview(token: string) {
  return apiFetch<ExamAnalyticsOverviewResponse>("/v2/exams/analytics/overview", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export type AdvancedNextActionResponse = {
  type: string
  priority: number
  title: string
  description: string
  cta_label: string
  cta_href: string
  reason: string
}

export type GuidedReviewResponse = {
  premium_locked: boolean
  premium_message?: string | null
  exam_reviews: Array<{
    exam_id: number
    title: string
    score_percentage: number
    wrong_questions: Array<{
      question_number: number
      user_answer: string | null
      correct_answer: string | null
      status: string
      subject?: string
    }>
    subject_breakdown: Array<{
      subject: string
      accuracy: number
      correct: number
      wrong: number
      blank: number
      total: number
    }>
  }>
  critical_questions: Array<{
    question_number: number
    average_time_seconds: number
    correct_rate: number
    difficulty: string
  }>
}

export type DailyMissionsResponse = {
  premium_locked: boolean
  missions: Array<{
    key: string
    title: string
    target: number
    progress: number
    cta_href: string
    completed: boolean
  }>
}

export type SmartWeeklySummaryResponse = {
  premium_locked: boolean
  premium_message?: string
  summary: Record<string, string | number | null>
}

export async function getAdvancedNextAction(token: string) {
  return apiFetch<AdvancedNextActionResponse>("/v2/recommendations/next-action", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getGuidedReview(token: string) {
  return apiFetch<GuidedReviewResponse>("/v2/recommendations/guided-review", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getDailyMissions(token: string) {
  return apiFetch<DailyMissionsResponse>("/v2/recommendations/daily-missions", {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function getSmartWeeklySummary(token: string) {
  return apiFetch<SmartWeeklySummaryResponse>("/v2/recommendations/weekly-summary", {
    headers: { Authorization: `Bearer ${token}` },
  })
}
