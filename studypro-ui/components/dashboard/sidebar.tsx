"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  Brain,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Share2,
  User,
  Users,
  X,
} from "lucide-react";

const AUTH_TOKEN_KEY = "studypro_auth_token";
const AUTH_USER_KEY = "studypro_auth_user";

type SidebarUser = {
  id?: number | string;
  name?: string;
  email?: string;
  plan?: string;
};

type NavItem = {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
};

const principalItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Simulados", href: "/dashboard/simulados", icon: BookOpen },
  { name: "Questões", href: "/dashboard/provas", icon: FileText },
  { name: "Chat IA", href: "/dashboard/chat", icon: MessageSquare },
  { name: "Área de Estudo", href: "/dashboard/estudo", icon: Brain },
  { name: "Analytics", href: "/dashboard", icon: BarChart3 },
  { name: "Painel Professor", href: "/dashboard/perfil", icon: User },
];

const socialItems: NavItem[] = [
  { name: "Comunidade", icon: Users },
  { name: "Grupos", icon: Users },
];

const accountItems: NavItem[] = [
  { name: "Planos", href: "/pricing", icon: CreditCard },
  { name: "Indicação", icon: Share2 },
  { name: "Configurações", icon: Settings },
];

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <p className="mb-4 px-3 text-sm font-medium text-white/40">{title}</p>

      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            !!item.href &&
            (pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href)));

          if (!item.href) {
            return (
              <button
                key={item.name}
                type="button"
                onClick={onNavigate}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[1.05rem] text-white/80 transition hover:bg-white/[0.04] hover:text-white"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-[1.05rem] transition",
                isActive
                  ? "bg-white/[0.06] text-white"
                  : "text-white/80 hover:bg-white/[0.04] hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SidebarUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (!storedUser) {
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(storedUser) as SidebarUser);
    } catch {
      localStorage.removeItem(AUTH_USER_KEY);
      setUser(null);
    }
  }, [pathname]);

  const initials = useMemo(() => {
    if (!user?.name) return "SP";

    return user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [user]);

  function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setUser(null);
    router.push("/login");
  }

  const sidebarContent = (
    <div className="flex h-full w-[260px] flex-col border-r border-white/10 bg-[#05101f]">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#22c55e] text-[#03101f]">
          <BookOpen className="h-5 w-5" />
        </div>

        <div>
          <div className="text-[1.8rem] font-semibold tracking-tight text-white">
            StudyPro
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="space-y-8">
          <NavSection
            title="Principal"
            items={principalItems}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />

          <NavSection
            title="Social"
            items={socialItems}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />

          <NavSection
            title=""
            items={accountItems}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0d1f38] text-sm font-semibold text-[#7db1ff]">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name || "Aluno StudyPro"}
            </p>
            <p className="truncate text-xs text-white/45">
              {user?.email || "Conta ativa"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[1.05rem] text-white/75 transition hover:bg-white/[0.04] hover:text-white"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden h-screen lg:block">{sidebarContent}</div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />

          <div className="absolute left-0 top-0 h-full">
            <div className="relative h-full">
              {sidebarContent}

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}