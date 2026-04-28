"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { RichQuestionContent } from "@/components/study/rich-question-content"
import { saveRecentAttempt } from "@/lib/activity"
import { dispatchAnalyticsRefresh, trackActivityEvent } from "@/lib/activity-events"
import { saveGeneratedContent } from "@/lib/generated-content-client"
import {
  appendSimulationHistory,
  recordCompletedSimulationAttempt,
  type SimulationHistoryEntry,
} from "@/lib/study-progress"
import {
  buildReviewFlashcards,
  buildReviewSummary,
} from "@/lib/review-content"

const RESULT_KEY = "studypro_last_simulation_result"
const REVIEW_SUMMARY_KEY = "studypro_review_summary"
const REVIEW_FLASHCARDS_KEY = "studypro_review_flashcards"

type ResultQuestion = {
  number: number
  subject: string
  statement: string
  options: Record<string, string>
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
      subject: string
      user_answer: string | null
      correct_answer: string
      status: "correct" | "wrong" | "blank"
    }>
  }
}

function buildGeneratedContentSourceKey(data: ResultData) {
  return (
    data.attempt_id ??
    `${data.simulation.exam_type}-${data.simulation.year}-${data.simulation.simulation_id}`
  )
}

export default function ResultadoSimuladoPage() {
  const router = useRouter()

  const [data, setData] = useState<ResultData | null>(null)
  const [error, setError] = useState("")
  const [actionMessage, setActionMessage] = useState("")

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY)

      if (!raw) {
        setError("Nenhum resultado encontrado.")
        return
      }

      const parsed = JSON.parse(raw) as ResultData
      setData(parsed)

      const savedAt = new Date().toISOString()
      const attemptId =
        parsed.attempt_id ?? `${parsed.simulation.simulation_id}-legacy`

      const answeredQuestions = Math.max(
        0,
        parsed.result.total_questions - parsed.result.unanswered_count
      )

      const historyEntry: SimulationHistoryEntry = {
        id: attemptId,
        saved_at: savedAt,
        title: parsed.simulation.title ?? "Simulado",
        exam_type: parsed.simulation.exam_type,
        year: parsed.simulation.year,
        mode: parsed.simulation.mode,
        total_questions: parsed.result.total_questions,
        correct_answers: parsed.result.correct_answers,
        wrong_answers: parsed.result.wrong_answers,
        unanswered_count: parsed.result.unanswered_count,
        score_percentage: parsed.result.score_percentage,
        subjects_summary: parsed.result.subjects_summary ?? [],
      }

      appendSimulationHistory(historyEntry)

      recordCompletedSimulationAttempt({
        attemptId,
        answeredQuestions,
        correctAnswers: parsed.result.correct_answers,
        completedAt: savedAt,
      })

      saveRecentAttempt({
        id: `simulado-${attemptId}`,
        module: "simulados",
        title: parsed.simulation.title ?? "Simulado",
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
      setError("Erro ao carregar resultado.")
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

  async function handleGenerateSummary() {
    if (!data) return

    const summary = buildReviewSummary(data)
    localStorage.setItem(REVIEW_SUMMARY_KEY, JSON.stringify(summary))

    let persistedInAccount = false

    try {
      await saveGeneratedContent({
        content_type: "review_summary",
        title: summary.title,
        description: summary.subtitle,
        source_type: "simulation_result",
        source_key: buildGeneratedContentSourceKey(data),
        payload: summary,
      })

      persistedInAccount = true
    } catch {
      persistedInAccount = false
    }

    try {
      await trackActivityEvent({
        event_type: "summary_opened",
        module: "resumos",
        subject: data.simulation.exam_type.toUpperCase(),
        metadata_json: {
          source: "simulation_result",
          simulation_title: data.simulation.title,
          total_questions: data.result.total_questions,
          correct_answers: data.result.correct_answers,
          persisted_in_account: persistedInAccount,
        },
      })
    } catch {
      // Mantém a experiência mesmo se o tracking falhar.
    }

    setActionMessage(
      persistedInAccount
        ? "Resumo salvo na sua conta e disponível na área de resumos."
        : "Resumo gerado nesta sessão. Faça login novamente se quiser manter este conteúdo salvo na conta."
    )

    router.push("/dashboard/resumos")
  }

  async function handleGenerateFlashcards() {
    if (!data) return

    const cards = buildReviewFlashcards(data)
    localStorage.setItem(REVIEW_FLASHCARDS_KEY, JSON.stringify(cards))

    let persistedInAccount = false

    try {
      await saveGeneratedContent({
        content_type: "flashcards",
        title: `Flashcards • ${data.simulation.title}`,
        description:
          "Cartões curtos gerados a partir das questões erradas ou em branco do último simulado.",
        source_type: "simulation_result",
        source_key: buildGeneratedContentSourceKey(data),
        payload: cards,
      })

      persistedInAccount = true
    } catch {
      persistedInAccount = false
    }

    try {
      await trackActivityEvent({
        event_type: "flashcard_reviewed",
        module: "flashcards",
        subject: data.simulation.exam_type.toUpperCase(),
        metadata_json: {
          source: "simulation_result",
          simulation_title: data.simulation.title,
          flashcards_reviewed: cards.length,
          persisted_in_account: persistedInAccount,
        },
      })
    } catch {
      // Mantém a experiência mesmo se o tracking falhar.
    }

    setActionMessage(
      persistedInAccount
        ? "Flashcards salvos na sua conta e disponíveis na área de flashcards."
        : "Flashcards gerados nesta sessão. Faça login novamente se quiser manter este conteúdo salvo na conta."
    )

    router.push("/dashboard/flashcards")
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-8">
        <p className="text-white">{error}</p>

        <Link
          href="/dashboard/simulados"
          className="mt-6 inline-flex rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Voltar
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-8 text-slate-300">
        Carregando...
      </div>
    )
  }

  const { result, simulation } = data

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[#7ea0d6]">
          Resultado do simulado
        </p>

        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
          {simulation.title}
        </h1>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Stat
            label="Aproveitamento"
            value={`${result.score_percentage.toFixed(1)}%`}
          />
          <Stat label="Acertos" value={String(result.correct_answers)} />
          <Stat label="Erros" value={String(result.wrong_answers)} />
          <Stat label="Respondidas" value={String(answeredQuestions)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerateSummary}
            className="rounded-2xl bg-[#2f7cff] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Gerar resumo explicativo
          </button>

          <button
            type="button"
            onClick={handleGenerateFlashcards}
            className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/5"
          >
            Gerar flashcards de revisão
          </button>
        </div>

        {actionMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {actionMessage}
          </div>
        ) : null}
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
              </article>
            )
          })}
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/simulados"
          className="rounded-2xl bg-[#2f7cff] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Novo simulado
        </Link>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/dashboard/simulados/resolver"
          }}
          className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Refazer
        </button>
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