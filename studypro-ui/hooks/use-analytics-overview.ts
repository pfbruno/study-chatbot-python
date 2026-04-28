"use client"

import { useEffect, useState } from "react"
import { AUTH_TOKEN_KEY } from "@/lib/api"
import {
  ANALYTICS_REFRESH_EVENT,
} from "@/lib/activity-events"
import {
  fetchGamificationSummary,
  GAMIFICATION_REFRESH_EVENT,
  type PersistedGamificationSummaryResponse,
} from "@/lib/gamification-client"

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

export type AnalyticsOverviewResponse = {
  user: {
    id: number
    name: string
    email: string
    plan: "free" | "pro"
    subscription_status?: string
    current_period_end?: string | null
    is_active: boolean
    created_at: string
    updated_at: string
  }
  overallStats: {
    totalQuestions: number
    totalSessions: number
    totalCorrect?: number
    totalWrong?: number
    avgAccuracy: number
    platformAvg: number
    avgTimePerQuestion: string
    avgTimePerSession: string
    streak: number
    bestSubject: string
    worstSubject: string
    improvement: number
    attemptsCount: number
  }
  evolutionData: Array<{
    month: string
    acerto: number
    media: number
  }>
  subjectAccuracy: Array<{
    subject: string
    acerto: number
    media: number
    questions: number
    correct: number
    wrong: number
    blank: number
  }>
  weeklyStudyData: Array<{
    day: string
    tempo: number
    questoes: number
  }>
  hardestQuestions: Array<{
    id: string
    subject: string
    topic: string
    accuracy: number
    avgTime: string
  }>
  simuladoHistory: Array<{
    id: string
    type: "prova" | "simulado"
    name: string
    score: number
    avg: number
    date: string
    questions: number
    created_at?: string
  }>
  gamification: PersistedGamificationSummaryResponse
}

const EMPTY_GAMIFICATION: PersistedGamificationSummaryResponse = {
  profile: {
    userName: "Usuário",
    level: 1,
    currentXP: 0,
    nextLevelXP: 800,
    totalXP: 0,
    streakDays: 0,
    completedChallenges: 0,
    unlockedAchievements: 0,
    totalAchievements: 0,
  },
  achievements: [],
  recentUnlocks: [],
  weeklyEvolution: [],
  challenges: [],
}

function getStoredToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
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

    return "Erro ao carregar analytics."
  } catch {
    const text = await response.text().catch(() => "")
    return text || "Erro ao carregar analytics."
  }
}

export function useAnalyticsOverview() {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchAnalytics() {
      const token = getStoredToken()

      if (!token) {
        if (mounted) {
          setData(null)
          setLoading(false)
          setError("Você precisa estar logado para acessar o analytics.")
        }
        return
      }

      try {
        setLoading(true)
        setError(null)

        const analyticsResponse = await fetch(`${API_URL}/analytics/overview`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })

        if (!analyticsResponse.ok) {
          throw new Error(await parseApiError(analyticsResponse))
        }

        const analyticsResult = await analyticsResponse.json()

        let gamification = EMPTY_GAMIFICATION
        try {
          gamification = await fetchGamificationSummary(token)
        } catch {
          gamification = EMPTY_GAMIFICATION
        }

        if (mounted) {
          setData({
            ...analyticsResult,
            gamification,
          } as AnalyticsOverviewResponse)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Erro inesperado ao carregar analytics."
          )
          setData(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    const handleRefresh = () => {
      void fetchAnalytics()
    }

    void fetchAnalytics()

    window.addEventListener(
      ANALYTICS_REFRESH_EVENT,
      handleRefresh as EventListener
    )
    window.addEventListener(
      GAMIFICATION_REFRESH_EVENT,
      handleRefresh as EventListener
    )

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchAnalytics()
      }
    }, 12000)

    return () => {
      mounted = false
      window.removeEventListener(
        ANALYTICS_REFRESH_EVENT,
        handleRefresh as EventListener
      )
      window.removeEventListener(
        GAMIFICATION_REFRESH_EVENT,
        handleRefresh as EventListener
      )
      window.clearInterval(intervalId)
    }
  }, [])

  return { data, loading, error }
}