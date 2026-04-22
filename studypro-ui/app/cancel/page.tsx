"use client"

import Link from "next/link"
import { AlertTriangle, ArrowLeft, CreditCard, Sparkles } from "lucide-react"

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-[#020817] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="glass-panel rounded-[32px] p-6 md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1 text-sm text-amber-200">
                <AlertTriangle className="size-4" />
                Checkout cancelado
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Nenhuma cobrança foi concluída
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                Você saiu do checkout antes da confirmação final. Seu plano atual
                continua o mesmo, e você pode retomar a assinatura quando quiser.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
                >
                  <CreditCard className="size-4" />
                  Tentar novamente
                </Link>

                <Link
                  href="/dashboard/simulados"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
                >
                  Voltar para simulados
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
                >
                  <ArrowLeft className="size-4" />
                  Ir para dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <p className="text-sm text-muted-foreground">Por que voltar?</p>

              <div className="mt-5 space-y-4">
                <BenefitCard
                  title="Mais volume de treino"
                  description="O Pro elimina travas e permite manter ritmo de estudo por mais tempo."
                />
                <BenefitCard
                  title="Mais leitura de desempenho"
                  description="Use o histórico e os insights para revisar com mais precisão."
                />
                <BenefitCard
                  title="Mais continuidade"
                  description="A principal vantagem é estudar sem interromper o fluxo quando estiver focado."
                />
              </div>

              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-slate-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 size-4 text-primary" />
                  <p>
                    O Free é ótimo para experimentar. O Pro faz mais sentido
                    quando você quer constância e menos atrito na rotina.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function BenefitCard({
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