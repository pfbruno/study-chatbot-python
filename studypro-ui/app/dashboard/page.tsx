"use client"

import { useEffect, useMemo, useState } from "react"
import { BarChart3, Filter, Lightbulb, Loader2, RefreshCw } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getHistory,
  getSimulationAnalyticsV2,
  getSimulationsV2,
  getStats,
  type HistoryItem,
  type SimulationV2AnalyticsResponse,
  type SimulationV2ListItem,
  type StatsResponse,
} from "@/lib/api"
import { AnalyticsCard } from "@/components/dashboard/analytics-card"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { InsightsPanel } from "@/components/dashboard/insights-panel"

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

  const recentPerformance = useMemo(() => {
    return history.slice(-5).reverse().map((item) => ({
      id: item.id,
      title: item.question,
      category: item.category,
      createdAt: new Date(item.created_at).toLocaleDateString("pt-BR"),
    }))
  }, [history])

  const uniqueSubjects = useMemo(() => {
    const values = simulations
      .map((item) => item.subject)
      .filter((subject): subject is string => Boolean(subject))
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Analytics reais por simulado com filtros por disciplina e período.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadBaseData(true)}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-accent disabled:opacity-60"
        >
          {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </button>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4 text-primary" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <select
            value={selectedSubject}
            onChange={(event) => setSelectedSubject(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
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
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
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

          <select
            value={periodDays}
            onChange={(event) => setPeriodDays(Number(event.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </CardContent>
      </Card>

      {error ? <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AnalyticsCard title="Tempo médio" value={analytics ? formatSeconds(analytics.average_time_seconds) : "-"} subtitle="por simulado" />
        <AnalyticsCard title="Taxa de acerto" value={analytics ? formatPercent(analytics.accuracy_rate) : "-"} />
        <AnalyticsCard title="Taxa de erro" value={analytics ? formatPercent(analytics.error_rate) : "-"} />
        <AnalyticsCard
          title="Alternativa mais marcada"
          value={analytics?.most_marked_option?.option ?? "N/A"}
          subtitle={analytics?.most_marked_option ? `${analytics.most_marked_option.count} marcações` : undefined}
        />
        <AnalyticsCard title="Dificuldade predominante" value={topDifficulty} subtitle="baseada em acertos por questão" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Gráfico de acerto/erro</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics ? <PerformanceChart accuracyRate={analytics.accuracy_rate} errorRate={analytics.error_rate} /> : <p className="text-sm text-muted-foreground">Sem dados para o gráfico.</p>}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" /> Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsPanel analytics={analytics} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Desempenho recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPerformance.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados recentes.</p>
            ) : (
              recentPerformance.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/60 bg-background/50 p-3">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.category} · {item.createdAt}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" /> Contexto geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Total de perguntas analisadas: {stats?.total_questions ?? 0}</p>
            <p>Categoria mais frequente: {stats?.most_frequent_category ?? "N/A"}</p>
            <p>Simulados v2 carregados: {simulations.length}</p>
            <p>Tentativas consideradas no período: {analytics?.attempts_count ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
