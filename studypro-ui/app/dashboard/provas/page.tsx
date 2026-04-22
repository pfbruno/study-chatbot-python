"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Crown,
  FileText,
  Filter,
  GraduationCap,
  Loader2,
  Lock,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  getExamByTypeAndYear,
  getSimulationEntitlement,
  type ExamDetail,
  type SimulationEntitlementResponse,
} from "@/lib/api"

type ExamListItem = {
  year: number
  title: string
  description: string
  question_count: number
  has_answer_key: boolean
  official_page_url?: string | null
  href: string
  source: "api" | "fallback"
}

type InstitutionCard = {
  id: string
  name: string
  fullName: string
  description: string
  editions: number
  href: string
  gradient: string
  featured?: boolean
  premiumBoost?: boolean
}

type ContinueCard = {
  title: string
  description: string
  progress: number
  href: string
  lastAccessLabel: string
}

const FALLBACK_ENEM_2022: ExamListItem = {
  year: 2022,
  title: "ENEM 2022 — Prova Oficial",
  description:
    "Prova oficial do ENEM 2022 disponível para resolução completa e revisão posterior.",
  question_count: 180,
  has_answer_key: true,
  official_page_url: null,
  href: "/dashboard/provas/enem/2022",
  source: "fallback",
}

const INSTITUTIONS: InstitutionCard[] = [
  {
    id: "enem",
    name: "ENEM",
    fullName: "Exame Nacional do Ensino Médio",
    description: "Principal porta de entrada para universidades brasileiras",
    editions: 5,
    href: "/dashboard/provas/enem",
    gradient: "from-cyan-400 via-emerald-400 to-teal-400",
    featured: true,
  },
  {
    id: "fuvest",
    name: "FUVEST",
    fullName: "Fundação Universitária para o Vestibular",
    description: "Vestibular oficial da USP",
    editions: 3,
    href: "/dashboard/provas/fuvest",
    gradient: "from-blue-400 via-violet-400 to-fuchsia-400",
  },
  {
    id: "unicamp",
    name: "UNICAMP",
    fullName: "Comissão Permanente para os Vestibulares",
    description: "Vestibular da Universidade Estadual de Campinas",
    editions: 3,
    href: "/dashboard/provas/unicamp",
    gradient: "from-emerald-400 via-teal-400 to-cyan-400",
  },
  {
    id: "unesp",
    name: "UNESP",
    fullName: "Vestibular UNESP",
    description: "Universidade Estadual Paulista",
    editions: 2,
    href: "/dashboard/provas/unesp",
    gradient: "from-orange-400 via-red-400 to-pink-400",
    premiumBoost: true,
  },
]

function mapExamDetailToItem(detail: ExamDetail): ExamListItem {
  return {
    year: detail.year,
    title: detail.title || `ENEM ${detail.year} — Prova Oficial`,
    description:
      detail.description ||
      `Prova oficial do ENEM ${detail.year} disponível para resolução completa.`,
    question_count: detail.question_count || 180,
    has_answer_key: detail.has_answer_key ?? true,
    official_page_url: detail.official_page_url,
    href: `/dashboard/provas/${detail.exam_type}/${detail.year}`,
    source: "api",
  }
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[#4b8df7]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function PlanStatusCard({
  entitlement,
  loading,
}: {
  entitlement: SimulationEntitlementResponse | null
  loading: boolean
}) {
  const isPro = entitlement?.entitlements.is_pro ?? false
  const remaining = entitlement?.usage.remaining_today
  const dailyLimit = entitlement?.usage.daily_limit

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#081224] p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
          <Sparkles className="size-4 text-blue-300" />
        </div>

        <div>
          <p className="text-sm text-slate-400">Plano atual</p>
          <h3 className="text-lg font-semibold text-white">
            {loading
              ? "Carregando..."
              : isPro
              ? "PRO ativo"
              : typeof remaining === "number" && typeof dailyLimit === "number"
              ? `FREE · ${remaining}/${dailyLimit} geração(ões) restantes`
              : "FREE"}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">
        {loading
          ? "Verificando seu acesso atual."
          : isPro
          ? "Seu plano já está pronto para estudar com mais continuidade, mais prática e menos fricção."
          : "Você pode usar provas oficiais normalmente. O Pro amplia seu fluxo de treino e reduz interrupções ao longo da preparação."}
      </p>

      {!isPro ? (
        <div className="mt-4">
          <Link
            href="/pricing"
            className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
          >
            Ver plano Pro
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function LightPaywallCard({ isPro }: { isPro: boolean }) {
  if (isPro) return null

  return (
    <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-amber-500/15">
          <Lock className="size-4 text-amber-200" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">
            Paywall leve
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            O Free permite começar. O Pro acelera sua rotina.
          </h3>
          <p className="mt-3 text-sm leading-7 text-amber-100">
            Use provas oficiais para entrar em ação agora. Quando quiser mais
            volume, mais constância e menos travas no fluxo de estudo, avance para o Pro.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Comparar planos
            </Link>

            <Link
              href="/dashboard/provas/enem/2022"
              className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Resolver prova oficial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProvasPage() {
  const [enem2022, setEnem2022] = useState<ExamListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")

  const [entitlement, setEntitlement] =
    useState<SimulationEntitlementResponse | null>(null)
  const [loadingEntitlement, setLoadingEntitlement] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todas")
  const [yearFilter, setYearFilter] = useState("Ano")
  const [sortFilter, setSortFilter] = useState("Mais recentes")

  useEffect(() => {
    async function loadEntitlement() {
      try {
        setLoadingEntitlement(true)
        const token = localStorage.getItem(AUTH_TOKEN_KEY)
        const data = await getSimulationEntitlement(token)
        setEntitlement(data)
      } catch {
        setEntitlement(null)
      } finally {
        setLoadingEntitlement(false)
      }
    }

    void loadEntitlement()
  }, [])

  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true)
        setError("")
        setWarning("")

        try {
          const exam2022 = await getExamByTypeAndYear("enem", 2022)
          setEnem2022(mapExamDetailToItem(exam2022))
        } catch {
          setEnem2022(FALLBACK_ENEM_2022)
          setWarning(
            "A listagem automática não retornou o ENEM 2022 em produção. Foi exibida a entrada fallback da prova oficial."
          )
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar provas."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadExams()
  }, [])

  const isPro = entitlement?.entitlements.is_pro ?? false

  const continueCard: ContinueCard | null = useMemo(() => {
    if (!enem2022) return null

    return {
      title: "ENEM 2022",
      description:
        "Prova oficial aplicada em novembro de 2022. Inclui ambos os dias da aplicação.",
      progress: 38,
      href: enem2022.href,
      lastAccessLabel: "Há 2 dias",
    }
  }, [enem2022])

  const filteredInstitutions = useMemo(() => {
    let items = [...INSTITUTIONS]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.fullName.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      )
    }

    if (yearFilter !== "Ano") {
      items = items.filter((item) => item.editions >= 2)
    }

    if (statusFilter === "Disponível") {
      items = items.filter((item) => !item.premiumBoost)
    }

    if (statusFilter === "Concluída") {
      items = items.filter((item) => item.id === "enem")
    }

    if (statusFilter === "Em andamento") {
      items = items.filter((item) => item.id === "fuvest")
    }

    if (sortFilter === "Mais recentes") {
      items.sort((a, b) => b.editions - a.editions)
    }

    if (sortFilter === "Mais antigas") {
      items.sort((a, b) => a.editions - b.editions)
    }

    if (sortFilter === "Mais edições") {
      items.sort((a, b) => b.editions - a.editions)
    }

    return items
  }, [search, sortFilter, statusFilter, yearFilter])

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#071225] p-6 text-slate-300">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando provas...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(41,98,255,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8 shadow-[0_10px_50px_-28px_rgba(59,130,246,0.5)]">
        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2f7cff]/25 bg-[#2f7cff]/10 px-4 py-2 text-sm text-[#79a6ff]">
              <FileText className="size-4" />
              Catálogo oficial + fluxo premium
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-[#0e2347]">
                <BookOpen className="size-7 text-[#4b8df7]" />
              </div>

              <div>
                <h1 className="text-5xl font-bold tracking-tight text-white">
                  Área de Provas
                </h1>
                <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
                  Resolva provas oficiais completas de vestibulares e ENEM, com gabarito,
                  continuidade de estudo e transição clara para recursos mais avançados.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-2 xl:grid-cols-4">
              <MetricItem label="Provas oficiais" value="9" />
              <MetricItem label="Instituições" value="4" />
              <MetricItem label="Concluídas" value="1" />
              <MetricItem label="Total de questões" value="1.5k+" />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#030b1d] p-6">
            <p className="text-sm text-slate-400">Instituição</p>
            <div className="mt-3 text-5xl font-bold text-white">ENEM</div>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              O ENEM é a maior avaliação educacional do Brasil, aplicada anualmente pelo INEP.
              Resolva provas oficiais completas com gabarito, comentários e análise de desempenho por área de conhecimento.
            </p>

            <div className="mt-6 flex flex-wrap gap-6 text-sm text-[#7ea0d6]">
              <span className="inline-flex items-center gap-2">
                <GraduationCap className="size-4" />
                5 edições
              </span>
              <span className="inline-flex items-center gap-2">
                <Trophy className="size-4" />
                Gabarito oficial
              </span>
            </div>

            <Link
              href="/dashboard/provas/enem"
              className="mt-7 inline-flex items-center justify-center rounded-2xl bg-[#4b8df7] px-6 py-3 text-base font-semibold text-white transition hover:opacity-90"
            >
              Explorar provas ENEM
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <PlanStatusCard
          entitlement={entitlement}
          loading={loadingEntitlement}
        />
        <LightPaywallCard isPro={isPro} />
      </section>

      {warning ? (
        <section className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {warning}
        </section>
      ) : null}

      {continueCard ? (
        <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.3)]">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 text-base text-emerald-300">
              <Calendar className="size-4" />
              Continuar de onde parei
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-white">
                  {continueCard.title}
                </h2>
                <p className="mt-3 max-w-3xl text-xl leading-8 text-[#7ea0d6]">
                  {continueCard.description}
                </p>
              </div>

              <div className="text-right text-sm text-slate-400">
                {continueCard.lastAccessLabel}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Progresso</span>
                <span>{continueCard.progress}%</span>
              </div>
              <ProgressBar value={continueCard.progress} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={continueCard.href}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-[#030b1d] px-5 py-4 text-xl font-semibold text-white transition hover:bg-[#0a1730]"
              >
                Continuar prova
              </Link>

              {!isPro ? (
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 px-5 py-4 text-base font-semibold text-primary transition hover:bg-primary/15"
                >
                  Ver Pro para acelerar revisão
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_0.4fr_0.35fr_0.45fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#6f8dbd]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar instituições ou provas..."
              className="h-14 w-full rounded-2xl border border-white/10 bg-[#081224] pl-12 pr-4 text-base text-white outline-none placeholder:text-[#6f8dbd] focus:border-[#2f7cff]/50"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-[#081224] pl-14 pr-10 text-base font-medium text-white outline-none"
            >
              <option className="bg-[#081224]">Todas</option>
              <option className="bg-[#081224]">Disponível</option>
              <option className="bg-[#081224]">Em andamento</option>
              <option className="bg-[#081224]">Concluída</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-[#081224] px-4 pr-10 text-base font-medium text-white outline-none"
            >
              <option className="bg-[#081224]">Ano</option>
              <option className="bg-[#081224]">2023</option>
              <option className="bg-[#081224]">2022</option>
              <option className="bg-[#081224]">2021</option>
              <option className="bg-[#081224]">2020</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={sortFilter}
              onChange={(e) => setSortFilter(e.target.value)}
              className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-[#081224] px-4 pr-10 text-base font-medium text-white outline-none"
            >
              <option className="bg-[#081224]">Mais recentes</option>
              <option className="bg-[#081224]">Mais antigas</option>
              <option className="bg-[#081224]">Mais edições</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Catálogo de instituições
          </h2>
          <span className="text-sm text-[#7ea0d6]">
            {filteredInstitutions.length} resultado(s)
          </span>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {filteredInstitutions.map((institution) => {
            const locked = institution.premiumBoost && !isPro

            return (
              <Link
                key={institution.id}
                href={locked ? "/pricing" : institution.href}
                className={`group overflow-hidden rounded-[28px] border transition ${
                  locked
                    ? "border-amber-500/20 bg-amber-500/10 hover:border-amber-400/40"
                    : "border-white/10 bg-[#071225] hover:border-[#2f7cff]/40 hover:bg-[#0b1730]"
                }`}
              >
                <div className={`h-28 bg-gradient-to-r ${institution.gradient}`} />

                <div className="relative p-6">
                  <div className="absolute right-6 top-[-18px] rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur">
                    {institution.editions} edições
                  </div>

                  <div className="flex items-center gap-2">
                    {institution.featured ? (
                      <div className="inline-flex rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">
                        Em destaque
                      </div>
                    ) : null}

                    {locked ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-200">
                        <Lock className="size-4" />
                        Recurso premium
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 text-xs uppercase tracking-[0.16em] text-[#7ea0d6]">
                    {institution.fullName}
                  </div>

                  <h3 className="mt-2 text-4xl font-bold tracking-tight text-white">
                    {institution.name}
                  </h3>

                  <p className="mt-4 max-w-xl text-xl leading-8 text-[#7ea0d6]">
                    {institution.description}
                  </p>

                  {locked ? (
                    <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      Disponível com prioridade no fluxo premium do StudyPro.
                    </div>
                  ) : null}

                  <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                    <span className="inline-flex items-center gap-2 text-base text-slate-400">
                      <BookOpen className="size-4" />
                      Catálogo oficial
                    </span>

                    <span className="inline-flex items-center gap-2 text-xl font-semibold text-[#4b8df7] transition group-hover:translate-x-1">
                      {locked ? "Ver plano Pro" : "Acessar"}
                      <ArrowRight className="size-5" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm uppercase tracking-[0.18em] text-[#7ea0d6]">
        {label}
      </div>
      <div className="mt-3 text-5xl font-bold tracking-tight text-white">
        {value}
      </div>
    </div>
  )
}