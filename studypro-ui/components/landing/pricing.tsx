import Link from "next/link"
import { Check, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Para começar a praticar",
    features: [
      "5 questões aleatórias por dia",
      "Acesso inicial a provas",
      "Correção automática",
      "Estatísticas básicas",
    ],
    cta: "Começar grátis",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "R$ 29",
    period: "/mês",
    description: "Para quem quer aprovação com consistência",
    features: [
      "Questões ilimitadas",
      "Todas as provas disponíveis",
      "Filtro por matéria",
      "Dashboard completo",
      "Histórico detalhado",
      "Suporte prioritário",
    ],
    cta: "Assinar Premium",
    href: "/pricing",
    highlighted: true,
  },
  {
    name: "Anual",
    price: "R$ 199",
    period: "/ano",
    description: "Melhor custo-benefício",
    features: [
      "Tudo do Premium",
      "Economia anual",
      "Simulados exclusivos",
      "Acesso antecipado a novidades",
    ],
    cta: "Assinar Anual",
    href: "/pricing",
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="planos" className="section-padding">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-primary">
            Planos
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Invista no seu futuro
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-300 md:text-lg">
            A rota continua a mesma. Nesta fase, a mudança é exclusivamente
            visual no fluxo do aluno.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={cn(
                "glass-panel relative rounded-[28px] p-6",
                plan.highlighted &&
                  "border-primary/30 bg-primary/[0.08] shadow-[0_18px_60px_-24px_rgba(59,130,246,0.65)]"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-slate-950 px-3 py-1 text-xs font-semibold text-primary">
                  <Star className="size-3.5 fill-current" />
                  Mais popular
                </div>
              )}

              <h3 className="mt-2 text-2xl font-semibold text-white">{plan.name}</h3>
              <p className="mt-3 text-sm text-slate-300">{plan.description}</p>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="pb-1 text-sm text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
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