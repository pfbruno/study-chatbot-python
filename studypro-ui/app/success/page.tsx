"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

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

type SyncStatus =
  | "checking"
  | "success"
  | "pending"
  | "unauthenticated"
  | "error";

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessPageFallback />}>
      <SuccessPageContent />
    </Suspense>
  );
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = useMemo(() => searchParams.get("session_id"), [searchParams]);

  const [status, setStatus] = useState<SyncStatus>("checking");
  const [message, setMessage] = useState(
    "Confirmando pagamento e sincronizando o plano PRO..."
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const syncPlan = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      setStatus("unauthenticated");
      setMessage(
        "Sua sessão não foi encontrada. Faça login novamente para sincronizar o plano."
      );
      return;
    }

    setStatus("checking");
    setMessage("Confirmando pagamento e sincronizando o plano PRO...");
    setIsRetrying(true);

    try {
      for (let attempt = 1; attempt <= 8; attempt += 1) {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const error = await safeReadError(response);
          throw new Error(error || "Não foi possível sincronizar sua conta.");
        }

        const data: AuthMeResponse = await response.json();
        setUser(data.user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

        if (data.user.plan === "pro") {
          setStatus("success");
          setMessage("Pagamento confirmado. Seu plano PRO já está ativo.");
          setIsRetrying(false);
          return;
        }

        await wait(1500);
      }

      setStatus("pending");
      setMessage(
        "O pagamento foi concluído, mas a ativação ainda não apareceu na sua conta. Aguarde alguns segundos e consulte novamente."
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao sincronizar o plano."
      );
    } finally {
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    syncPlan();
  }, [syncPlan]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Checkout concluído
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Retorno do Stripe
          </h1>

          <p className="mt-4 text-base leading-7 text-neutral-300">
            {message}
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="space-y-3 text-sm">
              <InfoRow
                label="Status de sincronização"
                value={renderStatus(status)}
              />
              <InfoRow
                label="Sessão Stripe"
                value={sessionId || "não informada"}
              />
              <InfoRow
                label="Plano atual"
                value={user?.plan?.toUpperCase() || "FREE"}
              />
              <InfoRow label="Usuário" value={user?.email || "—"} />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={syncPlan}
              disabled={isRetrying}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRetrying ? "Consultando..." : "Consultar novamente"}
            </button>

            <Link
              href="/dashboard/simulados"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-neutral-200 transition hover:bg-white/5"
            >
              Ir para simulados
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-neutral-200 transition hover:bg-white/5"
            >
              Voltar para pricing
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function SuccessPageFallback() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Checkout concluído
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Retorno do Stripe
          </h1>
          <p className="mt-4 text-base leading-7 text-neutral-300">
            Carregando status do pagamento...
          </p>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
      <span className="text-neutral-400">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-white">
        {value}
      </span>
    </div>
  );
}

function renderStatus(status: SyncStatus): string {
  switch (status) {
    case "checking":
      return "verificando";
    case "success":
      return "pro ativo";
    case "pending":
      return "aguardando webhook";
    case "unauthenticated":
      return "login necessário";
    case "error":
      return "erro";
    default:
      return "desconhecido";
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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