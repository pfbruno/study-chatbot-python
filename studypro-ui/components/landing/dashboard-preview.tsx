import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, Sparkles, Target } from "lucide-react"

import { Button } from "@/components/ui/button"

const previewCards = [
  {
    icon: BookOpen,
    label: "Provas organizadas",
    description: "Visualização estruturada por exame, ano e fluxo de resolução.",
  },
  {
    icon: Target,
    label: "Simulados e correção",
    description: "Treino contínuo com leitura clara de desempenho por disciplina.",
  },
  {
    icon: CheckCircle2,
    label: "Próximos passos",
    description: "Revisão guiada com foco nos pontos que mais precisam de atenção.",
  },
]

const focusAreas = ["Matemática", "Linguagens", "Humanas"]

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
                Visão completa da sua rotina de estudo
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-300 md:text-lg">
                Provas, simulados, revisão e leitura de desempenho em uma única
                experiência para estudar com mais clareza e menos atrito.
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
                {previewCards.map((card) => {
                  const Icon = card.icon

                  return (
                    <div
                      key={card.label}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>

                      <p className="mt-4 text-base font-semibold text-white">
                        {card.label}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-muted-foreground">Leitura do dia</p>
                <p className="mt-3 text-base text-white">
                  Use o painel para identificar onde você está errando mais,
                  revisar com foco e acompanhar a evolução do seu estudo ao longo
                  do tempo.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/15 via-sky-400/10 to-accent/15 p-4">
                <p className="text-sm text-muted-foreground">
                  Áreas em destaque no painel
                </p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {focusAreas.map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3 text-center text-sm text-slate-300"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  O objetivo aqui é mostrar o tipo de organização que o aluno
                  encontra dentro da plataforma, sem inflar números ou sugerir
                  resultados que ainda não foram comprovados publicamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}