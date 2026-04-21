"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Brain,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Search,
} from "lucide-react";
import { AppSidebar } from "./app-sidebar";

function getPageMeta(pathname: string) {
  if (pathname === "/dashboard") {
    return {
      title: "Dashboard",
      description: "Acompanhe sua evolução, metas e próximos passos.",
      icon: LayoutDashboard,
    };
  }

  if (pathname.startsWith("/dashboard/provas")) {
    return {
      title: "Provas",
      description: "Explore provas anteriores, resolva e acompanhe resultados.",
      icon: GraduationCap,
    };
  }

  if (pathname.startsWith("/dashboard/simulados")) {
    return {
      title: "Simulados",
      description: "Treine com simulados e refine sua performance.",
      icon: BookOpen,
    };
  }

  if (pathname.startsWith("/dashboard/chat")) {
    return {
      title: "Chat IA",
      description: "Use IA para estudar, revisar e acelerar sua aprendizagem.",
      icon: MessageSquare,
    };
  }

  if (pathname.startsWith("/dashboard/estudo")) {
    return {
      title: "Área de Estudo",
      description: "Organize revisões, resumos e recursos do seu plano.",
      icon: Brain,
    };
  }

  return {
    title: "StudyPro",
    description: "Seu ambiente unificado de estudos.",
    icon: LayoutDashboard,
  };
}

export function DashboardTopbar() {
  const pathname = usePathname();

  const pageMeta = useMemo(() => getPageMeta(pathname), [pathname]);
  const Icon = pageMeta.icon;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07101d]/85 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-4 py-4 md:px-6">
        <AppSidebar />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="hidden size-10 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-300 md:flex">
              <Icon className="size-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-white md:text-xl">
                {pageMeta.title}
              </h1>
              <p className="hidden truncate text-sm text-slate-400 md:block">
                {pageMeta.description}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden w-full max-w-md items-center md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar questões, simulados, conteúdos..."
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500/40 focus:bg-white/[0.07]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/15 md:inline-flex"
          >
            Free
          </Link>

          <button
            type="button"
            className="relative inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
            aria-label="Notificações"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-blue-400" />
          </button>

          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-semibold text-white shadow-[0_14px_40px_-18px_rgba(59,130,246,0.95)]">
            SP
          </div>
        </div>
      </div>
    </header>
  );
}