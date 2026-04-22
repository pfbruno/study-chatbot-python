import Link from "next/link"
import { Check, Crown, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    description:
      "Para conhecer a plataforma, começar a resolver questões e validar se o fluxo combina com sua rotina.",
    features: [
      "Acesso inicial ao StudyPro",
      "Simulados com limite diário",
      "Correção automática",
      "Dashboard básico",
    ],
    cta: "Começar grátis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 29",
    period: "/mês",
    description:
      "Para quem quer estudar com constância, praticar mais e transformar dados de desempenho em evolução real.",
    features: [
      "Simulados ilimitados",
      "Mais volume de treino",
      "Análise de desempenho completa",
      "Insights inteligentes",
      "Fluxo prioritário de evolução",
    ],
    cta: "Desbloquear Pro",
    href: "/pricing",
    highlighted: true,
  },
]

export function Pricing() {
  return (
    <section id="planos" className="section-padding">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-primary">
            Planos StudyPro
          </span>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Comece grátis. Evolua quando quiser.
          </h2>

          <p className="mt-5 text-base leading-8 text-slate-300 md:text-lg">
            O Free permite entrar rápido na plataforma. O Pro existe para quem
            quer mais prática, mais leitura de desempenho e um caminho mais
            forte até a aprovação.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "glass-panel relative rounded-[28px] p-6",
                plan.highlighted &&
                  "border-primary/30 bg-primary/[0.08] shadow-[0_18px_60px_-24px_rgba(59,130,246,0.65)]"
              )}
            >
              {plan.highlighted ? (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-slate-950 px-3 py-1 text-xs font-semibold text-primary">
                  <Crown className="size-3.5 fill-current" />
                  Melhor para evolução contínua
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <Sparkles
                  className={cn(
                    "size-4",
                    plan.highlighted ? "text-primary" : "text-slate-300"
                  )}
                />
                <span className="text-sm text-slate-300">{plan.name}</span>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="pb-1 text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                {plan.description}
              </p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-slate-300"
                  >
                    <div className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Check className="size-3.5" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                variant={plan.highlighted ? "default" : "outline"}
                className={cn(
                  "mt-8 w-full rounded-2xl",
                  !plan.highlighted &&
                    "border-white/10 bg-white/5 text-white hover:bg-white/10"
                )}
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}