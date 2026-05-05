"use client"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

export type QuestionExplanationSource = {
  title: string
  url: string
  publisher: string
}

export type QuestionExplanationPayload = {
  source: "simulation" | "exam" | "training"
  attempt_id: string
  exam_type: string
  year?: number | null
  question_ref?: string | null
  question_number: number
  subject: string
  statement: string
  options: Record<string, string>
  user_answer?: string | null
  correct_answer?: string | null
  status: "wrong" | "blank"
}

export type QuestionExplanationItem = {
  id: number
  user_id: number
  source: "simulation" | "exam" | "training"
  attempt_id: string
  question_key: string
  question_ref: string | null
  exam_type: string
  year: number | null
  question_number: number
  subject: string
  user_answer: string | null
  correct_answer: string | null
  explanation_text: string
  sources: QuestionExplanationSource[]
  created_at: string
  updated_at: string
}

function getStoredToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("studypro_auth_token")
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data?.detail === "string") return data.detail
    if (typeof data?.message === "string") return data.message

    return "Erro ao gerar explicação."
  } catch {
    return "Erro ao gerar explicação."
  }
}

export async function generateQuestionExplanation(
  payload: QuestionExplanationPayload,
  token?: string | null
) {
  const resolvedToken =
    typeof token === "undefined" ? getStoredToken() : token ?? null

  if (!resolvedToken) {
    throw new Error("Sessão não encontrada. Faça login para gerar explicações.")
  }

  const response = await fetch(`${API_URL}/question-explanations/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolvedToken}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  return response.json() as Promise<{
    message: string
    item: QuestionExplanationItem
  }>
}

export async function listQuestionExplanationsByAttempt(
  attemptId: string,
  token?: string | null
) {
  const resolvedToken =
    typeof token === "undefined" ? getStoredToken() : token ?? null

  if (!resolvedToken) {
    throw new Error("Sessão não encontrada.")
  }

  const response = await fetch(
    `${API_URL}/question-explanations/by-attempt/${encodeURIComponent(
      attemptId
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolvedToken}`,
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  return response.json() as Promise<{
    items: QuestionExplanationItem[]
  }>
}
