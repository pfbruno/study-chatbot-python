"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
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
import {
  ArrowDown,
  ArrowUp,
  Award,
  BarChart3,
  BookOpen,
  Clock,
  Crown,
  Flame,
  Minus,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react"

import { useAnalyticsOverview } from "@/hooks/use-analytics-overview"

type AnalyticsTab = "evolution" | "subjects" | "simulados" | "details"

function StatCard({
  icon,
  value,
  label,
  helper,
}: {
  icon: React.ReactNode
  value: string
  label: string
  helper: string
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400">{helper}</div>
    </article>
  )
}

function TrendBadge({
  value,
  suffix = "%",
}: {
  value: number
  suffix?: string
}) {
  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300">
        <ArrowUp className="size-3" /> +{value}
        {suffix}
      </span>
    )
  }

  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-300">
        <ArrowDown className="size-3" /> {value}
        {suffix}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
      <Minus className="size-3" /> 0
      {suffix}
    </span>
  )
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-[#2f7cff] text-white"
          : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

export default function AnalyticsPage() {
  const { data, loading, error } = useAnalyticsOverview()
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("evolution")

  const radarData = useMemo(() => {
    if (!data?.subjectAccuracy?.length) return []

    return data.subjectAccuracy.slice(0, 8).map((item) => ({
      subject: item.subject.slice(0, 4),
      voce: item.acerto,
      media: item.media,
    }))
  }, [data])

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-6 text-slate-300">
        Carregando analytics...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-red-500/20 bg-red-500/10 p-6">
          <h1 className="text-2xl font-semibold text-white">
            Não foi possível abrir o analytics
          </h1>
          <p className="mt-3 text-sm text-red-200">
            {error || "Erro inesperado ao carregar analytics."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Voltar ao dashboard
            </Link>

            <Link
              href="/dashboard/simulados"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir para simulados
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const { overallStats, gamification } = data
  const readyToClaim = gamification.challenges.filter(
    (item) => item.status === "ready_to_claim"
  )
  const trackedChallenge =
    gamification.challenges.find((item) => item.isTracked) ?? null

  return (
    <div className="max-w-7xl space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
            <BarChart3 className="size-7 text-blue-400" />
            Analytics
          </h1>
          <p className="mt-2 text-slate-400">
            Acompanhe desempenho acadêmico, evolução gamificada e seus pontos de melhoria.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Target className="size-5" />}
          value={`${overallStats.avgAccuracy}%`}
          label="Taxa de acerto"
          helper={`Média base: ${overallStats.platformAvg}%`}
        />
        <StatCard
          icon={<BookOpen className="size-5 text-emerald-300" />}
          value={overallStats.totalQuestions.toLocaleString("pt-BR")}
          label="Questões feitas"
          helper={`${overallStats.totalSessions} sessão(ões) registradas`}
        />
        <StatCard
          icon={<Clock className="size-5" />}
          value={overallStats.avgTimePerQuestion}
          label="Tempo/questão"
          helper={`Sessão: ${overallStats.avgTimePerSession}`}
        />
        <StatCard
          icon={<TrendingUp className="size-5 text-emerald-300" />}
          value={`${overallStats.improvement > 0 ? "+" : ""}${overallStats.improvement}%`}
          label="Evolução total"
          helper="Baseada nas tentativas registradas"
        />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Crown className="size-5 text-amber-300" />}
          value={`Nv ${gamification.profile.level}`}
          label="Nível atual"
          helper={`${gamification.profile.currentXP}/${gamification.profile.nextLevelXP} XP no nível`}
        />
        <StatCard
          icon={<Sparkles className="size-5 text-sky-300" />}
          value={gamification.profile.totalXP.toLocaleString("pt-BR")}
          label="XP total"
          helper="XP persistido da jornada do aluno"
        />
        <StatCard
          icon={<Trophy className="size-5 text-emerald-300" />}
          value={String(gamification.profile.completedChallenges)}
          label="Desafios concluídos"
          helper={`${readyToClaim.length} pronto(s) para pegar`}
        />
        <StatCard
          icon={<Award className="size-5 text-fuchsia-300" />}
          value={String(gamification.profile.unlockedAchievements)}
          label="Conquistas desbloqueadas"
          helper={`${gamification.profile.totalAchievements} no total`}
        />
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-4">
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "evolution"}
            onClick={() => setActiveTab("evolution")}
            label="Evolução"
          />
          <TabButton
            active={activeTab === "subjects"}
            onClick={() => setActiveTab("subjects")}
            label="Matérias"
          />
          <TabButton
            active={activeTab === "simulados"}
            onClick={() => setActiveTab("simulados")}
            label="Histórico"
          />
          <TabButton
            active={activeTab === "details"}
            onClick={() => setActiveTab("details")}
            label="Gamificação"
          />
        </div>
      </section>

      {activeTab === "evolution" ? (
        <div className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-white">
                Evolução de acertos vs média base
              </h2>

              <div className="mt-6 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.evolutionData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="month"
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
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="acerto"
                      name="Você"
                      stroke="#4b8df7"
                      strokeWidth={3}
                      dot={{ fill: "#4b8df7", r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="media"
                      name="Base"
                      stroke="#34d399"
                      strokeWidth={2}
                      strokeDasharray="6 6"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-lg font-semibold text-white">Resumo rápido</h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Streak</p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {overallStats.streak} dias
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Melhor matéria</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {overallStats.bestSubject}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Ponto de atenção</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {overallStats.worstSubject}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Diferença para a base</p>
                  <div className="mt-2">
                    <TrendBadge
                      value={Number(
                        (overallStats.avgAccuracy - overallStats.platformAvg).toFixed(1)
                      )}
                    />
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-lg font-semibold text-white">
              Ritmo semanal de estudo
            </h2>

            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.weeklyStudyData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke="rgba(255,255,255,0.55)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.55)"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020b18",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16,
                      color: "#fff",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="tempo"
                    name="Minutos"
                    stroke="#4b8df7"
                    fill="#4b8df7"
                    fillOpacity={0.18}
                  />
                  <Area
                    type="monotone"
                    dataKey="questoes"
                    name="Questões"
                    stroke="#34d399"
                    fill="#34d399"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "subjects" ? (
        <div className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-3">
            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-white">
                Desempenho por disciplina
              </h2>

              <div className="mt-6 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.subjectAccuracy}>
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
                    <Legend />
                    <Bar dataKey="acerto" name="Você" fill="#4b8df7" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="media" name="Base" fill="#34d399" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-lg font-semibold text-white">
                Radar de domínio
              </h2>

              <div className="mt-6 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.16)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                    />
                    <Legend />
                    <Radar
                      name="Você"
                      dataKey="voce"
                      stroke="#4b8df7"
                      fill="#4b8df7"
                      fillOpacity={0.28}
                    />
                    <Radar
                      name="Base"
                      dataKey="media"
                      stroke="#34d399"
                      fill="#34d399"
                      fillOpacity={0.18}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-lg font-semibold text-white">
              Resumo das matérias
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.subjectAccuracy.map((item) => (
                <article
                  key={item.subject}
                  className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
                >
                  <p className="text-sm text-slate-400">{item.subject}</p>
                  <div className="mt-2 text-2xl font-bold text-white">
                    {item.acerto}%
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {item.questions} questão(ões)
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "simulados" ? (
        <section className="space-y-6">
          <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-lg font-semibold text-white">
              Histórico recente
            </h2>

            <div className="mt-6 space-y-4">
              {data.simuladoHistory.length === 0 ? (
                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4 text-sm text-slate-300">
                  Ainda não há histórico suficiente para exibir nesta aba.
                </div>
              ) : (
                data.simuladoHistory.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          {item.type === "simulado" ? "Simulado" : "Prova"}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-white">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.date} • {item.questions} questão(ões)
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {item.score}%
                        </div>
                        <div className="text-sm text-slate-400">
                          base {item.avg}%
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "details" ? (
        <div className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-lg font-semibold text-white">
                Conquistas recentes
              </h2>

              <div className="mt-6 space-y-3">
                {data.gamification.recentUnlocks.length === 0 ? (
                  <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4 text-sm text-slate-300">
                    Ainda não há conquistas recentes desbloqueadas.
                  </div>
                ) : (
                  data.gamification.recentUnlocks.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-400">{item.rarity}</p>
                          <h3 className="mt-1 text-base font-semibold text-white">
                            {item.title}
                          </h3>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold text-white">
                            +{item.xpReward} XP
                          </div>
                          <div className="text-sm text-slate-400">
                            desbloqueada
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-lg font-semibold text-white">
                Leitura da progressão
              </h2>

              <div className="mt-6 grid gap-4">
                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Desafio em foco</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {trackedChallenge?.title || "Nenhum desafio acompanhado"}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Prontos para pegar</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {readyToClaim.length}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Streak atual</p>
                  <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-white">
                    <Flame className="size-5 text-amber-300" />
                    {gamification.profile.streakDays} dias
                  </div>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Diferença para a base</p>
                  <div className="mt-2">
                    <TrendBadge
                      value={Number(
                        (overallStats.avgAccuracy - overallStats.platformAvg).toFixed(1)
                      )}
                    />
                  </div>
                </div>
              </div>
            </article>
          </section>
        </div>
      ) : null}
    </div>
  )
}