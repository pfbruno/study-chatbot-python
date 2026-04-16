import {
  BarChart3,
  BookOpen,
  Clock,
  Filter,
  Shuffle,
  Trophy,
} from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Provas oficiais",
    description:
      "Acesso a provas reais de vestibulares e ENEM com organização mais clara e foco em resolução.",
  },
  {
    icon: Shuffle,
    title: "Questões aleatórias",
    description:
      "Pratique com listas rápidas, simulados personalizados e sessões objetivas de revisão.",
  },
  {
    icon: Filter,
    title: "Filtro por matéria",
    description:
      "Direcione o estudo para disciplinas e temas específicos sem perder tempo navegando.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de desempenho",
    description:
      "Acompanhe evolução, médias, tendências de acerto e gargalos de conteúdo.",
  },
  {
    icon: Clock,
    title: "Correção automática",
    description:
      "Receba resultado imediato com uma experiência mais limpa e orientada à decisão.",
  },
  {
    icon: Trophy,
    title: "Progresso contínuo",
    description:
      "Mantenha consistência com histórico, metas e visão consolidada da jornada do aluno.",
  },
]

export function Features() {
  return (
    <section id="funcionalidades" className="section-padding">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-primary">
            Funcionalidades
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
            Tudo que você precisa para <span className="text-gradient">estudar melhor</span>
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-300 md:text-lg">
            Uma camada visual mais consistente para deixar o fluxo do aluno mais
            claro, rápido e orientado a performance.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <article
                key={feature.title}
                className="glass-panel rounded-[24px] p-6 transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Icon className="size-5" />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {feature.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}