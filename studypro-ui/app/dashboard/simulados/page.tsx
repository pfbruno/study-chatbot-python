"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  ClipboardList,
  Crown,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  createCheckoutSession,
  getBillingStatus,
  type AuthUser,
  type BillingStatusResponse,
} from "@/lib/api"

export default function SimuladosPage() {
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [billing, setBilling] = useState<BillingStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    setAuthToken(storedToken)

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser)
      } catch {
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }

    async function loadBilling(token: string | null) {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError("")
        const data = await getBillingStatus(token)
        setBilling(data)
        setUser(data.user)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar o estado do seu plano."
        )
      } finally {
        setLoading(false)
      }
    }

    loadBilling(storedToken)
  }, [])

  async function handleCheckout() {
    if (!authToken) {
      window.location.href = "/login?redirect=/pricing"
      return
    }

    try {
      setCheckoutLoading(true)
      setError("")
      const data = await createCheckoutSession(authToken)
      window.location.href = data.checkout_url
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao iniciar o checkout."
      )
    } finally {
      setCheckoutLoading(false)
    }
  }

  const isPro = billing?.user.plan === "pro"
  const isFree = billing?.user.plan === "free"
  const remainingToday = billing?.usage.remaining_today ?? null
  const dailyLimit = billing?.usage.daily_limit ?? null
  const paywallActive = Boolean(isFree && remainingToday === 0)

  const cards = [
    {
      title: paywallActive ? "Limite gratuito atingido" : "Gerar simulado",
      description: paywallActive
        ? "Você já usou todo o gratuito de hoje. Faça upgrade para continuar estudando sem bloqueio."
        : "Monte um novo simulado com foco em treino, revisão e constância de prática.",
      href: paywallActive ? "/pricing" : "/dashboard/provas",
      cta: paywallActive ? "Desbloquear Pro" : "Começar",
      icon: paywallActive ? (
        <Crown className="size-5 text-primary" />
      ) : (
        <Zap className="size-5 text-primary" />
      ),
    },
    {
      title: isPro ? "Plano ativo" : "Plano Pro",
      description: isPro
        ? "Seu plano Pro está ativo. Aproveite a experiência completa do aluno."
        : "Ative recursos avançados, mais volume de prática e experiência completa do aluno.",
      href: "/pricing",
      cta: isPro ? "Ver detalhes do plano" : "Ver plano",
      icon: <Sparkles className="size-5 text-accent" />,
    },
    {
      title: "Histórico e evolução",
      description:
        "Acompanhe o que já foi resolvido e use o dashboard para guiar os próximos passos.",
      href: "/dashboard",
      cta: "Abrir dashboard",
      icon: <ClipboardList className="size-5 text-sky-300" />,
    },
  ]

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              Simulados ENEM
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
              Área de simulados do aluno
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Aqui é onde o aluno entende rapidamente o que ainda consegue usar no
              gratuito e qual o próximo passo para destravar a experiência completa.
            </p>

            {loading ? (
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                Carregando seu plano...
              </div>
            ) : authToken && billing ? (
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <span className="font-medium text-white">
                  Plano {billing.user.plan.toUpperCase()}
                </span>
                <span className="text-slate-500">•</span>
                <span>
                  {isPro
                    ? "Uso liberado"
                    : dailyLimit !== null && remainingToday !== null
                    ? `${remainingToday} de ${dailyLimit} geração(ões) restantes hoje`
                    : "Uso disponível"}
                </span>
              </div>
            ) : (
              <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Faça login para acompanhar seu limite e liberar o Pro.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-sm text-muted-foreground">Fluxo recomendado</p>

            <div className="mt-5 space-y-4">
              {[
                "1. Escolher prova ou categoria",
                "2. Resolver questões",
                "3. Ver resultado e revisar erros",
                "4. Subir para o Pro se quiser mais volume e mais consistência",
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {paywallActive ? (
        <section className="glass-panel rounded-[32px] border border-primary/20 bg-primary/10 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-slate-950/60 px-4 py-1 text-sm text-primary">
                <Crown className="size-4" />
                Paywall ativo
              </div>

              <h2 className="mt-5 text-2xl font-bold text-white md:text-4xl">
                Você atingiu o limite gratuito
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
                Continue estudando com simulados ilimitados, mais prática e leitura
                de desempenho mais completa.
              </p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <div className="space-y-3 text-sm text-slate-300">
                <PaywallItem text="Continue sem esperar outro ciclo de uso" />
                <PaywallItem text="Estude com mais volume por dia" />
                <PaywallItem text="Tenha mais clareza sobre sua evolução" />
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {checkoutLoading ? "Redirecionando..." : "Desbloquear Pro"}
                </button>

                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Ver comparação completa
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="glass-panel rounded-[28px] p-6 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
              {card.icon}
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-white">
              {card.title}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              {card.description}
            </p>

            <Link
              href={card.href}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
            >
              {card.cta}
              <ArrowRight className="size-4" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}

function PaywallItem({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      {text}
    </div>
  )
}