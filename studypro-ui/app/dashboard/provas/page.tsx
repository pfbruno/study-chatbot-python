"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { FileText, GraduationCap, Loader2 } from "lucide-react"

import { getExamByTypeAndYear, type ExamDetail } from "@/lib/api"

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

export default function ProvasPage() {
  const [enem2022, setEnem2022] = useState<ExamListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")

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

  const availableItems = useMemo<ExamListItem[]>(() => {
    return enem2022 ? [enem2022] : []
  }, [enem2022])

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
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <GraduationCap className="size-4" />
              Provas oficiais
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              Área de provas
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              Resolva provas oficiais completas e use os resultados para revisão
              e novos simulados.
            </p>
          </div>

          <div className="w-full xl:max-w-[360px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Instituição</p>
              <div className="mt-2 text-2xl font-bold text-white">ENEM</div>
              <p className="mt-3 text-sm text-slate-300">
                {availableItems.length} prova(s) oficial(is) disponível(is)
              </p>
            </div>
          </div>
        </div>
      </section>

      {warning ? (
        <section className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {warning}
        </section>
      ) : null}

      {availableItems.length === 0 ? (
        <section className="rounded-[24px] border border-white/10 bg-[#071225] p-6 text-slate-300">
          Nenhuma prova oficial disponível no momento.
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-2">
          {availableItems.map((exam) => (
            <article
              key={`${exam.title}-${exam.year}`}
              className="rounded-[32px] border border-white/10 bg-[#071225] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                    <FileText className="size-5 text-blue-300" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      {exam.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Ano {exam.year}
                    </p>
                  </div>
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white">
                  {exam.question_count} questões
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-300">
                {exam.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Gabarito {exam.has_answer_key ? "disponível" : "indisponível"}
                </span>

                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  Fonte {exam.source === "api" ? "API" : "fallback"}
                </span>

                {exam.official_page_url ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    Fonte oficial cadastrada
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <Link
                  href={exam.href}
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                >
                  Resolver prova
                </Link>

                {exam.official_page_url ? (
                  <a
                    href={exam.official_page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    Ver fonte oficial
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}