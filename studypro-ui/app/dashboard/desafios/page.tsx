"use client"

import type { ReactNode } from "react"
import {
  Award,
  Brain,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Crown,
  Flame,
  Rocket,
  Sparkles,
  Swords,
  Target,
  Trophy,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { AUTH_TOKEN_KEY } from "@/lib/api"
import {
  claimPersistedGamificationChallenge,
  dispatchGamificationRefresh,
  fetchGamificationSummary,
  trackPersistedGamificationChallenge,
  type PersistedGamificationChallenge,
  type PersistedGamificationSummaryResponse,
} from "@/lib/gamification-client"

const EMPTY_GAMIFICATION: PersistedGamificationSummaryResponse = {
  profile: {
    userName: "Usuário",
    level: 1,
    currentXP: 0,
    nextLevelXP: 800,
    totalXP: 0,
    streakDays: 0,
    completedChallenges: 0,
    unlockedAchievements: 0,
    totalAchievements: 0,
  },
  achievements: [],
  recentUnlocks: [],
  weeklyEvolution: [],
  challenges: [],
}

type ChallengeDifficulty = "easy" | "medium" | "hard"
type ChallengeStatus =
  | "active"
  | "ready_to_claim"
  | "claimed"
  | "completed"
  | "locked"
type ChallengeType = "daily" | "weekly" | "special"

function difficultyStyles(difficulty: ChallengeDifficulty) {
  if (difficulty === "hard") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-300"
  }
  if (difficulty === "medium") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
  }
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
}

function difficultyLabel(difficulty: ChallengeDifficulty) {
  if (difficulty === "hard") return "Difícil"
  if (difficulty === "medium") return "Médio"
  return "Fácil"
}

function typeStyles(type: ChallengeType) {
  if (type === "special") {
    return "border-purple-400/30 bg-purple-400/10 text-purple-300"
  }
  if (type === "weekly") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300"
  }
  return "border-white/10 bg-white/5 text-slate-300"
}

function typeLabel(type: ChallengeType) {
  if (type === "special") return "Especial"
  if (type === "weekly") return "Semanal"
  return "Diário"
}

function statusStyles(status: ChallengeStatus) {
  if (status === "claimed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  }
  if (status === "ready_to_claim") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300"
  }
  if (status === "locked") {
    return "border-white/10 bg-white/5 text-slate-400"
  }
  if (status === "completed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  }
  return "border-[#2f7cff]/30 bg-[#2f7cff]/10 text-[#79a6ff]"
}

function statusLabel(status: ChallengeStatus) {
  if (status === "claimed") return "Resgatado"
  if (status === "ready_to_claim") return "Pronto para pegar"
  if (status === "completed") return "Concluído"
  if (status === "locked") return "Bloqueado"
  return "Ativo"
}

function iconForChallenge(icon: PersistedGamificationChallenge["icon"]) {
  switch (icon) {
    case "brain":
      return Brain
    case "flame":
      return Flame
    case "rocket":
      return Rocket
    case "award":
      return Award
    case "trophy":
      return Trophy
    default:
      return Target
  }
}

function ProgressLine({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[#4b8df7]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
    </article>
  )
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-slate-300">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

function getButtonLabel(item: PersistedGamificationChallenge) {
  if (item.status === "claimed") return "Resgatado"
  if (item.status === "ready_to_claim") return "Pegar"
  if (item.isTracked) return "Acompanhando"
  return "Acompanhar"
}

function getButtonClassName(item: PersistedGamificationChallenge) {
  if (item.status === "claimed") {
    return "bg-emerald-400/20 text-emerald-200 cursor-default"
  }

  if (item.status === "ready_to_claim") {
    return "bg-amber-400 text-[#071225] hover:opacity-90"
  }

  if (item.isTracked) {
    return "bg-[#79a6ff] text-[#071225] cursor-default"
  }

  return "bg-[#4b8df7] text-white hover:opacity-90"
}

function ChallengeCard({
  item,
  onTrack,
  onClaim,
  loading,
}: {
  item: PersistedGamificationChallenge
  onTrack: (challengeId: string) => void
  onClaim: (challengeId: string) => void
  loading: boolean
}) {
  const Icon = iconForChallenge(item.icon)
  const progress =
    item.target > 0 ? Math.round((item.progress / item.target) * 100) : 0

  return (
    <article
      className={`overflow-hidden rounded-[28px] border transition ${
        item.isTracked
          ? "border-[#79a6ff]/50 bg-[#0a1730]"
          : "border-white/10 bg-[#071225] hover:border-[#2f7cff]/30 hover:bg-[#0a1730]"
      }`}
    >
      <div
        className={`h-2 ${
          item.type === "special"
            ? "bg-gradient-to-r from-purple-400/40 via-fuchsia-400/20 to-violet-400/20"
            : item.type === "weekly"
            ? "bg-gradient-to-r from-blue-400/40 via-cyan-400/20 to-sky-400/20"
            : "bg-gradient-to-r from-white/10 via-white/5 to-white/5"
        }`}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
            <Icon className="size-6" />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {item.isTracked ? (
              <span className="rounded-full border border-[#79a6ff]/30 bg-[#79a6ff]/10 px-3 py-1 text-xs font-semibold text-[#9abbff]">
                Em foco
              </span>
            ) : null}

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${typeStyles(
                item.type
              )}`}
            >
              {typeLabel(item.type)}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${difficultyStyles(
                item.difficulty
              )}`}
            >
              {difficultyLabel(item.difficulty)}
            </span>
          </div>
        </div>

        <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">
          {item.title}
        </h3>

        <p className="mt-3 min-h-[72px] text-sm leading-7 text-[#7ea0d6]">
          {item.description}
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#081224] p-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-400">Progresso</span>
            <span className="font-semibold text-white">
              {Math.min(item.progress, item.target)}/{item.target}
            </span>
          </div>

          <div className="mt-3">
            <ProgressLine value={progress} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-4 text-sm text-[#7ea0d6]">
            <span>{Math.min(progress, 100)}%</span>
            <span>+{item.xpReward} XP</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles(
              item.status
            )}`}
          >
            {statusLabel(item.status)}
          </span>

          <span className="text-sm text-slate-400">{item.expiresIn}</span>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">{item.rewardLabel}</div>
            <div className="mt-1 text-sm text-[#7ea0d6]">
              Recompensa vinculada ao desafio
            </div>
          </div>

          <button
            type="button"
            disabled={loading || item.status === "claimed" || item.isTracked}
            onClick={() =>
              item.status === "ready_to_claim"
                ? onClaim(item.id)
                : onTrack(item.id)
            }
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${getButtonClassName(
              item
            )}`}
          >
            {loading ? "Processando..." : getButtonLabel(item)}
          </button>
        </div>
      </div>
    </article>
  )
}

function CompactChallengeItem({
  item,
  onClaim,
  loading,
}: {
  item: PersistedGamificationChallenge
  onClaim: (challengeId: string) => void
  loading: boolean
}) {
  const Icon = iconForChallenge(item.icon)
  const progress =
    item.target > 0 ? Math.round((item.progress / item.target) * 100) : 0

  return (
    <div className="rounded-[22px] border border-white/10 bg-[#081224] p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-[#0f1d3d] text-[#79a6ff]">
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-white">{item.title}</div>
          <div className="mt-2 text-sm text-[#7ea0d6]">
            {Math.min(item.progress, item.target)}/{item.target} • +{item.xpReward} XP
          </div>
          <div className="mt-3">
            <ProgressLine value={progress} />
          </div>

          {item.status === "ready_to_claim" ? (
            <button
              type="button"
              onClick={() => onClaim(item.id)}
              disabled={loading}
              className="mt-3 rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-[#071225]"
            >
              {loading ? "Processando..." : "Pegar recompensa"}
            </button>
          ) : null}
        </div>

        {item.status === "claimed" ? (
          <CheckCircle2 className="size-5 text-emerald-300" />
        ) : null}
      </div>
    </div>
  )
}

export default function DesafiosPage() {
  const [summary, setSummary] =
    useState<PersistedGamificationSummaryResponse>(EMPTY_GAMIFICATION)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  async function loadSummary() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!token) {
      setError("Sessão não encontrada.")
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await fetchGamificationSummary(token)
      setSummary(data)
      setError("")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os desafios."
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSummary()
  }, [])

  const challenges = summary.challenges
  const dailyChallenges = challenges.filter((item) => item.type === "daily")
  const weeklyChallenges = challenges.filter((item) => item.type === "weekly")
  const specialChallenges = challenges.filter((item) => item.type === "special")

  const activeChallenges = challenges.filter((item) => item.status === "active").length
  const readyToClaimCount = challenges.filter(
    (item) => item.status === "ready_to_claim"
  ).length
  const claimedCount = challenges.filter((item) => item.status === "claimed").length

  async function handleTrack(challengeId: string) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return

    try {
      setActionLoadingId(challengeId)
      const response = await trackPersistedGamificationChallenge(challengeId, token)

      if (response.summary) {
        setSummary(response.summary)
      } else {
        await loadSummary()
      }

      setFeedback(response.message || "Desafio marcado como acompanhado.")
      dispatchGamificationRefresh()
    } catch (err) {
      setFeedback(
        err instanceof Error
          ? err.message
          : "Não foi possível acompanhar este desafio."
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleClaim(challengeId: string) {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) return

    try {
      setActionLoadingId(challengeId)
      const response = await claimPersistedGamificationChallenge(challengeId, token)

      if (response.summary) {
        setSummary(response.summary)
      } else {
        await loadSummary()
      }

      setFeedback(response.message || "Recompensa resgatada com sucesso.")
      dispatchGamificationRefresh()
    } catch (err) {
      setFeedback(
        err instanceof Error
          ? err.message
          : "Não foi possível resgatar a recompensa."
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8 shadow-[0_10px_50px_-28px_rgba(16,185,129,0.45)]">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              <Swords className="size-4" />
              Missões e progressão persistida
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
              Desafios
            </h1>

            <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
              Agora o acompanhamento e o resgate de desafios ficam salvos por usuário
              no backend da plataforma.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <MetricCard label="Ativos" value={String(activeChallenges)} />
              <MetricCard label="Prontos para pegar" value={String(readyToClaimCount)} />
              <MetricCard label="Resgatados" value={String(claimedCount)} />
              <MetricCard label="Total XP" value={`${summary.profile.totalXP}`} />
            </div>

            {feedback ? (
              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {feedback}
              </div>
            ) : null}

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#030b1d] p-6">
            <p className="text-sm text-slate-400">Resumo do ciclo atual</p>

            <div className="mt-5 space-y-4">
              <SummaryRow
                icon={<Clock3 className="size-4 text-[#79a6ff]" />}
                label="Desafios diários"
                value={`${dailyChallenges.length} disponíveis`}
              />
              <SummaryRow
                icon={<CalendarRange className="size-4 text-[#79a6ff]" />}
                label="Desafios semanais"
                value={`${weeklyChallenges.length} em rotação`}
              />
              <SummaryRow
                icon={<Crown className="size-4 text-[#79a6ff]" />}
                label="Desafios especiais"
                value={`${specialChallenges.length} em destaque`}
              />
              <SummaryRow
                icon={<Sparkles className="size-4 text-[#79a6ff]" />}
                label="Streak atual"
                value={`${summary.profile.streakDays} dia(s)`}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              O status dos desafios agora é sincronizado com a sua conta, e não apenas
              com este navegador.
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
              <Clock3 className="size-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Diários
              </h2>
              <p className="mt-1 text-sm text-[#7ea0d6]">
                Missões curtas para manter ritmo
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {dailyChallenges.map((item) => (
              <CompactChallengeItem
                key={item.id}
                item={item}
                onClaim={handleClaim}
                loading={actionLoadingId === item.id}
              />
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
              <CalendarRange className="size-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Semanais
              </h2>
              <p className="mt-1 text-sm text-[#7ea0d6]">
                Metas com mais impacto no avanço
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {weeklyChallenges.map((item) => (
              <CompactChallengeItem
                key={item.id}
                item={item}
                onClaim={handleClaim}
                loading={actionLoadingId === item.id}
              />
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
              <Crown className="size-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Especiais
              </h2>
              <p className="mt-1 text-sm text-[#7ea0d6]">
                Eventos com recompensa maior
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {specialChallenges.map((item) => (
              <CompactChallengeItem
                key={item.id}
                item={item}
                onClaim={handleClaim}
                loading={actionLoadingId === item.id}
              />
            ))}
          </div>
        </article>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Todos os desafios
          </h2>
          <p className="mt-2 text-base text-[#7ea0d6]">
            Visão detalhada por missão, progresso, recompensa e persistência
          </p>
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-[#071225] p-8 text-slate-300">
            Carregando desafios...
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {challenges.map((item) => (
              <ChallengeCard
                key={item.id}
                item={item}
                onTrack={handleTrack}
                onClaim={handleClaim}
                loading={actionLoadingId === item.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}