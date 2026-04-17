"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  BookOpen,
  Clock,
  Crown,
  Filter,
  Loader2,
  Search,
  Star,
  TrendingUp,
  Users,
} from "lucide-react"

import {
  getExamByTypeAndYear,
  getExamTypes,
  type ExamDetail,
} from "@/lib/api"

type Difficulty = "easy" | "medium" | "hard"
type CardKind = "official_exam" | "generated_simulation"

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
  isPremium?: boolean
  href: string
}

const SIMULATION_HISTORY_KEY = "studypro_simulation_history"

const subjects = [
  "Todas",
  "Biologia",
  "Matemática",
  "Física",
  "Química",
  "História",
  "Geografia",
  "Português",
]

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

  return subject
}

function inferDifficultyFromQuestionCount(questionCount: number): Difficulty {
  if (questionCount <= 10) return "easy"
  if (questionCount <= 20) return "medium"
  return "hard"
}

function inferDifficultyFromScore(score: number): Difficulty {
  if (score >= 75) return "easy"
  if (score >= 45) return "medium"
  return "hard"
}

function buildOfficialCard(detail: ExamDetail): SimuladoCard {
  const normalizedType = detail.exam_type.toUpperCase()
  const year = detail.year
  const questionCount = detail.question_count
  const primarySubject = "Biologia"

  return {
    id: `official-${detail.exam_type}-${detail.year}`,
    kind: "official_exam",
    title: `${normalizedType} ${year} — Prova Oficial`,
    description:
      detail.description ||
      `Prova oficial completa de ${normalizedType} ${year} para resolução e revisão.`,
    subject: primarySubject,
    subjects: ["Biologia", "Física", "Química", "Matemática", "Português"],
    difficulty: inferDifficultyFromQuestionCount(questionCount),
    tags: [normalizedType, "Oficial"],
    questionCount,
    duration: Math.max(30, Math.round(questionCount * 1.5)),
    timesCompleted: 1,
    rating: 5,
    author: "Base oficial",
    createdAt: `${year}-01-01`,
    href: `/dashboard/provas/${detail.exam_type}/${detail.year}`,
  }
}

function buildHistoryCard(item: SimulationHistoryEntry): SimuladoCard {
  const sortedSubjects = [...item.subjects_summary].sort(
    (a, b) => b.total - a.total
  )
  const primarySubject = normalizeSubject(sortedSubjects[0]?.subject || "Geral")
  const subjectsUsed = sortedSubjects
    .slice(0, 3)
    .map((subject) => normalizeSubject(subject.subject))

  return {
    id: `history-${item.id}`,
    kind: "generated_simulation",
    title: item.title,
    description: `Simulado já resolvido com ${item.correct_answers} acerto(s), ${item.wrong_answers} erro(s) e ${item.unanswered_count} em branco.`,
    subject: primarySubject,
    subjects: subjectsUsed.length > 0 ? subjectsUsed : [primarySubject],
    difficulty: inferDifficultyFromScore(item.score_percentage),
    tags: [
      item.exam_type.toUpperCase(),
      item.mode === "balanced" ? "Balanceado" : "Aleatório",
    ],
    questionCount: item.total_questions,
    duration: Math.max(20, Math.round(item.total_questions * 2.5)),
    timesCompleted: 1,
    rating: Number((Math.max(1, item.score_percentage / 20)).toFixed(1)),
    author: "Seu histórico",
    createdAt: item.saved_at,
    href: "/dashboard/simulados/resultado",
  }
}

export default function SimuladosPage() {
  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState("Todas")
  const [difficulty, setDifficulty] =
    useState<(typeof difficulties)[number]["value"]>("all")
  const [sort, setSort] =
    useState<(typeof sortOptions)[number]["value"]>("popular")

  const [cards, setCards] = useState<SimuladoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadRealCards() {
      try {
        setLoading(true)
        setError("")

        const [types, localHistoryRaw] = await Promise.all([
          getExamTypes(),
          Promise.resolve(localStorage.getItem(SIMULATION_HISTORY_KEY)),
        ])

        const officialCandidates = types.filter(
          (item) =>
            String(item.type).toLowerCase() === "enem" &&
            Number(item.year) === 2022
        )

        const officialCards: SimuladoCard[] = []

        for (const candidate of officialCandidates) {
          try {
            const detail = await getExamByTypeAndYear(
              String(candidate.type),
              Number(candidate.year)
            )
            officialCards.push(buildOfficialCard(detail))
          } catch {
            // ignora falha individual e segue com o restante
          }
        }

        let historyCards: SimuladoCard[] = []

        if (localHistoryRaw) {
          try {
            const parsed = JSON.parse(localHistoryRaw) as SimulationHistoryEntry[]
            if (Array.isArray(parsed)) {
              historyCards = parsed.map(buildHistoryCard)
            }
          } catch {
            localStorage.removeItem(SIMULATION_HISTORY_KEY)
          }
        }

        const merged = [...officialCards, ...historyCards]
        setCards(merged)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os simulados."
        )
      } finally {
        setLoading(false)
      }
    }

    void loadRealCards()
  }, [])

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

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.45)]">
        <h1 className="text-4xl font-bold tracking-tight text-white">Simulados</h1>
        <p className="mt-2 text-xl text-[#7ea0d6]">
          Treine com simulados reais e acompanhe sua evolução
        </p>

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
                {subjects.map((item) => (
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
                  setDifficulty(e.target.value as (typeof difficulties)[number]["value"])
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

        {loading ? (
          <div className="mt-6 flex items-center gap-3 text-lg text-[#7ea0d6]">
            <Loader2 className="size-5 animate-spin" />
            Carregando simulados reais...
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : (
          <>
            <p className="mt-6 text-lg text-[#7ea0d6]">
              {filtered.length} simulados encontrados
            </p>

            {filtered.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-white/10 bg-[#081224] p-6 text-base text-[#7ea0d6]">
                Nenhum simulado encontrado com os filtros atuais.
              </div>
            ) : (
              <div className="mt-6 grid gap-5 xl:grid-cols-3">
                {filtered.map((sim) => (
                  <Link
                    key={sim.id}
                    href={sim.href}
                    className="group rounded-[24px] border border-white/10 bg-[#081224] p-5 transition hover:border-[#2f7cff]/40 hover:bg-[#0a1830]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="max-w-[85%] text-[19px] font-bold leading-tight text-white">
                        {sim.title}
                      </h3>

                      {sim.isPremium ? (
                        <Crown className="mt-1 size-5 text-yellow-400" />
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
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}