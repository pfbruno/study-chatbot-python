"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  Crown,
  ListChecks,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"

type PaywallContext = "general" | "chat"

type CopyBlock = {
  title: string
  subtitle: string
  statusLabel: string
}

const COPY: Record<PaywallContext, CopyBlock> = {
  general: {
    title: "Você atingiu seu limite diário gratuito",
    subtitle:
      "Você já utilizou seu limite de hoje no plano Free. Para continuar estudando agora, escolha um plano Pro ou volte amanhã com um novo limite gratuito.",
    statusLabel: "Limite diário de questões atingido",
  },
  chat: {
    title: "Você atingiu o limite diário do Chat IA",
    subtitle:
      "Você já usou suas gerações gratuitas de hoje. Continue com o plano Pro ou volte amanhã para novas interações.",
    statusLabel: "Limite diário do Chat IA atingido",
  },
}

const MONTHLY_BENEFITS = [
  "Responda mais questões por dia",
  "Continue seus simulados e treinos sem bloqueio diário",
  "Use o Chat IA com limite ampliado",
  "Acompanhe sua evolução com mais profundidade",
  "Ideal para rotina de estudo contínua",
]

const ANNUAL_BENEFITS = [
  "Todos os benefícios do plano mensal",
  "Melhor custo-benefício",
  "Ideal para preparação de longo prazo para o ENEM",
  "Menos interrupções na rotina de estudo",
  "Acesso contínuo aos recursos Pro",
]

const COMPARISON = [
  {
    label: "Questões por dia",
    free: "10 questões",
    pro: "Uso ampliado",
    icon: ListChecks,
  },
  {
    label: "Chat IA",
    free: "5 gerações",
    pro: "Limite ampliado",
    icon: MessageSquareText,
  },
  {
    label: "Provas, simulados e treinos",
    free: "Com limite diário",
    pro: "Sem bloqueio diário padrão",
    icon: Zap,
  },
  {
    label: "Indicação de uso",
    free: "Para testar a plataforma",
    pro: "Para preparação constante",
    icon: ShieldCheck,
  },
]

const FAQS = [
  {
    question: "O que acontece se eu não assinar?",
    answer:
      "Você pode voltar amanhã e usar novamente o limite gratuito diário.",
  },
  {
    question: "O plano Free perde acesso às provas?",
    answer:
      "Não. O plano Free continua com acesso à plataforma, mas com limite diário de uso.",
  },
  {
    question: "O limite vale para quais áreas?",
    answer:
      "O limite de questões vale para Provas, Simulados e Modo Treinar. O Chat IA possui um limite separado.",
  },
  {
    question: "Posso cancelar o plano Pro?",
    answer:
      "Sim. O cancelamento poderá ser feito conforme a plataforma de pagamento configurada na contratação.",
  },
  {
    question: "O plano anual vale a pena?",
    answer:
      "Sim, para quem pretende estudar por vários meses e quer reduzir interrupções na rotina.",
  },
]

export function UpgradePaywallPage() {
  return (
    <Suspense fallback={<UpgradePaywallFallback />}>
      <UpgradePaywallContent />
    </Suspense>
  )
}

function UpgradePaywallContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checkoutNotice, setCheckoutNotice] = useState("")
  const [openFaq, setOpenFaq] = useState<string | null>("faq-0")

  const context = useMemo<PaywallContext>(() => {
    const value = searchParams.get("context")
    return value === "chat" ? "chat" : "general"
  }, [searchParams])

  const copy = COPY[context]

  function onClickMonthly() {
    setCheckoutNotice(
      "Checkout mensal ainda não conectado. Esta tela já está pronta para receber a integração do plano Pro Mensal."
    )
  }

  function onClickAnnual() {
    setCheckoutNotice(
      "Checkout anual ainda não conectado. Esta tela já está pronta para receber a integração do plano Pro Anual."
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050b16] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-44 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[360px] w-[460px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[280px] w-[420px] rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>

            <div>
              <p className="text-lg font-bold leading-none">MinhAprovação</p>
              <p className="mt-1 text-xs text-slate-400">
                Plataforma inteligente de estudos
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar ao dashboard</span>
            <span className="sm:hidden">Voltar</span>
          </button>
        </header>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200">
              <Clock className="mr-1.5 h-3 w-3" />
              Limite diário atingido
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {copy.title}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {copy.subtitle}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b1324]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Seu status hoje
            </p>

            <div className="mt-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Plano atual</h2>
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                Free
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <StatusRow
                icon={ListChecks}
                label="Questões gratuitas"
                value="10 / dia"
              />
              <StatusRow
                icon={MessageSquareText}
                label="Chat IA gratuito"
                value="5 gerações / dia"
              />
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-3 py-3 text-rose-100">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-300" />
              </span>
              <span className="text-sm font-medium">{copy.statusLabel}</span>
            </div>
          </div>
        </section>

        {checkoutNotice ? (
          <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {checkoutNotice}
          </div>
        ) : null}

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <PlanCard
            name="Pro Mensal"
            description="Para quem quer continuar estudando sem esperar o próximo dia."
            price="R$ XX,XX"
            period="/mês"
            benefits={MONTHLY_BENEFITS}
            ctaLabel="Assinar mensal"
            onClick={onClickMonthly}
          />

          <PlanCard
            name="Pro Anual"
            description="Para quem quer se preparar com constância durante o ano."
            price="R$ XX,XX"
            period="/ano"
            benefits={ANNUAL_BENEFITS}
            ctaLabel="Assinar anual"
            onClick={onClickAnnual}
            highlighted
            badge="Melhor escolha"
            footnote="Economize em relação ao plano mensal."
          />
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">Free vs Pro</h2>
            <p className="mt-2 text-sm text-slate-400">
              Compare o que muda na sua rotina de estudo.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0b1324]/80 backdrop-blur">
            <div className="grid grid-cols-[1.2fr_1fr_1fr] divide-x divide-white/10 border-b border-white/10 bg-white/[0.03] text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              <div className="px-4 py-3 sm:px-6">Recurso</div>
              <div className="px-4 py-3 text-center sm:px-6">Free</div>
              <div className="flex items-center justify-center gap-1.5 bg-blue-500/10 px-4 py-3 text-blue-200 sm:px-6">
                <Crown className="h-3.5 w-3.5" />
                Pro
              </div>
            </div>

            {COMPARISON.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.2fr_1fr_1fr] divide-x divide-white/10 border-b border-white/10 last:border-b-0"
              >
                <div className="flex items-center gap-2.5 px-4 py-4 text-sm font-medium sm:px-6">
                  <row.icon className="h-4 w-4 text-slate-400" />
                  {row.label}
                </div>

                <div className="flex items-center justify-center px-4 py-4 text-center text-sm text-slate-400 sm:px-6">
                  {row.free}
                </div>

                <div className="flex items-center justify-center bg-blue-500/5 px-4 py-4 text-center text-sm font-medium text-white sm:px-6">
                  {row.pro}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-center text-xs text-slate-500">
            O uso ampliado segue uma política de uso justo para garantir
            qualidade do serviço.
          </p>
        </section>

        <section className="mt-14">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Perguntas frequentes
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Tire suas dúvidas antes de assinar.
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-[#0b1324]/80 px-2 backdrop-blur sm:px-6">
            {FAQS.map((faq, index) => {
              const id = `faq-${index}`
              const isOpen = openFaq === id

              return (
                <div
                  key={faq.question}
                  className="border-b border-white/10 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-5 text-left text-sm font-semibold text-white sm:text-base"
                  >
                    {faq.question}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen ? (
                    <div className="px-4 pb-5 text-sm leading-relaxed text-slate-400">
                      {faq.answer}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </section>

        <footer className="mt-14 rounded-3xl border border-white/10 bg-[#0b1324]/60 p-6 text-center backdrop-blur sm:p-8">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-400">
            Sem promessas falsas de aprovação. A MinhAprovação ajuda você a
            estudar com mais consistência, revisar erros e acompanhar sua
            evolução.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Voltar amanhã
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              Voltar ao dashboard
            </button>
          </div>
        </footer>
      </div>
    </main>
  )
}

function UpgradePaywallFallback() {
  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-[#0b1324] p-8">
        <div className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
          MinhAprovação Pro
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">
          Carregando planos...
        </h1>
        <p className="mt-4 text-sm text-slate-400">
          Preparando a tela de upgrade.
        </p>
      </div>
    </main>
  )
}

function StatusRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#050b16]/70 px-3 py-3">
      <div className="flex items-center gap-2.5 text-slate-400">
        <Icon className="h-4 w-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

type PlanCardProps = {
  name: string
  description: string
  price: string
  period: string
  benefits: string[]
  ctaLabel: string
  onClick: () => void
  highlighted?: boolean
  badge?: string
  footnote?: string
}

function PlanCard({
  name,
  description,
  price,
  period,
  benefits,
  ctaLabel,
  onClick,
  highlighted,
  badge,
  footnote,
}: PlanCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-6 backdrop-blur transition sm:p-8 ${
        highlighted
          ? "border-blue-400/50 bg-gradient-to-b from-blue-500/10 via-[#0b1324]/90 to-[#0b1324] shadow-2xl shadow-blue-500/10"
          : "border-white/10 bg-[#0b1324]/80 hover:border-white/20"
      }`}
    >
      {badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-blue-500/30">
            <Crown className="mr-1 h-3 w-3" />
            {badge}
          </span>
        </div>
      ) : null}

      <h3 className="text-xl font-bold">{name}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{price}</span>
        <span className="text-sm text-slate-400">{period}</span>
      </div>

      {footnote ? (
        <p className="mt-1 text-xs font-medium text-emerald-300">{footnote}</p>
      ) : null}

      <ul className="mt-6 flex-1 space-y-3">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-sm">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                highlighted
                  ? "bg-emerald-400/20 text-emerald-300"
                  : "bg-blue-500/15 text-blue-300"
              }`}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="text-slate-200">{benefit}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onClick}
        className={`mt-8 w-full rounded-2xl px-5 py-3 text-sm font-semibold transition ${
          highlighted
            ? "bg-gradient-to-r from-blue-500 to-emerald-400 text-white hover:opacity-90"
            : "bg-white text-[#071225] hover:opacity-90"
        }`}
      >
        {ctaLabel}
      </button>
    </div>
  )
}