"use client"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

export const ANALYTICS_REFRESH_EVENT = "MinhAprovação:analytics-refresh"

export type ActivityEventPayload = {
  event_type: string
  module: string
  subject?: string | null
  score_percentage?: number | null
  time_spent_seconds?: number | null
  metadata_json?: Record<string, unknown> | null
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

    return "Erro ao registrar evento."
  } catch {
    return "Erro ao registrar evento."
  }
}

export function dispatchAnalyticsRefresh() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(ANALYTICS_REFRESH_EVENT))
}

export async function trackActivityEvent(
  payload: ActivityEventPayload,
  token?: string | null
) {
  const resolvedToken =
    typeof token === "undefined" ? getStoredToken() : token ?? null

  if (!resolvedToken) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_token",
    }
  }

  const response = await fetch(`${API_URL}/activity/events`, {
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

  dispatchAnalyticsRefresh()
  return response.json()
}
