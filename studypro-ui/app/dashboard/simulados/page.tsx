"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  Clock,
  Crown,
  Filter,
  GraduationCap,
  Loader2,
  Lock,
  Play,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  generateRandomSimulation,
  getSimulationEntitlement,
  type RandomSimulationResponse,
  type SimulationEntitlementResponse,
} from "@/lib/api"

type Difficulty = "easy" | "medium" | "hard"
type CardKind = "preset" | "history" | "premium_offer"
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

type SimuladoCard = {
  id: string
  kind: CardKind
  title: string
  description: string
  subject: string
  subjects: string[]
  difficulty: Difficulty
  tags: string[]
  questionCount: number
  duration: number
  timesCompleted: number
  rating: number
  author: string
  createdAt: string
  mode: SimulationMode
  href?: string
  isPremium?: boolean
  payload?: {
    exam_type: string
    year: number
    question_count: number
    subjects?: string[] | null
    mode?: SimulationMode
    seed?: number | null
  }
}

const SIMULATION_HISTORY_KEY = "studypro_simulation_history"
const ACTIVE_SIMULATION_KEY = "studypro_active_simulation"
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers"
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result"

const difficulties = [
  { value: "all", label: "Todas" },
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Médio" },
  { value: "hard", label: "Difícil" },
] as const

const sortOptions = [
  { value: "popular", label: "Mais feitos" },
  { value: "rating", label: "Melhor avaliados" },
  { value: "recent", label: "Mais recentes" },
] as const

const difficultyColors: Record<Difficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  hard: "bg-rose-500/15 text-rose-300 border-rose-500/30",
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
}

const PRESET_SIMULATIONS: SimuladoCard[] = [
  {
    id: "preset-bio-10",
    kind: "preset",
    title: "Biologia • 10 questões",
    description:
      "Simulado curto para treinar genética, citologia, ecologia e fisiologia.",
    subject: "Biologia",
    subjects: ["Biologia"],
    difficulty: "easy",
    tags: ["ENEM", "Biologia", "Rápido"],
    questionCount: 10,
    duration: 20,
    timesCompleted: 0,
    rating: 4.8,
    author: "StudyPro",
    createdAt: "2026-04-26",
    mode: "balanced",
    payload: {
      exam_type: "enem",
      year: 2022,
      question_count: 10,
      subjects: ["Biologia"],
      mode: "balanced",
    },
  },
  {
    id: "preset-math-10",
    kind: "preset",
    title: "Matemática • 10 questões",
    description:
      "Treino rápido de matemática do ENEM com foco em interpretação e cálculo.",
    subject: "Matemática",
    subjects: ["Matemática"],
    difficulty: "easy",
    tags: ["ENEM", "Matemática", "Rápido"],
    questionCount: 10,
    duration: 20,
    timesCompleted: 0,
    rating: 4.8,
    author: "StudyPro",
    createdAt: "2026-04-26",
    mode: "balanced",
    payload: {
      exam_type: "enem",
      year: 2022,
      question_count: 10,
      subjects: ["Matemática"],
      mode: "balanced",
    },
  },
  {
    id: "preset-humanas-15",
    kind: "preset",
    title: "Ciências Humanas • 15 questões",
    description:
      "História, geografia, filosofia e sociologia em um treino intermediário.",
    subject: "Ciências Humanas",
    subjects: ["Ciências Humanas", "História", "Geografia"],
    difficulty: "medium",
    tags: ["ENEM", "Humanas", "Intermediário"],
    questionCount: 15,
    duration: 30,
    timesCompleted: 0,
    rating: 4.7,
    author: "StudyPro",
    createdAt: "2026-04-26",
    mode: "balanced",
    payload: {
      exam_type: "enem",
      year: 2022,
      question_count: 15,
      subjects: ["Ciências Humanas"],
      mode: "balanced",
    },
  },
  {
    id: "preset-natureza-15",
    kind: "preset",
    title: "Ciências da Natureza • 15 questões",
    description:
      "Treino combinado de biologia, física e química com perfil ENEM.",
    subject: "Ciências da Natureza",
    subjects: ["Ciências da Natureza", "Biologia", "Física", "Química"],
    difficulty: "medium",
    tags: ["ENEM", "Natureza", "Intermediário"],
    questionCount: 15,
    duration: 30,
    timesCompleted: 0,
    rating: 4.7,
    author: "StudyPro",
    createdAt: "2026-04-26",
    mode: "balanced",
    payload: {
      exam_type: "enem",
      year: 2022,
      question_count: 15,
      subjects: ["Ciências da Natureza"],
      mode: "balanced",
    },
  },
  {
    id: "preset-linguagens-12",
    kind: "preset",
    title: "Linguagens • 12 questões",
    description:
      "Questões para reforçar interpretação textual e leitura de linguagem do ENEM.",
    subject: "Linguagens",
    subjects: ["Linguagens", "Português"],
    difficulty: "medium",
    tags: ["ENEM", "Linguagens"],
    questionCount: 12,
    duration: 24,
    timesCompleted: 0,
    rating: 4.6,
    author: "StudyPro",
    createdAt: "2026-04-26",
    mode: "balanced",
    payload: {
      exam_type: "enem",
      year: 2022,
      question_count: 12,
      subjects: ["Linguagens"],
      mode: "balanced",
    },
  },
  {
    id: "preset-misto-20",
    kind: "preset",
    title: "Simulado Misto • 20 questões",
    description:
      "Treino balanceado com várias áreas para simular uma sessão real de prova.",
    subject: "Geral",
    subjects: ["Biologia", "Matemática", "Ciências Humanas", "Linguagens"],
    difficulty: "medium",
    tags: ["ENEM", "Misto", "Balanceado"],
    questionCount: 20,
    duration: 40,
    timesCompleted: 0,
    rating: 4.9,
    author: "StudyPro",
    createdAt: "2026-04-26",
    mode: "balanced",
    payload: {
      exam_type: "enem",
      year: 2022,
      question_count: 20,
      subjects: null,
      mode: "balanced",
    },
  },
  {
    id: "preset-math-hard-20",
    kind: "preset",
    title: "Matemática Intensivo • 20 questões",
    description:
      "Volume maior de matemática para ganhar ritmo e resistência de resolução.",
    subject: "Matemática",
    subjects: ["Matemática"],
    difficulty: "hard",
    tags: ["ENEM", "Matemática", "Intensivo"],
    questionCount: 20,
    duration: 45,
    timesCompleted: 0,
    rating: 4.8,
    author: "StudyPro",
    createdAt: "2026-04-26",
    mode: "random",
    payload: {
      exam_type: "enem",
      year: 2022,
      question_count: 20,
      subjects: ["Matemática"],
      mode: "random",
    },
  },
  {
    id: "preset-bio-hard-20",
    kind: "preset",
    title: "Biologia Intensivo • 20 questões",
    description:
      "Mais volume em biologia para consolidar assuntos recorrentes do ENEM.",
    subject: "Biologia",
    subjects: ["Biologia"],
    difficulty: "hard",
    tags: ["ENEM", "Biologia", "Intensivo"],
    questionCount: 20,
    duration: 45,
    timesCompleted: 0,
    rating: 4.8,
    author: "StudyPro",
    createdAt: "2026-04-26",
    mode: "random",
    payload: {
      exam_type: "enem",
      year: 2022,
      question_count: 20,
      subjects: ["Biologia"],
      mode: "random",
    },
  },
]

function formatCount(value: number) {
  return value.toLocaleString("pt-BR")
}

function normalizeSubject(subject?: string | null): string {
  if (!subject) return "Geral"

  const value = subject.trim().toLowerCase()

  if (value.includes("biolog")) return "Biologia"
  if (value.includes("mate")) return "Matemática"
  if (value.includes("fís") || value.includes("fis")) return "Física"
  if (value.includes("quí") || value.includes("qui")) return "Química"
  if (value.includes("hist")) return "História"
  if (value.includes("geog")) return "Geografia"
  if (value.includes("port")) return "Português"
  if (value.includes("ling")) return "Linguagens"
  if (value.includes("human")) return "Ciências Humanas"
  if (value.includes("nature")) return "Ciências da Natureza"

  return subject
}

function inferDifficultyFromScore(score: number): Difficulty {
  if (score >= 75) return "easy"
  if (score >= 45) return "medium"
  return "hard"
}

function groupHistoryByTitle(history: SimulationHistoryEntry[]) {
  const grouped = new Map<string, SimulationHistoryEntry[]>()

  for (const item of history) {
    const key = `${item.title}::${item.exam_type}::${item.year}`
    const bucket = grouped.get(key) ?? []
    bucket.push(item)
    grouped.set(key, bucket)
  }

  return grouped
}

function buildHistoryCards(history: SimulationHistoryEntry[]): SimuladoCard[] {
  const grouped = groupHistoryByTitle(history)
  const cards: SimuladoCard[] = []

  for (const [, items] of grouped) {
    const latest = [...items].sort(
      (a, b) =>
        new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()
    )[0]

    const subjects = Array.from(
      new Set(
        items
          .flatMap((item) => item.subjects_summary ?? [])
          .map((subject) => normalizeSubject(subject.subject))
          .filter(Boolean)
      )
    )

    const averageScore =
      items.reduce((acc, item) => acc + item.score_percentage, 0) / items.length

    cards.push({
      id: `history-${latest.id}`,
      kind: "history",
      title: latest.title,
      description: `Simulado já resolvido ${items.length} vez(es). Último resultado: ${latest.correct_answers} acerto(s), ${latest.wrong_answers} erro(s) e ${latest.unanswered_count} em branco.`,
      subject: subjects[0] ?? "Geral",
      subjects: subjects.length > 0 ? subjects : ["Geral"],
      difficulty: inferDifficultyFromScore(averageScore),
      tags: [
        latest.exam_type.toUpperCase(),
        latest.mode === "balanced" ? "Balanceado" : "Aleatório",
      ],
      questionCount: latest.total_questions,
      duration: Math.max(20, Math.round(latest.total_questions * 2.5)),
      timesCompleted: items.length,
      rating: Number(Math.max(0, Math.min(5, averageScore / 20)).toFixed(1)),
      author: "Seu histórico",
      createdAt: latest.saved_at,
      mode: latest.mode,
      href: "/dashboard/simulados/resultado",
    })
  }

  return cards
}

function buildPremiumOfferCards(): SimuladoCard[] {
  return [
    {
      id: "premium-natureza-25",
      kind: "premium_offer",
      title: "Natureza Premium • 25 questões",
      description:
        "Mais volume de treino em biologia, física e química com sessão ampliada.",
      subject: "Ciências da Natureza",
      subjects: ["Ciências da Natureza", "Biologia", "Física", "Química"],
      difficulty: "hard",
      tags: ["Premium", "Volume extra"],
      questionCount: 25,
      duration: 55,
      timesCompleted: 0,
      rating: 5,
      author: "StudyPro Pro",
      createdAt: "2026-04-26",
      mode: "balanced",
      href: "/pricing",
      isPremium: true,
    },
    {
      id: "premium-misto-30",
      kind: "premium_offer",
      title: "Misto Premium • 30 questões",
      description:
        "Sessão mais longa para simular constância e aumentar resistência de prova.",
      subject: "Geral",
      subjects: ["Biologia", "Matemática", "Ciências Humanas", "Linguagens"],
      difficulty: "hard",
      tags: ["Premium", "Resistência"],
      questionCount: 30,
      duration: 70,
      timesCompleted: 0,
      rating: 5,
      author: "StudyPro Pro",
      createdAt: "2026-04-26",
      mode: "balanced",
      href: "/pricing",
      isPremium: true,
    },
  ]
}

function FreeUsageCard({
  entitlement,
  loading,
}: {
  entitlement: SimulationEntitlementResponse | null
  loading: boolean
}) {
  const isPro = entitlement?.entitlements.is_pro ?? false
  const remaining = entitlement?.usage.remaining_today
  const dailyLimit = entitlement?.usage.daily_limit

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#081224] p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
          <Sparkles className="size-4 text-blue-300" />
        </div>
        <div>
          <p className="text-sm text-slate-400">Seu acesso hoje</p>
          <h3 className="text-lg font-semibold text-white">
            {loading
              ? "Carregando..."
              : isPro
              ? "Plano PRO ativo"
              : typeof remaining === "number" && typeof dailyLimit === "number"
              ? `${remaining} de ${dailyLimit} geração(ões) restantes`
              : "Plano Free"}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">
        {loading
          ? "Verificando status da sua conta."
          : isPro
          ? "Seu plano já está liberado para gerar mais simulados e estudar sem interrupções."
          : "Agora você tem vários simulados prontos para localizar e iniciar. O Pro amplia o volume de treino e reduz as travas do dia."}
      </p>

      {!isPro ? (
        <div className="mt-4">
          <Link
            href="/pricing"
            className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
          >
            Desbloquear Pro
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function PaywallCard() {
  return (
    <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-amber-500/15">
          <Lock className="size-4 text-amber-200" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">
            Paywall leve
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            O Pro existe para manter continuidade
          </h3>
          <p className="mt-3 text-sm leading-7 text-amber-100">
            No gratuito você já consegue começar com simulados prontos. No Pro
            você aumenta o volume, reduz interrupções e expande o treino.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/pricing"
              className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Ver plano Pro
            </Link>

            <Link
              href="/dashboard/provas/enem/2022"
              className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Resolver prova oficial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SimuladoActionButton({
  card,
  isPro,
  generatingId,
  onStart,
}: {
  card: SimuladoCard
  isPro: boolean
  generatingId: string | null
  onStart: (card: SimuladoCard) => void
}) {
  const isGenerating = generatingId === card.id
  const isLocked = card.isPremium && !isPro

  if (card.kind === "history") {
    return (
      <Link
        href={card.href || "/dashboard/simulados/resultado"}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
      >
        Ver último resultado
      </Link>
    )
  }

  if (isLocked) {
    return (
      <Link
        href={card.href || "/pricing"}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
      >
        Ver plano Pro
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onStart(card)}
      disabled={isGenerating}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#4b8df7] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isGenerating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Play className="size-4" />
      )}
      {isGenerating ? "Preparando..." : "Fazer agora"}
    </button>
  )
}

export default function SimuladosPage() {
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState("Todas")
  const [difficulty, setDifficulty] =
    useState<(typeof difficulties)[number]["value"]>("all")
  const [sort, setSort] =
    useState<(typeof sortOptions)[number]["value"]>("popular")

  const [cards, setCards] = useState<SimuladoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionError, setActionError] = useState("")
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const [entitlement, setEntitlement] =
    useState<SimulationEntitlementResponse | null>(null)
  const [loadingEntitlement, setLoadingEntitlement] = useState(true)

  useEffect(() => {
    async function loadEntitlement() {
      try {
        setLoadingEntitlement(true)
        const token = localStorage.getItem(AUTH_TOKEN_KEY)
        const data = await getSimulationEntitlement(token)
        setEntitlement(data)
      } catch {
        setEntitlement(null)
      } finally {
        setLoadingEntitlement(false)
      }
    }

    void loadEntitlement()
  }, [])

  useEffect(() => {
    function loadCards() {
      try {
        setLoading(true)
        setError("")

        const historyRaw = localStorage.getItem(SIMULATION_HISTORY_KEY)
        let history: SimulationHistoryEntry[] = []

        if (historyRaw) {
          try {
            const parsed = JSON.parse(historyRaw) as SimulationHistoryEntry[]
            if (Array.isArray(parsed)) {
              history = parsed
            }
          } catch {
            localStorage.removeItem(SIMULATION_HISTORY_KEY)
          }
        }

        const historyCards = buildHistoryCards(history)
        const premiumCards = buildPremiumOfferCards()

        setCards([...PRESET_SIMULATIONS, ...historyCards, ...premiumCards])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar o catálogo de simulados."
        )
      } finally {
        setLoading(false)
      }
    }

    loadCards()
  }, [])

  const isPro = entitlement?.entitlements.is_pro ?? false
  const canGenerate = entitlement?.usage.can_generate ?? true

  const availableSubjects = useMemo(() => {
    const values = Array.from(
      new Set(cards.flatMap((item) => item.subjects).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, "pt-BR"))

    return ["Todas", ...values]
  }, [cards])

  const filtered = useMemo(() => {
    return [...cards]
      .filter((sim) => {
        if (
          search &&
          !sim.title.toLowerCase().includes(search.toLowerCase()) &&
          !sim.description.toLowerCase().includes(search.toLowerCase())
        ) {
          return false
        }

        if (subject !== "Todas" && !sim.subjects.includes(subject)) {
          return false
        }

        if (difficulty !== "all" && sim.difficulty !== difficulty) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (sort === "popular") return b.timesCompleted - a.timesCompleted
        if (sort === "rating") return b.rating - a.rating
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [cards, difficulty, search, sort, subject])

  async function handleStartSimulation(card: SimuladoCard) {
    if (!card.payload) return

    if (!canGenerate && !isPro) {
      setActionError(
        "Você atingiu o limite diário do plano gratuito. Vá para o Pro ou tente novamente no próximo dia."
      )
      return
    }

    try {
      setActionError("")
      setGeneratingId(card.id)

      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      const simulation: RandomSimulationResponse = await generateRandomSimulation(
        card.payload,
        token
      )

      sessionStorage.setItem(ACTIVE_SIMULATION_KEY, JSON.stringify(simulation))
      sessionStorage.removeItem(ACTIVE_SIMULATION_ANSWERS_KEY)
      sessionStorage.removeItem(LAST_SIMULATION_RESULT_KEY)

      router.push("/dashboard/simulados/resolver")
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Não foi possível preparar este simulado agora."
      )
    } finally {
      setGeneratingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-500/10">
              <GraduationCap className="size-5 text-blue-300" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Simulados
              </h1>
              <p className="mt-2 text-xl text-[#7ea0d6]">
                Encontre simulados prontos, filtre por área e comece a resolver.
              </p>
            </div>
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
          >
            <Crown className="size-4" />
            Ver plano Pro
          </Link>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <FreeUsageCard
            entitlement={entitlement}
            loading={loadingEntitlement}
          />
          {!isPro ? <PaywallCard /> : null}
        </div>

        <div className="mt-8 rounded-[22px] border border-white/10 bg-[#0a1428] p-3">
          <div className="grid gap-3 xl:grid-cols-[1.35fr_0.5fr_0.45fr_0.5fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#6f8dbd]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar simulados..."
                className="h-14 w-full rounded-2xl border border-white/10 bg-[#081224] pl-12 pr-4 text-base text-white outline-none placeholder:text-[#6f8dbd] focus:border-[#2f7cff]/50"
              />
            </div>

            <div className="relative">
              <Filter className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white" />
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-[#081224] pl-14 pr-10 text-base font-medium text-white outline-none focus:border-[#2f7cff]/50"
              >
                {availableSubjects.map((item) => (
                  <option key={item} value={item} className="bg-[#081224]">
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value as (typeof difficulties)[number]["value"]
                  )
                }
                className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-[#081224] px-4 pr-10 text-base font-medium text-white outline-none focus:border-[#2f7cff]/50"
              >
                {difficulties.map((item) => (
                  <option key={item.value} value={item.value} className="bg-[#081224]">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <TrendingUp className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white" />
              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as (typeof sortOptions)[number]["value"])
                }
                className="h-14 w-full appearance-none rounded-2xl border border-white/10 bg-[#081224] pl-14 pr-10 text-base font-medium text-white outline-none focus:border-[#2f7cff]/50"
              >
                {sortOptions.map((item) => (
                  <option key={item.value} value={item.value} className="bg-[#081224]">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {actionError ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {actionError}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 flex items-center gap-3 text-lg text-[#7ea0d6]">
            <Loader2 className="size-5 animate-spin" />
            Carregando catálogo de simulados...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : (
          <>
            <p className="mt-6 text-lg text-[#7ea0d6]">
              {filtered.length} simulado(s) encontrado(s)
            </p>

            {filtered.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-[#081224] p-6 text-base text-[#7ea0d6]">
                Nenhum simulado encontrado com os filtros atuais.
              </div>
            ) : (
              <div className="mt-6 grid gap-5 xl:grid-cols-3">
                {filtered.map((sim) => {
                  const locked = sim.isPremium && !isPro

                  return (
                    <article
                      key={sim.id}
                      className={`rounded-[24px] border p-5 transition ${
                        locked
                          ? "border-amber-500/20 bg-amber-500/10 hover:border-amber-400/40"
                          : "border-white/10 bg-[#081224] hover:border-[#2f7cff]/40 hover:bg-[#0a1830]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="max-w-[85%] text-[19px] font-bold leading-tight text-white">
                          {sim.title}
                        </h3>

                        {sim.isPremium ? (
                          locked ? (
                            <Lock className="mt-1 size-5 text-amber-300" />
                          ) : (
                            <Crown className="mt-1 size-5 text-yellow-400" />
                          )
                        ) : null}
                      </div>

                      <p className="mt-4 line-clamp-3 min-h-[78px] text-lg leading-8 text-[#7ea0d6]">
                        {sim.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-medium ${difficultyColors[sim.difficulty]}`}
                        >
                          {difficultyLabels[sim.difficulty]}
                        </span>

                        {sim.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/15 bg-[#071225] px-3 py-1 text-sm font-medium text-white"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 border-t border-white/10 pt-4">
                        <div className="flex flex-wrap items-center gap-5 text-sm text-[#8ea6cc]">
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="size-4" />
                            {sim.questionCount}q
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-4" />
                            {sim.duration}min
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Users className="size-4" />
                            {formatCount(sim.timesCompleted)}
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-yellow-400">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            {sim.rating.toFixed(1)}
                          </span>
                        </div>

                        <p className="mt-4 text-base text-[#9db3d7]">
                          por <span className="font-medium text-white">{sim.author}</span>
                        </p>

                        {locked ? (
                          <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                            Disponível no Pro para aumentar seu volume de treino.
                          </div>
                        ) : null}

                        <div className="mt-5">
                          <SimuladoActionButton
                            card={sim}
                            isPro={isPro}
                            generatingId={generatingId}
                            onStart={handleStartSimulation}
                          />
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}