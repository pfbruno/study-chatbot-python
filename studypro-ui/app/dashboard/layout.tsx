"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import type { DashboardUser as AuthLikeUser } from "@/lib/api"
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/api"
import {
  dispatchGamificationRefresh,
  fetchGamificationSummary,
  GAMIFICATION_REFRESH_EVENT,
  type PersistedGamificationSummaryResponse,
} from "@/lib/gamification-client"
import { AppSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar"
import { GamificationProgressToast } from "@/components/dashboard/gamification-progress-toast"

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

type DashboardUser = {
  id?: number | string
  name?: string
  email?: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [isReady, setIsReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<DashboardUser | null>(null)

  const [gamification, setGamification] =
    useState<PersistedGamificationSummaryResponse>(EMPTY_GAMIFICATION)
  const [gamificationLoading, setGamificationLoading] = useState(true)

  const isChatRoute = pathname === "/dashboard/chat"

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    if (!token) {
      router.replace(
        `/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`
      )
      return
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as DashboardUser)
      } catch {
        localStorage.removeItem(AUTH_USER_KEY)
        setUser(null)
      }
    }

    setIsReady(true)
  }, [pathname, router])

  useEffect(() => {
    let mounted = true

    async function loadGamification() {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)

      if (!token) {
        if (mounted) {
          setGamification(EMPTY_GAMIFICATION)
          setGamificationLoading(false)
        }
        return
      }

      try {
        setGamificationLoading(true)
        const data = await fetchGamificationSummary(token)

        if (!mounted) return
        setGamification(data)
      } catch {
        if (!mounted) return
        setGamification(EMPTY_GAMIFICATION)
      } finally {
        if (mounted) {
          setGamificationLoading(false)
        }
      }
    }

    const handleRefresh = () => {
      void loadGamification()
    }

    if (isReady) {
      void loadGamification()
    }

    window.addEventListener(
      GAMIFICATION_REFRESH_EVENT,
      handleRefresh as EventListener
    )

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible" && isReady) {
        void loadGamification()
      }
    }, 12000)

    return () => {
      mounted = false
      window.removeEventListener(
        GAMIFICATION_REFRESH_EVENT,
        handleRefresh as EventListener
      )
      window.clearInterval(intervalId)
    }
  }, [isReady])

  const avatarLabel = useMemo(() => {
    if (!user?.name) return "SP"

    return user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
  }, [user])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando área do aluno...
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardTopbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          user={user}
          avatarLabel={avatarLabel}
          mobileSidebar={<AppSidebar />}
          gamificationProfile={gamification.profile}
          weeklyEvolution={gamification.weeklyEvolution}
          challenges={gamification.challenges}
          gamificationLoading={gamificationLoading}
        />

        <GamificationProgressToast
          profile={gamification.profile}
          challenges={gamification.challenges}
        />

        <main
          className={
            isChatRoute
              ? "min-h-0 flex-1 overflow-hidden"
              : "min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8"
          }
        >
          {children}
        </main>
      </div>
    </div>
  )
}