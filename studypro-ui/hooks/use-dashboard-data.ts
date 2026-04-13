"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  getAdvancedNextAction,
  getBillingStatus,
  getDailyMissions,
  getExamAnalyticsOverview,
  getGuidedReview,
  getHistory,
  getHookCriticalQuestions,
  getHookDailyGoals,
  getHookStatus,
  getSmartWeeklySummary,
  getSimulationAnalyticsV2,
  getSimulationsV2,
  getStats,
  type AdvancedNextActionResponse,
  type BillingEntitlements,
  type DailyMissionsResponse,
  type ExamAnalyticsOverviewResponse,
  type GuidedReviewResponse,
  type HistoryItem,
  type HookCriticalQuestionsResponse,
  type HookDailyGoalsResponse,
  type HookStatusResponse,
  type SmartWeeklySummaryResponse,
  type SimulationV2AnalyticsResponse,
  type SimulationV2ListItem,
  type StatsResponse,
} from "@/lib/api"
import { getCached } from "@/lib/simple-cache"

const EMPTY_ENTITLEMENTS: BillingEntitlements = {
  is_pro: false,
  can_access_advanced_analytics: false,
  can_access_critical_questions: false,
  can_access_smart_insights: false,
  can_generate_advanced_simulations: false,
  can_compare_simulados_vs_provas: false,
}

export function useDashboardData(selectedSubject: string, selectedSimulationId: number | null, periodDays: number) {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [simulations, setSimulations] = useState<SimulationV2ListItem[]>([])
  const [analytics, setAnalytics] = useState<SimulationV2AnalyticsResponse | null>(null)

  const [entitlements, setEntitlements] = useState<BillingEntitlements>(EMPTY_ENTITLEMENTS)
  const [hookStatus, setHookStatus] = useState<HookStatusResponse | null>(null)
  const [nextAction, setNextAction] = useState<AdvancedNextActionResponse | null>(null)
  const [dailyGoals, setDailyGoals] = useState<HookDailyGoalsResponse | null>(null)
  const [weeklySummary, setWeeklySummary] = useState<SmartWeeklySummaryResponse | null>(null)
  const [criticalData, setCriticalData] = useState<HookCriticalQuestionsResponse | null>(null)
  const [examAnalytics, setExamAnalytics] = useState<ExamAnalyticsOverviewResponse | null>(null)
  const [guidedReview, setGuidedReview] = useState<GuidedReviewResponse | null>(null)
  const [dailyMissions, setDailyMissions] = useState<DailyMissionsResponse | null>(null)

  const [topLoading, setTopLoading] = useState(true)
  const [baseLoading, setBaseLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [weeklyLoading, setWeeklyLoading] = useState(true)
  const [criticalLoading, setCriticalLoading] = useState(true)
  const [examAnalyticsLoading, setExamAnalyticsLoading] = useState(true)
  const [guidedReviewLoading, setGuidedReviewLoading] = useState(true)
  const [dailyMissionsLoading, setDailyMissionsLoading] = useState(true)

  const [topError, setTopError] = useState<string | null>(null)
  const [baseError, setBaseError] = useState<string | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [weeklyError, setWeeklyError] = useState<string | null>(null)
  const [criticalError, setCriticalError] = useState<string | null>(null)
  const [examAnalyticsError, setExamAnalyticsError] = useState<string | null>(null)
  const [guidedReviewError, setGuidedReviewError] = useState<string | null>(null)
  const [dailyMissionsError, setDailyMissionsError] = useState<string | null>(null)

  const token = useMemo(
    () => (typeof window === "undefined" ? null : localStorage.getItem("studypro_auth_token")),
    [],
  )

  const loadTop = useCallback(async () => {
    setTopLoading(true)
    setTopError(null)
    if (!token) {
      setEntitlements(EMPTY_ENTITLEMENTS)
      setHookStatus(null)
      setNextAction(null)
      setDailyGoals(null)
      setTopLoading(false)
      return
    }

    try {
      const [billing, hookStatusData, nextActionData, dailyGoalsData] = await Promise.all([
        getCached(`billing:${token}`, 30_000, () => getBillingStatus(token)),
        getCached(`hook:status:${token}`, 30_000, () => getHookStatus(token)),
        getCached(`rec:next:${token}`, 30_000, () => getAdvancedNextAction(token)),
        getCached(`hook:goals:${token}`, 30_000, () => getHookDailyGoals(token)),
      ])
      setEntitlements(billing.entitlements)
      setHookStatus(hookStatusData)
      setNextAction(nextActionData)
      setDailyGoals(dailyGoalsData)
    } catch (err) {
      setTopError(err instanceof Error ? err.message : "Falha ao carregar topo do dashboard.")
    } finally {
      setTopLoading(false)
    }
  }, [token])

  const loadBase = useCallback(async () => {
    setBaseLoading(true)
    setBaseError(null)
    try {
      const [statsResponse, historyResponse, simulationsResponse] = await Promise.all([
        getCached("dashboard:stats", 30_000, () => getStats()),
        getCached("dashboard:history", 30_000, () => getHistory()),
        getCached("dashboard:simulations", 30_000, () => getSimulationsV2()),
      ])
      setStats(statsResponse)
      setHistory(Array.isArray(historyResponse) ? historyResponse : [])
      setSimulations(simulationsResponse.items || [])
    } catch (err) {
      setBaseError(err instanceof Error ? err.message : "Falha ao carregar dados principais.")
    } finally {
      setBaseLoading(false)
    }
  }, [])

  const loadWeekly = useCallback(async () => {
    setWeeklyLoading(true)
    setWeeklyError(null)
    if (!token) {
      setWeeklySummary(null)
      setWeeklyLoading(false)
      return
    }
    try {
      const data = await getCached(`rec:weekly:${token}`, 30_000, () => getSmartWeeklySummary(token))
      setWeeklySummary(data)
    } catch (err) {
      setWeeklyError(err instanceof Error ? err.message : "Falha ao carregar resumo semanal.")
    } finally {
      setWeeklyLoading(false)
    }
  }, [token])

  const loadCritical = useCallback(async () => {
    setCriticalLoading(true)
    setCriticalError(null)
    if (!token) {
      setCriticalData(null)
      setCriticalLoading(false)
      return
    }

    try {
      const data = await getCached(`hook:critical:${token}`, 30_000, () => getHookCriticalQuestions(token))
      setCriticalData(data)
    } catch (err) {
      setCriticalError(err instanceof Error ? err.message : "Falha ao carregar questões críticas.")
    } finally {
      setCriticalLoading(false)
    }
  }, [token])

  const loadExamAnalytics = useCallback(async () => {
    setExamAnalyticsLoading(true)
    setExamAnalyticsError(null)
    if (!token) {
      setExamAnalytics(null)
      setExamAnalyticsLoading(false)
      return
    }
    try {
      const data = await getCached(`exam:analytics:${token}`, 30_000, () => getExamAnalyticsOverview(token))
      setExamAnalytics(data)
    } catch (err) {
      setExamAnalyticsError(err instanceof Error ? err.message : "Falha ao carregar analytics de provas.")
    } finally {
      setExamAnalyticsLoading(false)
    }
  }, [token])

  const loadGuidedReview = useCallback(async () => {
    setGuidedReviewLoading(true)
    setGuidedReviewError(null)
    if (!token) {
      setGuidedReview(null)
      setGuidedReviewLoading(false)
      return
    }
    try {
      const data = await getCached(`rec:guided:${token}`, 30_000, () => getGuidedReview(token))
      setGuidedReview(data)
    } catch (err) {
      setGuidedReviewError(err instanceof Error ? err.message : "Falha ao carregar revisão guiada.")
    } finally {
      setGuidedReviewLoading(false)
    }
  }, [token])

  const loadDailyMissions = useCallback(async () => {
    setDailyMissionsLoading(true)
    setDailyMissionsError(null)
    if (!token) {
      setDailyMissions(null)
      setDailyMissionsLoading(false)
      return
    }
    try {
      const data = await getCached(`rec:missions:${token}`, 30_000, () => getDailyMissions(token))
      setDailyMissions(data)
    } catch (err) {
      setDailyMissionsError(err instanceof Error ? err.message : "Falha ao carregar missões diárias.")
    } finally {
      setDailyMissionsLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadTop()
    void loadBase()
    void loadWeekly()
    void loadCritical()
    void loadExamAnalytics()
    void loadGuidedReview()
    void loadDailyMissions()
  }, [loadBase, loadCritical, loadDailyMissions, loadExamAnalytics, loadGuidedReview, loadTop, loadWeekly])

  const filteredSimulations = useMemo(() => {
    if (selectedSubject === "all") return simulations
    return simulations.filter((item) => item.subject?.toLowerCase() === selectedSubject.toLowerCase())
  }, [selectedSubject, simulations])

  useEffect(() => {
    async function loadAnalytics() {
      if (!selectedSimulationId) {
        setAnalytics(null)
        return
      }
      setAnalyticsLoading(true)
      setAnalyticsError(null)
      try {
        const data = await getSimulationAnalyticsV2(selectedSimulationId, {
          periodDays,
          subject: selectedSubject !== "all" ? selectedSubject : undefined,
        })
        setAnalytics(data)
      } catch (err) {
        setAnalyticsError(err instanceof Error ? err.message : "Falha ao carregar analytics.")
      } finally {
        setAnalyticsLoading(false)
      }
    }
    void loadAnalytics()
  }, [periodDays, selectedSimulationId, selectedSubject])

  return {
    stats,
    history,
    simulations: filteredSimulations,
    analytics,
    entitlements,
    hookStatus,
    nextAction,
    dailyGoals,
    weeklySummary,
    criticalData,
    examAnalytics,
    guidedReview,
    dailyMissions,
    topLoading,
    baseLoading,
    analyticsLoading,
    weeklyLoading,
    criticalLoading,
    examAnalyticsLoading,
    guidedReviewLoading,
    dailyMissionsLoading,
    topError,
    baseError,
    analyticsError,
    weeklyError,
    criticalError,
    examAnalyticsError,
    guidedReviewError,
    dailyMissionsError,
    refreshTop: loadTop,
    refreshBase: loadBase,
  }
}
