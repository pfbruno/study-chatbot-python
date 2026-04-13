"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, BarChart3, Clock3, Filter, Flame, Lightbulb, Loader2, RefreshCw, Target } from "lucide-react"

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
import { getCombinedSubjectProgress, getRecentAttemptsByModule, type StoredAttempt } from "@/lib/activity"

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
      if (refresh) setIsRefreshing(true)
      else setIsLoading(true)
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
        const [hookStatusData, nextActionData, dailyGoalsData, weeklySummaryData, criticalDataValue] = await Promise.all([
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
        setHookStatus(null)
        setNextAction(null)
        setDailyGoals(null)
        setWeeklySummary(null)
        setCriticalData(null)
      }

      setStats(statsResponse)
      setHistory(Array.isArray(historyResponse) ? historyResponse : [])
      setSimulations(simulationsResponse.items || [])

      if (simulationsResponse.items?.length) {
        const exists = simulationsResponse.items.some((item) => item.id === selectedSimulationId)
        setSelectedSimulationId(exists && selectedSimulationId ? selectedSimulationId : simulationsResponse.items[0].id)
      } else {
        setSelectedSimulationId(null)
        setAnalytics(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o dashboard.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void loadBaseData()
    setRecentSimulados(getRecentAttemptsByModule("simulados", 4))
    setRecentProvas(getRecentAttemptsByModule("provas", 4))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject])

  useEffect(() => {
    async function loadAnalytics() {
      if (!selectedSimulationId) {
        setAnalytics(null)
        return
      }
      try {
        const data = await getSimulationAnalyticsV2(selectedSimulationId, {
          periodDays,
          subject: selectedSubject !== "all" ? selectedSubject : undefined,
        })
        setAnalytics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao carregar analytics.")
      }
    }

    void loadAnalytics()
  }, [selectedSimulationId, periodDays, selectedSubject])

  const uniqueSubjects = useMemo(() => {
    const values = simulations.map((item) => item.subject).filter((subject): subject is string => Boolean(subject))
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
  }, [simulations])

  const topDifficulty = useMemo(() => {
    if (!analytics?.questions.length) return "N/A"
    const counts = analytics.questions.reduce(
      (acc, question) => {
        acc[question.difficulty] += 1
        return acc
      },
      { easy: 0, medium: 0, hard: 0 },
    )
    const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return ordered[0][0]
  }, [analytics])

 const criticalQuestions = useMemo(() => {
  if (!entitlements?.can_access_critical_questions) return []
  if (!analytics?.questions?.length) return []

  const slowest = [...analytics.questions]
    .sort((a, b) => b.average_time_seconds - a.average_time_seconds)
    .slice(0, 3)
    .map((question) => ({
      label: `Questão ${question.question_number} mais demorada`,
      detail: `${formatSeconds(question.average_time_seconds)} em média`,
    }))

  const hardest = analytics.questions
    .filter((question) => question.difficulty === "hard")
    .slice(0, 3)
    .map((question) => ({
      label: `Questão ${question.question_number} hard`,
      detail: `taxa de acerto ${formatPercent(question.correct_rate)}`,
    }))

  const mostWrong = [...analytics.questions]
    .sort((a, b) => a.correct_rate - b.correct_rate)
    .slice(0, 3)
    .map((question) => ({
      label: `Questão ${question.question_number} mais errada`,
      detail: `${formatPercent(question.correct_rate)} de acerto`,
    }))

  return [...mostWrong, ...slowest, ...hardest].slice(0, 6)
}, [analytics, entitlements?.can_access_critical_questions])

  const recentPerformance = useMemo(() => {
    return history.slice(-5).reverse().map((item) => ({
      id: item.id,
      title: item.question,
      category: item.category,
      createdAt: new Date(item.created_at).toLocaleDateString("pt-BR"),
    }))
  }, [history])

  const combinedProgress = useMemo(() => getCombinedSubjectProgress(), [recentProvas, recentSimulados])

  const comparison = useMemo(() => {
    const avg = (items: StoredAttempt[]) => {
      if (!items.length) return 0
      return items.reduce((acc, item) => acc + item.scorePercentage, 0) / items.length
    }

    const simAvg = avg(recentSimulados)
    const examAvg = avg(recentProvas)
    return {
      simAvg,
      examAvg,
      message:
        examAvg && simAvg
          ? examAvg < simAvg
            ? "Você erra mais em provas do que em simulados."
            : "Seu desempenho em provas acompanha ou supera os simulados."
          : "Resolva provas e simulados para liberar comparação completa.",
    }
  }, [recentProvas, recentSimulados])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
  <div className="mb-2 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
    Plano {entitlements?.is_pro ? "PRO" : "FREE"}
  </div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard inteligente</h1>
          <p className="text-sm text-white/60">Analytics V2 em tempo real com visão unificada de simulados e provas.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadBaseData(true)}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
        >
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </button>
      </div>

{nextAction ? (
  <Card className="border-primary/40 bg-gradient-to-r from-primary/20 to-emerald-500/10">
    <CardHeader>
      <CardTitle className="text-xl text-white">Seu próximo passo</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-lg font-semibold text-white">{nextAction.title}</p>
        <p className="text-sm text-white/70">{nextAction.description}</p>
      </div>
      <Link
        href={nextAction.cta_href}
        className="inline-flex rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black"
      >
        {nextAction.cta_label}
      </Link>
    </CardContent>
  </Card>
) : null}

<div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
  <Card className="border-white/10 bg-white/5">
    <CardHeader>
      <CardTitle className="text-base text-white">Streak de estudo</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm text-white/80">
      <p>Streak atual: <strong>{hookStatus?.streak.current_streak ?? 0}</strong> dias</p>
      <p>Melhor streak: <strong>{hookStatus?.streak.best_streak ?? 0}</strong> dias</p>
      <p className={hookStatus?.streak.at_risk ? "text-amber-300" : "text-emerald-300"}>
        {hookStatus?.streak.at_risk ? "Sua streak está em risco hoje." : "Sua streak está protegida hoje."}
      </p>
    </CardContent>
  </Card>

  <Card className="border-white/10 bg-white/5">
    <CardHeader>
      <CardTitle className="text-base text-white">Metas diárias</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm text-white/80">
      <p>Questões: {dailyGoals?.progress.questions ?? 0}/{dailyGoals?.targets.questions ?? 0}</p>
      <p>Simulados: {dailyGoals?.progress.simulations ?? 0}/{dailyGoals?.targets.simulations ?? 0}</p>
      <p>Minutos: {dailyGoals?.progress.minutes ?? 0}/{dailyGoals?.targets.minutes ?? 0}</p>
      <p>Revisão concluída: {dailyGoals?.progress.review_completed ? "Sim" : "Não"}</p>
      <Progress value={(dailyGoals?.completion_ratio ?? 0) * 100} className="h-2" />
    </CardContent>
  </Card>
</div>
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Filter className="h-4 w-4 text-primary" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white">
            <option value="all">Todas as disciplinas</option>
            {uniqueSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          <select
            value={selectedSimulationId ?? ""}
            onChange={(event) => setSelectedSimulationId(Number(event.target.value))}
            className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white"
          >
            {simulations.length === 0 ? (
              <option value="">Sem simulados V2</option>
            ) : (
              simulations.map((simulation) => (
                <option key={simulation.id} value={simulation.id}>
                  {simulation.title} ({simulation.year})
                </option>
              ))
            )}
          </select>

          <select value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))} className="rounded-lg border border-white/10 bg-[#0f172a] px-3 py-2 text-sm text-white">
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </CardContent>
      </Card>

      {error ? <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AnalyticsCard title="Taxa de acerto" value={analytics ? formatPercent(analytics.accuracy_rate) : "-"} subtitle="card principal" />
        <AnalyticsCard title="Taxa de erro" value={analytics ? formatPercent(analytics.error_rate) : "-"} />
        <AnalyticsCard title="Tempo médio" value={analytics ? formatSeconds(analytics.average_time_seconds) : "-"} subtitle="por questão" />
        <AnalyticsCard title="Alternativa mais marcada" value={analytics?.most_marked_option?.option ?? "N/A"} subtitle={analytics?.most_marked_option ? `${analytics.most_marked_option.count} marcações` : undefined} />
        <AnalyticsCard title="Dificuldade" value={topDifficulty} subtitle="predominante" />
      </div>

{!entitlements?.can_access_advanced_analytics ? (
  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
    Disponível no Pro: desbloqueie analytics avançado, insights premium e questões críticas completas.
    <Link href="/pricing" className="ml-2 font-semibold text-amber-200 underline">
      Fazer upgrade
    </Link>
  </div>
) : null}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-base text-white">Gráfico central de desempenho</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics ? <PerformanceChart accuracyRate={analytics.accuracy_rate} errorRate={analytics.error_rate} /> : <p className="text-sm text-white/60">Sem dados para o gráfico.</p>}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Lightbulb className="h-4 w-4 text-primary" /> Insights inteligentes
            </CardTitle>
          </CardHeader>
<CardContent className="space-y-3 text-sm text-white/70">
  {entitlements?.can_access_smart_insights ? (
    <InsightsPanel analytics={analytics} />
  ) : (
    <p className="rounded-xl border border-white/10 bg-black/20 p-3">
      Desbloqueie insights inteligentes no Pro.
    </p>
  )}
</CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-base text-white">Simulados recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSimulados.length === 0 ? (
              <p className="text-sm text-white/60">Sem tentativas de simulados salvas.</p>
            ) : (
              recentSimulados.map((item) => (
                <AttemptRow key={item.id} title={item.title} score={item.scorePercentage} detail={`${item.correctAnswers}/${item.totalQuestions} acertos`} />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-base text-white">Provas recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProvas.length === 0 ? (
              <p className="text-sm text-white/60">Sem tentativas de provas salvas.</p>
            ) : (
              recentProvas.map((item) => (
                <AttemptRow key={item.id} title={item.title} score={item.scorePercentage} detail={`${item.correctAnswers}/${item.totalQuestions} acertos`} />
              ))
            )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
  <Card className="border-white/10 bg-white/5">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base text-white">
        <AlertTriangle className="h-4 w-4 text-red-300" /> Questões críticas
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm text-white/80">
      {!entitlements?.can_access_critical_questions ? (
        <p className="text-white/60">Veja suas questões críticas completas com o Pro.</p>
      ) : (criticalData?.most_wrong?.length ?? 0) > 0 ? (
        criticalData?.most_wrong.map((item) => (
          <div key={`mw-${item.question_number}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="font-medium">Mais errada · Questão {item.question_number}</p>
            <p className="text-white/60">Acerto: {formatPercent(item.correct_rate)}</p>
          </div>
        ))
      ) : criticalQuestions.length === 0 ? (
        <p className="text-white/60">Sem dados suficientes para identificar questões críticas.</p>
      ) : (
        criticalQuestions.map((item) => (
          <div key={`${item.label}-${item.detail}`} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="font-medium">{item.label}</p>
            <p className="text-white/60">{item.detail}</p>
          </div>
        ))
      )}
    </CardContent>
  </Card>

  <Card className="border-white/10 bg-white/5">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-base text-white">
        <BarChart3 className="h-4 w-4 text-primary" /> Comparativo e progresso
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 text-sm text-white/80">
      <p>Simulados: {comparison.simAvg.toFixed(1)}% · Provas: {comparison.examAvg.toFixed(1)}%</p>
      <div className="grid gap-3">
        {combinedProgress.length === 0 ? (
          <p className="text-white/60">Sem progresso por disciplina ainda.</p>
        ) : (
          combinedProgress.slice(0, 5).map((item) => (
            <div key={item.subject}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{item.subject}</span>
                <span>{item.averageScore}%</span>
              </div>
              <Progress value={item.averageScore} className="h-2" />
            </div>
          ))
        )}
      </div>
    </CardContent>
</Card>
</div>

<Card className="border-white/10 bg-white/5">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-base text-white">
      <Clock3 className="h-4 w-4 text-primary" /> Desempenho recente
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    {recentPerformance.length === 0 ? (
      <p className="text-sm text-white/60">Sem dados recentes.</p>
    ) : (
      recentPerformance.map((item) => (
        <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-sm font-medium text-white">{item.title}</p>
          <p className="mt-1 text-xs text-white/60">
            {item.category} · {item.createdAt}
          </p>
        </div>
      ))
    )}
  </CardContent>
</Card>
      
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-white">
              <Flame className="h-4 w-4 text-orange-300" /> Contexto geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/70">
            <p>Total de perguntas analisadas: {stats?.total_questions ?? 0}</p>
            <p>Categoria mais frequente: {stats?.most_frequent_category ?? "N/A"}</p>
            <p>Simulados v2 carregados: {simulations.length}</p>
            <p>Tentativas consideradas no período: {analytics?.attempts_count ?? 0}</p>
            <p className="pt-2 text-xs text-white/50">Módulos: <Link href="/dashboard/simulados" className="text-primary">Simulados</Link> · <Link href="/dashboard/provas" className="text-primary">Provas</Link></p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-base text-white">Insights prioritários</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <InsightText text={comparison.message} />
          <InsightText text={combinedProgress[0] ? `Disciplina ${combinedProgress[combinedProgress.length - 1]?.subject ?? "N/A"} precisa de revisão urgente.` : "Sem disciplina crítica detectada ainda."} />
          <InsightText text={analytics?.slowest_question ? "Seu tempo em questões difíceis está alto." : "Resolva mais simulados para detectar gargalos de tempo."} />
        </CardContent>
      </Card>
<Card className="border-white/10 bg-white/5">
  <CardHeader>
    <CardTitle className="text-base text-white">Resumo semanal</CardTitle>
  </CardHeader>
  <CardContent className="grid gap-2 text-sm text-white/80 md:grid-cols-2">
    <p>Questões respondidas: {weeklySummary?.summary.total_questions ?? 0}</p>
    <p>Simulados: {weeklySummary?.summary.simulations_completed ?? 0}</p>
    <p>Provas: {weeklySummary?.summary.exams_completed ?? 0}</p>
    <p>Taxa média: {weeklySummary?.summary.average_accuracy ?? 0}%</p>
    <p>Melhor disciplina: {weeklySummary?.summary.best_subject ?? "—"}</p>
    <p>Pior disciplina: {weeklySummary?.summary.worst_subject ?? "—"}</p>
    <p>Tempo médio: {weeklySummary?.summary.average_time_minutes ?? 0} min</p>
    <p>Streak da semana: {weeklySummary?.summary.week_streak ?? 0}</p>
    <p className="md:col-span-2">
      Recomendação: {weeklySummary?.summary.recommendation ?? "Complete atividades para gerar recomendações."}
    </p>
    {weeklySummary?.premium_locked ? (
      <p className="md:col-span-2 text-amber-300">
        {weeklySummary.premium_message}{" "}
        <Link href="/pricing" className="underline">
          Desbloquear Pro
        </Link>
      </p>
    ) : null}
  </CardContent>
</Card>
    </div>
  )
}

function AttemptRow({ title, score, detail }: { title: string; score: number; detail: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-xs text-white/60">{detail}</p>
      <p className="mt-1 text-xs text-primary">{score.toFixed(1)}%</p>
    </div>
  )
}

function InsightText({ text }: { text: string }) {
  return <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">{text}</p>
}
