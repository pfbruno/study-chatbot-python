"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  Clock3,
  Filter,
  Flame,
  Lightbulb,
  Loader2,
  RefreshCw,
} from "lucide-react"

import { AnalyticsCard } from "@/components/dashboard/analytics-card"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

import {
  getBillingStatus,
  getHookCriticalQuestions,
  getHookDailyGoals,
  getHookNextAction,
  getHookStatus,
  getHookWeeklySummary,
  getHistory,
  getSimulationAnalyticsV2,
  getSimulationsV2,
  getStats,
  type BillingEntitlements,
  type HistoryItem,
  type HookCriticalQuestionsResponse,
  type HookDailyGoalsResponse,
  type HookNextActionResponse,
  type HookStatusResponse,
  type HookWeeklySummaryResponse,
  type SimulationV2AnalyticsResponse,
  type SimulationV2ListItem,
  type StatsResponse,
} from "@/lib/api"

import {
  getCombinedSubjectProgress,
  getRecentAttemptsByModule,
  type StoredAttempt,
} from "@/lib/activity"

function formatSeconds(value: number) {
  return `${value.toFixed(1)}s`
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [simulations, setSimulations] = useState<SimulationV2ListItem[]>([])
  const [selectedSimulationId, setSelectedSimulationId] = useState<number | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [periodDays, setPeriodDays] = useState<number>(30)
  const [analytics, setAnalytics] = useState<SimulationV2AnalyticsResponse | null>(null)

  const [recentSimulados, setRecentSimulados] = useState<StoredAttempt[]>([])
  const [recentProvas, setRecentProvas] = useState<StoredAttempt[]>([])

  const [entitlements, setEntitlements] = useState<BillingEntitlements | null>(null)
  const [hookStatus, setHookStatus] = useState<HookStatusResponse | null>(null)
  const [nextAction, setNextAction] = useState<HookNextActionResponse | null>(null)
  const [dailyGoals, setDailyGoals] = useState<HookDailyGoalsResponse | null>(null)
  const [weeklySummary, setWeeklySummary] = useState<HookWeeklySummaryResponse | null>(null)
  const [criticalData, setCriticalData] = useState<HookCriticalQuestionsResponse | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadBaseData(refresh = false) {
    try {
      refresh ? setIsRefreshing(true) : setIsLoading(true)
      setError(null)

      const [statsResponse, historyResponse, simulationsResponse] = await Promise.all([
        getStats(),
        getHistory(),
        getSimulationsV2(selectedSubject !== "all" ? selectedSubject : undefined),
      ])

      const token = localStorage.getItem("studypro_auth_token")

      if (token) {
        const billing = await getBillingStatus(token)
        setEntitlements(billing.entitlements)

        const [
          hookStatusData,
          nextActionData,
          dailyGoalsData,
          weeklySummaryData,
          criticalDataValue,
        ] = await Promise.all([
          getHookStatus(token),
          getHookNextAction(token),
          getHookDailyGoals(token),
          getHookWeeklySummary(token),
          getHookCriticalQuestions(token),
        ])

        setHookStatus(hookStatusData)
        setNextAction(nextActionData)
        setDailyGoals(dailyGoalsData)
        setWeeklySummary(weeklySummaryData)
        setCriticalData(criticalDataValue)
      } else {
        setEntitlements({
          is_pro: false,
          can_access_advanced_analytics: false,
          can_access_critical_questions: false,
          can_access_smart_insights: false,
          can_generate_advanced_simulations: false,
          can_compare_simulados_vs_provas: false,
        })
      }

      setStats(statsResponse)
      setHistory(historyResponse ?? [])
      setSimulations(simulationsResponse.items || [])

      if (simulationsResponse.items?.length) {
        setSelectedSimulationId(simulationsResponse.items[0].id)
      } else {
        setSelectedSimulationId(null)
        setAnalytics(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadBaseData()
    setRecentSimulados(getRecentAttemptsByModule("simulados", 4))
    setRecentProvas(getRecentAttemptsByModule("provas", 4))
  }, [selectedSubject])

  useEffect(() => {
    async function loadAnalytics() {
      if (!selectedSimulationId) return setAnalytics(null)

      const data = await getSimulationAnalyticsV2(selectedSimulationId, {
        periodDays,
        subject: selectedSubject !== "all" ? selectedSubject : undefined,
      })

      setAnalytics(data)
    }

    loadAnalytics()
  }, [selectedSimulationId, periodDays, selectedSubject])

  const comparison = useMemo(() => {
    const avg = (arr: StoredAttempt[]) =>
      arr.length ? arr.reduce((a, b) => a + b.scorePercentage, 0) / arr.length : 0

    const simAvg = avg(recentSimulados)
    const examAvg = avg(recentProvas)

    return {
      simAvg,
      examAvg,
      message:
        examAvg && simAvg
          ? examAvg < simAvg
            ? "Você erra mais em provas."
            : "Desempenho equilibrado."
          : "Faça simulados e provas.",
    }
  }, [recentSimulados, recentProvas])

  if (isLoading) {
    return <Loader2 className="animate-spin" />
  }

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-3xl font-bold">Dashboard inteligente</h1>

      <button onClick={() => loadBaseData(true)}>
        {isRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      </button>

      <AnalyticsCard
        title="Taxa de acerto"
        value={analytics ? formatPercent(analytics.accuracy_rate) : "-"}
      />

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <InsightsPanel analytics={analytics} />
          <p>{comparison.message}</p>
        </CardContent>
      </Card>
    </div>
  )
}