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
    title: "Você vê que errou, mas não entende o motivo",
    description:
      "A nota aparece, mas o erro continua sem explicação prática para orientar a revisão.",
    icon: XCircle,
  },
  {
    title: "Você estuda assuntos que talvez nem sejam prioridade",
    description:
      "Sem diagnóstico claro, o tempo vai para conteúdos aleatórios em vez dos pontos fracos reais.",
    icon: AlertTriangle,
  },
  {
    title: "Você repete erros parecidos em outros simulados",
    description:
      "Quando o erro não vira revisão, ele volta em novas questões com outra aparência.",
    icon: Flame,
  },
]

const solutionSteps = [
  {
    title: "Resolva",
    description:
      "Faça provas oficiais, simulados prontos ou treinos rápidos com poucos cliques.",
    icon: FileText,
  },
  {
    title: "Corrija",
    description:
      "Veja acertos, erros, questões em branco e desempenho por disciplina.",
    icon: CheckCircle2,
  },
  {
    title: "Entenda",
    description:
      "Nas questões erradas ou em branco, a IA explica o erro, o conceito cobrado e o raciocínio correto.",
    icon: Brain,
  },
  {
    title: "Revise",
    description:
      "Use o dashboard para transformar sua correção em próximos passos de estudo.",
    icon: LineChart,
  },
]

const features = [
  {
    title: "Provas oficiais",
    description:
      "Resolva provas por exame e ano com correção organizada por questão.",
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
      "Treinos rápidos com 1 clique para manter constância nos estudos.",
    icon: PlayCircle,
  },
  {
    title: "Explicação por IA",
    description:
      "Entenda questões erradas ou em branco com explicações individuais.",
    icon: Sparkles,
  },
  {
    title: "Dashboard real",
    description:
      "Acompanhe somente dados gerados pelas suas próprias atividades.",
    icon: BarChart3,
  },
  {
    title: "Gamificação",
    description:
      "Use XP, streak e desafios para transformar estudo em rotina.",
    icon: Trophy,
  },
]

const before = [
  "Você apenas vê que errou.",
  "Não sabe por que caiu na alternativa errada.",
  "Não sabe qual conceito revisar.",
  "Repete o mesmo erro em outro simulado.",
]

const after = [
  "Você vê o erro com contexto.",
  "Entende o raciocínio correto.",
  "Descobre o conceito cobrado.",
  "Transforma a questão em revisão objetiva.",
]

const demoBlocks = [
  {
    label: "Diagnóstico do erro",
    text: "Você confundiu a interpretação do enunciado com o conceito realmente cobrado pela questão.",
  },
  {
    label: "Conceito central",
    text: "A questão exige identificar a relação entre os dados apresentados e o comando final do enunciado.",
  },
  {
    label: "Como resolver",
    text: "Leia o comando, destaque as informações úteis, elimine alternativas incompatíveis e compare com o conceito cobrado.",
  },
  {
    label: "Como revisar",
    text: "Registre o tipo de erro e refaça questões semelhantes antes de avançar para outro tema.",
  },
]

const audience = [
  "Quem está se preparando para o ENEM.",
  "Quem quer estudar por questões e provas.",
  "Quem faz simulados, mas não sabe o que revisar depois.",
  "Quem quer usar IA de forma prática, sem depender de prompts complexos.",
]

const notFor = [
  "Quem procura promessa de aprovação garantida.",
  "Quem quer apenas acumular materiais sem praticar.",
  "Quem não pretende revisar os próprios erros.",
]

const faqs = [
  {
    question: "O MinhAprovação garante minha aprovação?",
    answer:
      "Não. Nenhuma plataforma séria deve prometer aprovação garantida. O MinhAprovação ajuda você a praticar, corrigir erros, entender dificuldades e estudar com mais direção.",
  },
  {
    question: "O que a IA faz na plataforma?",
    answer:
      "A IA ajuda a explicar questões erradas ou em branco, mostrando o conceito cobrado, o raciocínio correto e como revisar aquele tipo de erro.",
  },
  {
    question: "Posso começar grátis?",
    answer:
      "Sim. O plano Free permite conhecer a plataforma e usar recursos iniciais com limites.",
  },
  {
    question: "Qual é a diferença do plano Pro?",
    answer:
      "O plano Pro libera mais uso, mais liberdade de treino e recursos avançados para quem quer estudar com mais intensidade.",
  },
  {
    question: "Os dados do dashboard são reais?",
    answer:
      "Sim. O dashboard deve exibir apenas dados gerados pelas atividades do próprio usuário, como provas, simulados e treinos realizados.",
  },
  {
    question: "Preciso saber usar IA?",
    answer:
      "Não. A IA aparece integrada na correção, principalmente nas questões que você errou ou deixou em branco.",
  },
  {
    question: "Posso cancelar o Pro?",
    answer:
      "Sim. O cancelamento deve seguir a política da plataforma, sem promessa de fidelidade forçada.",
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
            <img
              src="/logo.png"
              alt="MinhAprovação"
              className="size-11 shrink-0 object-contain"
            />

            <div>
              <div className="text-base font-semibold tracking-tight text-white">
                MinhAprovação
              </div>
              <div className="text-xs text-muted-foreground">
                Estudo com IA e correção inteligente
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

            <PrimaryButton href="/register">Começar grátis</PrimaryButton>
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
                <PrimaryButton href="/register">Começar grátis</PrimaryButton>
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
                Correção inteligente
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Questão de Matemática
              </h2>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
              <XCircle className="size-3.5" />
              Incorreta
            </span>
          </div>

          <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
            Considerando o conceito cobrado no enunciado, qual alternativa
            representa corretamente a relação entre os dados apresentados?
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
                  Explicação da IA
                </p>
                <p className="text-xs text-muted-foreground">
                  Gerada para esta questão
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
        O erro vira explicação, e a explicação vira revisão.
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
              <span className="text-gradient">direção.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-xl">
              Resolva provas, faça simulados e receba explicações por IA nas
              questões que você errou ou deixou em branco. O MinhAprovação mostra o
              que revisar sem prometer atalhos irreais.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="/register">Começar grátis</PrimaryButton>
              <SecondaryButton href="#como-funciona">
                Ver como funciona
              </SecondaryButton>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
              Sem promessa falsa de aprovação. Apenas prática, correção,
              explicação dos erros e dados reais da sua jornada.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                "Provas e simulados",
                "Explicação por IA",
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
            Fazer questões sem entender os erros não é estratégia.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            A correção precisa virar diagnóstico. Caso contrário, o aluno apenas
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
            O MinhAprovação transforma sua correção em direção de estudo.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            O fluxo foi pensado para tirar o aluno do “acertei ou errei” e
            levar para “o que eu preciso revisar agora?”.
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
            Não é só correção.{" "}
            <span className="text-gradient">É explicação do erro.</span>
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
            Tudo que você precisa para estudar com foco.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            O MinhAprovação une prática, correção, IA explicativa e acompanhamento de
            evolução em uma experiência direta.
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
          <SectionBadge>Demonstração</SectionBadge>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Veja a explicação por IA em ação.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            Quando você erra ou deixa em branco, o MinhAprovação abre o erro em
            camadas e mostra o caminho da próxima revisão.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="glass-panel rounded-[28px] p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Questão · Ciências da Natureza
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-300">
                <XCircle className="size-3.5" />
                Incorreta
              </span>
            </div>

            <p className="mt-5 text-base leading-8 text-slate-200">
              Uma questão apresenta dados, alternativas próximas e um comando
              específico. O aluno marca uma alternativa plausível, mas que não
              responde exatamente ao conceito pedido.
            </p>

            <div className="mt-5 grid gap-2">
              {[
                { letter: "A", text: "Alternativa incompatível" },
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
                <p className="font-semibold text-white">Explicação da IA</p>
                <p className="text-xs text-muted-foreground">
                  Gerada para esta questão
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
            <SectionBadge>Para quem é</SectionBadge>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Criado para quem quer estudar por prática e revisão.
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
            <SectionBadge>Talvez não seja para você</SectionBadge>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Transparência também faz parte do produto.
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
            Comece grátis. Evolua quando precisar de mais intensidade.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-300">
            A landing não usa métricas falsas nem promessas irreais. O valor
            está na prática, correção e explicação dos seus erros.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          <article className="rounded-[32px] border border-white/10 bg-card/70 p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Plano Free
            </p>

            <h3 className="mt-4 text-3xl font-bold text-white">
              Para começar agora
            </h3>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              Ideal para conhecer a plataforma, testar o fluxo de estudo e
              resolver atividades com limites iniciais.
            </p>

            <ul className="mt-7 space-y-4 text-sm text-slate-300">
              {[
                "Acesso inicial Ã  plataforma",
                "Treinos e simulados com limite",
                "Correção automática",
                "Visualização básica de desempenho",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <SecondaryButton href="/register">Começar grátis</SecondaryButton>
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
              Pensado para quem quer mais volume de prática, mais explicações e
              uma experiência de estudo mais intensa.
            </p>

            <ul className="mt-7 space-y-4 text-sm text-slate-100">
              {[
                "Mais uso de simulados e treinos",
                "Explicações por IA ampliadas",
                "Dashboard de evolução",
                "Recursos avançados conforme expansão da plataforma",
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
            Transforme sua próxima questão errada em uma revisão objetiva.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Resolva uma prova, faça um treino ou gere um simulado. O MinhAprovação
            ajuda você a transformar a correção em próximo passo.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <PrimaryButton href="/register">Começar grátis</PrimaryButton>
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
                  Estudo com IA e correção inteligente.
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
              MinhAprovação é uma plataforma independente de estudos. Não garante
              aprovação e não substitui dedicação, planejamento e prática
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

export function StudyProLanding() {
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
