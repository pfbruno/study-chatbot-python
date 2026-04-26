"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  GraduationCap,
  History,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  getCombinedSubjectProgress,
  getRecentAttemptsByModule,
  type StoredAttempt,
} from "@/lib/activity"
import {
  getStudyProgress,
  readSimulationHistory,
  SIMULATION_HISTORY_UPDATED_EVENT,
  STUDY_PROGRESS_UPDATED_EVENT,
} from "@/lib/study-progress"

type SimulationHistoryEntry = {
  id: string
  saved_at: string
  title: string
  exam_type: string
  year: number
  mode: "balanced" | "random"
  total_questions: number
  correct_answers: number
  wrong_answers: number
  unanswered_count: number
  score_percentage: number
  subjects_summary: Array<{
    subject: string
    total: number
    correct: number
    wrong: number
    blank: number
    accuracy_percentage: number
  }>
}

type AnalyticsSnapshot = {
  totalAnsweredQuestions: number
  totalCompletedSimulations: number
  totalCorrectAnswers: number
  averageAccuracy: number
  simulationHistory: SimulationHistoryEntry[]
  subjectProgress: Array<{
    subject: string
    averageScore: number
    attempts: number
  }>
  recentAttempts: StoredAttempt[]
  recentSimulados: StoredAttempt[]
  recentProvas: StoredAttempt[]
}

function formatDate(value?: string) {
  if (!value) return "Sem data"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function buildSnapshot(): AnalyticsSnapshot {
  const studyProgress = getStudyProgress()
  const simulationHistory = readSimulationHistory()
  const subjectProgress = getCombinedSubjectProgress()
  const recentSimulados = getRecentAttemptsByModule("simulados", 6)
  const recentProvas = getRecentAttemptsByModule("provas", 6)
  const recentAttempts = [...recentSimulados, ...recentProvas]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 8)

  const allAttemptsCount = recentAttempts.length
  const averageAccuracy =
    recentAttempts.length > 0
      ? Number(
          (
            recentAttempts.reduce(
              (acc, attempt) => acc + attempt.scorePercentage,
              0
            ) / recentAttempts.length
          ).toFixed(1)
        )
      : 0

  return {
    totalAnsweredQuestions: studyProgress.totalAnsweredQuestions,
    totalCompletedSimulations: studyProgress.totalCompletedSimulations,
    totalCorrectAnswers: studyProgress.totalCorrectAnswers,
    averageAccuracy: allAttemptsCount > 0 ? averageAccuracy : 0,
    simulationHistory,
    subjectProgress,
    recentAttempts,
    recentSimulados,
    recentProvas,
  }
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
          <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
        </div>

        <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
          {icon}
        </div>
      </div>
    </article>
  )
}

export default function AnalyticsPage() {
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null)

  useEffect(() => {
    function refresh() {
      setSnapshot(buildSnapshot())
    }

    refresh()

    window.addEventListener(STUDY_PROGRESS_UPDATED_EVENT, refresh)
    window.addEventListener(SIMULATION_HISTORY_UPDATED_EVENT, refresh)

    return () => {
      window.removeEventListener(STUDY_PROGRESS_UPDATED_EVENT, refresh)
      window.removeEventListener(SIMULATION_HISTORY_UPDATED_EVENT, refresh)
    }
  }, [])

  const simulationEvolution = useMemo(() => {
    if (!snapshot?.simulationHistory?.length) return []

    return [...snapshot.simulationHistory]
      .slice(0, 8)
      .reverse()
      .map((item, index) => ({
        label: `${index + 1}`,
        score: Number(item.score_percentage.toFixed(1)),
        title: item.title,
      }))
  }, [snapshot])

  const subjectBars = useMemo(() => {
    if (!snapshot?.subjectProgress?.length) return []
    return snapshot.subjectProgress.slice(0, 8)
  }, [snapshot])

  if (!snapshot) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-6 text-slate-300">
        Carregando analytics...
      </div>
    )
  }

  const hasData =
    snapshot.totalAnsweredQuestions > 0 ||
    snapshot.totalCompletedSimulations > 0 ||
    snapshot.recentAttempts.length > 0

  if (!hasData) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[#071225] p-8 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <BarChart3 className="size-4" />
            Analytics
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
            Seu analytics vai aparecer aqui
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Assim que você concluir provas e simulados, este painel vai mostrar
            evolução de desempenho, disciplinas com melhor resultado, histórico
            recente e visão consolidada da sua prática.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/simulados"
              className="rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Ir para simulados
            </Link>

            <Link
              href="/dashboard/provas"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir para provas
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <BarChart3 className="size-4" />
              Analytics de estudo
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              Visão consolidada do seu desempenho
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              Aqui você acompanha volume de questões respondidas, simulados
              concluídos, taxa média de acerto e evolução recente.
            </p>
          </div>

          <div className="grid w-full gap-4 xl:max-w-[360px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Última atualização</p>
              <div className="mt-2 text-2xl font-bold text-white">
                {formatDate(snapshot.simulationHistory[0]?.saved_at)}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Baseado nos seus dados locais mais recentes
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Questões respondidas"
          value={snapshot.totalAnsweredQuestions.toLocaleString("pt-BR")}
          subtitle="Total consolidado"
          icon={<BookOpen className="size-5" />}
        />
        <StatCard
          title="Simulados concluídos"
          value={snapshot.totalCompletedSimulations.toLocaleString("pt-BR")}
          subtitle="Tentativas finalizadas"
          icon={<GraduationCap className="size-5" />}
        />
        <StatCard
          title="Respostas corretas"
          value={snapshot.totalCorrectAnswers.toLocaleString("pt-BR")}
          subtitle="Acertos acumulados"
          icon={<CheckCircle2 className="size-5" />}
        />
        <StatCard
          title="Acurácia média"
          value={`${snapshot.averageAccuracy.toFixed(1)}%`}
          subtitle="Entre tentativas recentes"
          icon={<TrendingUp className="size-5" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Evolução dos simulados
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Últimas tentativas registradas
              </p>
            </div>
          </div>

          <div className="mt-6 h-[320px]">
            {simulationEvolution.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm text-slate-300">
                Ainda não há simulados suficientes para plotar evolução.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationEvolution}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="rgba(255,255,255,0.55)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.55)"
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020b18",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4b8df7"
                    strokeWidth={3}
                    dot={{ fill: "#4b8df7", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
              <Brain className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Desempenho por disciplina
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Média consolidada das suas tentativas
              </p>
            </div>
          </div>

          <div className="mt-6 h-[320px]">
            {subjectBars.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm text-slate-300">
                Ainda não há disciplinas suficientes para consolidar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectBars}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="subject"
                    stroke="rgba(255,255,255,0.55)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.55)"
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020b18",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="averageScore" fill="#4b8df7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
              <History className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Últimas tentativas
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Provas e simulados recentes
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {snapshot.recentAttempts.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm text-slate-300">
                Nenhuma tentativa recente encontrada.
              </div>
            ) : (
              snapshot.recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {attempt.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {attempt.module === "simulados" ? "Simulado" : "Prova"} •{" "}
                        {formatDate(attempt.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {attempt.scorePercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">
                        {attempt.correctAnswers}/{attempt.totalQuestions}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Próximas melhorias
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                O painel agora abre; o próximo passo é evoluir a profundidade
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4 text-sm leading-7 text-slate-300">
              • comparar desempenho por período
            </div>
            <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4 text-sm leading-7 text-slate-300">
              • destacar disciplinas com pior retenção
            </div>
            <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4 text-sm leading-7 text-slate-300">
              • mostrar evolução separada entre provas e simulados
            </div>
            <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4 text-sm leading-7 text-slate-300">
              • liberar analytics premium quando o Mercado Pago estiver integrado
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}