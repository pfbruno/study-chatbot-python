"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  BookOpen,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Medal,
  Menu,
  MessageSquare,
  Swords,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const mainItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Provas",
    href: "/dashboard/provas",
    icon: GraduationCap,
  },
  {
    label: "Simulados",
    href: "/dashboard/simulados",
    icon: BookOpen,
  },
  {
    label: "Treinar",
    href: "/dashboard/treinar",
    icon: Target,
    badge: "rápido",
  },
  {
    label: "Chat IA",
    href: "/dashboard/chat",
    icon: MessageSquare,
    badge: "novo",
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

const gamificationItems: SidebarItem[] = [
  {
    label: "Conquistas",
    href: "/dashboard/conquistas",
    icon: Award,
    badge: "beta",
  },
  {
    label: "Desafios",
    href: "/dashboard/desafios",
    icon: Swords,
  },
  {
    label: "Ranking",
    href: "/dashboard/ranking",
    icon: Medal,
  },
];

const accountItems: SidebarItem[] = [
  {
    label: "Planos",
    href: "/pricing",
    icon: CreditCard,
  },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: SidebarItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="px-3 pb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>

      <nav className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActiveRoute(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={[
                "flex items-center justify-between rounded-2xl px-3 py-3 transition",
                active
                  ? "bg-blue-500/15 text-white ring-1 ring-blue-500/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              <span className="flex items-center gap-3">
                <Icon className="size-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </span>

              {item.badge ? (
                <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-300">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <img
            src="/logo.png"
            alt="MinhAprovação"
            className="size-10 shrink-0 rounded-2xl object-cover shadow-[0_14px_40px_-18px_rgba(59,130,246,0.95)]"
          />
          <div>
            <div className="text-base font-semibold text-white">
              MinhAprovação
            </div>
            <div className="text-xs text-slate-400">
              Plataforma de estudos
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavSection
          title="Principal"
          items={mainItems}
          pathname={pathname}
          onNavigate={onNavigate}
        />

        <NavSection
          title="Gamificação"
          items={gamificationItems}
          pathname={pathname}
          onNavigate={onNavigate}
        />

        <NavSection
          title="Conta"
          items={accountItems}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/80">
            Plano atual
          </div>
          <div className="mt-2 text-lg font-semibold text-white">Free</div>
          <p className="mt-2 text-sm leading-6 text-amber-50/90">
            Desbloqueie analytics avançado, simulados premium, ranking e
            evolução gamificada.
          </p>
          <Link
            href="/pricing"
            onClick={onNavigate}
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90"
          >
            Ver plano Pro
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <aside className="hidden w-[300px] shrink-0 border-r border-white/10 bg-[#050b16] lg:block">
        <SidebarNav pathname={pathname} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[88vw] max-w-[340px] border-r border-white/10 bg-[#050b16] shadow-2xl">
            <div className="flex items-center justify-end border-b border-white/10 px-4 py-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                aria-label="Fechar menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}