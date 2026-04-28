"use client"

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

import {
  buildChallengeCatalog,
  claimChallengeReward,
  getChallengeState,
  setTrackedChallenge,
  STUDY_CHALLENGES_UPDATED_EVENT,
  type ChallengeDifficulty,
  type ChallengeItem,
  type ChallengeStatus,
  type ChallengeType,
} from "@/lib/challenges"
import {
  getStudyProgress,
  STUDY_PROGRESS_UPDATED_EVENT,
  type StudyProgressSnapshot,
} from "@/lib/study-progress"

const EMPTY_PROGRESS: StudyProgressSnapshot = {
  totalAnsweredQuestions: 0,
  totalCompletedSimulations: 0,
  totalCorrectAnswers: 0,
  completedAttemptIds: [],
  updatedAt: null,
}

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
  return "border-[#2f7cff]/30 bg-[#2f7cff]/10 text-[#79a6ff]"
}

function statusLabel(status: ChallengeStatus) {
  if (status === "claimed") return "Resgatado"
  if (status === "ready_to_claim") return "Pronto para pegar"
  if (status === "locked") return "Bloqueado"
  return "Ativo"
}

function iconForChallenge(icon: ChallengeItem["icon"]) {
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

function ChallengeCard({
  item,
  onTrack,
  onClaim,
}: {
  item: ChallengeItem
  onTrack: (challengeId: string) => void
  onClaim: (challengeId: string) => void
}) {
  const Icon = iconForChallenge(item.icon)
  const progress =
    item.target > 0 ? Math.round((item.progress / item.target) * 100) : 0

  const buttonLabel =
    item.status === "claimed"
      ? "Resgatado"
      : item.status === "ready_to_claim"
      ? "Pegar"
      : item.isTracked
      ? "Acompanhando"
      : "Acompanhar"

  const buttonClassName =
    item.status === "claimed"
      ? "bg-emerald-400/20 text-emerald-200 cursor-default"
      : item.status === "ready_to_claim"
      ? "bg-amber-400 text-[#071225] hover:opacity-90"
      : item.isTracked
      ? "bg-[#79a6ff] text-[#071225] hover:opacity-90"
      : "bg-[#4b8df7] text-white hover:opacity-90"

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
            disabled={item.status === "claimed"}
            onClick={() =>
              item.status === "ready_to_claim"
                ? onClaim(item.id)
                : onTrack(item.id)
            }
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${buttonClassName}`}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </article>
  )
}

function CompactChallengeItem({
  item,
  onClaim,
}: {
  item: ChallengeItem
  onClaim: (challengeId: string) => void
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
              className="mt-3 rounded-xl bg-amber-400 px-3 py-2 text-xs font-semibold text-[#071225]"
            >
              Pegar recompensa
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

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
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

export default function DesafiosPage() {
  const [progress, setProgress] = useState<StudyProgressSnapshot>(EMPTY_PROGRESS)
  const [challengeState, setChallengeState] = useState(getChallengeState())
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    const sync = () => {
      setProgress(getStudyProgress())
      setChallengeState(getChallengeState())
    }

    sync()
    window.addEventListener("storage", sync)
    window.addEventListener(
      STUDY_PROGRESS_UPDATED_EVENT,
      sync as EventListener
    )
    window.addEventListener(
      STUDY_CHALLENGES_UPDATED_EVENT,
      sync as EventListener
    )

    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener(
        STUDY_PROGRESS_UPDATED_EVENT,
        sync as EventListener
      )
      window.removeEventListener(
        STUDY_CHALLENGES_UPDATED_EVENT,
        sync as EventListener
      )
    }
  }, [])

  const challenges = useMemo(
    () => buildChallengeCatalog(progress, challengeState),
    [progress, challengeState]
  )

  const dailyChallenges = challenges.filter((item) => item.type === "daily")
  const weeklyChallenges = challenges.filter((item) => item.type === "weekly")
  const specialChallenges = challenges.filter((item) => item.type === "special")

  const activeChallenges = challenges.filter((item) => item.status === "active").length
  const readyToClaimCount = challenges.filter(
    (item) => item.status === "ready_to_claim"
  ).length
  const claimedCount = challenges.filter((item) => item.status === "claimed").length

  const claimedXP = challengeState.claimedXP

  function handleTrack(challengeId: string) {
    const currentTracked = challengeState.trackedChallengeId
    const nextTracked = currentTracked === challengeId ? null : challengeId
    setTrackedChallenge(nextTracked)
    setChallengeState(getChallengeState())

    const trackedItem = challenges.find((item) => item.id === challengeId)
    if (trackedItem) {
      setFeedback(
        nextTracked
          ? `Agora você está acompanhando: ${trackedItem.title}.`
          : `Você deixou de acompanhar: ${trackedItem.title}.`
      )
    }
  }

  function handleClaim(challengeId: string) {
    const result = claimChallengeReward(challengeId, progress)
    setChallengeState(getChallengeState())
    setFeedback(result.message)
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8 shadow-[0_10px_50px_-28px_rgba(16,185,129,0.45)]">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              <Swords className="size-4" />
              Missões e progressão ativa
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
              Desafios
            </h1>

            <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
              Agora você pode acompanhar desafios, concluir metas, resgatar XP e
              refletir esse avanço diretamente no topo da plataforma.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <MetricCard label="Ativos" value={String(activeChallenges)} />
              <MetricCard label="Prontos para pegar" value={String(readyToClaimCount)} />
              <MetricCard label="Resgatados" value={String(claimedCount)} />
              <MetricCard label="XP já resgatado" value={`${claimedXP}`} />
            </div>

            {feedback ? (
              <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {feedback}
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
                label="Questões contadas"
                value={`${progress.totalAnsweredQuestions}`}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              O progresso desta tela é alimentado pelas tentativas concluídas na
              área de simulados, e o resgate de XP é salvo localmente por conta de navegador.
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
            Visão detalhada por missão, progresso, recompensa e estado de resgate
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {challenges.map((item) => (
            <ChallengeCard
              key={item.id}
              item={item}
              onTrack={handleTrack}
              onClaim={handleClaim}
            />
          ))}
        </div>
      </section>
    </div>
  )
}