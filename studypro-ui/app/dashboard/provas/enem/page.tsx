"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  Calendar,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Trophy,
} from "lucide-react"

import { getExamYears } from "@/lib/api"

type ExamEditionStatus = "available" | "in_progress" | "completed"

type ExamEdition = {
  year: number
  questionCount: number
  status: ExamEditionStatus
  progress?: number
  lastAccessLabel?: string
  href: string
}

type SavedExamResult = {
  unanswered_count?: number
}

type SavedExamProgress = {
  answers?: Record<number, string>
}

const FALLBACK_YEARS = [2022, 2021, 2017, 2016, 2014, 2013, 2012, 2011, 2010]

const OFFICIAL_EXAM_RESULT_PREFIX = "studypro_official_exam_result_"
const OFFICIAL_EXAM_PROGRESS_PREFIX = "studypro_official_exam_progress_"

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

function getStatusBadge(status: ExamEditionStatus) {
  if (status === "completed") {
    return {
      label: "Concluída",
      className:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    }
  }

  if (status === "in_progress") {
    return {
      label: "Em andamento",
      className: "border-[#2f7cff]/25 bg-[#2f7cff]/10 text-[#79a6ff]",
    }
  }

  return {
    label: "Disponível",
    className: "border-white/10 bg-white/5 text-slate-300",
  }
}

function buildEditionStatus(year: number): {
  status: ExamEditionStatus
  progress?: number
  lastAccessLabel?: string
} {
  if (typeof window === "undefined") {
    return { status: "available" }
  }

  const resultKey = `${OFFICIAL_EXAM_RESULT_PREFIX}enem_${year}`
  const progressKey = `${OFFICIAL_EXAM_PROGRESS_PREFIX}enem_${year}`

  try {
    const rawResult = localStorage.getItem(resultKey)
    if (rawResult) {
      const parsedResult = JSON.parse(rawResult) as SavedExamResult
      if (parsedResult?.unanswered_count === 0) {
        return {
          status: "completed",
          progress: 100,
          lastAccessLabel: "Tentativa finalizada",
        }
      }
    }
  } catch {
    localStorage.removeItem(resultKey)
  }

  try {
    const rawProgress = localStorage.getItem(progressKey)
    if (rawProgress) {
      const parsedProgress = JSON.parse(rawProgress) as SavedExamProgress
      const answersCount = Object.keys(parsedProgress?.answers ?? {}).length

      if (answersCount > 0) {
        const progress = Math.round((answersCount / 180) * 100)

        return {
          status: "in_progress",
          progress,
          lastAccessLabel: `${answersCount} resposta(s) marcada(s)`,
        }
      }
    }
  } catch {
    localStorage.removeItem(progressKey)
  }

  return { status: "available" }
}

export default function EnemHubPage() {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("Mais recentes primeiro")
  const [editions, setEditions] = useState<ExamEdition[]>([])
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState("")

  useEffect(() => {
    async function loadYears() {
      try {
        setLoading(true)
        setWarning("")

        const data = await getExamYears()
        const years =
          Array.isArray(data?.years) && data.years.length > 0
            ? data.years.filter((year) => FALLBACK_YEARS.includes(year))
            : FALLBACK_YEARS

        const mapped = [...years]
          .sort((a, b) => b - a)
          .map((year) => {
            const statusData = buildEditionStatus(year)

            return {
              year,
              questionCount: 180,
              status: statusData.status,
              progress: statusData.progress,
              lastAccessLabel: statusData.lastAccessLabel,
              href: `/dashboard/provas/enem/${year}`,
            } satisfies ExamEdition
          })

        setEditions(mapped)

        if (!Array.isArray(data?.years) || data.years.length === 0) {
          setWarning(
            "A API não retornou a listagem de anos. Foram exibidas as edições válidas locais: 2022, 2021, 2017, 2016, 2014, 2013, 2012, 2011 e 2010."
          )
        }
      } catch {
        const mapped = [...FALLBACK_YEARS]
          .sort((a, b) => b - a)
          .map((year) => {
            const statusData = buildEditionStatus(year)

            return {
              year,
              questionCount: 180,
              status: statusData.status,
              progress: statusData.progress,
              lastAccessLabel: statusData.lastAccessLabel,
              href: `/dashboard/provas/enem/${year}`,
            } satisfies ExamEdition
          })

        setEditions(mapped)
        setWarning(
          "A API não retornou a listagem de anos. Foram exibidas as edições válidas locais: 2022, 2021, 2017, 2016, 2014, 2013, 2012, 2011 e 2010."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadYears()
  }, [])

  const filteredEditions = useMemo(() => {
    let items = [...editions]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      items = items.filter((item) => String(item.year).includes(q))
    }

    if (sort === "Mais antigas primeiro") {
      items.sort((a, b) => a.year - b.year)
    } else {
      items.sort((a, b) => b.year - a.year)
    }

    return items
  }, [editions, search, sort])

  const inProgressEdition = filteredEditions.find(
    (edition) => edition.status === "in_progress"
  )

  return (
    <div className="space-y-8">
      {warning ? (
        <section className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {warning}
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(41,98,255,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8 shadow-[0_10px_50px_-28px_rgba(59,130,246,0.45)]">
        <div className="grid gap-8 xl:grid-cols-[1fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              <GraduationCap className="size-4" />
              Instituição em destaque
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className="flex size-16 items-center justify-center rounded-3xl bg-[#0f2a51]">
                <Trophy className="size-8 text-[#4b8df7]" />
              </div>

              <div>
                <h1 className="text-5xl font-bold tracking-tight text-white">
                  ENEM
                </h1>
                <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
                  O ENEM é a maior avaliação educacional do Brasil, aplicada
                  anualmente pelo INEP. Resolva provas oficiais completas com
                  gabarito e análise de desempenho por área de conhecimento.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-base text-[#7ea0d6]">
              <span className="inline-flex items-center gap-2">
                <FileText className="size-4" />
                {loading
                  ? "Carregando edições..."
                  : `${editions.length} edição(ões) disponível(is)`}
              </span>
              <span className="inline-flex items-center gap-2">
                <Trophy className="size-4" />
                Gabarito oficial
              </span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#030b1d] p-6">
            <div className="text-sm uppercase tracking-[0.18em] text-[#7ea0d6]">
              Catálogo ENEM
            </div>

            <h2 className="mt-4 text-3xl font-bold text-white">
              Todas as edições válidas ficam listadas abaixo
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-300">
              A seção inferior já mostra todas as edições disponíveis. Aqui você
              só vê o resumo da instituição e o acesso rápido ao catálogo.
            </p>

            <Link
              href="#edicoes-enem"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#4b8df7] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Ir para edições
            </Link>
          </div>
        </div>
      </section>

      {inProgressEdition ? (
        <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 text-base text-emerald-300">
              <Calendar className="size-4" />
              Continuar de onde parei
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-white">
                  ENEM {inProgressEdition.year}
                </h2>
                <p className="mt-3 max-w-3xl text-xl leading-8 text-[#7ea0d6]">
                  Prova oficial aplicada em novembro de {inProgressEdition.year}.
                  Inclui ambos os dias da aplicação.
                </p>
              </div>

              <div className="text-sm text-slate-400">
                {inProgressEdition.lastAccessLabel}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Progresso</span>
                <span>{inProgressEdition.progress}%</span>
              </div>
              <ProgressBar value={inProgressEdition.progress ?? 0} />
            </div>

            <Link
              href={inProgressEdition.href}
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-[#030b1d] px-5 py-4 text-xl font-semibold text-white transition hover:bg-[#0a1730]"
            >
              Continuar prova
            </Link>
          </div>
        </section>
      ) : null}

      <section
        id="edicoes-enem"
        className="rounded-[28px] border border-white/10 bg-[#071225] p-6"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Edições disponíveis
          </h2>

          <div className="text-sm text-[#7ea0d6]">{sort}</div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#6f8dbd]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar edição..."
              className="h-14 w-full rounded-2xl border border-white/10 bg-[#081224] pl-12 pr-4 text-base text-white outline-none placeholder:text-[#6f8dbd] focus:border-[#2f7cff]/50"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-[#081224] px-4 pr-10 text-base font-medium text-white outline-none"
          >
            <option className="bg-[#081224]">Mais recentes primeiro</option>
            <option className="bg-[#081224]">Mais antigas primeiro</option>
          </select>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center gap-3 text-slate-300">
            <Loader2 className="size-4 animate-spin" />
            Carregando catálogo...
          </div>
        ) : (
          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {filteredEditions.map((edition) => {
              const badge = getStatusBadge(edition.status)

              return (
                <article
                  key={edition.year}
                  className="rounded-[28px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.25)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm uppercase tracking-[0.16em] text-[#7ea0d6]">
                        Edição
                      </div>
                      <div className="mt-2 text-6xl font-bold tracking-tight text-white">
                        {edition.year}
                      </div>
                    </div>

                    <div
                      className={`rounded-full border px-3 py-1 text-sm font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#7ea0d6]">
                    <span className="inline-flex items-center gap-2">
                      <FileText className="size-4" />
                      {edition.questionCount} questões
                    </span>

                    {edition.lastAccessLabel ? (
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="size-4" />
                        {edition.lastAccessLabel}
                      </span>
                    ) : null}
                  </div>

                  {typeof edition.progress === "number" ? (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between text-sm text-slate-300">
                        <span>Progresso</span>
                        <span>{edition.progress}%</span>
                      </div>
                      <ProgressBar value={edition.progress} />
                    </div>
                  ) : null}

                  <div className="mt-7 flex gap-3">
                    {edition.status === "completed" ? (
                      <>
                        <Link
                          href={edition.href}
                          className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-[#030b1d] px-4 py-4 text-xl font-semibold text-white transition hover:bg-[#0a1730]"
                        >
                          Revisar prova
                        </Link>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-[#071225] px-4 py-4 text-white transition hover:bg-white/5"
                        >
                          <RotateCcw className="size-5" />
                        </button>
                      </>
                    ) : (
                      <Link
                        href={edition.href}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4b8df7] px-4 py-4 text-xl font-semibold text-white transition hover:opacity-90"
                      >
                        <Play className="size-4" />
                        {edition.status === "in_progress"
                          ? "Continuar"
                          : "Resolver"}
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}