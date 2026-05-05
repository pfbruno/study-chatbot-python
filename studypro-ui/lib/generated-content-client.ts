"use client"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

export type PersistedGeneratedContentType = "review_summary" | "flashcards"

export type PersistedGeneratedContentItem<TPayload = unknown> = {
  id: number
  user_id: number
  content_type: PersistedGeneratedContentType
  title: string
  description: string | null
  source_type: string | null
  source_key: string | null
  payload: TPayload
  created_at: string
  updated_at: string
}

type SaveGeneratedContentPayload = {
  content_type: PersistedGeneratedContentType
  title: string
  description?: string | null
  source_type?: string | null
  source_key?: string | null
  payload: unknown
}

function getStoredToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("MinhAprovação_auth_token")
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data?.detail === "string") {
      return data.detail
    }

    if (typeof data?.message === "string") {
      return data.message
    }

    return "Erro na requisiÃ§Ã£o."
  } catch {
    return "Erro na requisiÃ§Ã£o."
  }
}

async function request<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST"
    token?: string | null
    body?: unknown
  } = {}
): Promise<T> {
  const { method = "GET", token, body } = options
  const resolvedToken =
    typeof token === "undefined" ? getStoredToken() : token ?? null

  if (!resolvedToken) {
    throw new Error("SessÃ£o nÃ£o encontrada.")
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolvedToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  return response.json() as Promise<T>
}

export async function saveGeneratedContent<TPayload = unknown>(
  payload: SaveGeneratedContentPayload,
  token?: string | null
) {
  return request<{
    message: string
    item: PersistedGeneratedContentItem<TPayload>
  }>("/generated-content", {
    method: "POST",
    token,
    body: payload,
  })
}

export async function listGeneratedContent<TPayload = unknown>(
  contentType?: PersistedGeneratedContentType,
  token?: string | null
) {
  const query = contentType ? `?content_type=${contentType}&limit=20` : "?limit=20"

  return request<{
    items: PersistedGeneratedContentItem<TPayload>[]
  }>(`/generated-content${query}`, {
    token,
  })
}

export async function getLatestGeneratedContent<TPayload = unknown>(
  contentType: PersistedGeneratedContentType,
  token?: string | null
) {
  return request<{
    item: PersistedGeneratedContentItem<TPayload>
  }>(`/generated-content/latest?content_type=${contentType}`, {
    token,
  })
}
