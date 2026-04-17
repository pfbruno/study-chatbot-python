"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  BarChart3,
  GraduationCap,
  Layers3,
  Loader2,
  Lock,
  SendHorizonal,
  Sparkles,
  Wand2,
} from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  generateRandomSimulation,
} from "@/lib/api"
import {
  getChatEntitlement,
  sendChatMessage,
  type ChatEntitlementResponse,
} from "@/lib/chat-api"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

type SimulationMode = "balanced" | "random"

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

const SESSION_STORAGE_KEY = "studypro_active_simulation"
const SIMULATION_HISTORY_KEY = "studypro_simulation_history"
const REVIEW_SUMMARY_KEY = "studypro_review_summary"
const REVIEW_FLASHCARDS_KEY = "studypro_review_flashcards"

const QUICK_PROMPTS = [
  "Crie um simulado de 10 questões de biologia do enem",
  "Explique mitose e meiose de forma simples",
  "Crie um simulado de 15 questões de matemática do enem 2022",
  "Quais são os principais tópicos de genética para o enem?",
]

function messageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

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

export function ChatIA() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const hasAutoRunExecutedRef = useRef(false)

  const [token, setToken] = useState<string | null>(null)
  const [entitlement, setEntitlement] =
    useState<ChatEntitlementResponse | null>(null)
  const [simulationHistory, setSimulationHistory] = useState<
    SimulationHistoryEntry[]
  >([])
  const [reviewSummary, setReviewSummary] =
    useState<ReviewSummaryPayload | null>(null)
  const [reviewFlashcards, setReviewFlashcards] = useState<ReviewCard[]>([])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: messageId(),
      role: "assistant",
      content:
        "Olá. Posso responder perguntas, explicar conteúdos e também criar simulados a partir do seu comando.",
    },
  ])

  const [input, setInput] = useState("")
  const [loadingEntitlement, setLoadingEntitlement] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const rawHistory = localStorage.getItem(SIMULATION_HISTORY_KEY)
    const rawSummary = localStorage.getItem(REVIEW_SUMMARY_KEY)
    const rawFlashcards = localStorage.getItem(REVIEW_FLASHCARDS_KEY)

    setToken(storedToken)

    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory) as SimulationHistoryEntry[]
        if (Array.isArray(parsed)) {
          setSimulationHistory(parsed)
        }
      } catch {
        localStorage.removeItem(SIMULATION_HISTORY_KEY)
      }
    }

    if (rawSummary) {
      try {
        const parsed = JSON.parse(rawSummary) as ReviewSummaryPayload
        if (parsed?.title && parsed?.revisionSummary) {
          setReviewSummary(parsed)
        }
      } catch {
        localStorage.removeItem(REVIEW_SUMMARY_KEY)
      }
    }

    if (rawFlashcards) {
      try {
        const parsed = JSON.parse(rawFlashcards) as ReviewCard[]
        if (Array.isArray(parsed)) {
          setReviewFlashcards(parsed)
        }
      } catch {
        localStorage.removeItem(REVIEW_FLASHCARDS_KEY)
      }
    }
  }, [])

  useEffect(() => {
    const promptFromUrl = searchParams.get("prompt")
    if (!promptFromUrl) return

    const normalized = promptFromUrl.trim()
    if (!normalized) return

    setInput((current) => (current.trim() ? current : normalized))
  }, [searchParams])

  useEffect(() => {
    async function load() {
      try {
        setLoadingEntitlement(true)
        setError("")

        const data = await getChatEntitlement(token)
        setEntitlement(data)

        if (data.user) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o status do chat."
        )
      } finally {
        setLoadingEntitlement(false)
      }
    }

    load()
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, sending])

  const canAsk = entitlement?.usage.can_ask ?? true
  const remainingToday = entitlement?.usage.remaining_today
  const isPro = entitlement?.usage.plan === "pro"

  const latestSimulation = simulationHistory[0] ?? null
  const bestSimulationScore =
    simulationHistory.length > 0
      ? Math.max(...simulationHistory.map((item) => item.score_percentage))
      : null

  const usageLabel = useMemo(() => {
    if (!entitlement) return "Carregando..."
    if (isPro) return "Plano PRO • uso ampliado"
    if (typeof remainingToday === "number") {
      return `Restam ${remainingToday} pergunta(s) hoje`
    }
    return "Plano gratuito"
  }, [entitlement, isPro, remainingToday])

  async function executePrompt(question: string) {
    if (!question.trim()) return
    if (sending) return

    setError("")

    const userMessage: Message = {
      id: messageId(),
      role: "user",
      content: question,
    }

    setMessages((current) => [...current, userMessage])
    setInput("")
    setSending(true)

    try {
      const response = await sendChatMessage(question, token)

      setEntitlement({
        authenticated: response.access.authenticated,
        user: response.access.user,
        usage: response.access.usage,
      })

      if (response.access.user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.access.user))
      }

      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "assistant",
          content: response.content,
        },
      ])

      if (
        response.kind === "action" &&
        response.action?.type === "generate_simulation"
      ) {
        const simulation = await generateRandomSimulation(
          response.action.payload,
          token
        )

        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify(simulation)
        )

        setMessages((current) => [
          ...current,
          {
            id: messageId(),
            role: "assistant",
            content:
              "Simulado criado com sucesso. Vou te encaminhar para a área de resolução agora.",
          },
        ])

        router.push("/dashboard/simulados/resolver")
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado ao enviar mensagem."

      setError(message)

      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "assistant",
          content: message,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    const autorun = searchParams.get("autorun")
    const promptFromUrl = searchParams.get("prompt")?.trim() ?? ""

    if (hasAutoRunExecutedRef.current) return
    if (autorun !== "1") return
    if (!promptFromUrl) return
    if (loadingEntitlement) return
    if (!canAsk) return
    if (sending) return

    hasAutoRunExecutedRef.current = true
    void executePrompt(promptFromUrl)
  }, [searchParams, loadingEntitlement, canAsk, sending])

  async function handleSubmit() {
    const question = input.trim()
    if (!question || sending) return
    await executePrompt(question)
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Sparkles className="size-4" />
              Chat IA operacional
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              Pergunte, peça explicações ou crie simulados por comando
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              Exemplos: explicar um conteúdo, resumir um tema ou criar um
              simulado em linguagem natural.
            </p>
          </div>

          <div className="grid w-full gap-4 xl:max-w-[360px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Uso do chat</p>
              <div className="mt-2 text-2xl font-bold text-white">
                {loadingEntitlement ? "Carregando..." : usageLabel}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                {isPro
                  ? "Seu plano PRO está ativo no chat."
                  : "O plano free possui limite diário de perguntas no chat."}
              </p>
            </div>

            {latestSimulation ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                    <BarChart3 className="size-5 text-blue-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-white">
                      Último resultado
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      {latestSimulation.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {latestSimulation.score_percentage.toFixed(1)}% •{" "}
                      {formatLocalDate(latestSimulation.saved_at)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/dashboard/simulados"
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                      >
                        Continuar treinando
                      </Link>

                      <Link
                        href="/dashboard"
                        className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Ver dashboard
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {(reviewSummary || reviewFlashcards.length > 0) && (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                    <GraduationCap className="size-5 text-blue-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-white">
                      Área de Estudo pronta
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Seus materiais de revisão já estão organizados.
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-sm text-slate-400">Resumo</div>
                        <div className="mt-1 text-base font-semibold text-white">
                          {reviewSummary ? "Disponível" : "Não"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="text-sm text-slate-400">Flashcards</div>
                        <div className="mt-1 text-base font-semibold text-white">
                          {reviewFlashcards.length}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href="/dashboard/estudo"
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                      >
                        Ir para Área de Estudo
                      </Link>

                      {reviewFlashcards.length > 0 ? (
                        <Link
                          href="/dashboard/flashcards"
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                        >
                          <Layers3 className="size-4" />
                          Flashcards
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {bestSimulationScore !== null ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
                <p className="text-sm text-slate-400">Melhor nota recente</p>
                <div className="mt-2 text-2xl font-bold text-white">
                  {bestSimulationScore.toFixed(1)}%
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Histórico local aproveitado pelo chat para manter contexto de estudo.
                </p>
              </div>
            ) : null}

            {!isPro ? (
              <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-amber-500/15">
                    <Lock className="size-5 text-amber-200" />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Upgrade do chat
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-amber-100">
                      Quando atingir o limite gratuito, o envio é bloqueado e o
                      upgrade passa a ser o próximo passo.
                    </p>

                    <Link
                      href="/pricing"
                      className="mt-4 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                    >
                      Desbloquear PRO
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleQuickPrompt(prompt)}
            className="rounded-[20px] border border-white/10 bg-[#071225] px-4 py-4 text-left text-sm text-slate-300 transition hover:border-blue-500/40 hover:bg-[#09172c] hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-4 md:p-6">
        <div className="flex h-[560px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-7 md:max-w-[75%] ${
                    message.role === "user"
                      ? "bg-[#2f7cff] text-white"
                      : "border border-white/10 bg-[#020b18] text-slate-200"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {sending ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-3 rounded-[24px] border border-white/10 bg-[#020b18] px-4 py-3 text-sm text-slate-300">
                  <Loader2 className="size-4 animate-spin" />
                  Processando...
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
            {error ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {!canAsk ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-amber-100/80">
                      Limite do plano gratuito
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      Você atingiu o limite diário do chat
                    </h3>
                  </div>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                  >
                    Ir para o PRO
                  </Link>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 md:flex-row">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void handleSubmit()
                  }
                }}
                placeholder="Digite sua pergunta ou peça um simulado..."
                disabled={sending || !canAsk}
                className="min-h-[90px] flex-1 rounded-[24px] border border-white/10 bg-[#020b18] px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500/40"
              />

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={sending || !canAsk || !input.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-[24px] bg-[#2f7cff] px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:self-end"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <SendHorizonal className="size-4" />
                )}
                Enviar
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Wand2 className="size-3.5" />
                Pode criar simulados por comando
              </span>
              <span>•</span>
              <span>
                Exemplo: “Crie um simulado de 10 questões de biologia do enem”
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}