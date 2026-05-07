"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { QuestionAIExplanation } from "@/components/study/question-ai-explanation"
import { RichQuestionContent } from "@/components/study/rich-question-content"
import { saveRecentAttempt } from "@/lib/activity"
import { dispatchAnalyticsRefresh } from "@/lib/activity-events"

const RESULT_KEY = "studypro_last_simulation_result"

type ResultQuestion = {
  number: number
  subject: string
  statement: string
  options: Record<string, string>
  source_pdf_label?: string | null
  source_year?: number | null
  source_number?: number | null
  source_ref?: string | null
}

type ResultData = {
  attempt_id?: string
  simulation: {
    simulation_id: string
    title: string
    exam_type: string
    year: number
    mode: "balanced" | "random"
    generated_question_count: number
    questions?: ResultQuestion[]
    simulation_source?: string | null
  }
  answers: Record<number, string>
  result: {
    total_questions: number
    correct_answers: number
    wrong_answers: number
    unanswered_count: number
    score_percentage: number
    subjects_summary: Array<{
      subject: string
      total: number
      correct: number
      wrong: number
      blank: number
      accuracy_percentage: number
    }>
    results_by_question: Array<{
      question_number: number
      question_ref?: string | null
      source_ref?: string | null
      source_year?: number | null
      source_number?: number | null
      subject: string
      user_answer: string | null
      correct_answer: string
      status: "correct" | "wrong" | "blank"
    }>
  }
}

function buildAttemptId(data: ResultData) {
  return data.attempt_id ?? `${data.simulation.simulation_id}-training`
}

export default function ResultadoTreinoPage() {
  const [data, setData] = useState<ResultData | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY)

      if (!raw) {
        setError("Nenhum resultado de treino encontrado.")
        return
      }

      const parsed = JSON.parse(raw) as ResultData
      setData(parsed)

      const savedAt = new Date().toISOString()
      const attemptId = buildAttemptId(parsed)

      saveRecentAttempt({
        id: `treino-${attemptId}`,
        module: "treinar",
        title: parsed.simulation.title ?? "Treino",
        scorePercentage: parsed.result.score_percentage,
        correctAnswers: parsed.result.correct_answers,
        totalQuestions: parsed.result.total_questions,
        createdAt: savedAt,
        subjects:
          parsed.result.subjects_summary?.map((item) => ({
            subject: item.subject,
            accuracyPercentage: item.accuracy_percentage,
          })) ?? [],
      })

      dispatchAnalyticsRefresh()
    } catch {
      setError("Erro ao carregar resultado do treino.")
    }
  }, [])

  const answeredQuestions = useMemo(() => {
    if (!data) return 0
    return Math.max(0, data.result.total_questions - data.result.unanswered_count)
  }, [data])

  const questionsByNumber = useMemo(() => {
    const questions = data?.simulation.questions ?? []
    return new Map(questions.map((question) => [question.number, question]))
  }, [data])

  if (error) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-8">
        <p className="text-white">{error}</p>

        <Link
          href="/dashboard/treinar"
          className="mt-6 inline-flex rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Voltar para treinar
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-8 text-slate-300">
        Carregando resultado do treino...
      </div>
    )
  }

  const { result, simulation } = data
  const attemptId = buildAttemptId(data)

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[#7ea0d6]">
          Resultado do treino
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
          {simulation.title}
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Veja seu desempenho neste treino e revise as questões erradas ou em
          branco com explicações individuais por IA.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat
            label="Aproveitamento"
            value={`${result.score_percentage.toFixed(1)}%`}
          />
          <Stat label="Acertos" value={String(result.correct_answers)} />
          <Stat label="Erros" value={String(result.wrong_answers)} />
          <Stat label="Respondidas" value={String(answeredQuestions)} />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <h2 className="text-2xl font-bold text-white">
          Desempenho por disciplina
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {result.subjects_summary.map((subject) => (
            <article
              key={subject.subject}
              className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-white">
                  {subject.subject}
                </h3>

                <span className="text-sm font-medium text-[#7ea0d6]">
                  {subject.accuracy_percentage}%
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-300">
                {subject.correct}/{subject.total} acertos
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#4b8df7]"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, subject.accuracy_percentage)
                    )}%`,
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <h2 className="text-2xl font-bold text-white">Correção detalhada</h2>

        <div className="mt-6 space-y-4">
          {result.results_by_question.map((questionResult) => {
            const sourceQuestion = questionsByNumber.get(
              questionResult.question_number
            )

            const selectedOptionContent =
              questionResult.user_answer && sourceQuestion
                ? sourceQuestion.options[questionResult.user_answer] ?? null
                : null

            const correctOptionContent = sourceQuestion
              ? sourceQuestion.options[questionResult.correct_answer] ?? null
              : null

            const shouldShowExplanation =
              Boolean(sourceQuestion) &&
              (questionResult.status === "wrong" ||
                questionResult.status === "blank")

            const questionRef =
              questionResult.question_ref ??
              questionResult.source_ref ??
              sourceQuestion?.source_ref ??
              `${simulation.exam_type}-${simulation.year}-${questionResult.question_number}`

            return (
              <article
                key={questionResult.question_number}
                className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">
                    Questão {questionResult.question_number}
                  </h3>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      questionResult.status === "correct"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : questionResult.status === "wrong"
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                          : "border-white/10 bg-white/5 text-slate-300"
                    }`}
                  >
                    {questionResult.status === "correct"
                      ? "Correta"
                      : questionResult.status === "wrong"
                        ? "Incorreta"
                        : "Em branco"}
                  </span>
                </div>

                {sourceQuestion ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Enunciado
                    </p>
                    <RichQuestionContent content={sourceQuestion.statement} />
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Sua resposta
                    </p>

                    <p className="mt-2 text-sm text-white">
                      {questionResult.user_answer || "—"}
                    </p>

                    {selectedOptionContent ? (
                      <div className="mt-3">
                        <RichQuestionContent content={selectedOptionContent} />
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Gabarito
                    </p>

                    <p className="mt-2 text-sm text-white">
                      {questionResult.correct_answer}
                    </p>

                    {correctOptionContent ? (
                      <div className="mt-3">
                        <RichQuestionContent content={correctOptionContent} />
                      </div>
                    ) : null}
                  </div>
                </div>

                {shouldShowExplanation && sourceQuestion ? (
                  <QuestionAIExplanation
                    payload={{
                      source: "training",
                      attempt_id: attemptId,
                      exam_type: simulation.exam_type,
                      year: simulation.year,
                      question_ref: questionRef,
                      question_number: questionResult.question_number,
                      subject: questionResult.subject,
                      statement: sourceQuestion.statement,
                      options: sourceQuestion.options,
                      user_answer: questionResult.user_answer,
                      correct_answer: questionResult.correct_answer,
                      status:
                        questionResult.status === "blank" ? "blank" : "wrong",
                    }}
                  />
                ) : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/treinar"
          className="rounded-2xl bg-[#2f7cff] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Continuar treinando
        </Link>

        <Link
          href="/dashboard"
          className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Voltar ao dashboard
        </Link>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
    </article>
  )
}
