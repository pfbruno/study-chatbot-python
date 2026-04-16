"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Search } from "lucide-react"

import { DashboardSidebar } from "@/components/dashboard/sidebar"

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

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`)
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
    <div className="flex min-h-screen bg-background text-foreground">
      <DashboardSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
          <div className="flex h-18 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <DashboardSidebar />
            </div>

            <div className="relative hidden flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar questões, simulados, conteúdos..."
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-primary/60 focus:bg-white/[0.07]"
              />
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Notificações"
              >
                <Bell className="size-4" />
              </button>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-white">
                    {user?.name || "Aluno StudyPro"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email || "Área do aluno"}
                  </p>
                </div>

                <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white ring-1 ring-white/10">
                  {avatarLabel}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}