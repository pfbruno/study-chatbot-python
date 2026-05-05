"use client"

export type SimulationMode = "balanced" | "random"

export type SimulationHistoryEntry = {
  id: string
  saved_at: string
  title: string
  exam_type: string
  year: number
  mode: SimulationMode
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
}

export type MinhAprovaçãogressSnapshot = {
  totalAnsweredQuestions: number
  totalCompletedSimulations: number
  totalCorrectAnswers: number
  completedAttemptIds: string[]
  updatedAt: string | null
}

export const SIMULATION_HISTORY_KEY = "studypro_simulation_history"
export const STUDY_PROGRESS_KEY = "studypro_study_progress"
export const STUDY_PROGRESS_UPDATED_EVENT = "MinhAprovação:progress-updated"
export const SIMULATION_HISTORY_UPDATED_EVENT = "MinhAprovação:simulation-history-updated"

const MAX_HISTORY_ITEMS = 60
const MAX_TRACKED_ATTEMPTS = 400

const EMPTY_PROGRESS: MinhAprovaçãogressSnapshot = {
  totalAnsweredQuestions: 0,
  totalCompletedSimulations: 0,
  totalCorrectAnswers: 0,
  completedAttemptIds: [],
  updatedAt: null,
}

function isBrowser() {
  return typeof window !== "undefined"
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback

  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function dispatch(name: string) {
  if (!isBrowser()) return
  window.dispatchEvent(new CustomEvent(name))
}

export function readSimulationHistory(): SimulationHistoryEntry[] {
  const parsed = readJson<SimulationHistoryEntry[]>(SIMULATION_HISTORY_KEY, [])
  return Array.isArray(parsed) ? parsed : []
}

export function appendSimulationHistory(entry: SimulationHistoryEntry) {
  const current = readSimulationHistory().filter((item) => item.id !== entry.id)
  const next = [entry, ...current]
    .sort(
      (a, b) =>
        new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
    )
    .slice(0, MAX_HISTORY_ITEMS)

  writeJson(SIMULATION_HISTORY_KEY, next)
  dispatch(SIMULATION_HISTORY_UPDATED_EVENT)
  return next
}

export function getMinhAprovaçãogress(): MinhAprovaçãogressSnapshot {
  const parsed = readJson<MinhAprovaçãogressSnapshot>(STUDY_PROGRESS_KEY, EMPTY_PROGRESS)

  if (!parsed || typeof parsed !== "object") {
    return { ...EMPTY_PROGRESS }
  }

  return {
    totalAnsweredQuestions: Number(parsed.totalAnsweredQuestions ?? 0),
    totalCompletedSimulations: Number(parsed.totalCompletedSimulations ?? 0),
    totalCorrectAnswers: Number(parsed.totalCorrectAnswers ?? 0),
    completedAttemptIds: Array.isArray(parsed.completedAttemptIds)
      ? parsed.completedAttemptIds
      : [],
    updatedAt: parsed.updatedAt ?? null,
  }
}

export function recordCompletedSimulationAttempt(payload: {
  attemptId: string
  answeredQuestions: number
  correctAnswers: number
  completedAt?: string
}) {
  const current = getMinhAprovaçãogress()

  if (current.completedAttemptIds.includes(payload.attemptId)) {
    return {
      didCount: false,
      progress: current,
    }
  }

  const next: MinhAprovaçãogressSnapshot = {
    totalAnsweredQuestions:
      current.totalAnsweredQuestions + Math.max(0, payload.answeredQuestions),
    totalCompletedSimulations: current.totalCompletedSimulations + 1,
    totalCorrectAnswers:
      current.totalCorrectAnswers + Math.max(0, payload.correctAnswers),
    completedAttemptIds: [...current.completedAttemptIds, payload.attemptId].slice(
      -MAX_TRACKED_ATTEMPTS
    ),
    updatedAt: payload.completedAt ?? new Date().toISOString(),
  }

  writeJson(STUDY_PROGRESS_KEY, next)
  dispatch(STUDY_PROGRESS_UPDATED_EVENT)

  return {
    didCount: true,
    progress: next,
  }
}
