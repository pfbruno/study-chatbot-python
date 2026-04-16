import Link from "next/link"
import { ArrowRight, BookOpen, Brain, Target } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const stats = [
  { icon: BookOpen, value: "50+", label: "provas oficiais" },
  { icon: Target, value: "10.000+", label: "questões" },
  { icon: Brain, value: "12", label: "áreas de estudo" },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24">
      <div className="absolute inset-0 -z-10 bg-grid opacity-[0.08]" />
      <div className="absolute left-1/2 top-16 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute right-[10%] top-32 -z-10 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

      <div className="container-shell">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
            <Badge className="rounded-full border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              Plataforma inteligente de estudos
            </Badge>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
              Conquiste sua vaga com{" "}
              <span className="text-gradient">provas reais</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
              Pratique com questões de vestibulares e ENEM, filtre por matéria,
              acompanhe seu desempenho e evolua com uma experiência visual mais
              clara, rápida e orientada a resultado.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="rounded-2xl px-6 text-sm font-semibold shadow-[0_16px_50px_-18px_rgba(59,130,246,0.85)]"
              >
                <Link href="/register">
                  Começar agora
                  <ArrowRight className="size-4" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border-white/10 bg-white/5 px-6 text-sm text-white hover:bg-white/10"
              >
                <Link href="#planos">Ver planos</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon

                return (
                  <div
                    key={stat.label}
                    className="glass-panel rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-white/6 text-primary ring-1 ring-white/10">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-white">
                          {stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative">
            <div className="hero-glow glass-panel rounded-[28px] p-5 md:p-6">
              <div className="rounded-[24px] border border-white/10 bg-slate-950/70 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Painel do aluno</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">
                      Visão consolidada de desempenho
                    </h2>
                  </div>
                  <div className="rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                    Online
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground">Aproveitamento</p>
                    <p className="mt-3 text-3xl font-bold text-white">72%</p>
                    <p className="mt-2 text-sm text-emerald-300">
                      +18% nas últimas 4 semanas
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-muted-foreground">Simulados concluídos</p>
                    <p className="mt-3 text-3xl font-bold text-white">05</p>
                    <p className="mt-2 text-sm text-sky-300">
                      histórico consolidado por prova
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Foco recomendado</p>
                    <span className="text-sm font-medium text-primary">Hoje</span>
                  </div>
                  <p className="mt-3 text-base text-white">
                    Priorize trigonometria, interpretação de texto e revisão de
                    erros recorrentes para elevar a média global.
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {["Matemática", "Linguagens", "Humanas"].map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-white/10 bg-slate-900/80 px-3 py-3 text-center text-sm text-slate-300"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary md:block">
              Feedback instantâneo e leitura rápida do progresso
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}