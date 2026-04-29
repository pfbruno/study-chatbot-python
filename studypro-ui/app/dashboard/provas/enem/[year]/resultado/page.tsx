"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Target,
  Trophy,
  XCircle,
} from "lucide-react"

import { QuestionAIExplanation } from "@/components/study/question-ai-explanation"
import { RichQuestionContent } from "@/components/study/rich-question-content"

type LocalResultByQuestion = {
  question_number: number
  subject: string
  user_answer: string | null
  correct_answer: string | null
  status: "correct" | "wrong" | "blank" | "annulled"
}

type ExamQuestion = {
  number: number
  day?: number | null
  area?: string | null
  subject: string
  topic?: string | null
  statement: string
  options: Record<string, string>
  answer?: string | null
  annulled?: boolean
  source_pdf_label?: string | null
  source_ref?: string | null
}

type ExamResult = {
  title: string
  exam_type: string
  year: number
  total_questions: number
  correct_answers: number
  wrong_answers: number
  unanswered_count: number
  annulled_count: number
  score_percentage: number
  results_by_question: LocalResultByQuestion[]
  subjects_summary: Array<{
    subject: string
    total: number
    correct: number
    wrong: number
    blank: number
    annulled: number
    accuracy_percentage: number
  }>
}

type ExamPayload = {
  questions?: ExamQuestion[]
}

const OFFICIAL_EXAM_RESULT_PREFIX = "studypro_official_exam_result_"

function buildRawQuestionsUrl(year: number) {
  return `https://raw.githubusercontent.com/pfbruno/study-chatbot-python/main/data/exams/questions/enem/${year}.json`
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[#4b8df7]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function getPerformanceLabel(value: number) {
  if (value >= 75) return { text: "Excelente", className: "text-emerald-300" }
  if (value >= 50) return { text: "Bom desempenho", className: "text-[#79a6ff]" }
  if (value >= 30) return { text: "Pode melhorar", className: "text-yellow-300" }
  return { text: "Precisa melhorar", className: "text-rose-400" }
}

export default function ExamResultPage() {
  const params = useParams()
  const year = Number(params.year as string)

  const [result, setResult] = useState<ExamResult | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [loading, setLoading] = useState(true)

  const storageKey = `${OFFICIAL_EXAM_RESULT_PREFIX}enem_${year}`

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)

        const rawResult = localStorage.getItem(storageKey)
        if (rawResult) {
          setResult(JSON.parse(rawResult) as ExamResult)
        }

        const rawResponse = await fetch(buildRawQuestionsUrl(year), {
          cache: "no-store",
        })

        if (rawResponse.ok) {
          const payload = (await rawResponse.json()) as ExamPayload
          setQuestions(Array.isArray(payload.questions) ? payload.questions : [])
        }
      } catch {
        setResult(null)
        setQuestions([])
      } finally {
        setLoading(false)
      }
    }

    if (Number.isInteger(year)) {
      void load()
    }
  }, [storageKey, year])

  const questionsByNumber = useMemo(() => {
    return new Map(questions.map((question) => [question.number, question]))
  }, [questions])

  const weakestSubjects = useMemo(() => {
    if (!result) return []
    return [...result.subjects_summary]
      .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)
      .slice(0, 3)
  }, [result])

  const performance = getPerformanceLabel(result?.score_percentage ?? 0)

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-8 text-slate-300">
        Carregando resultado...
      </div>
    )
  }

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Nenhum resultado salvo para esta prova ainda.
        </div>

        <Link
          href={`/dashboard/provas/enem/${year}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#071225] px-5 py-3 text-white transition hover:bg-[#0a1730]"
        >
          <ArrowLeft className="size-4" />
          Voltar à prova
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/provas/enem/${year}`}
        className="inline-flex items-center gap-2 text-lg text-[#7ea0d6] transition hover:text-white"
      >
        <ArrowLeft className="size-5" />
        Voltar à prova
      </Link>

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(41,98,255,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_220px] xl:items-center">
          <div className="flex items-start gap-5">
            <div className="flex size-28 items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,_rgba(75,141,247,1),_rgba(16,185,129,0.9))]">
              <Trophy className="size-14 text-[#071225]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                <CheckCircle2 className="size-4" />
                Prova finalizada
              </div>

              <h1 className="mt-5 text-6xl font-bold tracking-tight text-white">
                ENEM {year}
              </h1>

              <p className="mt-4 text-2xl text-[#7ea0d6]">
                Desempenho:{" "}
                <span className={performance.className}>{performance.text}</span>{" "}
                · {result.score_percentage.toFixed(1)}% de acerto
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm uppercase tracking-[0.18em] text-[#7ea0d6]">
              Pontuação
            </div>
            <div className="mt-2 text-7xl font-bold tracking-tight text-[#38c6d9]">
              {Math.round((result.score_percentage / 100) * 1000)}
            </div>
            <div className="text-base text-[#7ea0d6]">de 1000 pontos</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          icon={<CheckCircle2 className="size-6 text-emerald-300" />}
          label="Acertos"
          value={String(result.correct_answers)}
          valueClassName="text-emerald-300"
        />
        <MetricCard
          icon={<XCircle className="size-6 text-rose-400" />}
          label="Erros"
          value={String(result.wrong_answers)}
          valueClassName="text-rose-400"
        />
        <MetricCard
          icon={<Target className="size-6 text-slate-300" />}
          label="Em branco"
          value={String(result.unanswered_count)}
          valueClassName="text-slate-300"
        />
        <MetricCard
          icon={<Target className="size-6 text-[#4b8df7]" />}
          label="Aproveitamento"
          value={`${result.score_percentage.toFixed(1)}%`}
          valueClassName="text-[#4b8df7]"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Desempenho por disciplina
          </h2>
          <p className="mt-2 text-base text-[#7ea0d6]">
            Acertos por área de conhecimento
          </p>

          <div className="mt-6 space-y-5">
            {result.subjects_summary.map((subject) => (
              <div key={subject.subject} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xl font-semibold text-white">
                    {subject.subject}
                  </div>
                  <div className="text-base text-[#7ea0d6]">
                    {subject.correct}/{subject.total} •{" "}
                    {subject.accuracy_percentage.toFixed(1)}%
                  </div>
                </div>
                <ProgressBar value={subject.accuracy_percentage} />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-yellow-500/10">
              <AlertTriangle className="size-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Prioridades de revisão
              </h2>
              <p className="mt-1 text-base text-[#7ea0d6]">
                Disciplinas com pior desempenho
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {weakestSubjects.map((subject, index) => (
              <div
                key={subject.subject}
                className="flex items-center justify-between rounded-[22px] border border-white/10 bg-[#0a1428] px-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-yellow-300">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-white">
                      {subject.subject}
                    </div>
                    <div className="text-sm text-[#7ea0d6]">
                      {subject.correct} acerto(s), {subject.wrong} erro(s),{" "}
                      {subject.blank} em branco
                    </div>
                  </div>
                </div>

                <div className="text-xl font-bold text-rose-400">
                  {subject.accuracy_percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Correção detalhada com IA
        </h2>
        <p className="mt-2 text-base text-[#7ea0d6]">
          As explicações aparecem nas questões erradas ou em branco.
        </p>

        <div className="mt-6 space-y-5">
          {result.results_by_question.map((item) => {
            const question = questionsByNumber.get(item.question_number)
            const selectedOptionContent =
              item.user_answer && question
                ? question.options[item.user_answer] ?? null
                : null
            const correctOptionContent =
              item.correct_answer && question
                ? question.options[item.correct_answer] ?? null
                : null

            const shouldShowExplanation =
              Boolean(question) &&
              Boolean(item.correct_answer) &&
              (item.status === "wrong" || item.status === "blank")

            const statusLabel =
              item.status === "correct"
                ? "Correta"
                : item.status === "wrong"
                  ? "Incorreta"
                  : item.status === "blank"
                    ? "Em branco"
                    : "Anulada"

            const statusClass =
              item.status === "correct"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : item.status === "wrong"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                  : item.status === "blank"
                    ? "border-white/10 bg-white/5 text-slate-300"
                    : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"

            return (
              <article
                key={item.question_number}
                className="rounded-[24px] border border-white/10 bg-[#020b18] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Questão {item.question_number}
                    </h3>
                    <p className="mt-1 text-sm text-[#7ea0d6]">
                      {item.subject}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                </div>

                {question ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Enunciado
                    </p>
                    <RichQuestionContent content={question.statement} />
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Sua resposta
                    </p>

                    <p className="mt-2 text-sm text-white">
                      {item.user_answer || "—"}
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
                      {item.correct_answer || "—"}
                    </p>

                    {correctOptionContent ? (
                      <div className="mt-3">
                        <RichQuestionContent content={correctOptionContent} />
                      </div>
                    ) : null}
                  </div>
                </div>

                {shouldShowExplanation && question && item.correct_answer ? (
                  <QuestionAIExplanation
                    payload={{
                      source: "exam",
                      attempt_id: `exam-enem-${year}`,
                      exam_type: result.exam_type,
                      year,
                      question_ref:
                        question.source_ref ??
                        `${result.exam_type}-${year}-${item.question_number}`,
                      question_number: item.question_number,
                      subject: item.subject,
                      statement: question.statement,
                      options: question.options,
                      user_answer: item.user_answer,
                      correct_answer: item.correct_answer,
                      status: item.status === "blank" ? "blank" : "wrong",
                    }}
                  />
                ) : null}
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-white/5">
        {icon}
      </div>
      <div
        className={`mt-5 text-5xl font-bold tracking-tight ${
          valueClassName ?? "text-white"
        }`}
      >
        {value}
      </div>
      <div className="mt-2 text-xl text-[#7ea0d6]">{label}</div>
    </article>
  )
}