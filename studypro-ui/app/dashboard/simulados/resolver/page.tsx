"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

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
const OPTION_ORDER = ["A", "B", "C", "D", "E"] as const

export default function ResolverSimuladoPage() {
  const router = useRouter()

  const [simulation, setSimulation] = useState<SimulationGenerationResponse | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [submitError, setSubmitError] = useState("")

  useEffect(() => {
    try {
      const rawSimulation = sessionStorage.getItem(ACTIVE_SIMULATION_KEY)

      if (!rawSimulation) {
        setLoadError("Nenhum simulado ativo foi encontrado nesta sessão.")
        return
      }

      const parsedSimulation = JSON.parse(rawSimulation) as SimulationGenerationResponse
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
  }, [questions, answers])

  const unansweredCount = totalQuestions - answeredCount
  const progressPercentage = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0

  function handleSelectAnswer(questionNumber: number, optionKey: string) {
    setAnswers((current) => ({
      ...current,
      [questionNumber]: optionKey,
    }))
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
          ...(localStorage.getItem("studypro_auth_token")
            ? {
                Authorization: `Bearer ${localStorage.getItem(
                  "studypro_auth_token"
                )}`,
              }
            : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorMessage = await safeReadError(response)
        throw new Error(errorMessage || "Não foi possível corrigir o simulado.")
      }

      const result = (await response.json()) as SimulationSubmissionResponse
      const attemptId = `${simulation.simulation_id}-${Date.now()}`

      sessionStorage.setItem(
        LAST_SIMULATION_RESULT_KEY,
        JSON.stringify({
          attempt_id: attemptId,
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
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-8">
        <h1 className="text-2xl font-bold text-white">Simulado não encontrado</h1>
        <p className="mt-3 text-slate-300">{loadError}</p>
        <Link
          href="/dashboard/simulados"
          className="mt-6 inline-flex rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Voltar para simulados
        </Link>
      </div>
    )
  }

  if (!simulation || !currentQuestion) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-8 text-slate-300">
        Carregando simulado...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <p className="text-sm uppercase tracking-[0.18em] text-[#7ea0d6]">
          Resolver simulado
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
          {simulation.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
          <span>{simulation.exam_type.toUpperCase()}</span>
          <span>{String(simulation.year)}</span>
          <span>{simulation.mode === "balanced" ? "Balanceado" : "Aleatório"}</span>
          <span>{simulation.generated_question_count} questões</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard
            label="Respondidas"
            value={`${answeredCount}/${totalQuestions}`}
          />
          <InfoCard
            label="Em branco"
            value={String(unansweredCount)}
          />
          <InfoCard
            label="Progresso"
            value={`${progressPercentage}%`}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">
              Questão {currentIndex + 1} de {totalQuestions}
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
            onClick={() => handleClearAnswer(currentQuestion.number)}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Limpar resposta
          </button>
        </div>

        <div className="mt-6 rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm leading-7 text-slate-200">
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
                <div className="flex gap-3">
                  <span className="font-semibold text-white">{key}</span>
                  <span className="text-slate-200">{currentQuestion.options[key]}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Questão anterior
          </button>

          <button
            type="button"
            onClick={handleSubmitSimulation}
            disabled={isSubmitting}
            className="rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Finalizar e corrigir"}
          </button>

          <button
            type="button"
            onClick={() => goToQuestion(currentIndex + 1)}
            disabled={currentIndex === totalQuestions - 1}
            className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima questão
          </button>
        </div>

        {submitError ? (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {submitError}
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <h3 className="text-2xl font-bold text-white">Mapa de questões</h3>
        <p className="mt-2 text-sm text-[#7ea0d6]">
          Clique em uma questão para navegar rapidamente.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {questions.map((question, index) => {
            const selectedAnswer = answers[question.number]
            const isCurrent = index === currentIndex
            const isAnswered = !!selectedAnswer

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

        <div className="mt-6 text-sm text-slate-400">
          As respostas são mantidas localmente durante esta sessão para evitar
          perda acidental de progresso.
        </div>
      </section>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
    </article>
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