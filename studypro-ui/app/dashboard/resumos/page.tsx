"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  BookOpen,
  FileText,
  RotateCcw,
} from "lucide-react"

import { getLatestGeneratedContent } from "@/lib/generated-content-client"
import type { ReviewSummaryPayload } from "@/lib/review-content"

const REVIEW_SUMMARY_KEY = "studypro_review_summary"

function formatLocalDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export default function ResumosPage() {
  const [summary, setSummary] = useState<ReviewSummaryPayload | null>(null)
  const [loadError, setLoadError] = useState("")
  const [sourceLabel, setSourceLabel] = useState("")

  useEffect(() => {
    async function loadSummary() {
      try {
        const raw = localStorage.getItem(REVIEW_SUMMARY_KEY)

        if (raw) {
          const parsed = JSON.parse(raw) as ReviewSummaryPayload

          if (parsed?.title && parsed?.revisionSummary) {
            setSummary(parsed)
            setSourceLabel("Carregado do conteúdo gerado nesta sessão.")
            return
          }
        }

        const persisted = await getLatestGeneratedContent<ReviewSummaryPayload>(
          "review_summary"
        )

        const payload = persisted?.item?.payload

        if (!payload?.title || !payload?.revisionSummary) {
          setLoadError("Nenhum resumo de revisão foi encontrado.")
          return
        }

        setSummary(payload)
        setSourceLabel("Carregado do conteúdo salvo na sua conta.")
      } catch {
        setLoadError("Nenhum resumo de revisão foi encontrado.")
      }
    }

    void loadSummary()
  }, [])

  function handleRestart() {
    window.location.reload()
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-rose-500/20 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-white">
            Resumo não encontrado
          </h1>
          <p className="mt-3 text-sm text-rose-100">{loadError}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/simulados"
              className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Voltar para simulados
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir para o dashboard
            </Link>
          </div>
        </section>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#071225] p-6 text-sm text-slate-300">
        Carregando resumo...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <FileText className="size-4" />
              Resumo explicativo
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              {summary.title}
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              {summary.subtitle}
            </p>

            {sourceLabel ? (
              <p className="mt-4 text-sm text-slate-400">{sourceLabel}</p>
            ) : null}
          </div>

          <div className="w-full xl:max-w-[320px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Gerado em</p>
              <div className="mt-2 text-2xl font-bold text-white">
                {formatLocalDate(summary.generatedAt)}
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Texto baseado nas questões com erro ou em branco e no gabarito do
                último simulado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
              <BookOpen className="size-5 text-blue-300" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">
                Explicação principal
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Resumo em linguagem direta, sem orientação genérica de estudo.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm leading-8 text-slate-300 whitespace-pre-line">
            {summary.revisionSummary}
          </div>
        </article>

        <aside className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <FileText className="size-4" />
            Disciplinas com menor acurácia
          </div>

          <div className="mt-6 space-y-4">
            {summary.weakestSubjects.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm text-slate-300">
                Não houve disciplinas suficientes para destacar prioridade.
              </div>
            ) : (
              summary.weakestSubjects.map((subject, index) => (
                <div
                  key={`${subject.subject}-${index}`}
                  className="rounded-[24px] border border-white/10 bg-[#020b18] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {index + 1}. {subject.subject}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {subject.correct} acerto(s), {subject.wrong} erro(s),{" "}
                        {subject.blank} em branco
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {subject.accuracy.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">acurácia</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
        <div className="flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
          >
            <RotateCcw className="size-4" />
            Recarregar resumo
          </button>

          <Link
            href="/dashboard/simulados/resultado"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="size-4" />
            Voltar ao resultado
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Ir para o dashboard
          </Link>
        </div>
      </section>
    </div>
  )
}
