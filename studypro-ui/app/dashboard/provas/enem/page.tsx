"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { listExamsV2, type ExamV2ListItem } from "@/lib/api"
import { getExamProgress } from "@/lib/exam-progress"

export default function EnemYearsPage() {
  const [items, setItems] = useState<ExamV2ListItem[]>([])
  const [statuses, setStatuses] = useState<Record<number, string>>({})

export default function EnemYearsPage() {
  const [items, setItems] = useState<ExamV2ListItem[]>([])

  useEffect(() => {
    void listExamsV2("enem").then((data) => setItems(data.items || []))
  }, [])

  useEffect(() => {
    const map: Record<number, string> = {}
    for (const item of items) {
      map[item.id] = getExamProgress(item.id)?.status || "not_started"
    }
    setStatuses(map)
  }, [items])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">ENEM por ano</h1>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} href={`/dashboard/provas/enem/${item.year}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
            <p className="text-xl font-semibold">{item.year}</p>
            <p className="text-sm text-white/60">{item.total_questions} questões</p>
            <p className="mt-2 text-xs text-white/70">
              {statuses[item.id] === "completed" ? "Concluída" : statuses[item.id] === "in_progress" ? "Em andamento" : "Não iniciada"}
            </p>
            <p className="mt-1 text-xs text-primary">
              {statuses[item.id] === "in_progress" ? "Continuar prova" : statuses[item.id] === "completed" ? "Revisar prova" : "Iniciar prova"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
