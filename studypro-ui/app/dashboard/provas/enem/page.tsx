"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, GraduationCap, Loader2 } from "lucide-react"

import { getExamYears } from "@/lib/api"

export default function EnemPage() {
  const [years, setYears] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError("")
        const data = await getExamYears()
        setYears(Array.isArray(data?.years) ? data.years : [])
      } catch (err) {
        setYears([])
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar os anos do ENEM."
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="glass-panel rounded-[32px] p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando provas do ENEM...
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
              ENEM
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
              Provas ENEM
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Rota especializada para acessar rapidamente os anos disponíveis do ENEM.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-sm text-muted-foreground">Total de anos</p>
            <p className="mt-3 text-4xl font-bold text-white">{years.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {years.length === 0 ? (
          <div className="glass-panel rounded-[28px] p-6 text-sm text-slate-300">
            Nenhum ano disponível no catálogo.
          </div>
        ) : (
          years
            .slice()
            .sort((a, b) => b - a)
            .map((year) => (
              <article
                key={year}
                className="glass-panel rounded-[28px] p-6 transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
                  <GraduationCap className="size-5 text-primary" />
                </div>

                <h2 className="mt-5 text-3xl font-bold text-white">{year}</h2>

                <Link
                  href={`/dashboard/provas/enem/${year}`}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                >
                  Abrir prova
                  <ArrowRight className="size-4" />
                </Link>
              </article>
            ))
        )}
      </section>
    </div>
  )
}