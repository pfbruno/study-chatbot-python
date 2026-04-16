"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react"

const AUTH_TOKEN_KEY = "studypro_auth_token"
const AUTH_USER_KEY = "studypro_auth_user"

type SidebarUser = {
  id?: number | string
  name?: string
  email?: string
  plan?: string
}

type NavItem = {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
}

const mainItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Simulados", href: "/dashboard/simulados", icon: FileText },
  { name: "Provas", href: "/dashboard/provas", icon: ClipboardList },
  { name: "Perfil", href: "/dashboard/perfil", icon: User },
  { name: "Planos", href: "/pricing", icon: CreditCard },
]

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string
  items: NavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div>
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
        {title}
      </p>

      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            !!item.href &&
            (pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href)))

          if (!item.href) {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-slate-400"
              >
                <Icon className="size-4" />
                <span>{item.name}</span>
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                isActive
                  ? "bg-primary/15 text-white ring-1 ring-primary/25"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <Icon className={isActive ? "size-4 text-primary" : "size-4"} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<SidebarUser | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    if (!storedUser) {
      setUser(null)
      return
    }

    try {
      setUser(JSON.parse(storedUser) as SidebarUser)
    } catch {
      localStorage.removeItem(AUTH_USER_KEY)
      setUser(null)
    }
  }, [pathname])

  const initials = useMemo(() => {
    if (!user?.name) return "SP"

    return user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
  }, [user])

  function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setUser(null)
    router.push("/login")
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
          <BookOpen className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">StudyPro</p>
          <p className="text-xs text-muted-foreground">Área do aluno</p>
        </div>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto px-4 py-5">
        <NavSection
          title="Principal"
          items={mainItems}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white ring-1 ring-white/10">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user?.name || "Aluno StudyPro"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email || "Conta ativa"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="size-5" />
      </button>

      <aside className="hidden h-screen w-[280px] shrink-0 border-r border-white/10 bg-slate-950/70 backdrop-blur-xl lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute left-0 top-0 h-full w-[88%] max-w-[320px] border-r border-white/10 bg-slate-950 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>

            {sidebarContent}
          </div>
        </div>
      ) : null}
    </>
  )
}