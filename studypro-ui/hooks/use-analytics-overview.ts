"use client"

import { useEffect, useState } from "react"
import { AUTH_TOKEN_KEY } from "@/lib/api"

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

        const response = await fetch(`${API_URL}/analytics/overview`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error(await parseApiError(response))
        }

        const result = (await response.json()) as AnalyticsOverviewResponse

        if (mounted) {
          setData(result)
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

    fetchAnalytics()

    return () => {
      mounted = false
    }
  }, [])

  return { data, loading, error }
}