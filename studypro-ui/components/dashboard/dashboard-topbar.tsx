"use client"

import { Bell, Search } from "lucide-react"

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
  mobileSidebar?: React.ReactNode
}

export function DashboardTopbar({
  searchQuery,
  onSearchChange,
  user,
  avatarLabel,
  mobileSidebar,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/65 backdrop-blur-xl">
      <div className="flex h-18 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="lg:hidden">{mobileSidebar}</div>

        <div className="relative hidden flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
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
  )
}