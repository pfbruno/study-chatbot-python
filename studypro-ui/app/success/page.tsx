"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Clock3, Loader2, ShieldCheck } from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  getBillingStatus,
  type AuthUser,
  type BillingEntitlements,
  type BillingUsage,
} from "@/lib/api"

type BillingState = {
  user: AuthUser | null
  usage: BillingUsage | null
  entitlements: BillingEntitlements | null
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessPageFallback />}>
      <SuccessPageContent />
    </Suspense>
  )
}

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const provider = searchParams.get("provider") || "mercadopago"

  const [state, setState] = useState<BillingState>({
    user: null,
    usage: null,
    entitlements: null,
  })
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState("")

  const isPro = state.user?.plan === "pro"

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!token) {
      setLoading(false)
      setError("Você precisa estar logado para confirmar o status da assinatura.")
      return
    }

    let cancelled = false
    let localAttempts = 0

    async function checkStatus() {
      try {
        const data = await getBillingStatus(token)

        if (cancelled) return

        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))

        setState({
          user: data.user,
          usage: data.usage,
          entitlements: data.entitlements,
        })

        localAttempts += 1
        setAttempts(localAttempts)

        if (data.user.plan === "pro" || localAttempts >= 10) {
          setLoading(false)
          return true
        }

        return false
      } catch (err) {
        if (cancelled) return true

        setLoading(false)
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível confirmar o status da assinatura."
        )
        return true
      }
    }

    let timeoutId: number | null = null

    async function runPolling() {
      const shouldStop = await checkStatus()
      if (!shouldStop && !cancelled) {
        timeoutId = window.setTimeout(runPolling, 3000)
      }
    }

    void runPolling()

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  const statusTitle = useMemo(() => {
    if (loading) return "Confirmando sua assinatura"
    if (isPro) return "Plano Pro ativado com sucesso"
    if (error) return "Não foi possível confirmar automaticamente"
    return "Assinatura criada, aguardando confirmação"
  }, [loading, isPro, error])

  const statusDescription = useMemo(() => {
    if (loading) {
      return "Estamos consultando o backend para confirmar a assinatura e sincronizar o seu acesso."
    }

    if (isPro) {
      return "Seu plano foi atualizado e os recursos Pro já devem estar disponíveis no MinhAprovação."
    }

    if (error) {
      return error
    }

    return (
      "A cobrança foi iniciada, mas o plano ainda não foi sincronizado como Pro. " +
      "Isso pode acontecer antes do webhook terminar de atualizar o backend."
    )
  }, [loading, isPro, error])

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
            <ShieldCheck className="size-4" />
            Retorno do {provider === "mercadopago" ? "Mercado Pago" : "pagamento"}
          </div>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {loading ? (
                <Loader2 className="size-7 animate-spin" />
              ) : isPro ? (
                <CheckCircle2 className="size-7" />
              ) : (
                <Clock3 className="size-7" />
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white">{statusTitle}</h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-slate-300">
                {statusDescription}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard
              label="Plano atual"
              value={state.user?.plan?.toUpperCase() || "—"}
            />
            <InfoCard
              label="Status da assinatura"
              value={state.user?.subscription_status || "—"}
            />
            <InfoCard
              label="Tentativas de sincronização"
              value={String(attempts)}
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard/simulados"
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              Ir para simulados
            </Link>

            <Link
              href="/pricing"
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Voltar para pricing
            </Link>
          </div>

          {!isPro && !loading ? (
            <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
              Se o plano não atualizar automaticamente, o próximo passo é configurar o webhook
              definitivo do Mercado Pago e validar a assinatura em produção controlada.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function SuccessPageFallback() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="glass-panel rounded-[32px] p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
            <ShieldCheck className="size-4" />
            Confirmando retorno do pagamento
          </div>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Loader2 className="size-7 animate-spin" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white">
                Carregando confirmação
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-8 text-slate-300">
                Estamos preparando a validação do status da sua assinatura.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </article>
  )
}
