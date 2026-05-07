"use client"

import { useEffect, useMemo, useState } from "react"
import { Coins, Flame, Trophy } from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  getBillingStatus,
  type BillingUsage,
  type GamificationProfile,
  type GamificationWeeklyEvolutionPoint,
} from "@/lib/api"

type GamificationHudProps = {
  profile: GamificationProfile
  weeklyEvolution: GamificationWeeklyEvolutionPoint[]
  loading?: boolean
}

type CreditUsage = BillingUsage & {
  credits_used_today?: number | null
  daily_credit_limit?: number | null
  credits_remaining_today?: number | null
  questions_asked_today?: number | null
  simulations_generated_today?: number | null
}

function buildWeeklySquares(
  weeklyEvolution: GamificationWeeklyEvolutionPoint[],
  fallbackStreakDays: number
) {
  const orderedWeek = weeklyEvolution.slice(0, 7).reverse()

  return Array.from({ length: 7 }, (_, index) => {
    const point = orderedWeek[index]

    return {
      label: point?.label ?? `Dia ${index + 1}`,
      active: point ? point.xp > 0 : index < Math.min(fallbackStreakDays, 7),
      xp: point?.xp ?? 0,
    }
  })
}

function getCreditDisplayValue(usage: CreditUsage | null, loading: boolean) {
  if (loading) return "..."

  const plan = usage?.plan ?? "free"
  const isPro = plan === "pro"

  if (isPro) return "Ilimitado"

  const dailyLimit =
    usage?.daily_credit_limit ??
    usage?.daily_limit ??
    10

  const creditsUsed =
    usage?.credits_used_today ??
    usage?.simulations_generated_today ??
    usage?.questions_asked_today ??
    0

  return `${creditsUsed}/${dailyLimit}`
}

export function GamificationHud({
  profile,
  weeklyEvolution,
  loading = false,
}: GamificationHudProps) {
  const [creditUsage, setCreditUsage] = useState<CreditUsage | null>(null)
  const [creditLoading, setCreditLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadCredits() {
      try {
        setCreditLoading(true)

        const token = localStorage.getItem(AUTH_TOKEN_KEY)

        if (!token) {
          if (isMounted) {
            setCreditUsage(null)
          }
          return
        }

        const billing = await getBillingStatus(token)

        if (isMounted) {
          setCreditUsage(billing.usage as CreditUsage)
        }
      } catch {
        if (isMounted) {
          setCreditUsage(null)
        }
      } finally {
        if (isMounted) {
          setCreditLoading(false)
        }
      }
    }

    void loadCredits()

    function handleFocus() {
      void loadCredits()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      isMounted = false
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

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

  const creditsValue = useMemo(
    () => getCreditDisplayValue(creditUsage, creditLoading),
    [creditUsage, creditLoading]
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

      <div className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-300">
          <Coins className="size-4" />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
            Créditos
          </p>

          <p className="mt-1 text-lg font-bold leading-none text-white">
            {creditsValue}
          </p>
        </div>
      </div>
    </div>
  )
}