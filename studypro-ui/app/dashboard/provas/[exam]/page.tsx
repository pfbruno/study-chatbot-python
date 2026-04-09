"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, CalendarDays, FileText, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getExamTypes, type ExamType, type ExamYear } from "@/lib/api"

export default function ExamYearsPage() {
  const params = useParams<{ examType: string }>()
  const examTypeParam = decodeURIComponent(params.examType)

  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadExamTypes() {
      try {
        setLoading(true)
        setError(null)

        const data = await getExamTypes()
        setExamTypes(Array.isArray(data.exam_types) ? data.exam_types : [])
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar as provas disponíveis."

        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadExamTypes()
  }, [])

  const selectedExam = useMemo(() => {
    return examTypes.find((item) => item.key === examTypeParam) || null
  }, [examTypes, examTypeParam])

  const sortedYears = useMemo<ExamYear[]>(() => {
    if (!selectedExam?.years) return []

    return [...selectedExam.years].sort((a, b) => b.year - a.year)
  }, [selectedExam])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!selectedExam) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/provas"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para provas
        </Link>

        <div className="rounded-xl border border-border/60 bg-card/70 p-6">
          <h1 className="text-2xl font-bold text-foreground">Prova não encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Não foi possível localizar a instituição selecionada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/provas"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para provas
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          Instituição
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {selectedExam.label}
        </h1>

        <p className="text-sm text-muted-foreground">
          Selecione o ano da prova para visualizar detalhes e iniciar a resolução.
        </p>
      </div>

      {sortedYears.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/70 p-6">
          <p className="text-sm text-muted-foreground">
            Nenhuma prova disponível para esta instituição no momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedYears.map((yearItem) => (
            <Link
              key={`${selectedExam.key}-${yearItem.year}`}
              href={`/dashboard/provas/${selectedExam.key}/${yearItem.year}`}
            >
              <Card className="h-full cursor-pointer border-border/60 bg-card/80 transition hover:border-primary/60 hover:bg-card">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-xl">{yearItem.year}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{yearItem.title}</p>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-background/60 p-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {yearItem.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-md border border-border/60 bg-background/50 px-2 py-1">
                      {yearItem.question_count} questões
                    </span>

                    <span className="rounded-md border border-border/60 bg-background/50 px-2 py-1">
                      {yearItem.has_answer_key ? "Com gabarito" : "Sem gabarito"}
                    </span>

                    <span className="rounded-md border border-border/60 bg-background/50 px-2 py-1">
                      {yearItem.has_pdfs ? "PDF disponível" : "Sem PDF"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}