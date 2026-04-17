"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import { Check, Crown, CreditCard, ShieldCheck, Sparkles } from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  createCheckoutSession,
  getBillingStatus,
  type AuthUser,
  type BillingEntitlements,
  type BillingUsage,
} from "@/lib/api"

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageFallback />}>
      <PricingPageContent />
    </Suspense>
  )
}

function PricingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [authToken, setAuthToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [usage, setUsage] = useState<BillingUsage | null>(null)
  const [entitlements, setEntitlements] = useState<BillingEntitlements | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const canceled = useMemo(() => searchParams.get("canceled") === "1", [searchParams])

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
  }, [])

  useEffect(() => {
    async function loadCurrentUser() {
      if (!authToken) {
        setIsLoadingUser(false)
        return
      }

      setIsLoadingUser(true)
      setErrorMessage("")

      try {
        const data = await getBillingStatus(authToken)
        setUser(data.user)
        setUsage(data.usage)
        setEntitlements(data.entitlements)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar sua conta."
        )
      } finally {
        setIsLoadingUser(false)
      }
    }

    loadCurrentUser()
  }, [authToken])

  async function handleCheckout() {
    if (!authToken) {
      router.push("/login?redirect=/pricing")
      return
    }

    if (user?.plan === "pro") {
      router.push("/dashboard/simulados")
      return
    }

    setIsCreatingCheckout(true)
    setErrorMessage("")

    try {
      const data = await createCheckoutSession(authToken)

      if (!data.checkout_url) {
        throw new Error("O backend não retornou a URL de checkout do Stripe.")
      }

      window.location.href = data.checkout_url
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao iniciar o checkout."
      )
    } finally {
      setIsCreatingCheckout(false)
    }
  }

  const isPro = user?.plan === "pro"
  const freeUsageText =
    usage?.daily_limit && usage?.remaining_today !== null
      ? `${usage.remaining_today} de ${usage.daily_limit} geração(ões) restantes hoje`
      : "Uso liberado"

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-panel rounded-[32px] p-6 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
                Monetização ENEM
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Desbloqueie o Pro e estude sem travas
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                O plano gratuito é ótimo para experimentar. O Pro é para quem quer
                mais volume de prática, leitura de desempenho e constância real na
                preparação para o ENEM.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/simulados"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                >
                  Voltar para simulados
                </Link>

                {!authToken ? (
                  <Link
                    href="/login?redirect=/pricing"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                  >
                    Fazer login
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <p className="text-sm text-muted-foreground">Sua situação atual</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoRow
                  label="Plano"
                  value={
                    isLoadingUser
                      ? "Carregando..."
                      : isPro
                      ? "PRO"
                      : authToken
                      ? "FREE"
                      : "Visitante"
                  }
                />
                <InfoRow
                  label="Uso hoje"
                  value={isLoadingUser ? "Carregando..." : freeUsageText}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Recursos avançados:{" "}
                <span className="font-semibold text-white">
                  {entitlements?.is_pro ? "liberados" : "bloqueados"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {canceled ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            O checkout foi cancelado. Nenhuma cobrança foi concluída.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
          <article className="glass-panel rounded-[32px] p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              <Crown className="size-4" />
              Plano Pro
            </div>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-bold text-white">R$ 29</span>
              <span className="pb-2 text-sm text-muted-foreground">/mês</span>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-300">
              Ideal para transformar teste em rotina. O Pro remove bloqueios e
              torna o StudyPro uma ferramenta de preparação diária.
            </p>

            <div className="mt-8 space-y-3">
              <FeatureItem text="Simulados ilimitados" />
              <FeatureItem text="Mais prática por dia" />
              <FeatureItem text="Análise de desempenho completa" />
              <FeatureItem text="Insights inteligentes" />
              <FeatureItem text="Checkout seguro com Stripe" />
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCreatingCheckout || isLoadingUser}
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_16px_50px_-18px_rgba(59,130,246,0.85)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoadingUser
                ? "Carregando conta..."
                : isPro
                ? "Seu plano PRO já está ativo"
                : isCreatingCheckout
                ? "Redirecionando para o Stripe..."
                : authToken
                ? "Desbloquear Pro"
                : "Entrar para assinar"}
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="size-4" />
              Pagamento processado com Stripe e retorno automático para o StudyPro.
            </div>
          </article>

          <article className="glass-panel rounded-[32px] p-6 md:p-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4" />
              Free vs Pro
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
              <div className="grid grid-cols-3 border-b border-white/10 bg-slate-950/70 text-sm font-medium text-white">
                <div className="px-4 py-4">Recurso</div>
                <div className="px-4 py-4">Free</div>
                <div className="px-4 py-4">Pro</div>
              </div>

              <PlanRow feature="Simulados" free="Limitado" pro="Ilimitado" />
              <PlanRow feature="Desempenho" free="Básico" pro="Completo" />
              <PlanRow feature="Insights" free="Não" pro="Sim" />
              <PlanRow feature="Velocidade de evolução" free="Menor" pro="Maior" />
            </div>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-slate-200">
              Quem usa o Free experimenta. Quem usa o Pro constrói constância.
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Depois do pagamento, o Stripe redireciona para{" "}
              <span className="font-semibold text-white">/success</span>, onde a
              conta é sincronizada automaticamente com o backend.
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="glass-panel rounded-[28px] p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              <Sparkles className="size-4 text-primary" />
              Para começar
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white">Plano Free</h2>

            <ul className="mt-6 space-y-3">
              <FeatureItem text="Conhecer a plataforma" />
              <FeatureItem text="Testar fluxo de simulados" />
              <FeatureItem text="Ver correção automática" />
              <FeatureItem text="Entender se o modelo combina com seu estudo" />
            </ul>
          </article>

          <article className="glass-panel rounded-[28px] p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Crown className="size-4" />
              Para converter
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white">Plano Pro</h2>

            <ul className="mt-6 space-y-3">
              <FeatureItem text="Aumentar volume de treino" />
              <FeatureItem text="Remover travas do gratuito" />
              <FeatureItem text="Ler evolução com mais clareza" />
              <FeatureItem text="Criar hábito diário de estudo" />
            </ul>
          </article>
        </section>
      </div>
    </main>
  )
}

function PricingPageFallback() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="glass-panel rounded-[32px] p-6 md:p-8">
          <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
            Monetização ENEM
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Desbloqueie o Pro
          </h1>
          <p className="mt-5 text-sm text-slate-300">
            Carregando informações de pricing...
          </p>
        </div>
      </div>
    </main>
  )
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm text-slate-300">
      <div className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Check className="size-3.5" />
      </div>
      <span>{text}</span>
    </div>
  )
}

function PlanRow({
  feature,
  free,
  pro,
}: {
  feature: string
  free: string
  pro: string
}) {
  return (
    <div className="grid grid-cols-3 border-t border-white/10 bg-white/5 text-sm text-slate-300">
      <div className="px-4 py-4 text-white">{feature}</div>
      <div className="px-4 py-4">{free}</div>
      <div className="px-4 py-4">{pro}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}