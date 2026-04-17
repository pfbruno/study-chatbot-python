"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowRight,
  ClipboardList,
  Crown,
  FileText,
  History,
  Layers3,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  createCheckoutSession,
  generateRandomSimulation,
  getBillingStatus,
  type AuthUser,
  type BillingStatusResponse,
} from "@/lib/api"

type SimulationMode = "balanced" | "random"

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
  questions: Array<{
    number: number
    subject: string
    statement: string
    options: Record<string, string>
    source_pdf_label?: string | null
  }>
}

type SimulationHistoryEntry = {
  id: string
  saved_at: string
  title: string
  exam_type: string
  year: number
  mode: SimulationMode
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

type ReviewCard = {
  id: string
  subject: string
  questionNumber: number
  front: string
  back: string
}

const ACTIVE_SIMULATION_KEY = "studypro_active_simulation"
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers"
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result"
const SIMULATION_HISTORY_KEY = "studypro_simulation_history"
const REVIEW_SUMMARY_KEY = "studypro_review_summary"
const REVIEW_FLASHCARDS_KEY = "studypro_review_flashcards"

const SUBJECT_OPTIONS = [
  "Biologia",
  "Física",
  "Química",
  "Matemática",
  "Português",
  "Literatura",
  "História",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Inglês",
  "Espanhol",
  "Artes",
  "Educação Física",
  "Tecnologias da Comunicação",
]

function formatLocalDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export default function SimuladosPage() {
  const router = useRouter()

  const [authToken, setAuthToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [billing, setBilling] = useState<BillingStatusResponse | null>(null)
  const [history, setHistory] = useState<SimulationHistoryEntry[]>([])
  const [reviewSummary, setReviewSummary] =
    useState<ReviewSummaryPayload | null>(null)
  const [reviewFlashcards, setReviewFlashcards] = useState<ReviewCard[]>([])

  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")

  const [questionCount, setQuestionCount] = useState(10)
  const [mode, setMode] = useState<SimulationMode>("balanced")
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)
    const storedHistory = localStorage.getItem(SIMULATION_HISTORY_KEY)
    const storedSummary = localStorage.getItem(REVIEW_SUMMARY_KEY)
    const storedFlashcards = localStorage.getItem(REVIEW_FLASHCARDS_KEY)

    setAuthToken(storedToken)

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser)
      } catch {
        localStorage.removeItem(AUTH_USER_KEY)
      }
    }

    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory) as SimulationHistoryEntry[]
        if (Array.isArray(parsed)) {
          setHistory(parsed)
        }
      } catch {
        localStorage.removeItem(SIMULATION_HISTORY_KEY)
      }
    }

    if (storedSummary) {
      try {
        const parsed = JSON.parse(storedSummary) as ReviewSummaryPayload
        if (parsed?.title && parsed?.revisionSummary) {
          setReviewSummary(parsed)
        }
      } catch {
        localStorage.removeItem(REVIEW_SUMMARY_KEY)
      }
    }

    if (storedFlashcards) {
      try {
        const parsed = JSON.parse(storedFlashcards) as ReviewCard[]
        if (Array.isArray(parsed)) {
          setReviewFlashcards(parsed)
        }
      } catch {
        localStorage.removeItem(REVIEW_FLASHCARDS_KEY)
      }
    }

    async function loadBilling(token: string | null) {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError("")

        const data = await getBillingStatus(token)
        setBilling(data)
        setUser(data.user)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar o estado do seu plano."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadBilling(storedToken)
  }, [])

  const isPro = billing?.user.plan === "pro"
  const isFree = billing?.user.plan === "free"
  const remainingToday = billing?.usage.remaining_today ?? null
  const dailyLimit = billing?.usage.daily_limit ?? null
  const canGenerate = billing?.usage.can_generate ?? true
  const paywallActive = Boolean(isFree && !canGenerate)

  const usageLabel = useMemo(() => {
    if (loading) return "Carregando..."
    if (!authToken || !billing) return "Faça login para liberar simulados"
    if (isPro) return "Plano PRO • uso ampliado"
    if (dailyLimit !== null && remainingToday !== null) {
      return `${remainingToday} de ${dailyLimit} geração(ões) restantes hoje`
    }
    return "Uso disponível"
  }, [authToken, billing, dailyLimit, isPro, loading, remainingToday])

  const bestRecentScore = useMemo(() => {
    if (history.length === 0) return null
    return Math.max(...history.map((item) => item.score_percentage))
  }, [history])

  function toggleSubject(subject: string) {
    setSelectedSubjects((current) =>
      current.includes(subject)
        ? current.filter((item) => item !== subject)
        : [...current, subject]
    )
  }

  async function handleCheckout() {
    if (!authToken) {
      window.location.href = "/login?redirect=/pricing"
      return
    }

    try {
      setCheckoutLoading(true)
      setError("")

      const data = await createCheckoutSession(authToken)
      window.location.href = data.checkout_url
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao iniciar o checkout."
      )
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handleGenerateSimulation() {
    if (!authToken) {
      window.location.href = "/login?redirect=/dashboard/simulados"
      return
    }

    if (paywallActive) {
      router.push("/pricing")
      return
    }

    try {
      setGenerating(true)
      setError("")

      const simulation = (await generateRandomSimulation(
        {
          exam_type: "enem",
          year: 2022,
          question_count: questionCount,
          subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
          mode,
          seed: null,
        },
        authToken
      )) as SimulationGenerationResponse

      sessionStorage.setItem(ACTIVE_SIMULATION_KEY, JSON.stringify(simulation))
      sessionStorage.removeItem(ACTIVE_SIMULATION_ANSWERS_KEY)
      sessionStorage.removeItem(LAST_SIMULATION_RESULT_KEY)

      router.push("/dashboard/simulados/resolver")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar o simulado."
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Sparkles className="size-4" />
              Simulados ENEM
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              Área de simulados do aluno
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              Configure um treino rápido, gere o simulado e siga direto para a
              resolução com correção no final.
            </p>
          </div>

          <div className="grid w-full gap-4 xl:max-w-[380px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Seu plano</p>
              <div className="mt-2 text-2xl font-bold text-white">
                {loading
                  ? "Carregando..."
                  : billing?.user.plan?.toUpperCase() ?? "VISITANTE"}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                {usageLabel}
              </p>
            </div>

            {history.length > 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
                <p className="text-sm text-slate-400">Melhor resultado recente</p>
                <div className="mt-2 text-2xl font-bold text-white">
                  {bestRecentScore?.toFixed(1)}%
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Histórico local salvo neste navegador.
                </p>
              </div>
            ) : null}

            {paywallActive ? (
              <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-amber-500/15">
                    <Crown className="size-5 text-amber-200" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Limite gratuito atingido
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-amber-100">
                      Continue estudando com mais volume e sem bloqueio diário.
                    </p>

                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="mt-4 inline-flex items-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90 disabled:opacity-60"
                    >
                      {checkoutLoading ? "Redirecionando..." : "Desbloquear Pro"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {(reviewSummary || reviewFlashcards.length > 0) && (
        <section className="grid gap-6 xl:grid-cols-2">
          {reviewSummary ? (
            <article className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                    <FileText className="size-5 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Revisar antes de tentar de novo
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Seu último resumo de revisão está pronto
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/resumos"
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                >
                  Abrir resumo
                </Link>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm leading-7 text-slate-300">
                {reviewSummary.revisionSummary}
              </div>
            </article>
          ) : null}

          {reviewFlashcards.length > 0 ? (
            <article className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                    <Layers3 className="size-5 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Flashcards disponíveis
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Revise seus pontos fracos antes do próximo treino
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/flashcards"
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                >
                  Abrir flashcards
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoPill
                  label="Cards disponíveis"
                  value={String(reviewFlashcards.length)}
                />
                <InfoPill
                  label="Primeiro foco"
                  value={reviewFlashcards[0]?.subject ?? "N/D"}
                />
              </div>
            </article>
          ) : null}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          "1. Configurar quantidade e disciplinas",
          "2. Gerar simulado com base real",
          "3. Resolver questão por questão",
          "4. Corrigir e revisar o desempenho",
        ].map((step) => (
          <div
            key={step}
            className="rounded-[24px] border border-white/10 bg-[#071225] p-5 text-sm text-slate-300"
          >
            {step}
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
              <ClipboardList className="size-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Configurar simulado
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                ENEM 2022 como base principal
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Quantidade de questões
              </label>
              <select
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-[#020b18] px-4 py-3 text-white outline-none"
              >
                {[5, 10, 15, 20, 30].map((value) => (
                  <option key={value} value={value}>
                    {value} questões
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Modo
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("balanced")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    mode === "balanced"
                      ? "border-blue-400/50 bg-blue-400/10 text-white"
                      : "border-white/10 bg-[#020b18] text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Balanceado
                </button>
                <button
                  type="button"
                  onClick={() => setMode("random")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    mode === "random"
                      ? "border-blue-400/50 bg-blue-400/10 text-white"
                      : "border-white/10 bg-[#020b18] text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Aleatório
                </button>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-300">
                Disciplinas
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                {SUBJECT_OPTIONS.map((subject) => {
                  const selected = selectedSubjects.includes(subject)

                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => toggleSubject(subject)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? "border-emerald-400/50 bg-emerald-400/10 text-white"
                          : "border-white/10 bg-[#020b18] text-slate-300 hover:bg-white/5"
                      }`}
                    >
                      {subject}
                    </button>
                  )
                })}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Se nenhuma disciplina for selecionada, o sistema usa a base
                completa disponível.
              </p>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={handleGenerateSimulation}
                disabled={generating || loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2f7cff] px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Zap className="size-4" />
                )}
                {paywallActive ? "Desbloquear Pro" : "Gerar e resolver agora"}
              </button>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Voltar ao dashboard
              </Link>
            </div>
          </div>
        </article>

        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
              <History className="size-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Histórico recente
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Últimos simulados corrigidos neste navegador.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {history.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm leading-7 text-slate-300">
                Ainda não há resultados salvos. Finalize um simulado para começar
                a montar seu histórico local.
              </div>
            ) : (
              history.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-[24px] border border-white/10 bg-[#020b18] p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {entry.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatLocalDate(entry.saved_at)} • {entry.total_questions} questões
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {entry.score_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">
                        {entry.correct_answers} acerto(s)
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-300 transition hover:text-blue-200"
            >
              Ver comparação de planos
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}

function InfoPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#020b18] p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  )
}