"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getExamTypes, type ExamType } from "@/lib/api"

export default function ExamYearsPage() {
  const params = useParams()

  // ⚠️ aqui é o ponto crítico
  const examParam = decodeURIComponent(params.exam as string)

  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getExamTypes()
      setExamTypes(data.exam_types || [])
      setLoading(false)
    }

    load()
  }, [])

  const selectedExam = useMemo(() => {
    // 🔥 ajuste importante: comparação flexível
    return examTypes.find(
      (item) =>
        item.key.toLowerCase() === examParam.toLowerCase() ||
        item.label.toLowerCase() === examParam.toLowerCase(),
    )
  }, [examTypes, examParam])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!selectedExam) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/provas" className="text-sm text-muted-foreground">
          ← Voltar para provas
        </Link>

        <div className="text-red-500">
          Prova não encontrada ({examParam})
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/provas" className="text-sm text-muted-foreground">
        ← Voltar para provas
      </Link>

      <h1 className="text-3xl font-bold">{selectedExam.label}</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {selectedExam.years.map((year) => (
          <Link
            key={year.year}
            href={`/dashboard/provas/${selectedExam.key}/${year.year}`}
          >
            <Card className="cursor-pointer hover:border-primary">
              <CardHeader>
                <CardTitle>{year.year}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {year.question_count} questões
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}