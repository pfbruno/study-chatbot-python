import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

export function DashboardPreview() {
  return (
    <section className="section-padding">
      <div className="container-shell">
        <div className="glass-panel overflow-hidden rounded-[32px] p-6 md:p-8">
          <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
                <Sparkles className="size-4" />
                Preview do dashboard
              </div>

              <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
                Visão completa da sua performance
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-300 md:text-lg">
                Indicadores de progresso, simulados recentes e recomendações de
                estudo em uma única tela para decisões rápidas.
              </p>

              <Button asChild size="lg" className="mt-8 rounded-2xl px-6">
                <Link href="/dashboard">
                  Explorar dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-5">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Aproveitamento", value: "72%" },
                  { label: "Simulados", value: "5" },
                  { label: "Crescimento", value: "+18%" },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-3 text-2xl font-bold text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-muted-foreground">Recomendação de hoje</p>
                <p className="mt-3 text-base text-white">
                  Priorize trigonometria e interpretação de texto para elevar seu
                  desempenho global.
                </p>
              </div>

              <div className="mt-4 h-44 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/15 via-sky-400/10 to-accent/15 p-4">
                <div className="flex h-full items-end gap-3">
                  {[40, 62, 58, 70, 76, 72].map((value, index) => (
                    <div key={index} className="flex-1">
                      <div
                        className="rounded-t-xl bg-primary/80"
                        style={{ height: `${value}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}