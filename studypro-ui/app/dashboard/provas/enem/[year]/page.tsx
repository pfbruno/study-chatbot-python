"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

import { AnswerSheet } from "@/components/exams/answer-sheet"
import { CorrectionButton } from "@/components/exams/correction-button"
import { ExamHeader } from "@/components/exams/exam-header"
import { ExamViewer } from "@/components/exams/exam-viewer"
import { getExamV2Structure, listExamsV2, submitExamV2AnswersTimed, type ExamSubmissionResponse, type ExamV2ListItem, type ExamV2Structure } from "@/lib/api"
import { getExamProgress, markExamCompleted, markExamInProgress } from "@/lib/exam-progress"

export default function EnemYearDetailPage() {
  const params = useParams<{ year: string }>()
  const year = Number(params.year)

  const [examItem, setExamItem] = useState<ExamV2ListItem | null>(null)
  const [structure, setStructure] = useState<ExamV2Structure | null>(null)
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [selectedBookletId, setSelectedBookletId] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Array<string | null>>([])
  const [result, setResult] = useState<ExamSubmissionResponse | null>(null)
  const [startedAt, setStartedAt] = useState<number>(Date.now())

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
      const progress = getExamProgress(current.id)
      setAnswers(Array.from({ length: details.total_questions }, () => null))
      if (progress?.status === "in_progress" || progress?.status === "completed") {
        setStartedAt(Date.now())
      }
    }

    if (!Number.isNaN(year)) void load()
  }, [year])

  const totalQuestions = useMemo(() => structure?.total_questions ?? 180, [structure])

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = next[index] === value ? null : value
      if (examItem) {
        const answered = next.filter(Boolean).length
        markExamInProgress(examItem.id, answered, totalQuestions)
      }
      return next
    })
  }

  async function handleSubmit() {
    if (!examItem) return
    const token = localStorage.getItem("studypro_auth_token")
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000))
    const response = await submitExamV2AnswersTimed(examItem.id, answers, timeSpentSeconds, token)
    markExamCompleted(examItem.id, answers.filter(Boolean).length, totalQuestions, response.score_percentage)
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
          <p className="text-sm">Erros: {result.wrong_answers}</p>

          {result.subject_breakdown?.length ? (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {result.subject_breakdown.map((item) => (
                <div key={item.subject} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                  <p className="font-semibold capitalize">{item.subject}</p>
                  <p>Acerto: {item.accuracy}%</p>
                  <p>{item.correct}/{item.total} corretas</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4">
            <h3 className="font-semibold">Revisão pós-prova</h3>
            {(result.wrong_questions?.length ?? 0) === 0 ? (
              <p className="text-sm text-emerald-300">Sem erros para revisar nesta tentativa.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {result.wrong_questions?.slice(0, 8).map((item) => (
                  <div key={item.question_number} className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                    <p>Questão {item.question_number} ({item.subject || "geral"})</p>
                    <p>Você marcou: {item.user_answer || "em branco"} · Correta: {item.correct_answer || "-"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}
