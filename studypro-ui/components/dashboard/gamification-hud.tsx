"use client"

import { Flame, Trophy } from "lucide-react"

import type {
  GamificationProfile,
  GamificationWeeklyEvolutionPoint,
} from "@/lib/api"

type GamificationHudProps = {
  profile: GamificationProfile
  weeklyEvolution: GamificationWeeklyEvolutionPoint[]
  loading?: boolean
}

function buildWeeklySquares(
  weeklyEvolution: GamificationWeeklyEvolutionPoint[],
  fallbackStreakDays: number
) {
  return Array.from({ length: 7 }, (_, index) => {
    const point = weeklyEvolution[index]

    return {
      label: point?.label ?? `Dia ${index + 1}`,
      active: point ? point.xp > 0 : index < Math.min(fallbackStreakDays, 7),
      xp: point?.xp ?? 0,
    }
  })
}

export function GamificationHud({
  profile,
  weeklyEvolution,
  loading = false,
}: GamificationHudProps) {
  const nextLevelXP = Math.max(profile.nextLevelXP || 1, 1)
  const currentXP = Math.max(profile.currentXP || 0, 0)
  const progressPercentage = Math.max(
    0,
    Math.min(100, Math.round((currentXP / nextLevelXP) * 100))
  )

  const weeklySquares = buildWeeklySquares(
    weeklyEvolution,
    profile.streakDays || 0
  )

  return (
    <div className="hidden min-w-0 items-center gap-3 xl:flex">
      <div className="flex min-w-[240px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Trophy className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-white">
              Nível {loading ? "..." : profile.level}
            </p>
            <p className="text-xs text-slate-400">
              {loading ? "..." : `${profile.currentXP}/${profile.nextLevelXP} XP`}
            </p>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${loading ? 0 : progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
          <Flame className="size-4" />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
            Streak semanal
          </p>

          <div className="mt-2 flex items-center gap-1.5">
            {weeklySquares.map((square, index) => (
              <div
                key={`${square.label}-${index}`}
                title={`${square.label}${square.active ? ` • ${square.xp} XP` : ""}`}
                className={`size-4 rounded-md border transition ${
                  square.active
                    ? "border-sky-400/40 bg-sky-400"
                    : "border-white/10 bg-white/5"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}