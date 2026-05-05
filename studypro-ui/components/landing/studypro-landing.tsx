"use client"

import Link from "next/link"
import { useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Flame,
  GraduationCap,
  Layers3,
  LineChart,
  Menu,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  X,
  XCircle,
} from "lucide-react"

const navItems = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#recursos", label: "Recursos" },
  { href: "#planos", label: "Planos" },
  { href: "#faq", label: "FAQ" },
]

const painPoints = [
  {
    title: "VocÃª vÃª que errou, mas nÃ£o entende o motivo",
    description:
      "A nota aparece, mas o erro continua sem explicaÃ§Ã£o prÃ¡tica para orientar a revisÃ£o.",
    icon: XCircle,
  },
  {
    title: "VocÃª estuda assuntos que talvez nem sejam prioridade",
    description:
      "Sem diagnÃ³stico claro, o tempo vai para conteÃºdos aleatÃ³rios em vez dos pontos fracos reais.",
    icon: AlertTriangle,
  },
  {
    title: "VocÃª repete erros parecidos em outros simulados",
    description:
      "Quando o erro nÃ£o vira revisÃ£o, ele volta em novas questÃµes com outra aparÃªncia.",
    icon: Flame,
  },
]

const solutionSteps = [
  {
    title: "Resolva",
    description:
      "FaÃ§a provas oficiais, simulados prontos ou treinos rÃ¡pidos com poucos cliques.",
    icon: FileText,
  },
  {
    title: "Corrija",
    description:
      "Veja acertos, erros, questÃµes em branco e desempenho por disciplina.",
    icon: CheckCircle2,
  },
  {
    title: "Entenda",
    description:
      "Nas questÃµes erradas ou em branco, a IA explica o erro, o conceito cobrado e o raciocÃ­nio correto.",
    icon: Brain,
  },
  {
    title: "Revise",
    description:
      "Use o dashboard para transformar sua correÃ§Ã£o em prÃ³ximos passos de estudo.",
    icon: LineChart,
  },
]

const features = [
  {
    title: "Provas oficiais",
    description:
      "Resolva provas por exame e ano com correÃ§Ã£o organizada por questÃ£o.",
    icon: GraduationCap,
  },
  {
    title: "Simulados prontos",
    description:
      "Escolha um modelo e comece a responder sem configurar filtros complexos.",
    icon: FileText,
  },
  {
    title: "Modo Treinar",
    description:
      "Treinos rÃ¡pidos com 1 clique para manter constÃ¢ncia nos estudos.",
    icon: PlayCircle,
  },
  {
    title: "ExplicaÃ§Ã£o por IA",
    description:
      "Entenda questÃµes erradas ou em branco com explicaÃ§Ãµes individuais.",
    icon: Sparkles,
  },
  {
    title: "Dashboard real",
    description:
      "Acompanhe somente dados gerados pelas suas prÃ³prias atividades.",
    icon: BarChart3,
  },
  {
    title: "GamificaÃ§Ã£o",
    description:
      "Use XP, streak e desafios para transformar estudo em rotina.",
    icon: Trophy,
  },
]

const before = [
  "VocÃª apenas vÃª que errou.",
  "NÃ£o sabe por que caiu na alternativa errada.",
  "NÃ£o sabe qual conceito revisar.",
  "Repete o mesmo erro em outro simulado.",
]

const after = [
  "VocÃª vÃª o erro com contexto.",
  "Entende o raciocÃ­nio correto.",
  "Descobre o conceito cobrado.",
  "Transforma a questÃ£o em revisÃ£o objetiva.",
]

const demoBlocks = [
  {
    label: "DiagnÃ³stico do erro",
    text: "VocÃª confundiu a interpretaÃ§Ã£o do enunciado com o conceito realmente cobrado pela questÃ£o.",
  },
  {
    label: "Conceito central",
    text: "A questÃ£o exige identificar a relaÃ§Ã£o entre os dados apresentados e o comando final do enunciado.",
  },
  {
    label: "Como resolver",
    text: "Leia o comando, destaque as informaÃ§Ãµes Ãºteis, elimine alternativas incompatÃ­veis e compare com o conceito cobrado.",
  },
  {
    label: "Como revisar",
    text: "Registre o tipo de erro e refaÃ§a questÃµes semelhantes antes de avanÃ§ar para outro tema.",
  },
]

const audience = [
  "Quem estÃ¡ se preparando para o ENEM.",
  "Quem quer estudar por questÃµes e provas.",
  "Quem faz simulados, mas nÃ£o sabe o que revisar depois.",
  "Quem quer usar IA de forma prÃ¡tica, sem depender de prompts complexos.",
]

const notFor = [
  "Quem procura promessa de aprovaÃ§Ã£o garantida.",
  "Quem quer apenas acumular materiais sem praticar.",
  "Quem nÃ£o pretende revisar os prÃ³prios erros.",
]

const faqs = [
  {
    question: "O MinhAprovação garante minha aprovaÃ§Ã£o?",
    answer:
      "NÃ£o. Nenhuma plataforma sÃ©ria deve prometer aprovaÃ§Ã£o garantida. O MinhAprovação ajuda vocÃª a praticar, corrigir erros, entender dificuldades e estudar com mais direÃ§Ã£o.",
  },
  {
    question: "O que a IA faz na plataforma?",
    answer:
      "A IA ajuda a explicar questÃµes erradas ou em branco, mostrando o conceito cobrado, o raciocÃ­nio correto e como revisar aquele tipo de erro.",
  },
  {
    question: "Posso comeÃ§ar grÃ¡tis?",
    answer:
      "Sim. O plano Free permite conhecer a plataforma e usar recursos iniciais com limites.",
  },
  {
    question: "Qual Ã© a diferenÃ§a do plano Pro?",
    answer:
      "O plano Pro libera mais uso, mais liberdade de treino e recursos avanÃ§ados para quem quer estudar com mais intensidade.",
  },
  {
    question: "Os dados do dashboard sÃ£o reais?",
    answer:
      "Sim. O dashboard deve exibir apenas dados gerados pelas atividades do prÃ³prio usuÃ¡rio, como provas, simulados e treinos realizados.",
  },
  {
    question: "Preciso saber usar IA?",
    answer:
      "NÃ£o. A IA aparece integrada na correÃ§Ã£o, principalmente nas questÃµes que vocÃª errou ou deixou em branco.",
  },
  {
    question: "Posso cancelar o Pro?",
    answer:
      "Sim. O cancelamento deve seguir a polÃ­tica da plataforma, sem promessa de fidelidade forÃ§ada.",
  },
]

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
      {children}
    </span>
  )
}

function PrimaryButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_60px_-20px_rgba(59,130,246,0.95)] transition hover:scale-[1.01] hover:opacity-95"
    >
      {children}
      <ArrowRight className="size-4" />
    </Link>
  )
}

function SecondaryButton({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
    >
      {children}
    </Link>
  )
}

function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="container-shell">
        <div className="flex min-h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Brain className="size-5" />
            </div>

            <div>
              <div className="text-base font-semibold tracking-tight text-white">
                MinhAprovação
              </div>
              <div className="text-xs text-muted-foreground">
                Estudo com IA e correÃ§Ã£o inteligente
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="rounded-2xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white/5 hover:text-white"
            >
              Entrar
            </Link>

            <PrimaryButton href="/register">ComeÃ§ar grÃ¡tis</PrimaryButton>
          </div>

          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white md:hidden"
            aria-label="Abrir menu"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-white/10 py-4 md:hidden">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-3 py-3 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-3 grid gap-3">
                <SecondaryButton href="/login">Entrar</SecondaryButton>
                <PrimaryButton href="/register">ComeÃ§ar grÃ¡tis</PrimaryButton>
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  )
}

function HeroMockup() {
  return (
    <div className="relative">
      <div className="absolute -left-10 top-10 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-10 bottom-12 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />

      <div className="hero-glow glass-panel relative rounded-[32px] p-5">
        <div className="rounded-[26px] border border-white/10 bg-slate-950/75 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                CorreÃ§Ã£o inteligente
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                QuestÃ£o de MatemÃ¡tica
              </h2>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
              <XCircle className="size-3.5" />
              Incorreta
            </span>
          </div>

          <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
            Considerando o conceito cobrado no enunciado, qual alternativa
            representa corretamente a relaÃ§Ã£o entre os dados apresentados?
          </p>

          <div className="mt-4 grid gap-2">
            {[
              { letter: "A", text: "Alternativa A", state: "neutral" },
              { letter: "B", text: "Sua resposta", state: "wrong" },
              { letter: "C", text: "Alternativa C", state: "neutral" },
              { letter: "D", text: "Gabarito correto", state: "right" },
            ].map((option) => (
              <div
                key={option.letter}
                className={[
                  "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-sm",
                  option.state === "wrong"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-100"
                    : option.state === "right"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                      : "border-white/10 bg-white/5 text-slate-300",
                ].join(" ")}
              >
                <span className="grid size-7 place-items-center rounded-lg border border-white/10 bg-slate-950/60 text-xs font-bold text-white">
                  {option.letter}
                </span>

                <span>{option.text}</span>

                {option.state === "wrong" ? (
                  <XCircle className="ml-auto size-4 text-rose-300" />
                ) : null}

                {option.state === "right" ? (
                  <CheckCircle2 className="ml-auto size-4 text-emerald-300" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="size-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  ExplicaÃ§Ã£o da IA
                </p>
                <p className="text-xs text-muted-foreground">
                  Gerada para esta questÃ£o
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {demoBlocks.slice(0, 3).map((block) => (
                <div
                  key={block.label}
                  className="rounded-xl border border-white/10 bg-slate-950/45 p-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    {block.label}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-200">
                    {block.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 left-6 hidden rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent md:block">
        O erro vira explicaÃ§Ã£o, e a explicaÃ§Ã£o vira revisÃ£o.
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-24">
      <div className="absolute inset-0 -z-10 bg-grid opacity-[0.10]" />
      <div className="absolute left-1/2 top-20 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="container-shell">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="max-w-3xl">
            <SectionBadge>Plataforma de estudos com IA para ENEM</SectionBadge>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
              Entenda seus erros e estude com{" "}
              <span className="text-gradient">direÃ§Ã£o.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-xl">
              Resolva provas, faÃ§a simulados e receba explicaÃ§Ãµes por IA nas
              questÃµes que vocÃª errou ou deixou em branco. O MinhAprovação mostra o
              que revisar sem prometer atalhos irreais.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="/register">ComeÃ§ar grÃ¡tis</PrimaryButton>
              <SecondaryButton href="#como-funciona">
                Ver como funciona
              </SecondaryButton>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
              Sem promessa falsa de aprovaÃ§Ã£o. Apenas prÃ¡tica, correÃ§Ã£o,
              explicaÃ§Ã£o dos erros e dados reais da sua jornada.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                "Provas e simulados",
                "ExplicaÃ§Ã£o por IA",
                "Dashboard real",
              ].map((item) => (
                <div
                  key={item}
                  className="glass-panel rounded-2xl px-4 py-3 text-sm font-medium text-slate-200"
                >
                  <CheckCircle2 className="mr-2 inline size-4 text-accent" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <HeroMockup />
        </div>
      </div>
    </section>
  )
}

function Problem() {
  return (
    <section className="section-padding">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>O problema</SectionBadge>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Fazer questÃµes sem entender os erros nÃ£o Ã© estratÃ©gia.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            A correÃ§Ã£o precisa virar diagnÃ³stico. Caso contrÃ¡rio, o aluno apenas
            acumula tentativas sem saber o que revisar.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {painPoints.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.title}
                className="rounded-[28px] border border-white/10 bg-card/70 p-6"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
                  <Icon className="size-6" />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {item.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Solution() {
  return (
    <section id="como-funciona" className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/[0.05] to-transparent" />

      <div className="container-shell">
        <div className="max-w-3xl">
          <SectionBadge>Como funciona</SectionBadge>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            O MinhAprovação transforma sua correÃ§Ã£o em direÃ§Ã£o de estudo.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            O fluxo foi pensado para tirar o aluno do â€œacertei ou erreiâ€ e
            levar para â€œo que eu preciso revisar agora?â€.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {solutionSteps.map((step, index) => {
            const Icon = step.icon

            return (
              <article
                key={step.title}
                className="relative rounded-[28px] border border-white/10 bg-card/70 p-6"
              >
                <div className="absolute right-5 top-5 text-5xl font-bold text-white/[0.04]">
                  {index + 1}
                </div>

                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="size-6" />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
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

function Differential() {
  return (
    <section className="section-padding">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Diferencial</SectionBadge>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            NÃ£o Ã© sÃ³ correÃ§Ã£o.{" "}
            <span className="text-gradient">Ã‰ explicaÃ§Ã£o do erro.</span>
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-card/70 p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-rose-500/70 to-transparent" />

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-300">
              Antes do MinhAprovação
            </p>

            <ul className="mt-6 space-y-4">
              {before.map((item) => (
                <li key={item} className="flex gap-3 text-slate-300">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300">
                    <X className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="hero-glow relative overflow-hidden rounded-[28px] border border-primary/25 bg-primary/10 p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Com o MinhAprovação
            </p>

            <ul className="mt-6 space-y-4">
              {after.map((item) => (
                <li key={item} className="flex gap-3 text-slate-100">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Check className="size-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section id="recursos" className="section-padding">
      <div className="container-shell">
        <div className="max-w-3xl">
          <SectionBadge>Recursos</SectionBadge>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Tudo que vocÃª precisa para estudar com foco.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            O MinhAprovação une prÃ¡tica, correÃ§Ã£o, IA explicativa e acompanhamento de
            evoluÃ§Ã£o em uma experiÃªncia direta.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <article
                key={feature.title}
                className="rounded-[28px] border border-white/10 bg-card/70 p-6 transition hover:border-primary/30 hover:bg-white/[0.07]"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="size-6" />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-400">
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

function Demo() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-accent/[0.04] to-transparent" />

      <div className="container-shell">
        <div className="max-w-3xl">
          <SectionBadge>DemonstraÃ§Ã£o</SectionBadge>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Veja a explicaÃ§Ã£o por IA em aÃ§Ã£o.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            Quando vocÃª erra ou deixa em branco, o MinhAprovação abre o erro em
            camadas e mostra o caminho da prÃ³xima revisÃ£o.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                QuestÃ£o Â· CiÃªncias da Natureza
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
                <XCircle className="size-3.5" />
                Incorreta
              </span>
            </div>

            <p className="mt-5 text-base leading-8 text-slate-200">
              Uma questÃ£o apresenta dados, alternativas prÃ³ximas e um comando
              especÃ­fico. O aluno marca uma alternativa plausÃ­vel, mas que nÃ£o
              responde exatamente ao conceito pedido.
            </p>

            <div className="mt-5 grid gap-2">
              {[
                { letter: "A", text: "Alternativa incompatÃ­vel" },
                { letter: "B", text: "Sua resposta", wrong: true },
                { letter: "C", text: "Alternativa incompleta" },
                { letter: "D", text: "Gabarito correto", right: true },
              ].map((item) => (
                <div
                  key={item.letter}
                  className={[
                    "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm",
                    item.wrong
                      ? "border-rose-500/40 bg-rose-500/10"
                      : item.right
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : "border-white/10 bg-white/5",
                  ].join(" ")}
                >
                  <span className="grid size-7 place-items-center rounded-lg border border-white/10 bg-slate-950/60 text-xs font-bold text-white">
                    {item.letter}
                  </span>
                  <span className="text-slate-200">{item.text}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="hero-glow rounded-[28px] border border-primary/25 bg-primary/10 p-6">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="size-5" />
              </div>

              <div>
                <p className="font-semibold text-white">ExplicaÃ§Ã£o da IA</p>
                <p className="text-xs text-muted-foreground">
                  Gerada para esta questÃ£o
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {demoBlocks.map((block) => (
                <div
                  key={block.label}
                  className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    {block.label}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    {block.text}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function ForWho() {
  return (
    <section className="section-padding">
      <div className="container-shell">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-[32px] border border-white/10 bg-card/70 p-7">
            <SectionBadge>Para quem Ã©</SectionBadge>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Criado para quem quer estudar por prÃ¡tica e revisÃ£o.
            </h2>

            <div className="mt-8 space-y-4">
              {audience.map((item) => (
                <div key={item} className="flex gap-3 text-slate-300">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-white/10 bg-card/70 p-7">
            <SectionBadge>Talvez nÃ£o seja para vocÃª</SectionBadge>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              TransparÃªncia tambÃ©m faz parte do produto.
            </h2>

            <div className="mt-8 space-y-4">
              {notFor.map((item) => (
                <div key={item} className="flex gap-3 text-slate-300">
                  <XCircle className="mt-0.5 size-5 shrink-0 text-rose-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="planos" className="section-padding">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>Planos</SectionBadge>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Comece grÃ¡tis. Evolua quando precisar de mais intensidade.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            A landing nÃ£o usa mÃ©tricas falsas nem promessas irreais. O valor
            estÃ¡ na prÃ¡tica, correÃ§Ã£o e explicaÃ§Ã£o dos seus erros.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          <article className="rounded-[32px] border border-white/10 bg-card/70 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Plano Free
            </p>

            <h3 className="mt-4 text-3xl font-bold text-white">
              Para comeÃ§ar agora
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              Ideal para conhecer a plataforma, testar o fluxo de estudo e
              resolver atividades com limites iniciais.
            </p>

            <ul className="mt-7 space-y-4 text-sm text-slate-300">
              {[
                "Acesso inicial Ã  plataforma",
                "Treinos e simulados com limite",
                "CorreÃ§Ã£o automÃ¡tica",
                "VisualizaÃ§Ã£o bÃ¡sica de desempenho",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <SecondaryButton href="/register">ComeÃ§ar grÃ¡tis</SecondaryButton>
            </div>
          </article>

          <article className="hero-glow relative overflow-hidden rounded-[32px] border border-primary/30 bg-primary/10 p-7">
            <div className="absolute right-6 top-6 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              Mais completo
            </div>

            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Plano Pro
            </p>

            <h3 className="mt-4 text-3xl font-bold text-white">
              Para estudar com mais liberdade
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-200">
              Pensado para quem quer mais volume de prÃ¡tica, mais explicaÃ§Ãµes e
              uma experiÃªncia de estudo mais intensa.
            </p>

            <ul className="mt-7 space-y-4 text-sm text-slate-100">
              {[
                "Mais uso de simulados e treinos",
                "ExplicaÃ§Ãµes por IA ampliadas",
                "Dashboard de evoluÃ§Ã£o",
                "Recursos avanÃ§ados conforme expansÃ£o da plataforma",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <PrimaryButton href="/pricing">Ver plano Pro</PrimaryButton>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="section-padding">
      <div className="container-shell">
        <div className="mx-auto max-w-3xl text-center">
          <SectionBadge>FAQ</SectionBadge>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Perguntas frequentes
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-3">
          {faqs.map((faq, index) => {
            const isOpen = open === index

            return (
              <article
                key={faq.question}
                className="rounded-2xl border border-white/10 bg-card/70"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  <span className="font-semibold text-white">
                    {faq.question}
                  </span>

                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen ? (
                  <div className="border-t border-white/10 px-5 pb-5 pt-4 text-sm leading-7 text-slate-400">
                    {faq.answer}
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="section-padding">
      <div className="container-shell">
        <div className="hero-glow overflow-hidden rounded-[36px] border border-primary/25 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.20),_rgba(15,23,42,0.92)_45%,_rgba(2,6,23,0.95)_100%)] p-8 text-center md:p-12">
          <SectionBadge>Comece pelo que mais importa</SectionBadge>

          <h2 className="mx-auto mt-5 max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Transforme sua prÃ³xima questÃ£o errada em uma revisÃ£o objetiva.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Resolva uma prova, faÃ§a um treino ou gere um simulado. O MinhAprovação
            ajuda vocÃª a transformar a correÃ§Ã£o em prÃ³ximo passo.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryButton href="/register">ComeÃ§ar grÃ¡tis</PrimaryButton>
            <SecondaryButton href="/pricing">Ver planos</SecondaryButton>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="container-shell">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Brain className="size-5" />
              </div>

              <div>
                <p className="font-semibold text-white">MinhAprovação</p>
                <p className="text-sm text-muted-foreground">
                  Estudo com IA e correÃ§Ã£o inteligente.
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
              MinhAprovação Ã© uma plataforma independente de estudos. NÃ£o garante
              aprovaÃ§Ã£o e nÃ£o substitui dedicaÃ§Ã£o, planejamento e prÃ¡tica
              constante.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="transition hover:text-white">
              Entrar
            </Link>
            <Link href="/register" className="transition hover:text-white">
              Criar conta
            </Link>
            <Link href="/pricing" className="transition hover:text-white">
              Planos
            </Link>
            <Link href="/dashboard" className="transition hover:text-white">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function MinhAprovaçãoLanding() {
  return (
    <main className="min-h-screen overflow-hidden">
      <Header />
      <Hero />
      <Problem />
      <Solution />
      <Differential />
      <Features />
      <Demo />
      <ForWho />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  )
}
