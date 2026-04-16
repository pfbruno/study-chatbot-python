"use client"

import Link from "next/link"
import { ArrowRight, ClipboardList, Sparkles, Zap } from "lucide-react"

export default function SimuladosPage() {
  const cards = [
    {
      title: "Gerar simulado",
      description:
        "Monte um novo simulado com foco em treino, revisão e constância de prática.",
      href: "/dashboard/provas",
      cta: "Começar",
      icon: <Zap className="size-5 text-primary" />,
    },
    {
      title: "Plano PRO",
      description:
        "Ative recursos avançados, mais volume de prática e experiência completa do aluno.",
      href: "/pricing",
      cta: "Ver plano",
      icon: <Sparkles className="size-5 text-accent" />,
    },
    {
      title: "Histórico e evolução",
      description:
        "Acompanhe o que já foi resolvido e use o dashboard para guiar os próximos passos.",
      href: "/dashboard",
      cta: "Abrir dashboard",
      icon: <ClipboardList className="size-5 text-sky-300" />,
    },
  ]

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              Simulados
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
              Área de simulados do aluno
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Esta etapa reorganiza visualmente o fluxo, preservando as rotas e a
              integração já existente. Use os atalhos abaixo para seguir para os
              módulos principais de prática.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-sm text-muted-foreground">Fluxo recomendado</p>

            <div className="mt-5 space-y-4">
              {[
                "1. Escolher prova ou categoria",
                "2. Resolver questões",
                "3. Ver resultado e revisar erros",
                "4. Voltar ao dashboard para medir evolução",
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="glass-panel rounded-[28px] p-6 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
              {card.icon}
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-white">
              {card.title}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              {card.description}
            </p>

            <Link
              href={card.href}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
            >
              {card.cta}
              <ArrowRight className="size-4" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}