"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import {
  Check,
  Clock3,
  Crown,
  CreditCard,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"

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
  const [entitlements, setEntitlements] = useState<BillingEntitlements | null>(
    null
  )
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const canceled = useMemo(
    () => searchParams.get("canceled") === "1",
    [searchParams]
  )

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

    void loadCurrentUser()
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
        throw new Error("O backend não retornou a URL de checkout.")
      }

      window.location.href = data.checkout_url
    } catch (error) {
      const rawMessage =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao iniciar o checkout."

      const normalizedMessage = /Failed to fetch/i.test(rawMessage)
        ? "Não foi possível conectar ao checkout. Verifique se o backend no Render está online e se as variáveis STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET e FRONTEND_BASE_URL estão configuradas corretamente."
        : rawMessage

      setErrorMessage(normalizedMessage)
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
                Desbloqueie o Pro e mantenha seu ritmo de estudo
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                O gratuito serve para experimentar. O Pro serve para transformar
                intenção em constância, com mais prática, mais leitura de
                desempenho e menos travas durante a preparação.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MetricCard
                  icon={<TrendingUp className="size-4 text-primary" />}
                  label="Mais prática"
                  value="sem travas"
                />
                <MetricCard
                  icon={<Clock3 className="size-4 text-primary" />}
                  label="Mais ritmo"
                  value="todos os dias"
                />
                <MetricCard
                  icon={<ShieldCheck className="size-4 text-primary" />}
                  label="Checkout"
                  value="seguro"
                />
              </div>

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

              <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-slate-200">
                Cada bloqueio no plano gratuito interrompe o seu fluxo. O Pro
                existe para eliminar essa fricção.
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
          <article className="glass-panel rounded-[32px] border border-primary/20 bg-primary/[0.08] p-6 md:p-8 shadow-[0_18px_60px_-24px_rgba(59,130,246,0.65)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              <Crown className="size-4" />
              Plano Pro
            </div>

            <div className="mt-6 flex items-end gap-3">
              <span className="text-5xl font-bold text-white">R$ 29</span>
              <span className="pb-2 text-sm text-muted-foreground">/mês</span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Menos que R$ 1 por dia
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Cancelamento simples
              </span>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-300">
              Para quem quer manter consistência de estudo, sem depender do
              limite gratuito e sem perder ritmo exatamente quando está focado.
            </p>

            <div className="mt-8 space-y-3">
              <FeatureItem text="Simulados ilimitados" />
              <FeatureItem text="Mais prática por dia" />
              <FeatureItem text="Análise de desempenho completa" />
              <FeatureItem text="Insights inteligentes" />
              <FeatureItem text="Checkout seguro com gateway configurado" />
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
                ? "Abrindo checkout..."
                : authToken
                ? "Desbloquear Pro agora"
                : "Entrar para assinar"}
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="size-4" />
              O pagamento só funciona quando o backend, o price ID e o webhook
              estiverem configurados corretamente.
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
              <PlanRow
                feature="Ritmo de estudo"
                free="Interrompido"
                pro="Contínuo"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">
                Posicionamento real da oferta
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                O usuário não compra só “mais recursos”. Ele compra continuidade,
                menos fricção e mais volume de estudo quando está motivado.
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-slate-200">
              Quanto mais vezes você trava no gratuito, maior a chance de perder
              ritmo. O Pro resolve exatamente esse problema.
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="glass-panel rounded-[28px] p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              <Sparkles className="size-4 text-primary" />
              Para testar
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white">
              Plano Free
            </h2>

            <ul className="mt-6 space-y-3">
              <FeatureItem text="Conhecer a plataforma" />
              <FeatureItem text="Testar o fluxo do aluno" />
              <FeatureItem text="Ver correção automática" />
              <FeatureItem text="Entender a proposta do StudyPro" />
            </ul>
          </article>

          <article className="glass-panel rounded-[28px] border border-primary/20 p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Crown className="size-4" />
              Para evoluir
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white">
              Plano Pro
            </h2>

            <ul className="mt-6 space-y-3">
              <FeatureItem text="Aumentar volume de treino" />
              <FeatureItem text="Remover travas do gratuito" />
              <FeatureItem text="Estudar com mais constância" />
              <FeatureItem text="Ler evolução com mais clareza" />
            </ul>
          </article>
        </section>

        <section className="glass-panel rounded-[28px] p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">
                Transparência comercial
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Ainda não estamos exibindo depoimentos reais porque o produto
                segue em fase de ajustes e você ainda não tem base pagante
                consolidada.
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-semibold text-white">
                O que entra depois
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Quando houver alunos pagantes reais, aqui entram depoimentos
                verificados, estudos de caso e sinais de confiança baseados em
                uso real.
              </p>
            </article>
          </div>
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

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div>{icon}</div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}