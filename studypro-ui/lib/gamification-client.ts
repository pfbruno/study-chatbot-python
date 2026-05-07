"use client"

import type {
  GamificationAchievement,
  GamificationProfile,
  GamificationRecentUnlock,
  GamificationWeeklyEvolutionPoint,
} from "@/lib/api"
import { buildTokenCacheKey, clearTimedCache, readTimedCache, writeTimedCache } from "@/lib/simple-cache"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

export const GAMIFICATION_REFRESH_EVENT = "MinhAprovação:gamification-refresh"

const GAMIFICATION_SUMMARY_CACHE_PREFIX = "studypro_gamification_summary_cache"
const GAMIFICATION_SUMMARY_CACHE_TTL_MS = 15 * 1000

export type PersistedGamificationChallenge = {
  id: string
  title: string
  description: string
  type: "daily" | "weekly" | "special"
  difficulty: "easy" | "medium" | "hard"
  status: "active" | "ready_to_claim" | "claimed" | "completed" | "locked"
  progress: number
  target: number
  xpReward: number
  rewardLabel: string
  expiresIn: string
  icon: "target" | "brain" | "flame" | "rocket" | "award" | "trophy"
  isTracked?: boolean
}

export type PersistedGamificationSummaryResponse = {
  profile: GamificationProfile
  achievements: GamificationAchievement[]
  recentUnlocks: GamificationRecentUnlock[]
  weeklyEvolution: GamificationWeeklyEvolutionPoint[]
  challenges: PersistedGamificationChallenge[]
}

export type GamificationChallengeMutationResponse = {
  message: string
  challenge?: PersistedGamificationChallenge
  summary?: PersistedGamificationSummaryResponse
}

function getStoredToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("studypro_auth_token")
}

async function parseApiError(response: Response) {
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
  options: {
    method?: "GET" | "POST"
    token?: string | null
    body?: unknown
  } = {}
): Promise<T> {
  const { method = "GET", token, body } = options
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

export async function fetchGamificationSummary(token?: string | null) {
  const resolvedToken =
    typeof token === "undefined" ? getStoredToken() : token ?? null

  const cacheKey = buildTokenCacheKey(
    GAMIFICATION_SUMMARY_CACHE_PREFIX,
    resolvedToken
  )

  const cached = readTimedCache<PersistedGamificationSummaryResponse>(
    cacheKey,
    GAMIFICATION_SUMMARY_CACHE_TTL_MS
  )

  if (cached) return cached

  const response = await request<PersistedGamificationSummaryResponse>(
    "/gamification/summary",
    {
      token,
    }
  )

  writeTimedCache(cacheKey, response, GAMIFICATION_SUMMARY_CACHE_TTL_MS)

  return response
}

export async function trackPersistedGamificationChallenge(
  challengeId: string,
  token?: string | null
) {
  return request<GamificationChallengeMutationResponse>(
    `/gamification/challenges/${encodeURIComponent(challengeId)}/track`,
    {
      method: "POST",
      token,
      body: {},
    }
  )
}

export async function claimPersistedGamificationChallenge(
  challengeId: string,
  token?: string | null
) {
  return request<GamificationChallengeMutationResponse>(
    `/gamification/challenges/${encodeURIComponent(challengeId)}/claim`,
    {
      method: "POST",
      token,
      body: {},
    }
  )
}

export function dispatchGamificationRefresh() {
  if (typeof window === "undefined") return
  clearTimedCache(GAMIFICATION_SUMMARY_CACHE_PREFIX)
  window.dispatchEvent(new CustomEvent(GAMIFICATION_REFRESH_EVENT))
}
