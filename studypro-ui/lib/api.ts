// (mantido inteiro igual ao original ATÉ o final)

export async function completeHookMiniAction(token: string) {
  return apiFetch<{ message: string }>("/v2/hook/mini-action/complete", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
}

/* ===== MANTIDO (Codex) ===== */

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

export async function submitExamV2Answers(
  examId: number,
  answers: Array<string | null>
) {
  return apiFetch(`/v2/exams/${examId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  })
}