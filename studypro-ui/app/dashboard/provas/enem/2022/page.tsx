"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
} from "lucide-react"

import {
  getExamByTypeAndYear,
  submitExamAnswers,
} from "@/lib/api"

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
}

type ExamPayload = {
  exam_type: string
  year: number
  title: string
  description: string
  question_count: number
  total_questions?: number
  official_page_url?: string | null
  pdfs?: Array<{
    label: string
    url: string
  }>
  questions?: ExamQuestion[]
}

type LocalResultByQuestion = {
  question_number: number
  subject: string
  user_answer: string | null
  correct_answer: string | null
  status: "correct" | "wrong" | "blank" | "annulled"
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

const OFFICIAL_EXAM_RESULT_KEY = "studypro_official_exam_result_enem_2022"
const RAW_QUESTIONS_URL =
  "https://raw.githubusercontent.com/pfbruno/study-chatbot-python/main/data/exams/questions/enem/2022.json"

export default function Enem2022Page() {
  const [exam, setExam] = useState<ExamPayload | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [result, setResult] = useState<ExamResult | null>(null)

  useEffect(() => {
    async function loadExam() {
      try {
        setLoading(true)
        setError("")
        setWarning("")

        const remote = (await getExamByTypeAndYear("enem", 2022)) as ExamPayload

        let loadedQuestions = Array.isArray(remote?.questions)
          ? remote.questions
          : []

        if (loadedQuestions.length === 0) {
          const rawResponse = await fetch(RAW_QUESTIONS_URL, {
            cache: "no-store",
          })

          if (!rawResponse.ok) {
            throw new Error("Não foi possível carregar a base de questões do ENEM 2022.")
          }

          const rawExam = (await rawResponse.json()) as ExamPayload
          loadedQuestions = Array.isArray(rawExam?.questions) ? rawExam.questions : []

          setExam({
            ...remote,
            ...rawExam,
            questions: loadedQuestions,
          })
        } else {
          setExam(remote)
        }

        setQuestions(loadedQuestions)

        const declaredCount =
          remote?.question_count ?? remote?.total_questions ?? loadedQuestions.length

        if (loadedQuestions.length < declaredCount) {
          setWarning(
            `A prova foi carregada com ${loadedQuestions.length} questão(ões) disponível(is) no banco atual, embora o catálogo declare ${declaredCount}.`
          )
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar a prova oficial do ENEM 2022."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadExam()
  }, [])

  const currentQuestion = questions[currentIndex] ?? null
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((key) => Boolean(answers[Number(key)])).length,
    [answers]
  )

  function handleSelectAnswer(questionNumber: number, option: string) {
    setAnswers((current) => ({
      ...current,
      [questionNumber]: option,
    }))
  }

  function handlePrev() {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  function handleNext() {
    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
  }

  function buildLocalResult(): ExamResult {
    const resultsByQuestion: LocalResultByQuestion[] = questions.map((question) => {
      const userAnswer = answers[question.number] ?? null
      const correctAnswer = question.answer ?? null

      if (question.annulled) {
        return {
          question_number: question.number,
          subject: question.subject,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          status: "annulled",
        }
      }

      if (!userAnswer) {
        return {
          question_number: question.number,
          subject: question.subject,
          user_answer: null,
          correct_answer: correctAnswer,
          status: "blank",
        }
      }

      if (correctAnswer && userAnswer === correctAnswer) {
        return {
          question_number: question.number,
          subject: question.subject,
          user_answer: userAnswer,
          correct_answer: correctAnswer,
          status: "correct",
        }
      }

      return {
        question_number: question.number,
        subject: question.subject,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        status: "wrong",
      }
    })

    const validQuestions = resultsByQuestion.filter(
      (item) => item.status !== "annulled"
    )

    const correctAnswers = resultsByQuestion.filter(
      (item) => item.status === "correct"
    ).length
    const wrongAnswers = resultsByQuestion.filter(
      (item) => item.status === "wrong"
    ).length
    const unansweredCount = resultsByQuestion.filter(
      (item) => item.status === "blank"
    ).length
    const annulledCount = resultsByQuestion.filter(
      (item) => item.status === "annulled"
    ).length

    const grouped = new Map<
      string,
      {
        total: number
        correct: number
        wrong: number
        blank: number
        annulled: number
      }
    >()

    for (const item of resultsByQuestion) {
      const current = grouped.get(item.subject) ?? {
        total: 0,
        correct: 0,
        wrong: 0,
        blank: 0,
        annulled: 0,
      }

      current.total += 1

      if (item.status === "correct") current.correct += 1
      if (item.status === "wrong") current.wrong += 1
      if (item.status === "blank") current.blank += 1
      if (item.status === "annulled") current.annulled += 1

      grouped.set(item.subject, current)
    }

    return {
      title: exam?.title ?? "ENEM 2022",
      exam_type: exam?.exam_type ?? "enem",
      year: exam?.year ?? 2022,
      total_questions: questions.length,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      unanswered_count: unansweredCount,
      annulled_count: annulledCount,
      score_percentage:
        validQuestions.length > 0
          ? Number(((correctAnswers / validQuestions.length) * 100).toFixed(1))
          : 0,
      results_by_question: resultsByQuestion,
      subjects_summary: Array.from(grouped.entries()).map(([subject, item]) => {
        const validTotal = item.total - item.annulled
        return {
          subject,
          total: item.total,
          correct: item.correct,
          wrong: item.wrong,
          blank: item.blank,
          annulled: item.annulled,
          accuracy_percentage:
            validTotal > 0 ? Number(((item.correct / validTotal) * 100).toFixed(1)) : 0,
        }
      }),
    }
  }

  async function handleSubmit() {
    if (questions.length === 0 || submitting) return

    try {
      setSubmitting(true)
      setError("")

      const payload = questions.map((question) => ({
        number: question.number,
        question_number: question.number,
        answer: answers[question.number] ?? null,
      }))

      try {
        const remoteResult = await submitExamAnswers("enem", 2022, payload)
        const normalized: ExamResult = {
          title: exam?.title ?? "ENEM 2022",
          exam_type: "enem",
          year: 2022,
          total_questions:
            Number((remoteResult as any)?.total_questions) || questions.length,
          correct_answers: Number((remoteResult as any)?.correct_answers) || 0,
          wrong_answers: Number((remoteResult as any)?.wrong_answers) || 0,
          unanswered_count: Number((remoteResult as any)?.unanswered_count) || 0,
          annulled_count: Number((remoteResult as any)?.annulled_count) || 0,
          score_percentage: Number((remoteResult as any)?.score_percentage) || 0,
          results_by_question:
            Array.isArray((remoteResult as any)?.results_by_question)
              ? (remoteResult as any).results_by_question
              : buildLocalResult().results_by_question,
          subjects_summary:
            Array.isArray((remoteResult as any)?.subjects_summary)
              ? (remoteResult as any).subjects_summary
              : buildLocalResult().subjects_summary,
        }

        localStorage.setItem(OFFICIAL_EXAM_RESULT_KEY, JSON.stringify(normalized))
        setResult(normalized)
      } catch {
        const localResult = buildLocalResult()
        localStorage.setItem(OFFICIAL_EXAM_RESULT_KEY, JSON.stringify(localResult))
        setResult(localResult)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível corrigir a prova."
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#071225] p-6 text-slate-300">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando prova ENEM 2022...
        </div>
      </div>
    )
  }

  if (error && !exam) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
        {error}
      </div>
    )
  }

  if (!exam || questions.length === 0 || !currentQuestion) {
    return (
      <div className="rounded-[24px] border border-white/10 bg-[#071225] px-4 py-3 text-sm text-slate-300">
        Nenhuma questão disponível para o ENEM 2022 no banco atual.
      </div>
    )
  }

  if (result) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            <CheckCircle2 className="size-4" />
            Correção concluída
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
            {result.title}
          </h1>

          <p className="mt-4 text-lg text-slate-300">
            Aproveitamento: {result.score_percentage.toFixed(1)}%
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Acertos" value={String(result.correct_answers)} />
          <StatCard label="Erros" value={String(result.wrong_answers)} />
          <StatCard label="Em branco" value={String(result.unanswered_count)} />
          <StatCard label="Anuladas" value={String(result.annulled_count)} />
        </section>

        <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <h2 className="text-2xl font-semibold text-white">
            Desempenho por disciplina
          </h2>

          <div className="mt-6 space-y-4">
            {result.subjects_summary.map((subject) => (
              <div
                key={subject.subject}
                className="rounded-[24px] border border-white/10 bg-[#020b18] p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {subject.subject}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {subject.correct} acerto(s), {subject.wrong} erro(s), {subject.blank} em branco
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {subject.accuracy_percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-slate-400">
                      {subject.total} questão(ões)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 md:flex-row">
          <Link
            href="/dashboard/provas"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
          >
            Voltar para provas
          </Link>

          <Link
            href="/dashboard/estudo"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Ir para Área de Estudo
          </Link>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <FileText className="size-4" />
              Prova oficial
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              {exam.title}
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              {exam.description}
            </p>
          </div>

          <div className="w-full xl:max-w-[360px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Progresso</p>
              <div className="mt-2 text-3xl font-bold text-white">
                {answeredCount}/{questions.length}
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Questão {currentIndex + 1} de {questions.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {warning ? (
        <section className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {warning}
        </section>
      ) : null}

      {error ? (
        <section className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          <Badge>{currentQuestion.subject}</Badge>
          {currentQuestion.area ? <Badge>{currentQuestion.area}</Badge> : null}
          {currentQuestion.day ? <Badge>{currentQuestion.day}º dia</Badge> : null}
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-white">
          Questão {currentQuestion.number}
        </h2>

        <p className="mt-4 text-base leading-8 text-slate-200">
          {currentQuestion.statement}
        </p>

        <div className="mt-6 grid gap-3">
          {Object.entries(currentQuestion.options).map(([key, value]) => {
            const selected = answers[currentQuestion.number] === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectAnswer(currentQuestion.number, key)}
                className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
                  selected
                    ? "border-blue-400/50 bg-blue-400/10 text-white"
                    : "border-white/10 bg-[#020b18] text-slate-300 hover:bg-white/5"
                }`}
              >
                <span className="font-semibold">{key}</span> — {value}
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
            Anterior
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex >= questions.length - 1}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            Próxima
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <Link
            href="/dashboard/provas"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Link>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Corrigindo..." : "Finalizar e corrigir"}
          </button>
        </div>
      </section>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
      {children}
    </div>
  )
}

function StatCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
    </article>
  )
}