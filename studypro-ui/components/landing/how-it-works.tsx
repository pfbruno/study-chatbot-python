import { Brain, FileText, LineChart } from "lucide-react"

const steps = [
  {
    icon: FileText,
    title: "Escolha seu simulado",
    description: "Monte listas por banca, ano e disciplina com o banco de questões oficial.",
  },
  {
    icon: Brain,
    title: "Resolva com suporte inteligente",
    description: "Receba feedback imediato, histórico e recomendações para corrigir pontos fracos.",
  },
  {
    icon: LineChart,
    title: "Acompanhe evolução",
    description: "Veja progresso por matéria, tendências de acerto e plano de revisão personalizado.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h2>
          <p className="mt-3 text-muted-foreground">Fluxo simples para estudar com consistência e ganhar desempenho.</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-border/60 bg-card p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Passo {index + 1}</p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
