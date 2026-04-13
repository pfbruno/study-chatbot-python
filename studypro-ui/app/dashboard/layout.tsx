"use client"

import { Bell, Search } from "lucide-react"
import { useMemo, useState } from "react"

import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const avatarLabel = useMemo(() => {
    if (!searchQuery) return "SP"
    return searchQuery.trim().slice(0, 2).toUpperCase()
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-[#060a14]">
      <DashboardSidebar />
      <main className="pt-16 lg:pl-72 lg:pt-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#060a14]/85 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar questões, simulados, conteúdos..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-indigo-400/70"
              />
            </div>

            <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400" />
            </button>

            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 text-xs font-bold text-white">
              {avatarLabel}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
