"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { listExamsV2, type ExamV2ListItem } from "@/lib/api"
import { getExamProgress } from "@/lib/exam-progress"

export default function EnemYearsPage() {
  const [items, setItems] = useState<ExamV2ListItem[]>([])
  const [statuses, setStatuses] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        const exams = await listExamsV2("enem")
        setItems(exams)

        const nextStatuses: Record<number, string> = {}
        for (const exam of exams) {
          const progress = getExamProgress(exam.id)
          if (!progress) {
            nextStatuses[exam.id] = "not_started"
          } else if (progress.completed) {
            nextStatuses[exam.id] = "completed"
          } else {
            nextStatuses[exam.id] = "in_progress"
          }
        }

        setStatuses(nextStatuses)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar provas")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Provas ENEM</h1>
        <p className="text-sm text-white/60">
          Escolha um ano para iniciar ou continuar sua prova.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-white/60">Carregando provas...</p>
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const status = statuses[item.id] ?? "not_started"

            return (
              <Link
                key={item.id}
                href={`/dashboard/provas/enem/${item.year}`}
                className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">ENEM {item.year}</h2>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/70">
                    {status === "completed"
                      ? "Concluída"
                      : status === "in_progress"
                        ? "Em andamento"
                        : "Não iniciada"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/60">
                  {item.total_questions} questões
                </p>

                <div className="mt-4 inline-flex rounded-lg bg-primary px-3 py-2 text-sm font-medium text-black">
                  {status === "completed"
                    ? "Ver resultado"
                    : status === "in_progress"
                      ? "Continuar prova"
                      : "Iniciar prova"}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
