"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

import { AnswerSheet } from "@/components/exams/answer-sheet"
import { CorrectionButton } from "@/components/exams/correction-button"
import { ExamHeader } from "@/components/exams/exam-header"
import { ExamViewer } from "@/components/exams/exam-viewer"
import { getExamV2Structure, listExamsV2, submitExamV2Answers, type ExamSubmissionResponse, type ExamV2ListItem, type ExamV2Structure } from "@/lib/api"

export default function EnemYearDetailPage() {
  const params = useParams<{ year: string }>()
  const year = Number(params.year)

  const [examItem, setExamItem] = useState<ExamV2ListItem | null>(null)
  const [structure, setStructure] = useState<ExamV2Structure | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [selectedBookletId, setSelectedBookletId] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Array<string | null>>([])
  const [result, setResult] = useState<ExamSubmissionResponse | null>(null)

  useEffect(() => {
    async function load() {
      const list = await listExamsV2("enem")
      const current = (list.items || []).find((item) => item.year === year) ?? null
      setExamItem(current)
      if (!current) return

      const details = await getExamV2Structure(current.id)
      setStructure(details)
      setSelectedDayId(details.days[0]?.id ?? null)
      setSelectedBookletId(details.days[0]?.booklets[0]?.id ?? null)
      setAnswers(Array.from({ length: details.total_questions }, () => null))
    }

    if (!Number.isNaN(year)) void load()
  }, [year])

  const totalQuestions = useMemo(() => structure?.total_questions ?? 180, [structure])

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = next[index] === value ? null : value
      return next
    })
  }

  async function handleSubmit() {
    if (!examItem) return
    const response = await submitExamV2Answers(examItem.id, answers)
    setResult(response)
  }

  if (!examItem || !structure) {
    return <p className="text-white/70">Carregando prova ENEM...</p>
  }

  return (
    <div className="space-y-6">
      <ExamHeader title={structure.title} source={structure.source} year={structure.year} totalQuestions={totalQuestions} />
      <ExamViewer
        days={structure.days}
        selectedDayId={selectedDayId}
        selectedBookletId={selectedBookletId}
        onSelectDay={setSelectedDayId}
        onSelectBooklet={setSelectedBookletId}
      />
      <AnswerSheet answers={answers} onChange={updateAnswer} />
      <CorrectionButton onSubmit={() => void handleSubmit()} />

      {result ? (
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
          <h2 className="text-xl font-semibold">Resultado</h2>
          <p className="mt-2 text-sm">Nota: {result.score_percentage}%</p>
          <p className="text-sm">Acertos: {result.correct_answers} / {result.total_questions}</p>
        </section>
      ) : null}
    </div>
  )
}
