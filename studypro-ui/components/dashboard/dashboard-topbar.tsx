"use client"

import type { ReactNode } from "react"

import type {
  GamificationProfile,
  GamificationWeeklyEvolutionPoint,
} from "@/lib/api"
import { GamificationHud } from "@/components/dashboard/gamification-hud"

type DashboardUser = {
  id?: number | string
  name?: string
  email?: string
}

type DashboardTopbarProps = {
  searchQuery: string
  onSearchChange: (value: string) => void
  user: DashboardUser | null
  avatarLabel: string
  mobileSidebar?: ReactNode
  gamificationProfile?: GamificationProfile | null
  weeklyEvolution?: GamificationWeeklyEvolutionPoint[]
  gamificationLoading?: boolean
}

export function DashboardTopbar({
  user,
  avatarLabel,
  mobileSidebar,
  gamificationProfile,
  weeklyEvolution = [],
  gamificationLoading = false,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
      <div className="flex min-h-[76px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="lg:hidden">{mobileSidebar}</div>

        {gamificationProfile ? (
          <GamificationHud
            profile={gamificationProfile}
            weeklyEvolution={weeklyEvolution}
            loading={gamificationLoading}
          />
        ) : null}

        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">
                {user?.name || "Aluno MinhAprovação"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email || "Ãrea do aluno"}
              </p>
            </div>

            <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white ring-1 ring-white/10">
              {avatarLabel}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
