import { AUTH_TOKEN_KEY, type AuthUser } from "@/lib/api"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

type HttpMethod = "GET" | "POST"

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  token?: string | null
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data?.detail === "string") return data.detail
    if (typeof data?.message === "string") return data.message

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: unknown) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: string }).msg)
          }
          return "Erro de validação."
        })
        .join(" | ")
    }

    return "Erro na requisição."
  } catch {
    return "Erro na requisição."
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, token } = options
  const resolvedToken =
    typeof token === "undefined" ? getStoredToken() : token ?? null

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(await parseApiError(response))
  }

  return response.json() as Promise<T>
}

export type ChatUsage = {
  scope: "user" | "guest"
  plan: "free" | "pro" | "guest"
  usage_date: string
  questions_asked_today: number
  daily_limit: number | null
  remaining_today: number | null
  can_ask: boolean
}

export type ChatEntitlementResponse = {
  authenticated: boolean
  user: AuthUser | null
  usage: ChatUsage
}

export type ChatAction =
  | {
      type: "generate_simulation"
      payload: {
        exam_type: string
        year: number
        question_count: number
        subjects: string[] | null
        mode: "balanced" | "random"
        seed: number | null
      }
    }
  | null

export type ChatMessageResponse = {
  kind: "assistant" | "action"
  content: string
  category?: string
  explanation?: string
  summary?: string
  study_tip?: string
  formatted_response?: string
  action: ChatAction
  access: {
    authenticated: boolean
    user: AuthUser | null
    usage: ChatUsage
  }
}

export async function getChatEntitlement(token?: string | null) {
  return request<ChatEntitlementResponse>("/chat/entitlement", { token })
}

export async function sendChatMessage(
  question: string,
  token?: string | null
) {
  return request<ChatMessageResponse>("/chat/message", {
    method: "POST",
    token,
    body: { question },
  })
}