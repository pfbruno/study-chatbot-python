"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { AppSidebar } from "@/components/dashboard/sidebar"
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar"

const AUTH_TOKEN_KEY = "studypro_auth_token"
const AUTH_USER_KEY = "studypro_auth_user"

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