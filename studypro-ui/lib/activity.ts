export type StoredAttempt = {
  id: string
  module: "simulados" | "provas"
  title: string
  scorePercentage: number
  correctAnswers: number
  totalQuestions: number
  createdAt: string
  subjects?: Array<{
    subject: string
    accuracyPercentage: number
  }>
}

import { trackAttemptSaved } from "@/lib/study-events"

const STORAGE_KEY = "studypro_recent_attempts"

function readAttempts(): StoredAttempt[] {
  if (typeof window === "undefined") return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredAttempt[]) : []
  } catch {
    return []
  }
}

function writeAttempts(attempts: StoredAttempt[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts))
}

export function saveRecentAttempt(attempt: StoredAttempt) {
  const current = readAttempts().filter((item) => item.id !== attempt.id)
  const next = [attempt, ...current]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 60)

  writeAttempts(next)

  void trackAttemptSaved({
    module: attempt.module,
    title: attempt.title,
    scorePercentage: attempt.scorePercentage,
    correctAnswers: attempt.correctAnswers,
    totalQuestions: attempt.totalQuestions,
    subjects: attempt.subjects,
  })
}

export function getRecentAttemptsByModule(module: StoredAttempt["module"], limit = 4) {
  return readAttempts().filter((item) => item.module === module).slice(0, limit)
}

export function getCombinedSubjectProgress() {
  const accumulator = new Map<string, { total: number; count: number }>()

  for (const attempt of readAttempts()) {
    for (const subject of attempt.subjects ?? []) {
      const current = accumulator.get(subject.subject) ?? { total: 0, count: 0 }
      current.total += subject.accuracyPercentage
      current.count += 1
      accumulator.set(subject.subject, current)
    }
  }

  return Array.from(accumulator.entries())
    .map(([subject, values]) => ({
      subject,
      averageScore: Number((values.total / values.count).toFixed(1)),
      attempts: values.count,
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
}