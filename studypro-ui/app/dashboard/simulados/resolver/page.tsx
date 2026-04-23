"use client"

import { trackStudyEvent } from "@/lib/study-events"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
} from "lucide-react"

import { AUTH_TOKEN_KEY } from "@/lib/api"

type SimulationMode = "balanced" | "random"

type SimulationQuestion = {
  number: number
  subject: string
  statement: string
  options: Record<string, string>
  source_pdf_label?: string | null
}

type SimulationGenerationResponse = {
  simulation_id: string
  generated_at: string
  exam_type: string
  year: number
  title: string
  mode: SimulationMode
  requested_question_count: number
  generated_question_count: number
  filters: {
    subjects: string[]
    mode: SimulationMode
    seed: number | null
  }
  subjects_used: string[]
  question_numbers: number[]
  questions: SimulationQuestion[]
}

type SimulationSubmissionResponse = {
  exam_type: string
  year: number
  title: string
  total_questions: number
  valid_questions: number
  correct_answers: number
  wrong_answers: number
  unanswered_count: number
  annulled_count: number
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

const ACTIVE_SIMULATION_KEY = "studypro_active_simulation"
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers"
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result"
const OPTION_ORDER = ["A", "B", "C", "D", "E"]

export default function ResolverSimuladoPage() {
  const router = useRouter()
  const hasTrackedStartRef = useRef(false)

  const [simulation, setSimulation] =
    useState<SimulationGenerationResponse | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  const [loadError, setLoadError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    try {
      const rawSimulation = sessionStorage.getItem(ACTIVE_SIMULATION_KEY)
      if (!rawSimulation) {
        setLoadError("Nenhum simulado ativo foi encontrado nesta sessão.")
        return
      }

      const parsedSimulation = JSON.parse(
        rawSimulation
      ) as SimulationGenerationResponse

      setSimulation(parsedSimulation)

      const rawAnswers = sessionStorage.getItem(ACTIVE_SIMULATION_ANSWERS_KEY)
      if (rawAnswers) {
        const parsedAnswers = JSON.parse(rawAnswers) as Record<number, string>
        setAnswers(parsedAnswers)
      }
    } catch {
      setLoadError("Não foi possível carregar o simulado salvo localmente.")
    }
  }, [])

  useEffect(() => {
  if (!simulation || hasTrackedStartRef.current) return

  hasTrackedStartRef.current = true

  void trackStudyEvent({
    eventType: "simulation_started",
    module: "simulados",
    metadata: {
      simulation_id: simulation.simulation_id,
      exam_type: simulation.exam_type,
      year: simulation.year,
      question_count: simulation.generated_question_count,
      mode: simulation.mode,
      subjects: simulation.subjects_used,
    },
  })
}, [simulation])

  useEffect(() => {
    if (!simulation) return
    sessionStorage.setItem(ACTIVE_SIMULATION_ANSWERS_KEY, JSON.stringify(answers))
  }, [answers, simulation])

  const questions = simulation?.questions ?? []
  const totalQuestions = questions.length
  const currentQuestion = questions[currentIndex] ?? null

  const answeredCount = useMemo(() => {
    return questions.filter((question) => {
      const value = answers[question.number]
      return typeof value === "string" && value.trim() !== ""
    }).length
  }, [answers, questions])

  const unansweredCount = totalQuestions - answeredCount
  const progressPercentage = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0

  function handleSelectAnswer(questionNumber: number, optionKey: string) {
  const question = questions.find((item) => item.number === questionNumber)
  const previousAnswer = answers[questionNumber]

  setAnswers((current) => ({
    ...current,
    [questionNumber]: optionKey,
  }))

  if (previousAnswer !== optionKey) {
    void trackStudyEvent({
      eventType: "question_answered",
      module: "simulados",
      subject: question?.subject ?? null,
      metadata: {
        simulation_id: simulation?.simulation_id ?? null,
        question_number: questionNumber,
        selected_answer: optionKey,
      },
    })
  }
}

  function handleClearAnswer(questionNumber: number) {
    setAnswers((current) => {
      const next = { ...current }
      delete next[questionNumber]
      return next
    })
  }

  function goToQuestion(index: number) {
    if (index < 0 || index >= totalQuestions) return
    setCurrentIndex(index)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmitSimulation() {
    if (!simulation) return

    const confirmed = window.confirm(
      "Deseja finalizar o simulado e enviar para correção?"
    )
    if (!confirmed) return

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)

      const payload = {
        exam_type: simulation.exam_type,
        year: simulation.year,
        question_numbers: simulation.question_numbers,
        answers: simulation.question_numbers.map((number) => answers[number] ?? null),
      }

      const response = await fetch(`${API_BASE_URL}/simulados/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorMessage = await safeReadError(response)
        throw new Error(errorMessage || "Não foi possível corrigir o simulado.")
      }

      const result = (await response.json()) as SimulationSubmissionResponse

      sessionStorage.setItem(
        LAST_SIMULATION_RESULT_KEY,
        JSON.stringify({
          simulation,
          answers,
          result,
        })
      )

      sessionStorage.removeItem(ACTIVE_SIMULATION_ANSWERS_KEY)
      router.push("/dashboard/simulados/resultado")
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao enviar o simulado."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-rose-500/20 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-white">
            Simulado não encontrado
          </h1>
          <p className="mt-3 text-sm text-rose-100">{loadError}</p>

          <div className="mt-5">
            <Link
              href="/dashboard/simulados"
              className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Voltar para simulados
            </Link>
          </div>
        </section>
      </div>
    )
  }

  if (!simulation || !currentQuestion) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#071225] p-6 text-sm text-slate-300">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando simulado...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <ClipboardList className="size-4" />
              Resolver simulado
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              {simulation.title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
              <Badge>{simulation.exam_type.toUpperCase()}</Badge>
              <Badge>{String(simulation.year)}</Badge>
              <Badge>
                {simulation.mode === "balanced" ? "Balanceado" : "Aleatório"}
              </Badge>
              <Badge>{simulation.generated_question_count} questões</Badge>
            </div>
          </div>

          <div className="w-full xl:max-w-[360px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Progresso</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {answeredCount}/{totalQuestions}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Em branco</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {unansweredCount}
                  </h2>
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#071225]">
                <div
                  className="h-full rounded-full bg-[#2f7cff]"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-300">
                {progressPercentage}% concluído
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                Questão {currentIndex + 1} de {totalQuestions}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Nº {currentQuestion.number}
              </h2>
            </div>

            <div className="text-right">
              <InfoRow label="Disciplina" value={currentQuestion.subject} />
              {currentQuestion.source_pdf_label ? (
                <InfoRow
                  label="Referência"
                  value={currentQuestion.source_pdf_label}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-base leading-8 text-slate-200">
            {currentQuestion.statement}
          </div>

          <div className="mt-6 space-y-3">
            {OPTION_ORDER.filter((key) => currentQuestion.options[key]).map((key) => {
              const isSelected = answers[currentQuestion.number] === key

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectAnswer(currentQuestion.number, key)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isSelected
                      ? "border-emerald-400/50 bg-emerald-400/10"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckCircle2 className="size-5 text-emerald-300" />
                      ) : (
                        <Circle className="size-5 text-slate-400" />
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-semibold text-white">{key}</div>
                      <div className="mt-1 text-sm leading-7 text-slate-300">
                        {currentQuestion.options[key]}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleClearAnswer(currentQuestion.number)}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Limpar resposta
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="size-4" />
              Questão anterior
            </button>

            <button
              type="button"
              onClick={handleSubmitSimulation}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {isSubmitting ? "Enviando..." : "Finalizar e corrigir"}
            </button>

            <button
              type="button"
              onClick={() => goToQuestion(currentIndex + 1)}
              disabled={currentIndex === totalQuestions - 1}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima questão
              <ArrowRight className="size-4" />
            </button>
          </div>

          {submitError ? (
            <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {submitError}
            </div>
          ) : null}
        </article>

        <aside className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <h3 className="text-xl font-semibold text-white">Mapa de questões</h3>
          <p className="mt-2 text-sm text-slate-400">
            Clique em uma questão para navegar rapidamente.
          </p>

          <div className="mt-6 grid grid-cols-5 gap-3">
            {questions.map((question, index) => {
              const selectedAnswer = answers[question.number]
              const isCurrent = index === currentIndex
              const isAnswered = Boolean(selectedAnswer)

              return (
                <button
                  key={question.number}
                  type="button"
                  onClick={() => goToQuestion(index)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    isCurrent
                      ? "border-emerald-300 bg-emerald-300 text-black"
                      : isAnswered
                      ? "border-sky-400/40 bg-sky-400/10 text-sky-100"
                      : "border-white/10 bg-black/20 text-neutral-300 hover:bg-white/5"
                  }`}
                >
                  {question.number}
                </button>
              )
            })}
          </div>

          <div className="mt-6 space-y-3">
            <Legend color="bg-emerald-300" text="Questão atual" />
            <Legend color="bg-sky-400/30" text="Respondida" />
            <Legend color="bg-white/10" text="Ainda em branco" />
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#020b18] p-5">
            <h4 className="text-lg font-semibold text-white">Resumo</h4>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              As respostas são mantidas localmente durante esta sessão para
              evitar perda acidental de progresso.
            </p>
          </div>
        </aside>
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

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <div className={`size-4 rounded ${color}`} />
      <span>{text}</span>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm text-slate-300">
      <span className="text-slate-400">{label}: </span>
      <span className="text-white">{value}</span>
    </div>
  )
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json()

    if (typeof data?.detail === "string") {
      return data.detail
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: unknown) => {
          if (typeof item === "string") return item
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: string }).msg)
          }
          return "Erro de validação."
        })
        .join(" | ")
    }

    return "Erro na requisição."
  } catch {
    return "Erro na requisição."
  }
}