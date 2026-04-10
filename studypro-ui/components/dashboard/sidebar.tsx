"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  FileText,
  LogOut,
  Menu,
  PenTool,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const AUTH_TOKEN_KEY = "studypro_auth_token";
const AUTH_USER_KEY = "studypro_auth_user";

type SidebarUser = {
  id: number;
  name: string;
  email: string;
  plan: "free" | "pro";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const navigation = [
  { name: "Provas", href: "/dashboard/provas", icon: FileText },
  { name: "Simulados", href: "/dashboard/simulados", icon: PenTool },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Perfil", href: "/dashboard/perfil", icon: User },
];

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
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    return parts
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

  return (
    <>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 lg:hidden">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
            <span className="text-lg font-semibold">◫</span>
          </div>
          <span className="text-2xl font-semibold">StudyPro</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-white/10 p-2 text-white"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-black/95 transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white">
              <span className="text-lg font-semibold">◫</span>
            </div>
            <span className="text-2xl font-semibold">StudyPro</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition-colors",
                    isActive
                      ? "bg-blue-500/15 text-white"
                      : "text-white/75 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name || "Usuário"}
                </p>
                <p className="truncate text-xs text-white/60">
                  {user?.email || "Faça login"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/80 transition hover:text-white"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}