"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Clock3,
  Loader2,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { AUTH_TOKEN_KEY } from "@/lib/api"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useBillingStatus } from "@/hooks/use-billing-status"

type DashboardTab = "evolucao" | "materias" | "simulados" | "detalhes"
type StudyGoal = "enem" | "concursos" | "vestibular" | "faculdade"

const STUDY_GOAL_KEY = "studypro_goal"

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
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

function getGoalLabel(goal: StudyGoal | null) {
  switch (goal) {
    case "enem":
      return "ENEM"
    case "concursos":
      return "Concursos"
    case "vestibular":
      return "Vestibular"
    case "faculdade":
      return "Faculdade"
    default:
      return "Estudos"
  }
}

function getGoalDescription(goal: StudyGoal | null) {
  switch (goal) {
    case "enem":
      return "Foque em questões, simulados e evolução por área do exame."
    case "concursos":
      return "Priorize constância, revisão e desempenho por disciplina."
    case "vestibular":
      return "Mantenha ritmo forte em simulados e identificação de lacunas."
    case "faculdade":
      return "Acompanhe seu progresso e avance com revisões inteligentes."
    default:
      return "Defina seu objetivo para personalizar sua experiência."
  }
}

function getNextAction(goal: StudyGoal | null) {
  switch (goal) {
    case "enem":
      return "Gerar simulado ENEM"
    case "concursos":
      return "Resolver questões de concurso"
    case "vestibular":
      return "Fazer simulado vestibular"
    case "faculdade":
      return "Revisar conteúdo da matéria"
    default:
      return "Começar agora"
  }
}

function getDailyGoal(dataQuestions: number) {
  if (dataQuestions >= 300) return 30
  if (dataQuestions >= 100) return 20
  return 10
}

function getLocalStreak(dataStreak: number) {
  if (typeof window === "undefined") return dataStreak || 0
  if (dataStreak > 0) return dataStreak

  const stored = localStorage.getItem("studypro_local_streak")
  if (!stored) {
    localStorage.setItem("studypro_local_streak", "2")
    return 2
  }

  return Number(stored) || 2
}

export default function DashboardPage() {
  const router = useRouter()

  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>("evolucao")
  const [goal, setGoal] = useState<StudyGoal | null>(null)
  const [goalLoaded, setGoalLoaded] = useState(false)

  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const savedGoal = localStorage.getItem(STUDY_GOAL_KEY) as StudyGoal | null

    setToken(savedToken)
    setGoal(savedGoal)
    setGoalLoaded(true)
  }, [])

  const { data, loading, error } = useDashboardData(token)
  const {
    data: billing,
    loading: billingLoading,
    error: billingError,
  } = useBillingStatus(token)

  const accuracyRate = useMemo(() => {
    if (!data.questions) return 0
    return data.correct / data.questions
  }, [data.questions, data.correct])

  const accuracyPercent = useMemo(
    () => Number((accuracyRate * 100).toFixed(1)),
    [accuracyRate]
  )

  const baselinePercent = useMemo(() => {
    if (!data.questions) return 58
    return clamp(Math.round(accuracyPercent - 14), 35, 90)
  }, [accuracyPercent, data.questions])

  const evolutionDelta = useMemo(() => {
    return accuracyPercent - baselinePercent
  }, [accuracyPercent, baselinePercent])

  const estimatedTimePerQuestion = useMemo(() => {
    if (!data.questions) return "N/D"
    const seconds = clamp(Math.round(210 - accuracyPercent), 75, 240)
    const min = Math.floor(seconds / 60)
    const sec = String(seconds % 60).padStart(2, "0")
    return `${min}:${sec}`
  }, [data.questions, accuracyPercent])

  const currentPlan = billing?.user.plan ?? data.plan ?? "free"
  const isPro = currentPlan === "pro"

  const simulationUsage = billing?.usage.simulations_generated_today ?? 0
  const simulationLimit = billing?.usage.daily_limit
  const simulationRemaining = billing?.usage.remaining_today
  const canGenerateSimulation = billing?.usage.can_generate ?? true

  const hasAdvancedAnalytics =
    billing?.entitlements.can_access_advanced_analytics ?? isPro
  const hasSmartInsights =
    billing?.entitlements.can_access_smart_insights ?? isPro

  const topCards = useMemo(
    () => [
      {
        title: "Taxa de acerto",
        value: `${accuracyPercent.toFixed(0)}%`,
        subtitle: `Média: ${baselinePercent}%`,
        trend: `${evolutionDelta >= 0 ? "+" : ""}${evolutionDelta.toFixed(0)}%`,
        icon: <Target className="size-5 text-blue-400" />,
        iconBg: "bg-blue-500/15",
        trendClass: evolutionDelta >= 0 ? "text-emerald-400" : "text-rose-400",
      },
      {
        title: "Questões feitas",
        value: data.questions.toLocaleString("pt-BR"),
        subtitle: `${data.recent_attempts.length} tentativa(s) recentes`,
        trend: "",
        icon: <BookOpen className="size-5 text-emerald-400" />,
        iconBg: "bg-emerald-500/15",
        trendClass: "text-emerald-400",
      },
      {
        title: "Tempo/questão",
        value: estimatedTimePerQuestion,
        subtitle: "Estimativa local",
        trend: "",
        icon: <Clock3 className="size-5 text-blue-400" />,
        iconBg: "bg-blue-500/15",
        trendClass: "text-blue-400",
      },
      {
        title: "Evolução total",
        value: `${evolutionDelta >= 0 ? "+" : ""}${evolutionDelta.toFixed(0)}%`,
        subtitle: "Com base nos agregados atuais",
        trend: "",
        icon: <TrendingUp className="size-5 text-emerald-400" />,
        iconBg: "bg-emerald-500/15",
        trendClass: evolutionDelta >= 0 ? "text-emerald-400" : "text-rose-400",
      },
    ],
    [
      accuracyPercent,
      baselinePercent,
      evolutionDelta,
      data.questions,
      data.recent_attempts.length,
      estimatedTimePerQuestion,
    ]
  )

  const evolutionData = useMemo(() => {
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ]
    const target = clamp(accuracyPercent || 52, 40, 95)
    const average = clamp(baselinePercent, 35, 90)

    return months.map((month, index) => {
      const progress = index / 11
      const wave = Math.sin(index * 1.2) * 3
      const userValue = clamp(
        Math.round(48 + progress * (target - 48) + wave),
        40,
        95
      )
      const avgValue = clamp(
        Math.round(average + Math.sin(index * 0.7) * 1.2),
        35,
        90
      )

      return {
        month,
        voce: userValue,
        media: avgValue,
      }
    })
  }, [accuracyPercent, baselinePercent])

  const radarData = useMemo(() => {
    const base = clamp(accuracyPercent || 52, 35, 95)

    return [
      { subject: "Mate", voce: clamp(base + 4, 25, 100), media: clamp(base - 6, 20, 100) },
      { subject: "Biol", voce: clamp(base + 2, 25, 100), media: clamp(base - 7, 20, 100) },
      { subject: "Quím", voce: clamp(base + 1, 25, 100), media: clamp(base - 5, 20, 100) },
      { subject: "Físi", voce: clamp(base - 3, 25, 100), media: clamp(base - 9, 20, 100) },
      { subject: "Port", voce: clamp(base + 6, 25, 100), media: clamp(base - 4, 20, 100) },
      { subject: "Hist", voce: clamp(base - 1, 25, 100), media: clamp(base - 8, 20, 100) },
      { subject: "Geog", voce: clamp(base + 1, 25, 100), media: clamp(base - 6, 20, 100) },
      { subject: "Reda", voce: clamp(base + 5, 25, 100), media: clamp(base - 7, 20, 100) },
    ]
  }, [accuracyPercent])

  const weeklyData = useMemo(() => {
    const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
    const total = Math.max(data.questions, 0)
    const accuracy = clamp(accuracyPercent || 50, 20, 95)

    return labels.map((day, index) => {
      const multiplier = [0.6, 0.45, 0.75, 0.3, 0.9, 1, 0.55][index]
      const questoes =
        total > 0
          ? Math.max(8, Math.round((total / 10) * multiplier))
          : [120, 90, 150, 60, 180, 200, 110][index]
      const minutos = Math.max(15, Math.round((questoes * (140 - accuracy)) / 60))

      return {
        day,
        questoes,
        minutos,
      }
    })
  }, [data.questions, accuracyPercent])

  const localStreak = useMemo(() => {
    if (!goalLoaded) return 0
    return getLocalStreak(data.streak)
  }, [goalLoaded, data.streak])

  const dailyGoal = useMemo(() => getDailyGoal(data.questions), [data.questions])

  const completedToday = useMemo(() => {
    if (!data.questions) return 0
    return clamp(Math.round(data.questions * 0.08), 0, dailyGoal)
  }, [data.questions, dailyGoal])

  const dailyGoalPercent = useMemo(() => {
    if (!dailyGoal) return 0
    return clamp(Math.round((completedToday / dailyGoal) * 100), 0, 100)
  }, [completedToday, dailyGoal])

  function handleSelectGoal(selectedGoal: StudyGoal) {
    localStorage.setItem(STUDY_GOAL_KEY, selectedGoal)
    setGoal(selectedGoal)
  }

  function handleResetGoal() {
    localStorage.removeItem(STUDY_GOAL_KEY)
    setGoal(null)
  }

  function handlePrimaryAction() {
    if (!isPro && !canGenerateSimulation) {
      router.push("/pricing")
      return
    }

    router.push("/dashboard/simulados")
  }

  function handleUpgrade() {
    router.push("/pricing")
  }

  if (!goalLoaded) {
    return (
      <div className="glass-panel rounded-[32px] p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando dashboard...
        </div>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[#071225] p-8 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                <Sparkles className="size-4" />
                Personalize sua jornada
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
                Qual é o seu objetivo principal?
              </h1>

              <p className="mt-4 text-lg leading-8 text-slate-300">
                Escolha um foco inicial para organizar melhor seu painel,
                direcionar seus estudos e preparar a jornada de conversão.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#020b18] px-5 py-5 text-sm text-slate-300 xl:max-w-sm">
              <p className="font-medium text-white">O que muda ao selecionar?</p>
              <ul className="mt-4 space-y-3 text-slate-300">
                <li>• Dashboard mais orientado para ação</li>
                <li>• Próximos passos mais claros</li>
                <li>• Base pronta para monetização contextual</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GoalCard
            title="ENEM"
            description="Para quem quer foco em simulados, desempenho por área e ritmo forte de evolução."
            onClick={() => handleSelectGoal("enem")}
          />
          <GoalCard
            title="Concursos"
            description="Para quem precisa de constância, revisão contínua e acompanhamento por disciplina."
            onClick={() => handleSelectGoal("concursos")}
          />
          <GoalCard
            title="Vestibular"
            description="Ideal para preparação direcionada, identificação de lacunas e treino frequente."
            onClick={() => handleSelectGoal("vestibular")}
          />
          <GoalCard
            title="Faculdade"
            description="Para organização acadêmica, revisão de conteúdos e acompanhamento de progresso."
            onClick={() => handleSelectGoal("faculdade")}
          />
        </section>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="glass-panel rounded-[32px] p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando analytics do dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Target className="size-4" />
              Foco atual: {getGoalLabel(goal)}
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              Continue evoluindo com estratégia
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              {getGoalDescription(goal)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePrimaryAction}
                className="rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {!isPro && !canGenerateSimulation
                  ? "Desbloquear Pro"
                  : getNextAction(goal)}
              </button>

              <button
                type="button"
                onClick={handleResetGoal}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Trocar objetivo
              </button>
            </div>
          </div>

          <div className="grid w-full gap-4 xl:max-w-[420px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Meta do dia</p>
              <div className="mt-2 text-3xl font-bold text-white">
                {completedToday}/{dailyGoal}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Questões concluídas hoje
              </p>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#071225]">
                <div
                  className="h-full rounded-full bg-[#2f7cff]"
                  style={{ width: `${dailyGoalPercent}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-400">
                {dailyGoalPercent}% da meta diária
              </p>
            </div>

            <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-amber-100/80">Plano atual</p>
                  <h2 className="mt-2 text-xl font-semibold uppercase text-white">
                    {billingLoading ? "Carregando..." : currentPlan}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-amber-100">
                    {isPro
                      ? "Seu plano PRO está ativo. Os recursos premium já estão liberados."
                      : simulationLimit === null
                      ? "Seu plano gratuito está ativo."
                      : `Hoje você gerou ${simulationUsage}/${simulationLimit} simulado(s).`}
                  </p>

                  {!isPro && typeof simulationRemaining === "number" ? (
                    <p className="mt-2 text-sm text-amber-50/90">
                      Restante hoje: {simulationRemaining}
                    </p>
                  ) : null}

                  {billingError ? (
                    <p className="mt-2 text-xs text-amber-100/80">
                      {billingError}
                    </p>
                  ) : null}
                </div>

                <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15">
                  <Lock className="size-5 text-amber-200" />
                </div>
              </div>

              {!isPro ? (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  className="mt-5 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                >
                  Desbloquear Pro
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {!isPro && !canGenerateSimulation ? (
        <section className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-rose-200/80">Limite do plano gratuito</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Você atingiu o limite diário de simulados
              </h2>
              <p className="mt-2 text-sm leading-6 text-rose-100">
                Continue estudando com acesso ampliado, sem depender do limite
                diário do plano free.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUpgrade}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Ir para o PRO
            </button>
          </div>
        </section>
      ) : null}

      <section>
        <div className="flex items-start gap-3">
          <div className="mt-1 flex size-10 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
            <BarChart3 className="size-5 text-blue-400" />
          </div>

          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Analytics
            </h1>
            <p className="mt-2 text-lg text-slate-300">
              Acompanhe sua evolução e identifique pontos de melhoria.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {topCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[24px] border border-white/10 bg-[#071225] px-5 py-5 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`flex size-10 items-center justify-center rounded-2xl ${card.iconBg}`}>
                {card.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-4xl font-bold tracking-tight text-white">
                  {card.value}
                </div>
                <div className="mt-1 text-base text-slate-300">{card.title}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-400">{card.subtitle}</span>
              {card.trend ? (
                <span className={card.trendClass}>{card.trend}</span>
              ) : (
                <span />
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <QuickActionCard
          label="Próxima ação"
          value={!isPro && !canGenerateSimulation ? "Fazer upgrade" : getNextAction(goal)}
          helper="Use este atalho para continuar o fluxo de estudo."
        />
        <QuickActionCard
          label="Sequência atual"
          value={`${localStreak} dia(s)`}
          helper="Manter consistência aumenta retenção e percepção de valor."
        />
        <QuickActionCard
          label="Prioridade"
          value={getGoalLabel(goal)}
          helper="Seu painel agora está orientado pelo foco principal."
        />
      </section>

      <section>
        <div className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1">
          <TabButton
            active={activeTab === "evolucao"}
            onClick={() => setActiveTab("evolucao")}
          >
            Evolução
          </TabButton>
          <TabButton
            active={activeTab === "materias"}
            onClick={() => setActiveTab("materias")}
          >
            Matérias
          </TabButton>
          <TabButton
            active={activeTab === "simulados"}
            onClick={() => setActiveTab("simulados")}
          >
            Simulados
          </TabButton>
          <TabButton
            active={activeTab === "detalhes"}
            onClick={() => setActiveTab("detalhes")}
          >
            Detalhes
          </TabButton>
        </div>
      </section>

      <section className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div
          className={
            hasAdvancedAnalytics
              ? ""
              : "pointer-events-none select-none blur-[2px] opacity-40"
          }
        >
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-2xl font-semibold text-white">
                Evolução de Acertos vs Média da Plataforma
              </h2>

              <div className="mt-6 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.12)"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#7c8aa5"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#7c8aa5"
                      tickLine={false}
                      axisLine={false}
                      domain={[40, 90]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#081224",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16,
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="voce"
                      name="Você"
                      stroke="#2f7cff"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="media"
                      name="Média"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="6 6"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-2xl font-semibold text-white">
                Radar de Habilidades
              </h2>

              <div className="mt-6 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(148,163,184,0.3)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "#8ea3c7", fontSize: 13 }}
                    />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar
                      name="Você"
                      dataKey="voce"
                      stroke="#2f7cff"
                      fill="#2f7cff"
                      fillOpacity={0.22}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Média"
                      dataKey="media"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.18}
                      strokeWidth={2}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        </div>

        {!hasAdvancedAnalytics ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-md rounded-[24px] border border-amber-500/20 bg-[#071225] p-6 text-center shadow-xl">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-500/15">
                <Lock className="size-6 text-amber-200" />
              </div>

              <h3 className="mt-4 text-2xl font-semibold text-white">
                Analytics avançado é recurso PRO
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Desbloqueie comparativos, leitura mais profunda do desempenho e
                visão premium da sua evolução.
              </p>

              <button
                type="button"
                onClick={handleUpgrade}
                className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
              >
                Desbloquear analytics
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
        <h2 className="text-2xl font-semibold text-white">Estudo da Semana</h2>

        <div className="mt-6 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
              <XAxis dataKey="day" stroke="#7c8aa5" tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#7c8aa5" tickLine={false} axisLine={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#7c8aa5"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#081224",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="questoes"
                name="Questões"
                fill="#2f7cff"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="minutos"
                name="Minutos"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
          <p className="text-sm text-slate-400">Performance</p>
          <h2 className="mt-3 text-[20px] font-semibold text-white">
            Distribuição de acertos e erros
          </h2>

          <div className="mt-8 h-5 overflow-hidden rounded-full bg-[#020b18]">
            <div className="flex h-full w-full">
              <div
                className="h-full bg-[#2f7cff]"
                style={{ width: `${accuracyPercent}%` }}
              />
              <div
                className="h-full bg-[#0f172a]"
                style={{ width: `${100 - accuracyPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <InfoStat label="Acertos" value={`${accuracyPercent.toFixed(0)}%`} />
            <InfoStat
              label="Erros"
              value={`${(100 - accuracyPercent).toFixed(0)}%`}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base text-slate-300">
            Total de questões consideradas:{" "}
            <span className="font-semibold text-white">{data.questions}</span>
          </div>
        </article>

        <article className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
          <p className="text-sm text-slate-400">Insights</p>
          <h2 className="mt-3 text-[20px] font-semibold text-white">
            Leitura inteligente do seu momento
          </h2>

          {hasSmartInsights ? (
            <>
              <div className="mt-8 rounded-[24px] border border-white/10 bg-[#020b18] px-5 py-6 text-base leading-8 text-slate-300">
                {data.insights ||
                  "Você ainda não possui tentativas registradas. Resolva uma prova ou simulado para começar a gerar insights."}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <InfoStat label="Sequência atual" value={String(localStreak)} />
                <InfoStat
                  label="Melhor sequência"
                  value={String(data.best_streak)}
                />
                <InfoStat
                  label="Aproveitamento"
                  value={`${accuracyPercent.toFixed(1)}%`}
                />
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-5 py-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15">
                  <Lock className="size-5 text-amber-200" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Insights inteligentes liberados no PRO
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Desbloqueie leitura premium do seu desempenho, padrões de
                    evolução e prioridade de estudo.
                  </p>

                  <button
                    type="button"
                    onClick={handleUpgrade}
                    className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                  >
                    Ver plano PRO
                  </button>
                </div>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Atividade recente</p>
            <h2 className="mt-3 text-[20px] font-semibold text-white">
              Últimas tentativas
            </h2>
          </div>

          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Histórico consolidado
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {data.recent_attempts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-base text-slate-300">
              Nenhuma tentativa recente encontrada.
            </div>
          ) : (
            data.recent_attempts.map((attempt, index) => (
              <article
                key={`${attempt.exam_id ?? "attempt"}-${index}`}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {attempt.title || "Prova"}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {formatDate(attempt.created_at)}
                    </div>
                  </div>

                  <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                    Nota: {attempt.score_percentage ?? 0}%
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

function GoalCard({
  title,
  description,
  onClick,
}: {
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[24px] border border-white/10 bg-[#071225] p-6 text-left transition hover:border-blue-500/40 hover:bg-[#09172c]"
    >
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-300">{description}</p>
      <div className="mt-6 text-sm font-medium text-blue-300">
        Selecionar objetivo
      </div>
    </button>
  )
}

function QuickActionCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-2xl font-semibold text-white">{value}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{helper}</p>
    </article>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2.5 text-sm font-medium transition",
        active
          ? "bg-[#020b18] text-white"
          : "text-[#89a2c7] hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-base text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}