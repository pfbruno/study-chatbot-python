"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRight,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react"

import { AnalyticsCard } from "@/components/dashboard/analytics-card"
import { InsightsPanel } from "@/components/dashboard/insights-panel"
import { PerformanceChart } from "@/components/dashboard/performance-chart"
import { AUTH_TOKEN_KEY, getDashboardData, type DashboardResponse } from "@/lib/api"

function formatDate(value?: string) {
  if (!value) return "Sem data"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null)
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_TOKEN_KEY)
    setToken(saved)
  }, [])

  useEffect(() => {
    async function loadDashboard() {
      if (token === null) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError("")

      try {
        const response = await getDashboardData(token)
        setData(response)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o dashboard."
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [token])

  const accuracyRate = useMemo(() => {
    if (!data?.questions || data.questions <= 0) return 0
    return data.correct / data.questions
  }, [data])

  const errorRate = useMemo(() => {
    if (!data?.questions || data.questions <= 0) return 0
    return data.wrong / data.questions
  }, [data])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel rounded-[28px] p-6">
          <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-panel rounded-[28px] border border-red-500/20 bg-red-500/10 p-6 text-red-200">
        {error}
      </div>
    )
  }

  const questions = data?.questions ?? 0
  const correct = data?.correct ?? 0
  const wrong = data?.wrong ?? 0
  const streak = data?.streak ?? 0
  const bestStreak = data?.best_streak ?? 0
  const plan = data?.plan ?? "free"
  const attempts = data?.recent_attempts ?? []

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              Dashboard do aluno
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
              Sua evolução em um só lugar
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Acompanhe desempenho, consistência e histórico recente com uma leitura
              visual mais clara do seu progresso.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Plano atual:{" "}
                <span className="font-semibold text-white">
                  {plan === "pro" ? "PRO" : "Free"}
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Questões resolvidas:{" "}
                <span className="font-semibold text-white">{questions}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-sm text-muted-foreground">Resumo rápido</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <TrendingUp className="size-4 text-primary" />
                  Aproveitamento
                </div>
                <p className="mt-3 text-3xl font-bold text-white">
                  {(accuracyRate * 100).toFixed(1)}%
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Flame className="size-4 text-accent" />
                  Sequência atual
                </div>
                <p className="mt-3 text-3xl font-bold text-white">{streak}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          title="Questões resolvidas"
          value={String(questions)}
          subtitle="volume total registrado"
          icon={<Target className="size-5 text-primary" />}
        />
        <AnalyticsCard
          title="Acertos"
          value={String(correct)}
          subtitle="respostas corretas"
          icon={<CheckCircle2 className="size-5 text-emerald-400" />}
        />
        <AnalyticsCard
          title="Erros"
          value={String(wrong)}
          subtitle="pontos para revisar"
          icon={<XCircle className="size-5 text-rose-400" />}
        />
        <AnalyticsCard
          title="Melhor sequência"
          value={String(bestStreak)}
          subtitle="consistência máxima"
          icon={<Flame className="size-5 text-amber-300" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PerformanceChart
          accuracyRate={accuracyRate}
          errorRate={errorRate}
          totalQuestions={questions}
        />

        <InsightsPanel
          insights={data?.insights ?? ""}
          streak={streak}
          bestStreak={bestStreak}
          accuracyRate={accuracyRate}
        />
      </section>

      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Atividade recente</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Últimas tentativas
            </h2>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            <ArrowUpRight className="size-4" />
            Histórico consolidado
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {attempts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              Nenhuma tentativa recente encontrada.
            </div>
          ) : (
            attempts.map((attempt, index) => (
              <article
                key={`${attempt.exam_id ?? "attempt"}-${index}`}
                className="rounded-[24px] border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {attempt.title || "Prova"}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formatDate(attempt.created_at)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                    Nota:{" "}
                    <span className="font-semibold">
                      {attempt.score_percentage ?? 0}%
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  )
}