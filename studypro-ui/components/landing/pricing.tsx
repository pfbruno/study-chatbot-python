import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "para sempre",
    description: "Ideal para começar a estudar",
    features: [
      "Acesso limitado a provas",
      "10 questões por dia",
      "Dashboard básico",
      "Correção automática"
    ],
    cta: "Começar grátis",
    highlighted: false
  },
  {
    name: "Premium",
    price: "R$ 29",
    period: "/mês",
    description: "Para quem quer passar de verdade",
    features: [
      "Acesso ilimitado a provas",
      "Questões ilimitadas",
      "Dashboard completo",
      "Correção com explicações",
      "Simulados personalizados",
      "Ranking nacional",
      "Suporte prioritário"
    ],
    cta: "Assinar Premium",
    highlighted: true
  },
  {
    name: "Anual",
    price: "R$ 199",
    period: "/ano",
    description: "Economia de 43%",
    features: [
      "Todos os benefícios Premium",
      "4 meses grátis",
      "Acesso antecipado",
      "Materiais exclusivos",
      "Mentoria em grupo"
    ],
    cta: "Assinar Anual",
    highlighted: false
  }
]

export function Pricing() {
  return (
    <section id="planos" className="border-t border-border/50 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Planos que cabem no seu <span className="text-primary">bolso</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Escolha o plano ideal para sua jornada de estudos
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border p-8 transition-all",
                plan.highlighted
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border/50 bg-card hover:border-border"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                  Mais popular
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={cn(
                  "mt-8 w-full",
                  plan.highlighted
                    ? "bg-primary hover:bg-primary/90"
                    : "bg-secondary hover:bg-secondary/80"
                )}
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
