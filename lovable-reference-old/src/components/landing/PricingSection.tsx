import { Button } from "@/components/ui/button";
import { Check, Star } from "lucide-react";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Para começar a praticar",
    features: [
      "5 questões aleatórias por dia",
      "Acesso a 3 provas",
      "Correção automática",
      "Estatísticas básicas",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "R$ 19,90",
    period: "/mês",
    description: "Para quem quer aprovação",
    features: [
      "Questões ilimitadas",
      "Todas as provas disponíveis",
      "Filtro por matéria",
      "Dashboard completo",
      "Histórico detalhado",
      "Suporte prioritário",
    ],
    cta: "Assinar Premium",
    highlighted: true,
  },
  {
    name: "Anual",
    price: "R$ 149,90",
    period: "/ano",
    description: "Melhor custo-benefício",
    features: [
      "Tudo do Premium",
      "37% de desconto",
      "Simulados exclusivos",
      "Acesso antecipado a novidades",
    ],
    cta: "Assinar Anual",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">Planos</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-3">
            Invista no seu <span className="text-primary">futuro</span>
          </h2>
          <p className="text-muted-foreground mt-4">
            Escolha o plano ideal para o seu ritmo de estudos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? "bg-gradient-to-b from-primary/10 to-card border-primary/40 shadow-lg shadow-primary/10 scale-105"
                  : "bg-card border-border hover:border-primary/20"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  <Star className="w-3 h-3" /> Mais popular
                </div>
              )}

              <h3 className="font-heading text-xl font-bold">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">{plan.description}</p>

              <div className="mt-6 mb-8">
                <span className="font-heading text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full font-semibold ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                    : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
