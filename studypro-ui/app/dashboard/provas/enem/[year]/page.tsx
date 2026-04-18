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
  Layers3,
  Loader2,
  Map,
  Menu,
  MessageSquare,
  Play,
  RefreshCw,
  ScrollText,
  X,
} from "lucide-react"
import { getExamByTypeAndYear, submitExamAnswers, type ExamDetail } from "@/lib/api"

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

type ReviewCard = {
  id: string
  subject: string
  questionNumber: number
  front: string
  back: string
}

type ReviewSummaryPayload = {
  title: string
  subtitle: string
  revisionSummary: string
  weakestSubjects: Array<{
    subject: string
    accuracy: number
    correct: number
    wrong: number
    blank: number
  }>
  generatedAt: string
}

type SavedProgress = {
  answers?: Record<number, string>
  currentIndex?: number
  hasStarted?: boolean
  reviewFlags?: number[]
}

const REVIEW_FLASHCARDS_KEY = "studypro_review_flashcards"
const REVIEW_SUMMARY_KEY = "studypro_review_summary"
const OFFICIAL_EXAM_RESULT_PREFIX = "studypro_official_exam_result_"
const OFFICIAL_EXAM_PROGRESS_PREFIX = "studypro_official_exam_progress_"

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

function buildFallbackExam(year: number): ExamDetail {
  if (year === 2022) {
    return {
      exam_type: "enem",
      institution: "ENEM",
      year: 2022,
      title: "ENEM 2022 — Prova Oficial",
      description:
        "Prova oficial do ENEM 2022 disponível para resolução completa e revisão posterior.",
      question_count: 180,
      pdfs: [],
      has_answer_key: true,
      official_page_url:
        "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2022",
    }
  }

  return {
    ...EMPTY_EXAM,
    year,
    title: `ENEM ${year}`,
    description: "Metadados oficiais da prova selecionada.",
  }
}

function buildRawQuestionsUrl(year: number) {
  return `https://raw.githubusercontent.com/pfbruno/study-chatbot-python/main/data/exams/questions/enem/${year}.json`
}

function parseContentBlocks(text: string) {
  const normalized = (text || "").replace(/\r\n/g, "\n")
  const regexes = [
    /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g,
    /\[imagem:\s*(https?:\/\/[^\]\s]+)\]/gi,
  ]

  const matches: Array<{ start: number; end: number; url: string }> = []

  for (const regex of regexes) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(normalized)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        url: match[1],
      })
    }
  }

  matches.sort((a, b) => a.start - b.start)

  const blocks: Array<{ type: "text"; value: string } | { type: "image"; url: string }> = []
  let cursor = 0

  for (const match of matches) {
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

  if (blocks.length === 0 && normalized.trim()) {
    blocks.push({ type: "text", value: normalized.trim() })
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
                alt="Imagem da questão"
                className="max-h-[420px] w-full object-contain"
                loading="lazy"
              />
            </div>
          )
        }

        return (
          <div key={`text-${index}`} className={`${className} whitespace-pre-line`}>
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

function badgeClass(kind: "answered" | "blank" | "current" | "review") {
  if (kind === "current") {
    return "border-[#2f7cff]/40 bg-[#2f7cff]/20 text-white"
  }
  if (kind === "review") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
  }
  if (kind === "answered") {
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
  const [hasStarted, setHasStarted] = useState(false)
  const [showAnswerSheet, setShowAnswerSheet] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExamResult | null>(null)

  const resolverRef = useRef<HTMLDivElement | null>(null)

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
        const rawQuestions = Array.isArray(rawPayload.questions) ? rawPayload.questions : []

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
            loadedExam.question_count || rawPayload.question_count || rawQuestions.length,
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

            if (saved.hasStarted) {
              setHasStarted(true)
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
        setError(err instanceof Error ? err.message : "Erro ao carregar a prova.")
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
        hasStarted,
        reviewFlags,
      } satisfies SavedProgress)
    )
  }, [answers, currentIndex, hasStarted, progressStorageKey, questions.length, reviewFlags])

  const currentQuestion = questions[currentIndex] ?? null

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((key) => Boolean(answers[Number(key)])).length,
    [answers]
  )

  const progressPercent = useMemo(() => {
    if (!questions.length) return 0
    return Math.round((answeredCount / questions.length) * 100)
  }, [answeredCount, questions.length])

  const weakestSubjects = useMemo(() => {
    if (!result) return []
    return [...result.subjects_summary]
      .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)
      .slice(0, 3)
  }, [result])

  const reviewSummaryText = useMemo(() => {
    if (!result) return ""

    if (result.correct_answers === result.total_questions - result.annulled_count) {
      return "Excelente desempenho. Seu próximo passo deve ser manutenção de desempenho com revisão leve e novo treino de consolidação."
    }

    if (weakestSubjects.length === 0) {
      return "Priorize revisar as questões incorretas e em branco antes de avançar para um novo treino."
    }

    const subjectNames = weakestSubjects.map((item) => item.subject).join(", ")
    return `Priorize revisão em ${subjectNames}. O melhor próximo passo é revisar erros, consolidar conceitos centrais e voltar para um novo treino com foco nessas disciplinas.`
  }, [result, weakestSubjects])

  const reviewCards = useMemo<ReviewCard[]>(() => {
    if (!result) return []

    return result.results_by_question
      .filter((entry) => entry.status === "wrong" || entry.status === "blank")
      .slice(0, 12)
      .map((entry) => {
        const question = questions.find((item) => item.number === entry.question_number)
        const correctText =
          entry.correct_answer && question?.options?.[entry.correct_answer]
            ? question.options[entry.correct_answer]
            : "Resposta correta indisponível"

        return {
          id: `enem-${examYear}-${entry.question_number}-${entry.status}`,
          subject: entry.subject,
          questionNumber: entry.question_number,
          front: `Questão ${entry.question_number} • ${entry.subject}: qual alternativa correta e por que esta questão precisa ser revisada?`,
          back: `Resposta correta: ${entry.correct_answer ?? "N/D"} — ${correctText}. ${
            entry.user_answer
              ? `Sua resposta foi ${entry.user_answer}.`
              : "A questão ficou em branco."
          } Revise o enunciado, as alternativas e o conteúdo-base desta disciplina.`,
        }
      })
  }, [examYear, questions, result])

  useEffect(() => {
    if (!result) return

    const summaryPayload: ReviewSummaryPayload = {
      title: `${result.title} — Resumo de revisão`,
      subtitle: `Resumo gerado a partir da prova oficial ${result.exam_type.toUpperCase()} ${result.year}.`,
      revisionSummary: reviewSummaryText,
      weakestSubjects: weakestSubjects.map((subject) => ({
        subject: subject.subject,
        accuracy: subject.accuracy_percentage,
        correct: subject.correct,
        wrong: subject.wrong,
        blank: subject.blank,
      })),
      generatedAt: new Date().toISOString(),
    }

    localStorage.setItem(REVIEW_SUMMARY_KEY, JSON.stringify(summaryPayload))
    localStorage.setItem(REVIEW_FLASHCARDS_KEY, JSON.stringify(reviewCards))
  }, [result, reviewCards, reviewSummaryText, weakestSubjects])

  function scrollToResolver() {
    resolverRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function handleStartOrContinue() {
    setHasStarted(true)
    setTimeout(scrollToResolver, 50)
  }

  function handleReset() {
    setAnswers({})
    setReviewFlags([])
    setCurrentIndex(0)
    setResult(null)
    setHasStarted(false)
    setShowAnswerSheet(false)
    localStorage.removeItem(progressStorageKey)
    localStorage.removeItem(resultStorageKey)
  }

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
    setShowAnswerSheet(false)
    setTimeout(scrollToResolver, 50)
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

    const correctAnswers = resultsByQuestion.filter((item) => item.status === "correct").length
    const wrongAnswers = resultsByQuestion.filter((item) => item.status === "wrong").length
    const unansweredCount = resultsByQuestion.filter((item) => item.status === "blank").length
    const annulledCount = resultsByQuestion.filter((item) => item.status === "annulled").length

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

    return {
      title: exam.title || `ENEM ${examYear} — Prova Oficial`,
      exam_type: "enem",
      year: examYear,
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
      setError(null)

      const payload = questions.map((question) => ({
        number: question.number,
        question_number: question.number,
        answer: answers[question.number] ?? null,
      }))

      try {
        const remoteResult = await submitExamAnswers("enem", examYear, payload)
        const normalized: ExamResult = {
          title: exam.title || `ENEM ${examYear} — Prova Oficial`,
          exam_type: "enem",
          year: examYear,
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

        localStorage.setItem(resultStorageKey, JSON.stringify(normalized))
        setResult(normalized)
      } catch {
        const localResult = buildLocalResult()
        localStorage.setItem(resultStorageKey, JSON.stringify(localResult))
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

  if (result) {
    return (
      <div className="space-y-6">
        {warning ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {warning}
          </div>
        ) : null}

        <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(41,98,255,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            <CheckCircle2 className="size-4" />
            Prova finalizada
          </div>

          <h1 className="mt-5 text-5xl font-bold tracking-tight text-white">
            ENEM {examYear}
          </h1>

          <p className="mt-4 text-2xl text-[#7ea0d6]">
            Desempenho:{" "}
            <span className="font-semibold text-white">
              {result.score_percentage.toFixed(1)}%
            </span>{" "}
            de acerto
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard label="Acertos" value={String(result.correct_answers)} />
          <StatCard label="Erros" value={String(result.wrong_answers)} />
          <StatCard label="Em branco" value={String(result.unanswered_count)} />
          <StatCard label="Aproveitamento" value={`${result.score_percentage.toFixed(1)}%`} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Desempenho por disciplina
            </h2>
            <p className="mt-2 text-base text-[#7ea0d6]">
              Acertos por área de conhecimento
            </p>

            <div className="mt-6 space-y-4">
              {result.subjects_summary.map((subject) => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-base">
                    <span className="font-semibold text-white">{subject.subject}</span>
                    <span className="text-[#7ea0d6]">
                      {subject.correct}/{subject.total} • {subject.accuracy_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <ProgressBar value={subject.accuracy_percentage} />
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Prioridades de revisão
            </h2>
            <p className="mt-2 text-base text-[#7ea0d6]">
              Disciplinas com pior desempenho
            </p>

            <div className="mt-6 space-y-4">
              {weakestSubjects.map((subject, index) => (
                <div
                  key={subject.subject}
                  className="flex items-center justify-between rounded-[22px] border border-white/10 bg-[#0a1428] px-4 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-yellow-300">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-white">
                        {subject.subject}
                      </div>
                      <div className="text-sm text-[#7ea0d6]">
                        {subject.correct} acerto(s), {subject.wrong} erro(s), {subject.blank} em branco
                      </div>
                    </div>
                  </div>

                  <div className="text-xl font-bold text-rose-400">
                    {subject.accuracy_percentage.toFixed(1)}%
                  </div>
                </div>
              ))}

              <Link
                href="/dashboard/estudo"
                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-[#030b1d] px-5 py-4 text-xl font-semibold text-white transition hover:bg-[#0a1730]"
              >
                Iniciar revisão guiada
              </Link>
            </div>
          </article>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Sua revisão já está pronta
          </h2>
          <p className="mt-2 text-base text-[#7ea0d6]">
            Conecte o resultado à sua área de estudo
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Link
              href="/dashboard/flashcards"
              className="rounded-[24px] border border-white/10 bg-[#12244a] p-5 transition hover:border-[#2f7cff]/40"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f1d3d]">
                <Layers3 className="size-6 text-[#79a6ff]" />
              </div>
              <div className="mt-4 text-2xl font-bold text-white">Gerar flashcards</div>
              <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
                Cards com IA das questões que você errou
              </div>
            </Link>

            <Link
              href="/dashboard/resumos"
              className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,_rgba(16,185,129,0.14),_rgba(14,35,71,0.7))] p-5 transition hover:border-emerald-500/30"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f1d3d]">
                <ScrollText className="size-6 text-emerald-300" />
              </div>
              <div className="mt-4 text-2xl font-bold text-white">Resumo personalizado</div>
              <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
                Resumo focado nos seus pontos fracos
              </div>
            </Link>

            <Link
              href="/dashboard/estudo"
              className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,_rgba(168,85,247,0.14),_rgba(14,35,71,0.7))] p-5 transition hover:border-purple-500/30"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f1d3d]">
                <Map className="size-6 text-purple-300" />
              </div>
              <div className="mt-4 text-2xl font-bold text-white">Mapa mental</div>
              <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
                Visualize conceitos centrais das matérias revisadas
              </div>
            </Link>

            <Link
              href="/dashboard/chat-ia"
              className="rounded-[24px] border border-white/10 bg-[#12244a] p-5 transition hover:border-[#2f7cff]/40"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f1d3d]">
                <MessageSquare className="size-6 text-[#79a6ff]" />
              </div>
              <div className="mt-4 text-2xl font-bold text-white">Tirar dúvidas com IA</div>
              <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
                Converse sobre as questões da prova
              </div>
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-3 md:flex-row">
          <Link
            href={`/dashboard/provas/enem/${examYear}`}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
          >
            Voltar à prova
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
    <div className="space-y-8">
      {warning ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {warning}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(41,98,255,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8">
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2f7cff]/25 bg-[#2f7cff]/10 px-4 py-2 text-sm text-[#79a6ff]">
              <FileText className="size-4" />
              Prova oficial
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
              ENEM {examYear}
            </h1>
            <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
              {exam.description || "Prova oficial disponível para resolução completa."}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <InfoCard label="Instituição" value={exam.institution || "ENEM"} />
              <InfoCard label="Ano" value={String(exam.year || examYear)} />
              <InfoCard label="Questões" value={String(exam.question_count || questions.length)} />
            </div>

            <div className="mt-8 flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={handleStartOrContinue}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4b8df7] px-6 py-4 text-xl font-semibold text-white transition hover:opacity-90"
              >
                <Play className="size-5" />
                {answeredCount > 0 || hasStarted ? "Continuar prova" : "Iniciar prova"}
              </button>

              {(answeredCount > 0 || hasStarted || result) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#030b1d] px-6 py-4 text-xl font-semibold text-white transition hover:bg-[#0a1730]"
                >
                  <RefreshCw className="size-5" />
                  Reiniciar tentativa
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Recursos disponíveis
              </h2>

              <div className="mt-6 space-y-5">
                <ResourceRow label="Gabarito oficial" available={Boolean(exam.has_answer_key)} />
                <ResourceRow
                  label="PDF da prova original"
                  available={Boolean(exam.pdfs?.length || exam.official_page_url)}
                />
                <ResourceRow label="Comentários por IA" available />
                <ResourceRow label="Análise por disciplina" available />
                <ResourceRow label="Geração de flashcards" available />
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Sua revisão já está pronta
              </h2>
              <p className="mt-2 text-base text-[#7ea0d6]">
                Conecte o resultado à sua área de estudo
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Link
                  href="/dashboard/flashcards"
                  className="rounded-[24px] border border-white/10 bg-[#12244a] p-5 transition hover:border-[#2f7cff]/40"
                >
                  <div className="text-2xl font-bold text-white">Gerar flashcards</div>
                  <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
                    Cards com IA das questões que você errou
                  </div>
                </Link>

                <Link
                  href="/dashboard/resumos"
                  className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,_rgba(16,185,129,0.14),_rgba(14,35,71,0.7))] p-5 transition hover:border-emerald-500/30"
                >
                  <div className="text-2xl font-bold text-white">Resumo personalizado</div>
                  <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
                    Resumo focado nos seus pontos fracos
                  </div>
                </Link>

                <Link
                  href="/dashboard/estudo"
                  className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,_rgba(168,85,247,0.14),_rgba(14,35,71,0.7))] p-5 transition hover:border-purple-500/30"
                >
                  <div className="text-2xl font-bold text-white">Mapa mental</div>
                  <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
                    Visualize conceitos centrais das matérias revisadas
                  </div>
                </Link>

                <Link
                  href="/dashboard/chat-ia"
                  className="rounded-[24px] border border-white/10 bg-[#12244a] p-5 transition hover:border-[#2f7cff]/40"
                >
                  <div className="text-2xl font-bold text-white">Tirar dúvidas com IA</div>
                  <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
                    Converse sobre as questões da prova
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </section>

      {hasStarted && currentQuestion ? (
        <section ref={resolverRef} className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-[#071225] p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-lg text-white"
                  >
                    <ArrowLeft className="size-5" />
                    Sair
                  </button>

                  <div className="hidden h-8 w-px bg-white/10 xl:block" />

                  <div className="text-sm text-slate-400">
                    Salvamento automático
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAnswerSheet(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#030b1d] px-4 py-3 text-lg font-semibold text-white transition hover:bg-[#0a1730]"
                  >
                    <Menu className="size-5" />
                    Folha de respostas
                    <span className="rounded-full bg-[#132544] px-2 py-0.5 text-sm text-[#79a6ff]">
                      {answeredCount}/{questions.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    className="rounded-2xl bg-emerald-400 px-5 py-3 text-lg font-semibold text-[#071225] transition hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Corrigindo..." : "Finalizar"}
                  </button>
                </div>
              </div>
            </div>

            <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
              <div className="flex flex-wrap gap-3 text-sm text-slate-300">
                {currentQuestion.day ? <Badge>{`${currentQuestion.day}º dia`}</Badge> : null}
                <Badge>{currentQuestion.area || "Área"}</Badge>
                <Badge>{currentQuestion.subject}</Badge>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[56px_1fr]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f2a51] text-2xl font-bold text-[#79a6ff]">
                  {currentQuestion.number}
                </div>

                <div className="space-y-6">
                  <RichContent text={currentQuestion.statement} className="text-[19px] leading-10 text-white" />

                  <div className="grid gap-4">
                    {Object.entries(currentQuestion.options).map(([key, value]) => {
                      const selected = answers[currentQuestion.number] === key

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectAnswer(currentQuestion.number, key)}
                          className={`rounded-[24px] border px-5 py-5 text-left text-xl transition ${
                            selected
                              ? "border-[#2f7cff]/40 bg-[#2f7cff]/10 text-white"
                              : "border-white/10 bg-[#081224] text-white hover:bg-[#0a1730]"
                          }`}
                        >
                          <div className="flex gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#132544] font-bold text-[#79a6ff]">
                              {key}
                            </div>
                            <div className="flex-1 leading-9">{value}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <button
                      type="button"
                      onClick={handlePrev}
                      disabled={currentIndex === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#030b1d] px-5 py-4 text-xl font-semibold text-white transition hover:bg-[#0a1730] disabled:opacity-50"
                    >
                      <ChevronLeft className="size-5" />
                      Anterior
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleReviewFlag(currentQuestion.number)}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 text-xl font-semibold transition ${
                        reviewFlags.includes(currentQuestion.number)
                          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                          : "border-white/10 bg-transparent text-white hover:bg-white/5"
                      }`}
                    >
                      <Flag className="size-5" />
                      Marcar para revisão
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={currentIndex >= questions.length - 1}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4b8df7] px-5 py-4 text-xl font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      Próxima
                      <ChevronRight className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="hidden xl:block">
            <AnswerSheetPanel
              questions={questions}
              answers={answers}
              reviewFlags={reviewFlags}
              currentIndex={currentIndex}
              onSelectIndex={goToQuestion}
            />
          </aside>
        </section>
      ) : null}

      {showAnswerSheet ? (
        <div className="fixed inset-0 z-50 bg-black/60 p-4 backdrop-blur-sm xl:hidden">
          <div className="mx-auto h-full max-w-md overflow-y-auto rounded-[28px] border border-white/10 bg-[#071225] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-white">Folha de respostas</div>
                <div className="text-sm text-[#7ea0d6]">
                  {answeredCount}/{questions.length} respondidas
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAnswerSheet(false)}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            <AnswerSheetPanel
              questions={questions}
              answers={answers}
              reviewFlags={reviewFlags}
              currentIndex={currentIndex}
              onSelectIndex={goToQuestion}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AnswerSheetPanel({
  questions,
  answers,
  reviewFlags,
  currentIndex,
  onSelectIndex,
}: {
  questions: ExamQuestion[]
  answers: Record<number, string>
  reviewFlags: number[]
  currentIndex: number
  onSelectIndex: (index: number) => void
}) {
  const answeredCount = Object.keys(answers).filter((key) => Boolean(answers[Number(key)])).length

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#071225] p-5">
      <div className="mb-5">
        <div className="text-2xl font-bold text-white">Folha de respostas</div>
        <div className="mt-1 text-sm text-[#7ea0d6]">
          {answeredCount}/{questions.length} respondidas
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {questions.map((question, index) => {
          const isCurrent = index === currentIndex
          const isAnswered = Boolean(answers[question.number])
          const isReview = reviewFlags.includes(question.number)

          const style = isCurrent
            ? badgeClass("current")
            : isReview
            ? badgeClass("review")
            : isAnswered
            ? badgeClass("answered")
            : badgeClass("blank")

          return (
            <button
              key={question.number}
              type="button"
              onClick={() => onSelectIndex(index)}
              className={`flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold transition hover:opacity-90 ${style}`}
            >
              {question.number}
            </button>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-xs text-[#7ea0d6]">
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-emerald-400" />
          Respondida
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-yellow-300" />
          Revisão
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#4b8df7]" />
          Atual
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-3 rounded-full bg-slate-400" />
          Pendente
        </span>
      </div>
    </section>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-3 text-4xl font-bold tracking-tight text-white">{value}</div>
    </div>
  )
}

function ResourceRow({
  label,
  available,
}: {
  label: string
  available: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-2xl text-white">{label}</div>
      <div
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          available
            ? "bg-emerald-500/15 text-emerald-300"
            : "bg-white/5 text-slate-400"
        }`}
      >
        {available ? "Disponível" : "Indisponível"}
      </div>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
    </article>
  )
}