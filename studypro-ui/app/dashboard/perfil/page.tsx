"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

const AUTH_TOKEN_KEY = "studypro_auth_token";
const AUTH_USER_KEY = "studypro_auth_user";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  plan: "free" | "pro";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AuthMeResponse = {
  user: AuthUser;
  usage: {
    scope: "user";
    plan: "free" | "pro";
    usage_date: string;
    simulations_generated_today: number;
    daily_limit: number | null;
    remaining_today: number | null;
    can_generate: boolean;
  };
};

export default function PerfilPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser) as AuthUser);
        } catch {
          localStorage.removeItem(AUTH_USER_KEY);
        }
      }

      if (!token) {
        setIsLoading(false);
        setErrorMessage("Faça login para visualizar seu perfil.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const message = await safeReadError(response);
          throw new Error(message || "Não foi possível carregar seu perfil.");
        }

        const data: AuthMeResponse = await response.json();
        setUser(data.user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar o perfil."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  const initials = useMemo(() => {
    if (!user?.name) return "SP";
    const parts = user.name.trim().split(/\s+/).filter(Boolean);
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [user]);

  return (
    <main className="space-y-8">
      <section>
        <h1 className="text-4xl font-semibold tracking-tight text-white">Perfil</h1>
        <p className="mt-2 text-base text-neutral-400">
          Gerencie suas informações pessoais
        </p>
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-500 text-3xl font-semibold text-white">
              {isLoading ? "..." : initials}
            </div>

            <h2 className="mt-6 text-3xl font-semibold text-white">
              {isLoading ? "Carregando..." : user?.name || "Usuário"}
            </h2>

            <p className="mt-2 text-base text-neutral-400">
              {isLoading ? "Carregando e-mail..." : user?.email || "—"}
            </p>

            <span
              className={`mt-4 inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                user?.plan === "pro"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-neutral-700 text-neutral-200"
              }`}
            >
              {user?.plan === "pro" ? "Premium" : "Free"}
            </span>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-white/10 pt-8">
            <div className="text-center">
              <p className="text-4xl font-semibold text-white">—</p>
              <p className="mt-1 text-sm text-neutral-400">Provas</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-semibold text-white">—</p>
              <p className="mt-1 text-sm text-neutral-400">Acerto</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-8">
          <h3 className="text-2xl font-semibold text-white">Informações pessoais</h3>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <FieldBlock label="Nome completo">
              <input
                type="text"
                value={user?.name || ""}
                readOnly
                className={inputClassName}
              />
            </FieldBlock>

            <FieldBlock label="E-mail">
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className={inputClassName}
              />
            </FieldBlock>

            <FieldBlock label="Telefone">
              <input
                type="text"
                value=""
                readOnly
                placeholder="(00) 00000-0000"
                className={inputClassName}
              />
            </FieldBlock>

            <FieldBlock label="Escola/Cursinho">
              <input
                type="text"
                value=""
                readOnly
                placeholder="Nome da instituição"
                className={inputClassName}
              />
            </FieldBlock>
          </div>

          <div className="mt-8">
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl bg-blue-500/70 px-6 py-3 text-sm font-semibold text-white opacity-70"
            >
              Salvar alterações
            </button>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-white">Assinatura</h3>

            <div className="mt-6 flex items-center gap-3">
              <span className="text-3xl font-semibold text-white">
                {user?.plan === "pro" ? "Plano Premium" : "Plano Free"}
              </span>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                  user?.plan === "pro"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-neutral-700 text-neutral-200"
                }`}
              >
                {user?.plan === "pro" ? "Ativo" : "Atual"}
              </span>
            </div>

            <p className="mt-3 text-base text-neutral-400">
              {user?.plan === "pro"
                ? "Seu acesso PRO está ativo."
                : "Seu acesso atual é Free. Faça upgrade para liberar uso ilimitado."}
            </p>
          </div>

          <Link
            href={user?.plan === "pro" ? "/pricing" : "/pricing"}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            {user?.plan === "pro" ? "Gerenciar assinatura" : "Fazer upgrade"}
          </Link>
        </div>
      </section>
    </main>
  );
}

function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-white">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-500";

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: unknown) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: string }).msg);
          }
          return "Erro de validação.";
        })
        .join(" | ");
    }

    return "Erro na requisição.";
  } catch {
    return "Erro na requisição.";
  }
}