"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Brain,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PenTool,
  Settings,
  Share2,
  Trophy,
  User,
  Users,
  Video,
  X,
} from "lucide-react"
import { useEffect, useMemo, useState, type ComponentType } from "react"

import { cn } from "@/lib/utils"

const AUTH_TOKEN_KEY = "studypro_auth_token"
const AUTH_USER_KEY = "studypro_auth_user"

type SidebarUser = {
  id: number
  name: string
  email: string
  plan: "free" | "pro"
  is_active: boolean
  created_at: string
  updated_at: string
}

type NavItem = {
  name: string
  href?: string
  icon: ComponentType<{ className?: string }>
}

const principalItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Simulados", href: "/dashboard/simulados", icon: BookOpen },
  { name: "Provas", href: "/dashboard/provas", icon: FileText },
  { name: "Analytics", href: "/dashboard", icon: BarChart3 },
  { name: "Área de Estudo", icon: Brain },
  { name: "Chat IA", icon: MessageSquare },
  { name: "Perfil", href: "/dashboard/perfil", icon: User },
  { name: "Resolver", href: "/dashboard/simulados/resolver", icon: PenTool },
]

const socialItems: NavItem[] = [
  { name: "Comunidade", icon: Users },
  { name: "Grupos", icon: Users },
  { name: "Aulas ao Vivo", icon: Video },
  { name: "Conquistas", icon: Trophy },
]

const accountItems: NavItem[] = [
  { name: "Planos", href: "/pricing", icon: CreditCard },
  { name: "Indicação", icon: Share2 },
  { name: "Configurações", icon: Settings },
]

function NavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string
  items: NavItem[]
  pathname: string
  onNavigate: () => void
}) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = !!item.href && (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))

          if (!item.href) {
            return (
              <div key={item.name} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/35" title="Disponível em breve">
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
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

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b1020] px-4 py-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-3 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">StudyPro</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-white/10 p-2 text-white"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0b1020] transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">StudyPro</span>
          </Link>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <NavGroup title="Principal" items={principalItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavGroup title="Social" items={socialItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <NavGroup title="Conta" items={accountItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">{initials}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.name || "Usuário"}</p>
                <p className="truncate text-xs text-white/60">{user?.email || "Faça login"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
