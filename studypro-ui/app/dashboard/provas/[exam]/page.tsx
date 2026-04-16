"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CalendarDays, Loader2 } from "lucide-react"

import { getExamTypes } from "@/lib/api"

type FlatExamItem = {
  id?: number
  type?: string
  label?: string
  year?: number
  title?: string
}

type YearCard = {
  year: number
  totalExams: number
  titles: string[]
}

function normalizeExamParam(value: string) {
  return decodeURIComponent(value).trim().toLowerCase()
}

function formatExamLabel(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export default function ExamYearsPage() {
  const params = useParams<{ exam: string }>()
  const examParam = normalizeExamParam(params.exam)

  const [items, setItems] = useState<FlatExamItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError("")
        const data = await getExamTypes()
        setItems(Array.isArray(data) ? (data as FlatExamItem[]) : [])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar os anos."
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    return items.filter((item) => String(item.type || "enem").toLowerCase() === examParam)
  }, [items, examParam])

  const label = useMemo(() => {
    const first = filtered[0]
    return first?.label || formatExamLabel(examParam)
  }, [filtered, examParam])

  const years = useMemo<YearCard[]>(() => {
    const map = new Map<number, YearCard>()

    for (const item of filtered) {
      if (typeof item.year !== "number") continue

      if (!map.has(item.year)) {
        map.set(item.year, {
          year: item.year,
          totalExams: 0,
          titles: [],
        })
      }

      const current = map.get(item.year)!
      current.totalExams += 1

      if (item.title) {
        current.titles.push(item.title)
      }
    }

    return Array.from(map.values()).sort((a, b) => b.year - a.year)
  }, [filtered])

  if (loading) {
    return (
      <div className="glass-panel rounded-[32px] p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando anos disponíveis...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/provas"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar para provas
        </Link>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </div>
    )
  }

  if (years.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/provas"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar para provas
        </Link>

        <div className="glass-panel rounded-[32px] p-6 text-sm text-slate-300">
          Nenhum ano disponível para <span className="font-semibold text-white">{label}</span>.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/provas"
        className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar para provas
      </Link>

      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              Instituição selecionada
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
              {label}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Escolha o ano que deseja abrir. O próximo passo leva para a visualização
              da prova e, quando disponível, para a correção automática.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-sm text-muted-foreground">Resumo do catálogo</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoTile label="Anos encontrados" value={String(years.length)} />
              <InfoTile
                label="Itens no catálogo"
                value={String(filtered.length)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {years.map((yearItem) => (
          <article
            key={yearItem.year}
            className="glass-panel rounded-[28px] p-6 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
              <CalendarDays className="size-5 text-primary" />
            </div>

            <h2 className="mt-5 text-3xl font-bold text-white">
              {yearItem.year}
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              {yearItem.totalExams} item(ns) encontrados para este ano.
            </p>

            {yearItem.titles.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {yearItem.titles[0]}
              </div>
            ) : null}

            <Link
              href={`/dashboard/provas/${encodeURIComponent(examParam)}/${yearItem.year}`}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
            >
              Abrir prova
              <ArrowRight className="size-4" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}