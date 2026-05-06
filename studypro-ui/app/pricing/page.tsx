"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  Clock3,
  Crown,
  CreditCard,
  Loader2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  createMercadoPagoSubscription,
  getBillingPublicConfig,
  getBillingStatus,
  type AuthUser,
  type BillingEntitlements,
  type BillingPlanKey,
  type BillingPlanOption,
  type BillingPublicConfigResponse,
  type BillingUsage,
} from "@/lib/api"
import { normalizeBillingErrorMessage } from "@/lib/billing-errors"

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: Record<string, unknown>) => {
      cardForm: (config: Record<string, unknown>) => unknown
    }
  }
}

const PLAN_COPY: Record<
  BillingPlanKey,
  {
    name: string
    price: string
    period: string
    description: string
    badge: string
    helper: string
  }
> = {
  monthly: {
    name: "Pro Mensal",
    price: "R$ 19,90",
    period: "/mês",
    description: "Para continuar estudando agora sem esperar o próximo dia.",
    badge: "Baixa barreira de entrada",
    helper: "Ideal para testar o Pro com assinatura mensal.",
  },
  annual: {
    name: "Pro Anual",
    price: "R$ 149,90",
    period: "/ano",
    description: "Para estudar com constância durante a preparação.",
    badge: "Melhor custo-benefício",
    helper: "Equivale a aproximadamente R$ 12,49/mês.",
  },
}

function normalizePlanFromQuery(value: string | null): BillingPlanKey {
  return value === "annual" ? "annual" : "monthly"
}

function getPlanOption(
  publicConfig: BillingPublicConfigResponse | null,
  planKey: BillingPlanKey
): BillingPlanOption | null {
  const option = publicConfig?.plan_options?.[planKey]
  if (option) return option

  if (planKey === "monthly" && publicConfig?.stored_plan) {
    return publicConfig.stored_plan
  }

  return null
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
  const selectedPlanKey = normalizePlanFromQuery(searchParams.get("plan"))
  const selectedPlanCopy = PLAN_COPY[selectedPlanKey]

  const formReadyRef = useRef(false)
  const cardFormRef = useRef<any>(null)

  const [authToken, setAuthToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [usage, setUsage] = useState<BillingUsage | null>(null)
  const [entitlements, setEntitlements] = useState<BillingEntitlements | null>(null)
  const [publicConfig, setPublicConfig] =
    useState<BillingPublicConfigResponse | null>(null)

  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [payerEmail, setPayerEmail] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [identificationNumber, setIdentificationNumber] = useState("")
  const [identificationType, setIdentificationType] = useState("CPF")
  const [mercadoPagoLoaded, setMercadoPagoLoaded] = useState(false)

  const selectedPlan = useMemo(
    () => getPlanOption(publicConfig, selectedPlanKey),
    [publicConfig, selectedPlanKey]
  )

  const selectedAmount =
    selectedPlan?.transaction_amount ??
    (selectedPlanKey === "annual" ? 149.9 : 19.9)

  const selectedPlanId = selectedPlan?.plan_id ?? null

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    setAuthToken(storedToken)

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser
        setUser(parsed)
        setPayerEmail(parsed.email || "")
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
        setPayerEmail((current) => current || data.user.email || "")
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

  useEffect(() => {
    async function loadPublicConfig() {
      setIsLoadingConfig(true)
      try {
        const data = await getBillingPublicConfig()
        setPublicConfig(data)
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a configuração de pagamento."
        )
      } finally {
        setIsLoadingConfig(false)
      }
    }

    void loadPublicConfig()
  }, [])

  useEffect(() => {
    if (!publicConfig?.public_key) return

    if (window.MercadoPago) {
      setMercadoPagoLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.async = true
    script.onload = () => setMercadoPagoLoaded(true)
    script.onerror = () =>
      setErrorMessage(
        "Não foi possível carregar o SDK do Mercado Pago. Verifique a chave pública e tente novamente."
      )
    document.body.appendChild(script)

    return () => {
      script.remove()
    }
  }, [publicConfig?.public_key])

  useEffect(() => {
    if (
      !mercadoPagoLoaded ||
      !publicConfig?.public_key ||
      !selectedPlanId ||
      formReadyRef.current
    ) {
      return
    }

    if (!window.MercadoPago) return

    const mp = new window.MercadoPago(publicConfig.public_key)
    const amount = String(selectedAmount)

    cardFormRef.current = mp.cardForm({
      amount,
      iframe: true,
      form: {
        id: "form-checkout",
        cardNumber: {
          id: "form-checkout__cardNumber",
          placeholder: "Número do cartão",
        },
        expirationDate: {
          id: "form-checkout__expirationDate",
          placeholder: "MM/AA",
        },
        securityCode: {
          id: "form-checkout__securityCode",
          placeholder: "CVV",
        },
        cardholderName: {
          id: "form-checkout__cardholderName",
          placeholder: "Titular do cartão",
        },
        issuer: {
          id: "form-checkout__issuer",
          placeholder: "Banco emissor",
        },
        installments: {
          id: "form-checkout__installments",
          placeholder: "Parcelas",
        },
        identificationType: {
          id: "form-checkout__identificationType",
          placeholder: "Tipo de documento",
        },
        identificationNumber: {
          id: "form-checkout__identificationNumber",
          placeholder: "Número do documento",
        },
        cardholderEmail: {
          id: "form-checkout__cardholderEmail",
          placeholder: "E-mail",
        },
      },
      callbacks: {
        onFormMounted: (error: unknown) => {
          if (error) {
            console.error("Erro ao montar CardForm:", error)
            setErrorMessage(
              "Não foi possível montar o formulário do cartão. Revise a configuração do Mercado Pago e tente novamente."
            )
            return
          }

          formReadyRef.current = true
        },
        onSubmit: async (event: Event) => {
          event.preventDefault()

          if (!authToken) {
            router.push(`/login?redirect=/pricing?plan=${selectedPlanKey}`)
            return
          }

          if (user?.plan === "pro") {
            router.push("/dashboard/simulados")
            return
          }

          setIsSubmitting(true)
          setErrorMessage("")
          setSuccessMessage("")

          try {
            const {
              token,
              cardholderEmail,
              identificationNumber: formIdentificationNumber,
              identificationType: formIdentificationType,
            } = cardFormRef.current.getCardFormData()

            if (!token) {
              throw new Error("O token do cartão não foi gerado.")
            }

            const response = await createMercadoPagoSubscription(
              {
                plan_key: selectedPlanKey,
                card_token_id: token,
                payer_email: cardholderEmail || payerEmail,
                identification_type:
                  formIdentificationType || identificationType || null,
                identification_number:
                  formIdentificationNumber || identificationNumber || null,
              },
              authToken
            )

            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user))
            setUser(response.user)
            setSuccessMessage(
              "Assinatura criada com sucesso. Seu plano já foi atualizado."
            )

            window.location.href = `/success?provider=mercadopago&plan=${selectedPlanKey}`
          } catch (error) {
            setErrorMessage(normalizeBillingErrorMessage(error))
          } finally {
            setIsSubmitting(false)
          }
        },
        onFetching: () => {
          return () => undefined
        },
      },
    })
  }, [
    authToken,
    identificationNumber,
    identificationType,
    mercadoPagoLoaded,
    payerEmail,
    publicConfig?.public_key,
    router,
    selectedAmount,
    selectedPlanId,
    selectedPlanKey,
    user?.plan,
  ])

  const isPro = user?.plan === "pro"
  const freeUsageText =
    usage?.daily_limit && usage?.remaining_today !== null
      ? `${usage.remaining_today} de ${usage.daily_limit} uso(s) gratuitos restantes hoje`
      : "Uso liberado"

  const canRenderPaymentForm = useMemo(() => {
    return (
      !!authToken &&
      !isPro &&
      !!publicConfig?.is_configured &&
      !!selectedPlanId
    )
  }, [authToken, isPro, publicConfig?.is_configured, selectedPlanId])

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="glass-panel rounded-[32px] p-6 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
                Assinatura MinhAprovação
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Escolha seu plano Pro
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                O gratuito serve para experimentar. O Pro serve para estudar com
                mais constância, mais prática e menos interrupções durante a
                preparação.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MetricCard
                  icon={<TrendingUp className="size-4 text-primary" />}
                  label="Mais prática"
                  value="uso ampliado"
                />
                <MetricCard
                  icon={<Clock3 className="size-4 text-primary" />}
                  label="Mais ritmo"
                  value="todos os dias"
                />
                <MetricCard
                  icon={<ShieldCheck className="size-4 text-primary" />}
                  label="Assinatura"
                  value="Mercado Pago"
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
                    href={`/login?redirect=/pricing?plan=${selectedPlanKey}`}
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
                O Pro remove a fricção do limite diário e mantém sua rotina de
                estudo em andamento.
              </div>
            </div>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
          <article className="glass-panel rounded-[32px] border border-primary/20 bg-primary/[0.08] p-6 md:p-8 shadow-[0_18px_60px_-24px_rgba(59,130,246,0.65)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              <Crown className="size-4" />
              Planos Pro
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <PlanSelectorCard planKey="monthly" selectedPlanKey={selectedPlanKey} />
              <PlanSelectorCard planKey="annual" selectedPlanKey={selectedPlanKey} />
            </div>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-[#081224] p-5">
              <p className="text-sm text-muted-foreground">Plano selecionado</p>

              <div className="mt-3 flex items-end gap-3">
                <span className="text-5xl font-bold text-white">
                  {selectedPlanCopy.price}
                </span>
                <span className="pb-2 text-sm text-muted-foreground">
                  {selectedPlanCopy.period}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                {selectedPlanCopy.description}
              </p>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {selectedPlanCopy.helper}
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <FeatureItem text="Mais questões por dia" />
              <FeatureItem text="Mais uso do Chat IA" />
              <FeatureItem text="Continuidade em provas, simulados e treinos" />
              <FeatureItem text="Acompanhamento de evolução com mais clareza" />
              <FeatureItem text="Pagamento recorrente via Mercado Pago" />
            </div>
          </article>

          <article className="glass-panel rounded-[32px] p-6 md:p-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="size-4" />
              Assinar {selectedPlanCopy.name}
            </div>

            {!authToken ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-300">
                  Faça login para assinar o plano Pro.
                </p>
                <Link
                  href={`/login?redirect=/pricing?plan=${selectedPlanKey}`}
                  className="mt-4 inline-flex rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Entrar para assinar
                </Link>
              </div>
            ) : isLoadingConfig ? (
              <div className="mt-6 flex items-center gap-3 text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                Carregando configuração do Mercado Pago...
              </div>
            ) : !publicConfig?.is_configured ? (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-200">
                O backend ainda não recebeu as credenciais do Mercado Pago.
              </div>
            ) : !selectedPlanId ? (
              <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
                O plano {selectedPlanKey === "annual" ? "anual" : "mensal"} do
                Mercado Pago ainda não foi criado no backend. Execute primeiro o
                bootstrap deste plano.
              </div>
            ) : isPro ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-emerald-200">
                Seu plano PRO já está ativo.
              </div>
            ) : canRenderPaymentForm ? (
              <form id="form-checkout" className="mt-6 space-y-4">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-slate-200">
                  Você está assinando:{" "}
                  <span className="font-semibold text-white">
                    {selectedPlanCopy.name} — {selectedPlanCopy.price}
                    {selectedPlanCopy.period}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-slate-300">
                      E-mail do pagador
                    </label>
                    <input
                      id="form-checkout__cardholderEmail"
                      type="email"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#081224] px-4 text-white outline-none"
                      placeholder="voce@email.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-slate-300">
                      Titular do cartão
                    </label>
                    <input
                      id="form-checkout__cardholderName"
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#081224] px-4 text-white outline-none"
                      placeholder="Nome impresso no cartão"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-slate-300">
                      Número do cartão
                    </label>
                    <div
                      id="form-checkout__cardNumber"
                      className="h-12 rounded-2xl border border-white/10 bg-[#081224] px-4"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Validade
                    </label>
                    <div
                      id="form-checkout__expirationDate"
                      className="h-12 rounded-2xl border border-white/10 bg-[#081224] px-4"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Código de segurança
                    </label>
                    <div
                      id="form-checkout__securityCode"
                      className="h-12 rounded-2xl border border-white/10 bg-[#081224] px-4"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Banco emissor
                    </label>
                    <select
                      id="form-checkout__issuer"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#081224] px-4 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Parcelas
                    </label>
                    <select
                      id="form-checkout__installments"
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#081224] px-4 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Tipo de documento
                    </label>
                    <select
                      id="form-checkout__identificationType"
                      value={identificationType}
                      onChange={(e) => setIdentificationType(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#081224] px-4 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Número do documento
                    </label>
                    <input
                      id="form-checkout__identificationNumber"
                      type="text"
                      value={identificationNumber}
                      onChange={(e) => setIdentificationNumber(e.target.value)}
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#081224] px-4 text-white outline-none"
                      placeholder="CPF"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting
                    ? "Processando assinatura..."
                    : `Assinar ${selectedPlanCopy.name}`}
                </button>

                <p className="text-xs leading-6 text-slate-400">
                  Os dados do cartão são tokenizados no navegador via MercadoPago.js.
                </p>
              </form>
            ) : null}
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
            MinhAprovação Pro
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Carregando planos...
          </h1>
        </div>
      </div>
    </main>
  )
}

function PlanSelectorCard({
  planKey,
  selectedPlanKey,
}: {
  planKey: BillingPlanKey
  selectedPlanKey: BillingPlanKey
}) {
  const plan = PLAN_COPY[planKey]
  const selected = planKey === selectedPlanKey

  return (
    <a
      href={`/pricing?plan=${planKey}`}
      className={`rounded-3xl border p-5 transition ${
        selected
          ? "border-primary/50 bg-primary/15"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-white">{plan.name}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-white/10 text-slate-300"
          }`}
        >
          {selected ? "Selecionado" : plan.badge}
        </span>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <span className="text-3xl font-bold text-white">{plan.price}</span>
        <span className="pb-1 text-sm text-slate-400">{plan.period}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-300">{plan.description}</p>
    </a>
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
