"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Flag,
  GraduationCap,
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react"

import { saveRecentAttempt } from "@/lib/activity"
import {
  getExamByTypeAndYear,
  submitExamAnswers,
  type ExamDetail,
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
  institution?: string
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
  has_answer_key?: boolean
  questions?: ExamQuestion[]
}

type ResultByQuestion = {
  question_number: number
  subject: string
  user_answer: string | null
  correct_answer: string | null
  status: "correct" | "wrong" | "blank" | "annulled"
}

type SubjectSummary = {
  subject: string
  total: number
  correct: number
  wrong: number
  blank: number
  annulled: number
  accuracy_percentage: number
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
  results_by_question: ResultByQuestion[]
  subjects_summary: SubjectSummary[]
}

type SavedProgress = {
  answers?: Record<number, string>
  currentIndex?: number
  reviewFlags?: number[]
}

const EMPTY_EXAM: ExamDetail = {
  exam_type: "enem",
  institution: "ENEM",
  year: 0,
  title: "",
  description: "",
  question_count: 0,
  pdfs: [],
  has_answer_key: false,
  official_page_url: null,
}

const OFFICIAL_EXAM_RESULT_PREFIX = "studypro_official_exam_result_"
const OFFICIAL_EXAM_PROGRESS_PREFIX = "studypro_official_exam_progress_"

const OPTION_KEYS = ["A", "B", "C", "D", "E"] as const

function buildFallbackExam(year: number): ExamDetail {
  return {
    exam_type: "enem",
    institution: "ENEM",
    year,
    title: `ENEM ${year}`,
    description: `Prova oficial do ENEM ${year}.`,
    question_count: 180,
    pdfs: [],
    has_answer_key: true,
    official_page_url: null,
  }
}

function buildRawQuestionsUrl(year: number) {
  return `https://raw.githubusercontent.com/pfbruno/study-chatbot-python/main/data/exams/questions/enem/${year}.json`
}

function parseContentBlocks(text: string) {
  const normalized = (text || "").replace(/\r\n/g, "\n").trim()

  if (!normalized) return []

  const patterns = [
    /!\[[^\]]*]\((https?:\/\/[^\s)]+)\)/gi,
    /\[(?:imagem|Imagem)[^\]]*?(https?:\/\/[^\]\s]+\.(?:png|jpg|jpeg|webp|gif|svg))\s*\]/gi,
    /(https?:\/\/[^\s\]]+\.(?:png|jpg|jpeg|webp|gif|svg))/gi,
  ]

  const matches: Array<{ start: number; end: number; url: string }> = []

  for (const regex of patterns) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(normalized)) !== null) {
      const url = match[1] || match[0]
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        url,
      })
    }
  }

  matches.sort((a, b) => a.start - b.start)

  const uniqueMatches: Array<{ start: number; end: number; url: string }> = []
  for (const match of matches) {
    const overlaps = uniqueMatches.some(
      (item) => match.start < item.end && match.end > item.start
    )
    if (!overlaps) uniqueMatches.push(match)
  }

  const blocks: Array<
    | { type: "text"; value: string }
    | { type: "image"; url: string }
  > = []

  let cursor = 0

  for (const match of uniqueMatches) {
    if (match.start > cursor) {
      const textPart = normalized.slice(cursor, match.start).trim()
      if (textPart) blocks.push({ type: "text", value: textPart })
    }

    blocks.push({ type: "image", url: match.url })
    cursor = match.end
  }

  if (cursor < normalized.length) {
    const textPart = normalized.slice(cursor).trim()
    if (textPart) blocks.push({ type: "text", value: textPart })
  }

  if (blocks.length === 0) {
    blocks.push({ type: "text", value: normalized })
  }

  return blocks
}

function RichContent({
  text,
  className = "text-base leading-8 text-slate-200",
}: {
  text: string
  className?: string
}) {
  const blocks = useMemo(() => parseContentBlocks(text), [text])

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "image") {
          return (
            <div
              key={`${block.url}-${index}`}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#020b18]"
            >
              <img
                src={block.url}
                alt="Imagem da questão ou alternativa"
                className="max-h-[420px] w-full object-contain"
                loading="lazy"
              />
            </div>
          )
        }

        return (
          <div
            key={`text-${index}`}
            className={`${className} whitespace-pre-line`}
          >
            {block.value}
          </div>
        )
      })}
    </div>
  )
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#071225] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
    </article>
  )
}

function questionButtonClass(params: {
  isCurrent: boolean
  isAnswered: boolean
  isFlagged: boolean
  resultStatus?: ResultByQuestion["status"]
}) {
  const { isCurrent, isAnswered, isFlagged, resultStatus } = params

  if (isCurrent) {
    return "border-[#2f7cff]/40 bg-[#2f7cff]/20 text-white"
  }

  if (resultStatus === "correct") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  }

  if (resultStatus === "wrong") {
    return "border-rose-500/30 bg-rose-500/10 text-rose-300"
  }

  if (resultStatus === "blank") {
    return "border-slate-500/30 bg-slate-500/10 text-slate-300"
  }

  if (resultStatus === "annulled") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
  }

  if (isFlagged) {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
  }

  if (isAnswered) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
  }

  return "border-white/10 bg-white/5 text-slate-300"
}

export default function ExamYearPage() {
  const params = useParams()
  const yearParam = params.year as string
  const examYear = Number(yearParam)

  const [exam, setExam] = useState<ExamDetail>(EMPTY_EXAM)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [reviewFlags, setReviewFlags] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExamResult | null>(null)

  const resultRef = useRef<HTMLDivElement | null>(null)

  const resultStorageKey = `${OFFICIAL_EXAM_RESULT_PREFIX}enem_${examYear}`
  const progressStorageKey = `${OFFICIAL_EXAM_PROGRESS_PREFIX}enem_${examYear}`

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setWarning(null)
        setError(null)

        if (!Number.isInteger(examYear)) {
          throw new Error("Ano da prova inválido.")
        }

        let loadedExam: ExamDetail

        try {
          loadedExam = await getExamByTypeAndYear("enem", examYear)
        } catch {
          loadedExam = buildFallbackExam(examYear)
          setWarning(
            "A API publicada não retornou esta prova em produção. Foi exibido o fallback local da prova oficial."
          )
        }

        const rawResponse = await fetch(buildRawQuestionsUrl(examYear), {
          cache: "no-store",
        })

        if (!rawResponse.ok) {
          throw new Error("Não foi possível carregar a base local de questões.")
        }

        const rawPayload = (await rawResponse.json()) as ExamPayload
        const rawQuestions = Array.isArray(rawPayload.questions)
          ? rawPayload.questions
          : []

        if (rawQuestions.length === 0) {
          throw new Error("Nenhuma questão disponível para esta prova.")
        }

        setExam({
          ...loadedExam,
          title: loadedExam.title || rawPayload.title || `ENEM ${examYear}`,
          description:
            loadedExam.description ||
            rawPayload.description ||
            "Prova oficial disponível para resolução.",
          question_count:
            loadedExam.question_count ||
            rawPayload.question_count ||
            rawQuestions.length,
          official_page_url:
            loadedExam.official_page_url || rawPayload.official_page_url || null,
        })

        setQuestions(rawQuestions)

        const savedProgressRaw = localStorage.getItem(progressStorageKey)
        if (savedProgressRaw) {
          try {
            const saved = JSON.parse(savedProgressRaw) as SavedProgress

            if (saved.answers && typeof saved.answers === "object") {
              setAnswers(saved.answers)
            }

            if (typeof saved.currentIndex === "number") {
              setCurrentIndex(saved.currentIndex)
            }

            if (Array.isArray(saved.reviewFlags)) {
              setReviewFlags(saved.reviewFlags)
            }
          } catch {
            localStorage.removeItem(progressStorageKey)
          }
        }

        const savedResultRaw = localStorage.getItem(resultStorageKey)
        if (savedResultRaw) {
          try {
            setResult(JSON.parse(savedResultRaw) as ExamResult)
          } catch {
            localStorage.removeItem(resultStorageKey)
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao carregar a prova."
        )
      } finally {
        setLoading(false)
      }
    }

    if (yearParam) {
      void load()
    }
  }, [examYear, progressStorageKey, resultStorageKey, yearParam])

  useEffect(() => {
    if (!questions.length) return

    localStorage.setItem(
      progressStorageKey,
      JSON.stringify({
        answers,
        currentIndex,
        reviewFlags,
      } satisfies SavedProgress)
    )
  }, [answers, currentIndex, progressStorageKey, questions.length, reviewFlags])

  const currentQuestion = questions[currentIndex] ?? null

  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter((key) => Boolean(answers[Number(key)])).length
  }, [answers])

  const progressPercent = useMemo(() => {
    if (!questions.length) return 0
    return Math.round((answeredCount / questions.length) * 100)
  }, [answeredCount, questions.length])

  const resultStatusMap = useMemo(() => {
    const map = new Map<number, ResultByQuestion["status"]>()
    for (const item of result?.results_by_question ?? []) {
      map.set(item.question_number, item.status)
    }
    return map
  }, [result])

  function handleSelectAnswer(questionNumber: number, option: string) {
    setAnswers((current) => ({
      ...current,
      [questionNumber]: option,
    }))
  }

  function toggleReviewFlag(questionNumber: number) {
    setReviewFlags((current) =>
      current.includes(questionNumber)
        ? current.filter((item) => item !== questionNumber)
        : [...current, questionNumber]
    )
  }

  function handlePrev() {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  function handleNext() {
    setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleReset() {
    setAnswers({})
    setReviewFlags([])
    setCurrentIndex(0)
    setResult(null)
    localStorage.removeItem(progressStorageKey)
    localStorage.removeItem(resultStorageKey)
  }

  function buildLocalResult(): ExamResult {
    const resultsByQuestion: ResultByQuestion[] = questions.map((question) => {
      const userAnswer = answers[question.number] ?? null
      const normalizedAnswer =
        question.answer && /^[A-E]$/i.test(question.answer)
          ? question.answer.toUpperCase()
          : null

      const isAnnulled =
        question.annulled === true ||
        String(question.answer ?? "")
          .trim()
          .toUpperCase() === "ANULADA"

      if (isAnnulled) {
        return {
          question_number: question.number,
          subject: question.subject,
          user_answer: userAnswer,
          correct_answer: normalizedAnswer,
          status: "annulled",
        }
      }

      if (!userAnswer) {
        return {
          question_number: question.number,
          subject: question.subject,
          user_answer: null,
          correct_answer: normalizedAnswer,
          status: "blank",
        }
      }

      if (normalizedAnswer && userAnswer === normalizedAnswer) {
        return {
          question_number: question.number,
          subject: question.subject,
          user_answer: userAnswer,
          correct_answer: normalizedAnswer,
          status: "correct",
        }
      }

      return {
        question_number: question.number,
        subject: question.subject,
        user_answer: userAnswer,
        correct_answer: normalizedAnswer,
        status: "wrong",
      }
    })

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
      { total: number; correct: number; wrong: number; blank: number; annulled: number }
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

    const subjectsSummary: SubjectSummary[] = Array.from(grouped.entries()).map(
      ([subject, item]) => {
        const validTotal = item.total - item.annulled
        return {
          subject,
          total: item.total,
          correct: item.correct,
          wrong: item.wrong,
          blank: item.blank,
          annulled: item.annulled,
          accuracy_percentage:
            validTotal > 0
              ? Number(((item.correct / validTotal) * 100).toFixed(1))
              : 0,
        }
      }
    )

    const validQuestions = questions.length - annulledCount

    return {
      title: exam.title || `ENEM ${examYear}`,
      exam_type: "enem",
      year: examYear,
      total_questions: questions.length,
      correct_answers: correctAnswers,
      wrong_answers: wrongAnswers,
      unanswered_count: unansweredCount,
      annulled_count: annulledCount,
      score_percentage:
        validQuestions > 0
          ? Number(((correctAnswers / validQuestions) * 100).toFixed(1))
          : 0,
      results_by_question: resultsByQuestion,
      subjects_summary: subjectsSummary,
    }
  }

  async function handleSubmit() {
    if (questions.length === 0 || submitting) return

    try {
      setSubmitting(true)
      setError(null)

      const orderedAnswers = questions.map(
        (question) => answers[question.number] ?? null
      )

      try {
        const remoteResult = await submitExamAnswers(
          "enem",
          examYear,
          orderedAnswers
        )
        const localFallback = buildLocalResult()

        const normalized: ExamResult = {
          title: exam.title || `ENEM ${examYear}`,
          exam_type: "enem",
          year: examYear,
          total_questions:
            Number((remoteResult as any)?.total_questions) || questions.length,
          correct_answers:
            Number((remoteResult as any)?.correct_answers) ??
            localFallback.correct_answers,
          wrong_answers:
            Number((remoteResult as any)?.wrong_answers) ??
            localFallback.wrong_answers,
          unanswered_count:
            Number((remoteResult as any)?.unanswered_count) ??
            localFallback.unanswered_count,
          annulled_count:
            Number((remoteResult as any)?.annulled_count) ??
            localFallback.annulled_count,
          score_percentage:
            Number((remoteResult as any)?.score_percentage) ||
            localFallback.score_percentage,
          results_by_question: Array.isArray(
            (remoteResult as any)?.results_by_question
          )
            ? (remoteResult as any).results_by_question
            : localFallback.results_by_question,
          subjects_summary: Array.isArray(
            (remoteResult as any)?.subjects_summary
          )
            ? (remoteResult as any).subjects_summary
            : localFallback.subjects_summary,
        }

        localStorage.setItem(resultStorageKey, JSON.stringify(normalized))
        setResult(normalized)

        if (normalized.unanswered_count === 0) {
          saveRecentAttempt({
            id: `prova-enem-${examYear}-${Date.now()}`,
            module: "provas",
            title: normalized.title,
            scorePercentage: normalized.score_percentage,
            correctAnswers: normalized.correct_answers,
            totalQuestions: normalized.total_questions,
            createdAt: new Date().toISOString(),
            subjects: normalized.subjects_summary.map((item) => ({
              subject: item.subject,
              accuracyPercentage: item.accuracy_percentage,
            })),
          })
        }
      } catch {
        const localResult = buildLocalResult()
        localStorage.setItem(resultStorageKey, JSON.stringify(localResult))
        setResult(localResult)

        if (localResult.unanswered_count === 0) {
          saveRecentAttempt({
            id: `prova-enem-${examYear}-${Date.now()}`,
            module: "provas",
            title: localResult.title,
            scorePercentage: localResult.score_percentage,
            correctAnswers: localResult.correct_answers,
            totalQuestions: localResult.total_questions,
            createdAt: new Date().toISOString(),
            subjects: localResult.subjects_summary.map((item) => ({
              subject: item.subject,
              accuracyPercentage: item.accuracy_percentage,
            })),
          })
        }
      }

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 120)
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
          Carregando prova...
        </div>
      </div>
    )
  }

  if (error && !questions.length && !result) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
        {error}
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
        Nenhuma questão disponível para esta prova.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {warning ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {warning}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(41,98,255,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2f7cff]/25 bg-[#2f7cff]/10 px-4 py-2 text-sm text-[#79a6ff]">
              <GraduationCap className="size-4" />
              Prova oficial
            </div>

            <h1 className="mt-5 text-5xl font-bold tracking-tight text-white">
              ENEM {examYear}
            </h1>

            <p className="mt-4 max-w-3xl text-xl leading-8 text-[#7ea0d6]">
              {exam.description || `Prova oficial do ENEM ${examYear}.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/provas/enem"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Link>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <RotateCcw className="size-4" />
              Reiniciar
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard label="Questões" value={String(questions.length)} />
          <StatCard label="Respondidas" value={String(answeredCount)} />
          <StatCard label="Em branco" value={String(questions.length - answeredCount)} />
          <StatCard label="Progresso" value={`${progressPercent}%`} />
        </div>

        <div className="mt-6">
          <ProgressBar value={progressPercent} />
        </div>
      </section>

      {result ? (
        <section
          ref={resultRef}
          className="rounded-[28px] border border-white/10 bg-[#071225] p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                <CheckCircle2 className="size-4" />
                {result.unanswered_count === 0
                  ? "Correção final"
                  : "Correção parcial"}
              </div>

              <h2 className="mt-4 text-3xl font-bold text-white">
                Resultado da prova
              </h2>
              <p className="mt-2 text-base text-[#7ea0d6]">
                Após a correção, o mapa de questões já destaca acertos, erros,
                itens em branco e questões anuladas. Aqui fica apenas o resumo
                geral e o desempenho por disciplina.
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm text-slate-400">Aproveitamento</div>
              <div className="mt-2 text-4xl font-bold text-white">
                {result.score_percentage.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <StatCard label="Acertos" value={String(result.correct_answers)} />
            <StatCard label="Erros" value={String(result.wrong_answers)} />
            <StatCard label="Em branco" value={String(result.unanswered_count)} />
            <StatCard label="Anuladas" value={String(result.annulled_count)} />
          </div>

          <article className="mt-8 rounded-[24px] border border-white/10 bg-[#020b18] p-5">
            <h3 className="text-2xl font-bold text-white">
              Desempenho por disciplina
            </h3>

            <div className="mt-5 space-y-4">
              {result.subjects_summary.map((subject) => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-white">
                      {subject.subject}
                    </span>
                    <span className="text-[#7ea0d6]">
                      {subject.correct}/{subject.total} •{" "}
                      {subject.accuracy_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar value={subject.accuracy_percentage} />
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                Questão {currentIndex + 1} de {questions.length}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">
                Nº {currentQuestion.number}
              </h2>
              <p className="mt-2 text-sm text-[#7ea0d6]">
                Disciplina: {currentQuestion.subject}
              </p>
              {currentQuestion.source_pdf_label ? (
                <p className="mt-1 text-xs text-slate-500">
                  Referência: {currentQuestion.source_pdf_label}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => toggleReviewFlag(currentQuestion.number)}
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                reviewFlags.includes(currentQuestion.number)
                  ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
                  : "border-white/10 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              <Flag className="size-4" />
              {reviewFlags.includes(currentQuestion.number)
                ? "Marcada para revisão"
                : "Marcar para revisão"}
            </button>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#020b18] p-5">
            <RichContent text={currentQuestion.statement} />
          </div>

          <div className="mt-6 space-y-3">
            {OPTION_KEYS.filter((key) => currentQuestion.options[key]).map((key) => {
              const isSelected = answers[currentQuestion.number] === key
              const resultItem = result?.results_by_question.find(
                (item) => item.question_number === currentQuestion.number
              )
              const isCorrectOption =
                resultItem?.correct_answer === key &&
                resultItem.status !== "annulled"
              const isWrongSelected =
                resultItem?.user_answer === key && resultItem.status === "wrong"

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectAnswer(currentQuestion.number, key)}
                  className={`w-full rounded-[24px] border p-5 text-left transition ${
                    isSelected
                      ? "border-[#2f7cff]/40 bg-[#2f7cff]/10"
                      : "border-white/10 bg-[#071225] hover:border-white/20 hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
                        isCorrectOption
                          ? "bg-emerald-500/20 text-emerald-300"
                          : isWrongSelected
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-[#11306a] text-[#8fb5ff]"
                      }`}
                    >
                      {key}
                    </div>

                    <div className="min-w-0 flex-1">
                      <RichContent
                        text={currentQuestion.options[key]}
                        className="text-lg leading-9 text-slate-100"
                      />

                      {result ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {isCorrectOption ? (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300">
                              Gabarito
                            </span>
                          ) : null}

                          {isWrongSelected ? (
                            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-semibold text-rose-300">
                              Sua resposta incorreta
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
              Anterior
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#4b8df7] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {submitting ? "Corrigindo..." : "Corrigir agora"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
              <ChevronRight className="size-4" />
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
        </article>

        <aside className="rounded-[28px] border border-white/10 bg-[#071225] p-5 xl:sticky xl:top-6 xl:h-fit">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-white">Mapa de questões</h3>
            <span className="text-sm text-slate-400">
              {answeredCount}/{questions.length}
            </span>
          </div>

          <div className="mt-4">
            <ProgressBar value={progressPercent} />
          </div>

          <div className="mt-6 grid grid-cols-4 gap-3">
            {questions.map((question, index) => {
              const isAnswered = Boolean(answers[question.number])
              const isFlagged = reviewFlags.includes(question.number)
              const resultStatus = resultStatusMap.get(question.number)

              return (
                <button
                  key={question.number}
                  type="button"
                  onClick={() => goToQuestion(index)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${questionButtonClass(
                    {
                      isCurrent: index === currentIndex,
                      isAnswered,
                      isFlagged,
                      resultStatus,
                    }
                  )}`}
                >
                  {question.number}
                </button>
              )
            })}
          </div>

          <div className="mt-6 space-y-3 text-xs">
            <LegendItem
              icon={<CheckCircle2 className="size-4 text-emerald-300" />}
              label="Acertou"
            />
            <LegendItem
              icon={<XCircle className="size-4 text-rose-300" />}
              label="Errou"
            />
            <LegendItem
              icon={<Flag className="size-4 text-yellow-300" />}
              label="Marcada para revisão"
            />
            <LegendItem
              icon={<FileText className="size-4 text-slate-300" />}
              label="Ainda não respondida"
            />
          </div>
        </aside>
      </section>
    </div>
  )
}

function LegendItem({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-2 text-slate-300">
      {icon}
      <span>{label}</span>
    </div>
  )
}