"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useState } from "react"
import { Check, CreditCard, Sparkles, Zap } from "lucide-react"

import { getBillingStatus, type BillingEntitlements } from "@/lib/api"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

const AUTH_TOKEN_KEY = "studypro_auth_token"
const AUTH_USER_KEY = "studypro_auth_user"

type AuthUser = {
  id: number
  name: string
  email: string
  plan: "free" | "pro"
  subscription_status?: string
  current_period_end?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type CheckoutResponse = {
  message: string
  checkout_session_id: string
  checkout_url: string
}

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
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [entitlements, setEntitlements] = useState<BillingEntitlements | null>(null)

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
      const response = await fetch(`${API_BASE_URL}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const message = await safeReadError(response)
        throw new Error(message || "Não foi possível iniciar o checkout.")
      }

      const data: CheckoutResponse = await response.json()

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

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-panel rounded-[32px] p-6 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
                Monetização
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Ative o plano PRO
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                Checkout integrado ao Stripe com retorno ao StudyPro e ativação
                automática do acesso após confirmação do backend.
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
              <p className="text-sm text-muted-foreground">Conta atual</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <InfoRow
                  label="Plano"
                  value={
                    isLoadingUser
                      ? "Carregando..."
                      : user?.plan === "pro"
                      ? "PRO"
                      : "Free"
                  }
                />
                <InfoRow
                  label="Status"
                  value={
                    isLoadingUser
                      ? "Carregando..."
                      : user?.subscription_status || "sem assinatura"
                  }
                />
              </div>

              {entitlements ? (
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  Recursos avançados:{" "}
                  <span className="font-semibold text-white">
                    {entitlements.is_pro ? "liberados" : "bloqueados"}
                  </span>
                </div>
              ) : null}
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

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="glass-panel rounded-[32px] p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              <Sparkles className="size-4" />
              Plano PRO
            </div>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-bold text-white">R$ 29</span>
              <span className="pb-2 text-sm text-muted-foreground">/mês</span>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-300">
              Fluxo preparado para Stripe Checkout com retorno ao StudyPro e
              liberação automática do uso ilimitado.
            </p>

            <div className="mt-8 space-y-3">
              <FeatureItem text="Checkout seguro com Stripe" />
              <FeatureItem text="Retorno automático ao StudyPro" />
              <FeatureItem text="Ativação via backend e webhook" />
              <FeatureItem text="Recursos avançados liberados" />
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={isCreatingCheckout}
              className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_16px_50px_-18px_rgba(59,130,246,0.85)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
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
          </article>

          <article className="glass-panel rounded-[32px] p-6 md:p-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4" />
              Comparativo Free vs Pro
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10">
              <div className="grid grid-cols-3 border-b border-white/10 bg-slate-950/70 text-sm font-medium text-white">
                <div className="px-4 py-4">Recurso</div>
                <div className="px-4 py-4">Free</div>
                <div className="px-4 py-4">Pro</div>
              </div>

              <PlanRow feature="Questões" free="Limitado" pro="Ilimitado" />
              <PlanRow feature="Dashboard completo" free="Parcial" pro="Completo" />
              <PlanRow feature="Insights inteligentes" free="Não" pro="Sim" />
              <PlanRow feature="Recursos avançados" free="Não" pro="Sim" />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Após o pagamento, o Stripe redireciona para{" "}
              <span className="font-semibold text-white">/success</span>. Essa
              página consulta o backend até a ativação do plano PRO ser confirmada.
            </div>
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
            Monetização
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Ative o plano PRO
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

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data?.detail === "string") {
      return data.detail
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: unknown) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: string }).msg)
          }
          return "Erro de validação."
        })
        .join(" | ")
    }

    return "Erro na requisição."
  } catch {
    return "Erro na requisição."
  }
}