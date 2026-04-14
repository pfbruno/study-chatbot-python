export type ExamProgressStatus = "not_started" | "in_progress" | "completed"

export type StoredExamProgress = {
  examId: number
  status: ExamProgressStatus
  updatedAt: string
  answeredCount: number
  totalQuestions: number
  scorePercentage?: number
}

const KEY = "studypro_exam_progress"

function readAll(): StoredExamProgress[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as StoredExamProgress[]
  } catch {
    return []
  }
}

function writeAll(items: StoredExamProgress[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function getExamProgress(examId: number): StoredExamProgress | null {
  return readAll().find((item) => item.examId === examId) || null
}

export function upsertExamProgress(progress: StoredExamProgress) {
  const items = readAll().filter((item) => item.examId !== progress.examId)
  items.unshift(progress)
  writeAll(items.slice(0, 100))
}

export function markExamInProgress(examId: number, answeredCount: number, totalQuestions: number) {
  upsertExamProgress({
    examId,
    status: answeredCount > 0 ? "in_progress" : "not_started",
    updatedAt: new Date().toISOString(),
    answeredCount,
    totalQuestions,
  })
}

export function markExamCompleted(examId: number, answeredCount: number, totalQuestions: number, scorePercentage: number) {
  upsertExamProgress({
    examId,
    status: "completed",
    updatedAt: new Date().toISOString(),
    answeredCount,
    totalQuestions,
    scorePercentage,
  })
}
