import { Brain, FileText, LineChart } from "lucide-react"

const steps = [
  {
    icon: FileText,
    title: "Escolha prova ou simulado",
    description:
      "Entre rÃ¡pido no treino com provas reais, listas por tema e navegaÃ§Ã£o objetiva por banca, ano e disciplina.",
  },
  {
    icon: Brain,
    title: "Resolva com correÃ§Ã£o imediata",
    description:
      "Veja resultado, erros e oportunidades de revisÃ£o sem sair do fluxo principal de estudo.",
  },
  {
    icon: LineChart,
    title: "Use os dados para evoluir",
    description:
      "Acompanhe desempenho, tendÃªncias e prioridades para estudar com mais direÃ§Ã£o e menos desperdÃ­cio de tempo.",
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="section-padding">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-primary">
            Como funciona
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Um fluxo simples para estudar melhor
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-300 md:text-lg">
            O MinhAprovação foi pensado para reduzir atrito, acelerar a prÃ¡tica e
            transformar desempenho em plano de aÃ§Ã£o.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <article
                key={step.title}
                className="glass-panel rounded-[24px] p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Passo {index + 1}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {step.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
