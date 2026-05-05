"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Sparkles, Trophy } from "lucide-react"

import type { GamificationProfile } from "@/lib/api"
import type { PersistedGamificationChallenge } from "@/lib/gamification-client"

type ToastItem = {
  id: string
  title: string
  description: string
  variant: "progress" | "completed" | "xp"
}

type Snapshot = {
  totalXP: number
  challengeStates: Record<
    string,
    {
      progress: number
      target: number
      status: string
      title: string
    }
  >
}

type GamificationProgressToastProps = {
  profile: GamificationProfile
  challenges: PersistedGamificationChallenge[]
}

const STORAGE_KEY = "studypro_gamification_snapshot_backend_v1"

function buildSnapshot(
  profile: GamificationProfile,
  challenges: PersistedGamificationChallenge[]
): Snapshot {
  return {
    totalXP: profile.totalXP ?? 0,
    challengeStates: Object.fromEntries(
      challenges.map((challenge) => [
        challenge.id,
        {
          progress: challenge.progress,
          target: challenge.target,
          status: challenge.status,
          title: challenge.title,
        },
      ])
    ),
  }
}

function readPreviousSnapshot(): Snapshot | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Snapshot
  } catch {
    return null
  }
}

function persistSnapshot(snapshot: Snapshot) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export function GamificationProgressToast({
  profile,
  challenges,
}: GamificationProgressToastProps) {
  const [queue, setQueue] = useState<ToastItem[]>([])
  const initializedRef = useRef(false)

  const currentSnapshot = useMemo(
    () => buildSnapshot(profile, challenges),
    [profile, challenges]
  )

  useEffect(() => {
    const previous = readPreviousSnapshot()

    if (!initializedRef.current) {
      initializedRef.current = true
      persistSnapshot(currentSnapshot)
      return
    }

    const nextToasts: ToastItem[] = []

    if (previous && currentSnapshot.totalXP > previous.totalXP) {
      nextToasts.push({
        id: `xp-${Date.now()}`,
        title: "XP atualizado",
        description: `+${currentSnapshot.totalXP - previous.totalXP} XP recebidos`,
        variant: "xp",
      })
    }

    for (const challenge of challenges) {
      const previousState = previous?.challengeStates?.[challenge.id]

      if (
        previousState &&
        challenge.progress > previousState.progress &&
        challenge.progress < challenge.target
      ) {
        nextToasts.push({
          id: `progress-${challenge.id}-${challenge.progress}`,
          title: "Desafio avançou",
          description: `${challenge.title}: ${challenge.progress}/${challenge.target}`,
          variant: "progress",
        })
      }

      const becameReadyToClaim =
        previousState &&
        previousState.status !== "ready_to_claim" &&
        challenge.status === "ready_to_claim"

      if (becameReadyToClaim) {
        nextToasts.push({
          id: `ready-${challenge.id}-${Date.now()}`,
          title: "Desafio concluído",
          description: `${challenge.title} • pegar recompensa`,
          variant: "completed",
        })
      }

      const becameClaimed =
        previousState &&
        previousState.status !== "claimed" &&
        challenge.status === "claimed"

      if (becameClaimed) {
        nextToasts.push({
          id: `claimed-${challenge.id}-${Date.now()}`,
          title: "Recompensa resgatada",
          description: `${challenge.title} • XP incorporado`,
          variant: "xp",
        })
      }
    }

    if (nextToasts.length > 0) {
      setQueue((current) => [...current, ...nextToasts].slice(-4))
    }

    persistSnapshot(currentSnapshot)
  }, [challenges, currentSnapshot])

  useEffect(() => {
    if (queue.length === 0) return

    const timeout = window.setTimeout(() => {
      setQueue((current) => current.slice(1))
    }, 3600)

    return () => window.clearTimeout(timeout)
  }, [queue])

  if (queue.length === 0) return null

  return (
    <div className="pointer-events-none fixed left-4 top-20 z-[80] flex w-[320px] max-w-[calc(100vw-2rem)] flex-col gap-3">
      {queue.map((toast) => (
        <article
          key={toast.id}
          className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition ${
            toast.variant === "completed"
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
              : toast.variant === "xp"
              ? "border-primary/30 bg-primary/15 text-slate-100"
              : "border-sky-400/30 bg-sky-400/15 text-slate-100"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-0.5 flex size-9 items-center justify-center rounded-xl ${
                toast.variant === "completed"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : toast.variant === "xp"
                  ? "bg-primary/20 text-primary"
                  : "bg-sky-400/20 text-sky-200"
              }`}
            >
              {toast.variant === "completed" ? (
                <Trophy className="size-4" />
              ) : (
                <Sparkles className="size-4" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              <p className="mt-1 text-sm opacity-90">{toast.description}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
