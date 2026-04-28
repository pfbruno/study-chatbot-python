"use client"

import type { GamificationProfile } from "@/lib/api"
import type { StudyProgressSnapshot } from "@/lib/study-progress"

export type ChallengeStatus =
  | "active"
  | "ready_to_claim"
  | "claimed"
  | "locked"

export type ChallengeDifficulty = "easy" | "medium" | "hard"
export type ChallengeType = "daily" | "weekly" | "special"

export type ChallengeItem = {
  id: string
  title: string
  description: string
  type: ChallengeType
  difficulty: ChallengeDifficulty
  status: ChallengeStatus
  progress: number
  target: number
  xpReward: number
  rewardLabel: string
  expiresIn: string
  icon: "target" | "brain" | "flame" | "rocket" | "award" | "trophy"
  isTracked: boolean
}

export type LocalChallengeState = {
  trackedChallengeId: string | null
  claimedChallengeIds: string[]
  claimedXP: number
  updatedAt: string | null
}

export const LOCAL_CHALLENGE_STATE_KEY = "studypro_local_challenge_state_v1"
export const STUDY_CHALLENGES_UPDATED_EVENT = "studypro:challenges-updated"

const EMPTY_STATE: LocalChallengeState = {
  trackedChallengeId: null,
  claimedChallengeIds: [],
  claimedXP: 0,
  updatedAt: null,
}

function isBrowser() {
  return typeof window !== "undefined"
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback

  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (!isBrowser()) return
  localStorage.setItem(key, JSON.stringify(value))
}

function dispatchChallengesUpdated() {
  if (!isBrowser()) return
  window.dispatchEvent(new CustomEvent(STUDY_CHALLENGES_UPDATED_EVENT))
}

function updateState(next: LocalChallengeState) {
  writeJson(LOCAL_CHALLENGE_STATE_KEY, next)
  dispatchChallengesUpdated()
  return next
}

export function getChallengeState(): LocalChallengeState {
  const parsed = readJson<LocalChallengeState>(LOCAL_CHALLENGE_STATE_KEY, EMPTY_STATE)

  if (!parsed || typeof parsed !== "object") {
    return { ...EMPTY_STATE }
  }

  return {
    trackedChallengeId:
      typeof parsed.trackedChallengeId === "string"
        ? parsed.trackedChallengeId
        : null,
    claimedChallengeIds: Array.isArray(parsed.claimedChallengeIds)
      ? parsed.claimedChallengeIds
      : [],
    claimedXP: Number(parsed.claimedXP ?? 0),
    updatedAt: parsed.updatedAt ?? null,
  }
}

export function setTrackedChallenge(challengeId: string | null) {
  const current = getChallengeState()

  const next: LocalChallengeState = {
    ...current,
    trackedChallengeId,
    updatedAt: new Date().toISOString(),
  }

  return updateState(next)
}

function baseDefinitions(progress: StudyProgressSnapshot) {
  const questions = progress.totalAnsweredQuestions
  const simulations = progress.totalCompletedSimulations

  return [
    {
      id: "daily-questions-20",
      title: "Sprint de 20 questões",
      description:
        "Resolva 20 questões em simulados para começar a subir seu volume de treino.",
      type: "daily" as const,
      difficulty: "easy" as const,
      progress: questions,
      target: 20,
      xpReward: 90,
      rewardLabel: "Bônus de consistência",
      icon: "target" as const,
    },
    {
      id: "weekly-questions-50",
      title: "Volume de 50 questões",
      description:
        "Acumule 50 respostas em simulados para consolidar ritmo de resolução.",
      type: "weekly" as const,
      difficulty: "medium" as const,
      progress: questions,
      target: 50,
      xpReward: 220,
      rewardLabel: "Boost de treino",
      icon: "brain" as const,
    },
    {
      id: "weekly-simulado-1",
      title: "Primeiro simulado concluído",
      description:
        "Finalize um simulado completo para registrar histórico e desempenho.",
      type: "weekly" as const,
      difficulty: "easy" as const,
      progress: simulations,
      target: 1,
      xpReward: 120,
      rewardLabel: "Marco inicial",
      icon: "award" as const,
    },
    {
      id: "weekly-simulado-3",
      title: "Trilogia de simulados",
      description:
        "Conclua 3 simulados para construir regularidade e base estatística de desempenho.",
      type: "weekly" as const,
      difficulty: "medium" as const,
      progress: simulations,
      target: 3,
      xpReward: 260,
      rewardLabel: "Selo de persistência",
      icon: "flame" as const,
    },
    {
      id: "special-simulado-5",
      title: "Maratona de simulados",
      description:
        "Chegue a 5 simulados concluídos e entre na zona alta da progressão gamificada.",
      type: "special" as const,
      difficulty: "hard" as const,
      progress: simulations,
      target: 5,
      xpReward: 420,
      rewardLabel: "Baú premium",
      icon: "trophy" as const,
    },
    {
      id: "special-questions-100",
      title: "Centena resolvida",
      description:
        "Resolva 100 questões em simulados para desbloquear um marco de volume avançado.",
      type: "special" as const,
      difficulty: "hard" as const,
      progress: questions,
      target: 100,
      xpReward: 500,
      rewardLabel: "Distintivo competitivo",
      icon: "rocket" as const,
    },
  ]
}

export function buildChallengeCatalog(
  progress: StudyProgressSnapshot,
  state: LocalChallengeState = getChallengeState()
): ChallengeItem[] {
  return baseDefinitions(progress).map((item) => {
    const reachedTarget = item.progress >= item.target
    const alreadyClaimed = state.claimedChallengeIds.includes(item.id)

    let status: ChallengeStatus = "active"
    if (reachedTarget && alreadyClaimed) status = "claimed"
    else if (reachedTarget) status = "ready_to_claim"

    return {
      ...item,
      status,
      expiresIn:
        status === "claimed"
          ? "Recompensa resgatada"
          : status === "ready_to_claim"
          ? "Pronto para pegar"
          : "Em andamento",
      isTracked: state.trackedChallengeId === item.id,
    }
  })
}

export function claimChallengeReward(
  challengeId: string,
  progress: StudyProgressSnapshot
) {
  const current = getChallengeState()
  const challenge = buildChallengeCatalog(progress, current).find(
    (item) => item.id === challengeId
  )

  if (!challenge) {
    return {
      success: false,
      message: "Desafio não encontrado.",
      challenge: null,
      state: current,
    }
  }

  if (challenge.status === "claimed") {
    return {
      success: false,
      message: "Este desafio já foi resgatado.",
      challenge,
      state: current,
    }
  }

  if (challenge.status !== "ready_to_claim") {
    return {
      success: false,
      message: "Este desafio ainda não está pronto para resgate.",
      challenge,
      state: current,
    }
  }

  const next: LocalChallengeState = {
    ...current,
    claimedChallengeIds: [...current.claimedChallengeIds, challenge.id],
    claimedXP: current.claimedXP + challenge.xpReward,
    updatedAt: new Date().toISOString(),
  }

  updateState(next)

  return {
    success: true,
    message: `+${challenge.xpReward} XP resgatados com sucesso.`,
    challenge,
    state: next,
  }
}

export function applyLocalChallengeRewardsToProfile(
  profile: GamificationProfile,
  state: LocalChallengeState = getChallengeState()
): GamificationProfile {
  const claimedXP = Math.max(0, state.claimedXP || 0)
  const claimedCount = state.claimedChallengeIds.length

  if (claimedXP === 0 && claimedCount === 0) {
    return profile
  }

  let level = Math.max(1, profile.level || 1)
  let currentXP = Math.max(0, profile.currentXP || 0)
  let nextLevelXP = Math.max(1, profile.nextLevelXP || 800)
  let remainingXP = claimedXP

  while (remainingXP > 0) {
    const spaceLeft = nextLevelXP - currentXP

    if (remainingXP >= spaceLeft) {
      remainingXP -= spaceLeft
      level += 1
      currentXP = 0
      nextLevelXP += 200
    } else {
      currentXP += remainingXP
      remainingXP = 0
    }
  }

  return {
    ...profile,
    level,
    currentXP,
    nextLevelXP,
    totalXP: (profile.totalXP || 0) + claimedXP,
    completedChallenges: Math.max(profile.completedChallenges || 0, claimedCount),
  }
}