"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Crown,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import { getBillingStatus } from "@/lib/api"

const AUTH_TOKEN_KEY = "studypro_auth_token"
const AUTH_USER_KEY = "studypro_auth_user"

type AuthUser = {
  id: number
  name: string
  email: string
  plan: "free" | "pro"
  is_active: boolean
  created_at: string
  updated_at: string
}

type SyncStatus =
  | "checking"
  | "success"
  | "pending"
  | "unauthenticated"
  | "error"

export default function SuccessPage() {
  return (
    <Suspense fallback={<SuccessPageFallback />}>
      <SuccessPageContent />
    </Suspense>
  )
}

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const sessionId = useMemo(() => searchParams.get("session_id"), [searchParams])

  const [status, setStatus] = useState<SyncStatus>("checking")
  const [message, setMessage] = useState(
    "Confirmando pagamento e sincronizando o plano PRO..."
  )
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const syncPlan = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)

    if (!token) {
      setStatus("unauthenticated")
      setMessage(
        "Sua sessão não foi encontrada. Faça login novamente para sincronizar o plano."
      )
      return
    }

    setStatus("checking")
    setMessage("Confirmando pagamento e sincronizando o plano PRO...")
    setIsRetrying(true)

    try {
      for (let attempt = 1; attempt <= 8; attempt += 1) {
        const data = await getBillingStatus(token)
        setUser(data.user)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))

        if (data.user.plan === "pro") {
          setStatus("success")
          setMessage("Pagamento confirmado. Seu plano PRO já está ativo.")
          setIsRetrying(false)
          return
        }

        await wait(1500)
      }

      setStatus("pending")
      setMessage(
        "O pagamento foi concluído, mas a ativação ainda não apareceu na sua conta. Aguarde alguns segundos e consulte novamente."
      )
    } catch (error) {
      setStatus("error")
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao sincronizar o plano."
      )
    } finally {
      setIsRetrying(false)
    }
  }, [])

  useEffect(() => {
    syncPlan()
  }, [syncPlan])

  const title =
    status === "success"
      ? "Plano PRO ativado"
      : status === "pending"
      ? "Pagamento concluído"
      : status === "unauthenticated"
      ? "Login necessário"
      : status === "error"
      ? "Erro na sincronização"
      : "Confirmando pagamento"

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="glass-panel rounded-[32px] p-6 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-300">
                <CheckCircle2 className="size-4" />
                Checkout concluído
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
                {title}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                {message}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <MetricCard
                  icon={<Crown className="size-4 text-primary" />}
                  label="Plano"
                  value={user?.plan?.toUpperCase() || "FREE"}
                />
                <MetricCard
                  icon={<ShieldCheck className="size-4 text-primary" />}
                  label="Sincronização"
                  value={renderStatus(status)}
                />
                <MetricCard
                  icon={<Sparkles className="size-4 text-primary" />}
                  label="Sessão"
                  value={sessionId ? "confirmada" : "sem id"}
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={syncPlan}
                  disabled={isRetrying}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRetrying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="size-4" />
                  )}
                  {isRetrying ? "Consultando..." : "Consultar novamente"}
                </button>

                <Link
                  href="/dashboard/simulados"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
                >
                  Ir para simulados
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
                >
                  Ir para dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <p className="text-sm text-muted-foreground">Próximos passos</p>

              <div className="mt-5 space-y-4">
                <StepCard
                  title="1. Gere mais simulados"
                  description="Use o plano PRO para aumentar seu volume de treino sem travas."
                />
                <StepCard
                  title="2. Acompanhe desempenho"
                  description="Use dashboard, histórico e analytics para estudar com direção."
                />
                <StepCard
                  title="3. Mantenha constância"
                  description="Aproveite o momento de foco para consolidar sua rotina de estudo."
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Conta:{" "}
                <span className="font-semibold text-white">
                  {user?.email || "—"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function SuccessPageFallback() {
  return (
    <main className="min-h-screen bg-[#020817] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="glass-panel rounded-[32px] p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-300">
            <CheckCircle2 className="size-4" />
            Checkout concluído
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Confirmando pagamento
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-300">
            Carregando status do pagamento...
          </p>
        </div>
      </div>
    </main>
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

function StepCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
    </div>
  )
}

function renderStatus(status: SyncStatus): string {
  switch (status) {
    case "checking":
      return "verificando"
    case "success":
      return "pro ativo"
    case "pending":
      return "aguardando webhook"
    case "unauthenticated":
      return "login necessário"
    case "error":
      return "erro"
    default:
      return "desconhecido"
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}