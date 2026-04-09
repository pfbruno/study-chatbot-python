"use client"

import { useEffect, useMemo, useState } from "react"
import {
  BarChart3,
  BookOpen,
  Clock3,
  Loader2,
  MessageSquareText,
  RefreshCw,
  TrendingUp,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getHistory, getStats, type HistoryItem, type StatsResponse } from "@/lib/api"

function formatDate(dateString: string) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return "Data indisponível"
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function normalizeStats(data: StatsResponse | null) {
  if (!data) {
    return {
      totalQuestions: 0,
      categoryCount: 0,
      mostFrequentCategory: "Nenhuma ainda",
      questionsByCategory: {} as Record<string, number>,
    }
  }

  const questionsByCategory =
    data.questions_by_category && typeof data.questions_by_category === "object"
      ? data.questions_by_category
      : {}

  return {
    totalQuestions: Number(data.total_questions ?? 0),
    categoryCount: Object.keys(questionsByCategory).length,
    mostFrequentCategory: data.most_frequent_category || "Nenhuma ainda",
    questionsByCategory,
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadDashboardData(showRefreshState = false) {
    try {
      if (showRefreshState) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      setError(null)

      const [statsResponse, historyResponse] = await Promise.all([getStats(), getHistory()])

      setStats(statsResponse)
      setHistory(Array.isArray(historyResponse) ? historyResponse : [])
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível carregar os dados do dashboard."

      setError(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    void loadDashboardData()
  }, [])

  const normalizedStats = useMemo(() => normalizeStats(stats), [stats])

  const categoryEntries = useMemo(() => {
    const entries = Object.entries(normalizedStats.questionsByCategory)

    return entries.sort((a, b) => b[1] - a[1])
  }, [normalizedStats.questionsByCategory])

  const maxCategoryValue = categoryEntries.length > 0 ? categoryEntries[0][1] : 0

  const recentActivity = useMemo(() => history.slice(0, 6), [history])

  const summaryCards = [
    {
      title: "Perguntas analisadas",
      value: String(normalizedStats.totalQuestions),
      description: "Total processado pela IA",
      icon: MessageSquareText,
    },
    {
      title: "Categorias mapeadas",
      value: String(normalizedStats.categoryCount),
      description: "Assuntos identificados no histórico",
      icon: BookOpen,
    },
    {
      title: "Categoria principal",
      value: normalizedStats.mostFrequentCategory,
      description: "Tema mais recorrente",
      icon: TrendingUp,
    },
    {
      title: "Registros recentes",
      value: String(recentActivity.length),
      description: "Últimas interações exibidas",
      icon: Clock3,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe estatísticas reais do seu estudo e o histórico recente de uso da plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDashboardData(true)}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar dados
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon

          return (
            <Card key={card.title} className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className="text-2xl font-semibold tracking-tight text-foreground">
                    {isLoading ? "..." : card.value}
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-background/60 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Distribuição por categoria
            </CardTitle>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : categoryEntries.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                Ainda não há categorias suficientes para exibir.
              </div>
            ) : (
              <div className="space-y-4">
                {categoryEntries.map(([category, value]) => {
                  const percentage =
                    maxCategoryValue > 0 ? Math.max((value / maxCategoryValue) * 100, 8) : 0

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">{category}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>

                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base">Atividade recente</CardTitle>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                Nenhuma atividade recente encontrada.
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/60 bg-background/40 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <span className="rounded-md border border-border/60 bg-muted/50 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {item.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-sm font-medium text-foreground">
                      {item.question}
                    </p>

                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {item.response}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}