"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getBillingStatus, type BillingEntitlements } from "@/lib/api";

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
  subscription_status?: string;
  current_period_end?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CheckoutResponse = {
  message: string;
  checkout_session_id: string;
  checkout_url: string;
};

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageFallback />}>
      <PricingPageContent />
    </Suspense>
  );
}

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [entitlements, setEntitlements] = useState<BillingEntitlements | null>(null);

  const canceled = useMemo(
    () => searchParams.get("canceled") === "1",
    [searchParams]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    setAuthToken(storedToken);

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
  }, []);

  useEffect(() => {
    async function loadCurrentUser() {
      if (!authToken) {
        setIsLoadingUser(false);
        return;
      }

      setIsLoadingUser(true);
      setErrorMessage("");

      try {
        const data = await getBillingStatus(authToken);
        setUser(data.user);
        setEntitlements(data.entitlements);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar sua conta."
        );
      } finally {
        setIsLoadingUser(false);
      }
    }

    loadCurrentUser();
  }, [authToken]);

  async function handleCheckout() {
    if (!authToken) {
      router.push("/login?redirect=/pricing");
      return;
    }

    if (user?.plan === "pro") {
      router.push("/dashboard/simulados");
      return;
    }

    setIsCreatingCheckout(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const message = await safeReadError(response);
        throw new Error(message || "Não foi possível iniciar o checkout.");
      }

      const data: CheckoutResponse = await response.json();

      if (!data.checkout_url) {
        throw new Error("O backend não retornou a URL de checkout do Stripe.");
      }

      window.location.href = data.checkout_url;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao iniciar o checkout."
      );
    } finally {
      setIsCreatingCheckout(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-emerald-300">
            StudyPro
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/simulados"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-200 transition hover:bg-white/5"
            >
              Simulados
            </Link>

            {!authToken ? (
              <Link
                href="/login?redirect=/pricing"
                className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-95"
              >
                Entrar
              </Link>
            ) : null}
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Monetização
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Ative o plano PRO
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-300">
            Checkout integrado ao Stripe com retorno para o StudyPro e ativação
            automática do acesso ilimitado após confirmação via webhook.
          </p>
        </section>

        {canceled ? (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            O checkout foi cancelado. Nenhuma cobrança foi concluída.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-emerald-400/30 bg-emerald-400/5 p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Plano PRO
                </p>
                <h2 className="mt-3 text-3xl font-semibold">R$ 29/mês</h2>
                <p className="mt-4 text-sm leading-7 text-neutral-300">
                  Fluxo preparado para Stripe Checkout com retorno ao StudyPro e
                  liberação automática do uso ilimitado.
                </p>
              </div>

              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                SaaS
              </span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <FeatureItem text="Questões e simulados sem limite diário" />
              <FeatureItem text="Plano atualizado automaticamente após pagamento" />
              <FeatureItem text="Retorno para página de sucesso do StudyPro" />
              <FeatureItem text="Sincronização de plano com backend e frontend" />
            </div>

            <div className="mt-8">
              <button
                onClick={handleCheckout}
                disabled={isCreatingCheckout || isLoadingUser}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingUser
                  ? "Carregando conta..."
                  : user?.plan === "pro"
                  ? "Você já possui PRO ativo"
                  : isCreatingCheckout
                  ? "Redirecionando para o Stripe..."
                  : authToken
                  ? "Assinar PRO"
                  : "Entrar para assinar"}
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="text-lg font-semibold text-white">Conta atual</h3>

            <div className="mt-6 space-y-4">
              <InfoRow
                label="Status"
                value={
                  isLoadingUser
                    ? "Carregando..."
                    : authToken
                    ? "Autenticado"
                    : "Não autenticado"
                }
              />
              <InfoRow
                label="Plano"
                value={user?.plan ? user.plan.toUpperCase() : "FREE"}
              />
              <InfoRow
                label="Assinatura"
                value={user?.subscription_status?.toUpperCase() || "INACTIVE"}
              />
              <InfoRow
                label="Usuário"
                value={user?.name || "Faça login para assinar"}
              />
              <InfoRow label="E-mail" value={user?.email || "—"} />
              <InfoRow
                label="Analytics avançado"
                value={
                  entitlements?.can_access_advanced_analytics
                    ? "Liberado"
                    : "Disponível no PRO"
                }
              />
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-neutral-300">
              Após o pagamento, o Stripe redireciona para{" "}
              <span className="font-semibold text-white">/success</span>. Essa
              página consulta o backend até o webhook concluir a ativação do
              plano PRO.
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/dashboard/simulados"
                className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-neutral-200 transition hover:bg-white/5"
              >
                Voltar para simulados
              </Link>

              {!authToken ? (
                <Link
                  href="/login?redirect=/pricing"
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-center text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/15"
                >
                  Fazer login
                </Link>
              ) : null}
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h3 className="text-xl font-semibold">Comparativo Free vs Pro</h3>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400">
                  <th className="py-3 pr-4 font-medium">Recurso</th>
                  <th className="py-3 pr-4 font-medium">Free</th>
                  <th className="py-3 font-medium text-emerald-300">Pro</th>
                </tr>
              </thead>
              <tbody>
                <PlanRow feature="Geração diária de simulados" free="Limitada" pro="Ilimitada" />
                <PlanRow feature="Fluxo de cobrança Stripe" free="Não" pro="Sim" />
                <PlanRow feature="Sincronização automática de plano" free="Básica" pro="Completa" />
                <PlanRow feature="Acesso contínuo a simulados" free="Parcial" pro="Total" />
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function PricingPageFallback() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-black/30 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Monetização
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            Ative o plano PRO
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-300">
            Carregando informações de pricing...
          </p>
        </section>
      </div>
    </main>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-200">
      {text}
    </div>
  );
}

function PlanRow({
  feature,
  free,
  pro,
}: {
  feature: string;
  free: string;
  pro: string;
}) {
  return (
    <tr className="border-b border-white/5">
      <td className="py-3 pr-4 text-neutral-100">{feature}</td>
      <td className="py-3 pr-4 text-neutral-400">{free}</td>
      <td className="py-3 font-medium text-emerald-200">{pro}</td>
    </tr>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 text-sm">
      <span className="text-neutral-400">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-white">
        {value}
      </span>
    </div>
  );
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
