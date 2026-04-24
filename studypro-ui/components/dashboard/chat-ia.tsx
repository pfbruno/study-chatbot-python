"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  Bot,
  Check,
  Copy,
  FileText,
  History,
  Layers3,
  MessageSquare,
  PanelLeft,
  Plus,
  Search,
  SendHorizonal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
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
  type ChatMessageResponse,
} from "@/lib/chat-api"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

type ChatSession = {
  id: string
  title: string
  updatedAt: string
  messages: Message[]
}

const CHAT_SESSIONS_KEY = "studypro_chat_sessions"
const CHAT_ACTIVE_SESSION_KEY = "studypro_chat_active_session"
const ACTIVE_SIMULATION_KEY = "studypro_active_simulation"
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers"
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result"

const INITIAL_ASSISTANT_MESSAGE = `Olá! Como posso ajudar você hoje?`

const QUICK_PROMPTS = [
  "Explique mitose e meiose de forma simples",
  "Crie um simulado de 10 questões de biologia do ENEM",
  "Monte um cronograma de estudos de 4 semanas para o ENEM",
  "Gere 5 questões estilo ENEM com gabarito sobre genética",
]

function messageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function sessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatLocalDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function formatTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "--:--"

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function buildInitialSession(): ChatSession {
  const now = new Date().toISOString()

  return {
    id: sessionId(),
    title: "Nova conversa",
    updatedAt: now,
    messages: [
      {
        id: messageId(),
        role: "assistant",
        content: INITIAL_ASSISTANT_MESSAGE,
        createdAt: now,
      },
    ],
  }
}

function extractSessionTitle(input: string) {
  const normalized = input.trim()
  if (!normalized) return "Nova conversa"
  return normalized.length > 48 ? `${normalized.slice(0, 48)}...` : normalized
}

function sortSessions(sessions: ChatSession[]) {
  return [...sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      )
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-blue-200"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    return part
  })
}

function renderContent(content: string) {
  const lines = content.split("\n")
  const elements: ReactNode[] = []
  let listBuffer: { ordered: boolean; items: string[] } | null = null

  const flushList = () => {
    if (!listBuffer) return

    const Tag = listBuffer.ordered ? "ol" : "ul"

    elements.push(
      <Tag
        key={`list-${elements.length}`}
        className={`my-2 space-y-1.5 pl-5 ${
          listBuffer.ordered ? "list-decimal" : "list-disc"
        } marker:text-blue-300`}
      >
        {listBuffer.items.map((item, index) => (
          <li key={index} className="leading-7 text-slate-200">
            {renderInline(item)}
          </li>
        ))}
      </Tag>
    )

    listBuffer = null
  }

  lines.forEach((line, index) => {
    if (line.startsWith("## ")) {
      flushList()
      elements.push(
        <h3 key={index} className="mb-2 mt-4 text-lg font-bold text-white">
          {line.slice(3)}
        </h3>
      )
      return
    }

    if (line.startsWith("### ")) {
      flushList()
      elements.push(
        <h4 key={index} className="mb-2 mt-3 text-base font-semibold text-white">
          {line.slice(4)}
        </h4>
      )
      return
    }

    if (line.startsWith("> ")) {
      flushList()
      elements.push(
        <blockquote
          key={index}
          className="my-2 rounded-r border-l-2 border-blue-400/70 bg-blue-500/10 px-3 py-2 text-sm text-slate-200"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      )
      return
    }

    if (line.startsWith("- ")) {
      if (!listBuffer || listBuffer.ordered) {
        flushList()
        listBuffer = { ordered: false, items: [] }
      }
      listBuffer.items.push(line.slice(2))
      return
    }

    if (/^\d+\.\s/.test(line)) {
      if (!listBuffer || !listBuffer.ordered) {
        flushList()
        listBuffer = { ordered: true, items: [] }
      }
      listBuffer.items.push(line.replace(/^\d+\.\s/, ""))
      return
    }

    if (!line.trim()) {
      flushList()
      elements.push(<div key={index} className="h-2" />)
      return
    }

    flushList()
    elements.push(
      <p key={index} className="leading-7 text-slate-200">
        {renderInline(line)}
      </p>
    )
  })

  flushList()
  return elements
}

function sanitizeAssistantText(raw: string | null | undefined) {
  const normalized = (raw ?? "").replace(/\r\n/g, "\n").trim()

  if (!normalized) return ""

  const explanationMatch = normalized.match(
    /(?:^|\n)Explicação:\s*([\s\S]*?)(?=\n(?:Resumo|Sugestão de estudo|Tema identificado):|$)/i
  )

  if (explanationMatch?.[1]?.trim()) {
    return explanationMatch[1].trim()
  }

  const ignoredLabel = /^(Tema identificado|Resumo|Sugestão de estudo):/i
  const lines = normalized.split("\n").filter((line) => !ignoredLabel.test(line.trim()))
  return lines.join("\n").trim()
}

function getAssistantMessageText(response: ChatMessageResponse) {
  const candidates = [
    response.formatted_response,
    response.content,
    response.explanation,
  ]

  for (const candidate of candidates) {
    const sanitized = sanitizeAssistantText(candidate)
    if (sanitized) return sanitized
  }

  return "Não consegui gerar uma resposta agora."
}

function ConversationsPanel({
  search,
  setSearch,
  sessions,
  activeSessionId,
  setActiveSessionId,
  deleteSession,
}: {
  search: string
  setSearch: (value: string) => void
  sessions: ChatSession[]
  activeSessionId: string
  setActiveSessionId: (value: string) => void
  deleteSession: (value: string) => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar conversas..."
          className="h-12 w-full rounded-2xl border border-white/10 bg-[#020b18] pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/40"
        />
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
            Nenhuma conversa encontrada.
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId

            return (
              <div
                key={session.id}
                className={`group rounded-2xl border transition ${
                  isActive
                    ? "border-blue-400/30 bg-blue-500/10"
                    : "border-white/10 bg-[#081224] hover:bg-white/[0.04]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveSessionId(session.id)}
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {session.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {formatLocalDate(session.updatedAt)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      aria-label="Excluir conversa"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export function ChatIA() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const messagesViewportRef = useRef<HTMLDivElement | null>(null)
  const pendingAutoScrollRef = useRef(false)
  const hasAutoRunExecutedRef = useRef(false)

  const [token, setToken] = useState<string | null>(null)
  const [entitlement, setEntitlement] =
    useState<ChatEntitlementResponse | null>(null)

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState("")
  const [search, setSearch] = useState("")
  const [input, setInput] = useState("")
  const [loadingEntitlement, setLoadingEntitlement] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const rawSessions = localStorage.getItem(CHAT_SESSIONS_KEY)
    const storedActiveSessionId = localStorage.getItem(CHAT_ACTIVE_SESSION_KEY)

    setToken(storedToken)

    if (rawSessions) {
      try {
        const parsed = JSON.parse(rawSessions) as ChatSession[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = sortSessions(parsed)
          setSessions(normalized)
          setActiveSessionId(storedActiveSessionId || normalized[0].id)
          return
        }
      } catch {
        localStorage.removeItem(CHAT_SESSIONS_KEY)
      }
    }

    const initial = buildInitialSession()
    setSessions([initial])
    setActiveSessionId(initial.id)
  }, [])

  useEffect(() => {
    if (!sessions.length) return
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions))
  }, [sessions])

  useEffect(() => {
    if (!activeSessionId) return
    localStorage.setItem(CHAT_ACTIVE_SESSION_KEY, activeSessionId)
  }, [activeSessionId])

  useEffect(() => {
    const promptFromUrl = searchParams.get("prompt")
    if (!promptFromUrl) return

    const normalized = promptFromUrl.trim()
    if (!normalized) return

    setInput((current) => (current.trim() ? current : normalized))
  }, [searchParams])

  useEffect(() => {
    async function loadEntitlement() {
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

    void loadEntitlement()
  }, [token])

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = "auto"
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      180
    )}px`
  }, [input])

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  )

  const filteredSessions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return sessions

    return sessions.filter((session) =>
      session.title.toLowerCase().includes(normalizedSearch)
    )
  }, [sessions, search])

  const canAsk = entitlement?.usage.can_ask ?? true
  const remainingToday = entitlement?.usage.remaining_today
  const isPro = entitlement?.usage.plan === "pro"

  const usageLabel = useMemo(() => {
    if (!entitlement) return "Carregando..."
    if (isPro) return "Plano PRO"
    if (typeof remainingToday === "number") {
      return `${remainingToday} pergunta(s) restantes hoje`
    }
    return "Plano gratuito"
  }, [entitlement, isPro, remainingToday])

  const isEmptyState = !activeSession || activeSession.messages.length <= 1

  function scrollMessagesToBottom(behavior: ScrollBehavior = "smooth") {
    const viewport = messagesViewportRef.current
    if (!viewport) return
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior,
    })
  }

  useEffect(() => {
    if (!messagesViewportRef.current) return
    messagesViewportRef.current.scrollTop = 0
  }, [activeSessionId])

  useEffect(() => {
    if (!pendingAutoScrollRef.current) return
    scrollMessagesToBottom(sending ? "auto" : "smooth")
    pendingAutoScrollRef.current = false
  }, [activeSession?.messages.length, sending])

  function createNewChat(prefill?: string) {
    const now = new Date().toISOString()
    const newSession: ChatSession = {
      id: sessionId(),
      title: prefill ? extractSessionTitle(prefill) : "Nova conversa",
      updatedAt: now,
      messages: [
        {
          id: messageId(),
          role: "assistant",
          content: INITIAL_ASSISTANT_MESSAGE,
          createdAt: now,
        },
      ],
    }

    setSessions((current) => sortSessions([newSession, ...current]))
    setActiveSessionId(newSession.id)
    setInput(prefill ?? "")
    setError("")
    setShowSidebar(false)

    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }

  function deleteSession(targetId: string) {
    const nextSessions = sessions.filter((session) => session.id !== targetId)

    if (!nextSessions.length) {
      const initial = buildInitialSession()
      setSessions([initial])
      setActiveSessionId(initial.id)
      return
    }

    const normalized = sortSessions(nextSessions)
    setSessions(normalized)

    if (activeSessionId === targetId) {
      setActiveSessionId(normalized[0].id)
    }
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 50)
  }

  function updateSessionMessages(
    targetId: string,
    updater: (session: ChatSession) => ChatSession
  ) {
    setSessions((current) =>
      sortSessions(
        current.map((session) =>
          session.id === targetId ? updater(session) : session
        )
      )
    )
  }

  async function executePrompt(question: string) {
    const trimmed = question.trim()

    if (!trimmed || sending) return

    let targetSessionId = activeSessionId

    if (!targetSessionId) {
      const initial = buildInitialSession()
      setSessions([initial])
      setActiveSessionId(initial.id)
      targetSessionId = initial.id
    }

    setError("")

    const userMessage: Message = {
      id: messageId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    }

    pendingAutoScrollRef.current = true

    updateSessionMessages(targetSessionId, (session) => ({
      ...session,
      title:
        session.messages.filter((message) => message.role === "user").length === 0
          ? extractSessionTitle(trimmed)
          : session.title,
      updatedAt: new Date().toISOString(),
      messages: [...session.messages, userMessage],
    }))

    setInput("")
    setSending(true)

    try {
      const response = await sendChatMessage(trimmed, token)

      setEntitlement({
        authenticated: response.access.authenticated,
        user: response.access.user,
        usage: response.access.usage,
      })

      if (response.access.user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.access.user))
      }

      const assistantText = getAssistantMessageText(response)

      if (assistantText) {
        const assistantMessage: Message = {
          id: messageId(),
          role: "assistant",
          content: assistantText,
          createdAt: new Date().toISOString(),
        }

        pendingAutoScrollRef.current = true

        updateSessionMessages(targetSessionId, (session) => ({
          ...session,
          updatedAt: new Date().toISOString(),
          messages: [...session.messages, assistantMessage],
        }))
      }

      if (
        response.kind === "action" &&
        response.action?.type === "generate_simulation"
      ) {
        const simulation = await generateRandomSimulation(
          response.action.payload,
          token
        )

        sessionStorage.setItem(ACTIVE_SIMULATION_KEY, JSON.stringify(simulation))
        sessionStorage.removeItem(ACTIVE_SIMULATION_ANSWERS_KEY)
        sessionStorage.removeItem(LAST_SIMULATION_RESULT_KEY)

        const finalMessage: Message = {
          id: messageId(),
          role: "assistant",
          content:
            "Simulado criado com sucesso. Vou te encaminhar para a área de resolução agora.",
          createdAt: new Date().toISOString(),
        }

        pendingAutoScrollRef.current = true

        updateSessionMessages(targetSessionId, (session) => ({
          ...session,
          updatedAt: new Date().toISOString(),
          messages: [...session.messages, finalMessage],
        }))

        router.push("/dashboard/simulados/resolver")
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao enviar mensagem."

      setError(message)

      const errorMessage: Message = {
        id: messageId(),
        role: "assistant",
        content: message,
        createdAt: new Date().toISOString(),
      }

      pendingAutoScrollRef.current = true

      updateSessionMessages(targetSessionId, (session) => ({
        ...session,
        updatedAt: new Date().toISOString(),
        messages: [...session.messages, errorMessage],
      }))
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
    if (!activeSessionId) return

    hasAutoRunExecutedRef.current = true
    void executePrompt(promptFromUrl)
  }, [searchParams, loadingEntitlement, canAsk, sending, activeSessionId])

  async function handleSubmit() {
    if (!input.trim() || sending) return
    await executePrompt(input)
  }

  async function copyMessage(message: Message) {
    if (!navigator?.clipboard) return
    await navigator.clipboard.writeText(message.content)
    setCopiedMessageId(message.id)
    setTimeout(() => setCopiedMessageId(null), 1800)
  }

  return (
    <div className="relative flex h-[calc(100vh-9rem)] min-h-0 flex-col">
      {showSidebar ? (
        <div className="fixed inset-0 z-40 bg-black/60">
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setShowSidebar(false)}
            aria-label="Fechar conversas"
          />

          <div className="absolute inset-y-0 left-0 w-[92vw] max-w-[360px] border-r border-white/10 bg-[#071225] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <p className="text-sm font-semibold text-white">Conversas</p>
                <p className="text-xs text-slate-400">
                  Histórico e troca rápida de conversa
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSidebar(false)}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="h-[calc(100%-81px)] overflow-y-auto p-4">
              <ConversationsPanel
                search={search}
                setSearch={setSearch}
                sessions={filteredSessions}
                activeSessionId={activeSessionId}
                setActiveSessionId={(value) => {
                  setActiveSessionId(value)
                  setShowSidebar(false)
                }}
                deleteSession={deleteSession}
              />
            </div>
          </div>
        </div>
      ) : null}

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#071225]">
        <div className="border-b border-white/10 px-4 py-4 md:px-6">
          <div className="mx-auto flex w-full max-w-[1200px] items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSidebar(true)}
              className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Abrir conversas"
            >
              <PanelLeft className="size-4" />
            </button>

            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f7cff] to-cyan-400 text-white shadow-[0_18px_50px_-20px_rgba(59,130,246,0.95)]">
              <Bot className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-semibold text-white">
                  {activeSession?.title || "Chat IA"}
                </h1>
                <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-300">
                  beta
                </span>
              </div>
              <p className="truncate text-sm text-slate-400">
                Converse com a IA de forma contínua, com foco total no estudo.
              </p>
            </div>

            <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 md:block">
              {loadingEntitlement ? "Carregando..." : usageLabel}
            </div>
          </div>
        </div>

        <div
          ref={messagesViewportRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6"
        >
          <div className="mx-auto flex w-full max-w-[1200px] flex-col">
            {isEmptyState ? (
              <div className="mb-8">
                <div className="mb-6 rounded-[28px] border border-white/10 bg-[#020b18] p-6">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">
                      <Sparkles className="size-3.5" />
                      Início rápido
                    </div>

                    <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">
                      Como posso ajudar nos seus estudos hoje?
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Tire dúvidas, peça resumos, gere questões, monte
                      cronogramas e crie simulados em linguagem natural.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleQuickPrompt(prompt)}
                      className="rounded-2xl border border-white/10 bg-[#020b18] p-4 text-left transition hover:border-blue-500/30 hover:bg-white/[0.04]"
                    >
                      <div className="text-sm font-semibold leading-6 text-white">
                        {prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-6 pb-6">
              {activeSession?.messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[92%] md:max-w-[80%] lg:max-w-[760px]">
                        <div className="rounded-3xl rounded-br-md bg-gradient-to-br from-[#2f7cff] to-blue-500 px-5 py-4 text-sm leading-7 text-white shadow-[0_18px_50px_-20px_rgba(59,130,246,0.95)]">
                          {message.content}
                        </div>
                        <div className="mt-1 pr-2 text-right text-[11px] text-slate-500">
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[96%] md:max-w-[88%] lg:max-w-[900px]">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f7cff] to-cyan-400 text-white shadow-[0_18px_50px_-20px_rgba(59,130,246,0.95)]">
                          <Bot className="size-4" />
                        </div>
                        <div className="text-xs font-semibold text-white">
                          StudyPro IA
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatTime(message.createdAt)}
                        </div>
                      </div>

                      <div className="rounded-3xl rounded-tl-md border border-white/10 bg-[#020b18] px-5 py-4 text-sm shadow-sm">
                        <div className="space-y-1">{renderContent(message.content)}</div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyMessage(message)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="size-3.5 text-emerald-300" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                          Copiar
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          <FileText className="size-3.5" />
                          Resumo
                        </button>

                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          <Layers3 className="size-3.5" />
                          Flashcards
                        </button>

                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                          >
                            <ThumbsUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex size-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                          >
                            <ThumbsDown className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {sending ? (
                <div className="flex justify-start">
                  <div className="max-w-[96%] md:max-w-[88%] lg:max-w-[900px]">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f7cff] to-cyan-400 text-white shadow-[0_18px_50px_-20px_rgba(59,130,246,0.95)]">
                        <Bot className="size-4" />
                      </div>
                      <div className="text-xs font-semibold text-white">
                        StudyPro IA
                      </div>
                      <div className="text-[11px] text-slate-500">
                        pensando...
                      </div>
                    </div>

                    <div className="rounded-3xl rounded-tl-md border border-white/10 bg-[#020b18] px-5 py-4">
                      <div className="flex gap-1.5">
                        <span className="size-2 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]" />
                        <span className="size-2 animate-bounce rounded-full bg-blue-400 [animation-delay:150ms]" />
                        <span className="size-2 animate-bounce rounded-full bg-blue-400 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#071225] px-4 py-3 md:px-6">
          <div className="mx-auto flex w-full max-w-[1200px] flex-col">
            {error ? (
              <div className="mb-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {!canAsk ? (
              <div className="mb-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
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

            <div className="ml-auto w-full max-w-5xl rounded-[24px] border border-white/10 bg-[#020b18] p-2.5 shadow-[0_-12px_40px_-24px_rgba(0,0,0,0.8)]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    void handleSubmit()
                  }
                }}
                placeholder="Pergunte qualquer coisa sobre seus estudos... (Shift + Enter para quebrar linha)"
                disabled={sending || !canAsk}
                rows={1}
                className="max-h-[180px] min-h-[52px] w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-6 text-white outline-none placeholder:text-slate-500"
              />

              <div className="mt-1.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => createNewChat()}
                    className="inline-flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                    aria-label="Nova conversa"
                  >
                    <Plus className="size-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSidebar(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <History className="size-4" />
                    Conversas
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={sending || !input.trim() || !canAsk}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendHorizonal className="size-4" />
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}