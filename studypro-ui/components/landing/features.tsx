import { FileText, Shuffle, BarChart3, CheckCircle, Trophy } from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Provas oficiais",
    description: "Acesso a provas completas do ENEM e principais vestibulares do Brasil"
  },
  {
    icon: Shuffle,
    title: "Questões aleatórias",
    description: "Pratique com simulados personalizados e questões filtradas por tema"
  },
  {
    icon: BarChart3,
    title: "Dashboard de desempenho",
    description: "Acompanhe sua evolução com gráficos e métricas detalhadas"
  },
  {
    icon: CheckCircle,
    title: "Correção automática",
    description: "Receba feedback instantâneo com explicações detalhadas"
  },
  {
    icon: Trophy,
    title: "Ranking e progresso",
    description: "Compare seu desempenho e mantenha a motivação com metas"
  }
]

export function Features() {
  return (
    <section id="funcionalidades" className="border-t border-border/50 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo que você precisa para <span className="text-primary">passar</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Ferramentas completas para maximizar seu tempo de estudo
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/50 hover:bg-card/80"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
