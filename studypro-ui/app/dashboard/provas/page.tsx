"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, BookOpen, FileText, GraduationCap, Loader2 } from "lucide-react"

import { getExamTypes } from "@/lib/api"

type FlatExamItem = {
  id?: number
  type?: string
  label?: string
  year?: number
  title?: string
}

type GroupedExam = {
  key: string
  label: string
  totalYears: number
  totalExams: number
  latestYear: number | null
}

function formatExamLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function ProvasPage() {
  const [items, setItems] = useState<FlatExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true)
        setError("")
        const data = await getExamTypes()
        setItems(Array.isArray(data) ? (data as FlatExamItem[]) : [])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar provas."
        )
      } finally {
        setLoading(false)
      }
    }

    loadExams()
  }, [])

  const groupedExams = useMemo<GroupedExam[]>(() => {
    const map = new Map<string, GroupedExam & { yearsSet: Set<number> }>()

    for (const item of items) {
      const key = String(item.type || "enem").toLowerCase()
      const year = typeof item.year === "number" ? item.year : null

      if (!map.has(key)) {
        map.set(key, {
          key,
          label: item.label || formatExamLabel(key),
          totalYears: 0,
          totalExams: 0,
          latestYear: year,
          yearsSet: new Set<number>(),
        })
      }

      const current = map.get(key)!
      current.totalExams += 1

      if (year !== null) {
        current.yearsSet.add(year)
        current.latestYear =
          current.latestYear === null ? year : Math.max(current.latestYear, year)
      }
    }

    return Array.from(map.values())
      .map((item) => ({
        key: item.key,
        label: item.label,
        totalExams: item.totalExams,
        totalYears: item.yearsSet.size,
        latestYear: item.latestYear,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))
  }, [items])

  if (loading) {
    return (
      <div className="glass-panel rounded-[32px] p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando catálogo de provas...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              Provas oficiais
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
              Escolha a instituição e avance para os anos disponíveis
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Esta etapa preserva o consumo do catálogo atual de provas e reorganiza
              a navegação do aluno em um fluxo mais claro: instituição, ano, prova e correção.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-sm text-muted-foreground">Fluxo da jornada</p>

            <div className="mt-5 space-y-4">
              {[
                "1. Escolher a instituição",
                "2. Selecionar o ano",
                "3. Visualizar a prova e marcar respostas",
                "4. Corrigir automaticamente quando houver gabarito",
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

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {groupedExams.length === 0 ? (
          <div className="glass-panel rounded-[28px] p-6 text-sm text-slate-300">
            Nenhuma instituição encontrada no catálogo.
          </div>
        ) : (
          groupedExams.map((exam) => (
            <article
              key={exam.key}
              className="glass-panel rounded-[28px] p-6 transition-transform duration-200 hover:-translate-y-1"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
                {exam.key === "enem" ? (
                  <GraduationCap className="size-5 text-primary" />
                ) : (
                  <BookOpen className="size-5 text-primary" />
                )}
              </div>

              <h2 className="mt-5 text-2xl font-semibold text-white">
                {exam.label}
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <InfoChip label="Anos" value={String(exam.totalYears)} />
                <InfoChip label="Provas" value={String(exam.totalExams)} />
                <InfoChip
                  label="Mais recente"
                  value={exam.latestYear ? String(exam.latestYear) : "—"}
                />
              </div>

              <Link
                href={`/dashboard/provas/${encodeURIComponent(exam.key)}`}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
              >
                Explorar anos
                <ArrowRight className="size-4" />
              </Link>
            </article>
          ))
        )}
      </section>

      <section className="glass-panel rounded-[32px] p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
            <FileText className="size-5 text-accent" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Observação técnica
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              A listagem foi reorganizada localmente a partir do retorno atual do
              catálogo, sem alterar `lib/api.ts` nem o backend.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}