"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { listExamsV2, type ExamV2ListItem } from "@/lib/api"

export default function EnemYearsPage() {
  const [items, setItems] = useState<ExamV2ListItem[]>([])

  useEffect(() => {
    void listExamsV2("enem").then((data) => setItems(data.items || []))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">ENEM por ano</h1>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} href={`/dashboard/provas/enem/${item.year}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
            <p className="text-xl font-semibold">{item.year}</p>
            <p className="text-sm text-white/60">{item.total_questions} questões</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
