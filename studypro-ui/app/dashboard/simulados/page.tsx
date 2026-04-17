"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  BookOpen,
  Clock,
  Crown,
  Filter,
  Search,
  Star,
  TrendingUp,
  Users,
} from "lucide-react"

type Difficulty = "easy" | "medium" | "hard"

type SimuladoItem = {
  id: string
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
  href?: string
}

const simulados: SimuladoItem[] = [
  {
    id: "enem-matematica-tecnologias",
    title: "ENEM — Matemática e suas Tecnologias",
    description:
      "45 questões no padrão ENEM para treinar matemática completa.",
    subject: "Matemática",
    subjects: ["Matemática"],
    difficulty: "easy",
    tags: ["ENEM", "Matemática"],
    questionCount: 10,
    duration: 25,
    timesCompleted: 4521,
    rating: 4.3,
    author: "Maria Clara",
    createdAt: "2026-04-01",
    href: "/dashboard/simulados",
  },
  {
    id: "fisica-mecanica-termodinamica",
    title: "Física — Mecânica e Termodinâmica",
    description:
      "Questões selecionadas de mecânica e termodinâmica para vestibulares.",
    subject: "Física",
    subjects: ["Física"],
    difficulty: "medium",
    tags: ["Física", "Mecânica"],
    questionCount: 10,
    duration: 35,
    timesCompleted: 2103,
    rating: 4.5,
    author: "João Pedro",
    createdAt: "2026-04-05",
    href: "/dashboard/simulados",
  },
  {
    id: "enem-2024-ciencias-natureza",
    title: "ENEM 2024 — Ciências da Natureza",
    description:
      "Simulado completo baseado no padrão ENEM com questões de Biologia, Química e Física.",
    subject: "Biologia",
    subjects: ["Biologia", "Física", "Química"],
    difficulty: "medium",
    tags: ["ENEM", "Ciências"],
    questionCount: 10,
    duration: 30,
    timesCompleted: 1847,
    rating: 4.7,
    author: "Prof. Ana Silva",
    createdAt: "2026-04-08",
    href: "/dashboard/provas/enem/2022",
  },
  {
    id: "matematica-fuvest-funcoes-geometria",
    title: "Matemática FUVEST — Funções e Geometria",
    description:
      "Simulado focado nos temas mais cobrados pela FUVEST em Matemática.",
    subject: "Matemática",
    subjects: ["Matemática"],
    difficulty: "hard",
    tags: ["FUVEST", "Matemática"],
    questionCount: 10,
    duration: 45,
    timesCompleted: 956,
    rating: 4.9,
    author: "Prof. Carlos Mendes",
    createdAt: "2026-04-12",
    isPremium: true,
    href: "/dashboard/simulados",
  },
  {
    id: "biologia-genetica-evolucao",
    title: "Biologia — Genética e Evolução",
    description:
      "Simulado aprofundado em genética mendeliana, molecular e evolução.",
    subject: "Biologia",
    subjects: ["Biologia"],
    difficulty: "hard",
    tags: ["Biologia", "Genética"],
    questionCount: 10,
    duration: 40,
    timesCompleted: 723,
    rating: 4.8,
    author: "Prof. Ana Silva",
    createdAt: "2026-04-15",
    isPremium: true,
    href: "/dashboard/simulados",
  },
  {
    id: "fisica-unicamp-eletromagnetismo",
    title: "Física UNICAMP — Eletromagnetismo",
    description:
      "Simulado de alta dificuldade focado em eletromagnetismo para UNICAMP.",
    subject: "Física",
    subjects: ["Física"],
    difficulty: "hard",
    tags: ["UNICAMP", "Física"],
    questionCount: 10,
    duration: 50,
    timesCompleted: 412,
    rating: 4.6,
    author: "Prof. Ricardo Lima",
    createdAt: "2026-04-18",
    isPremium: true,
    href: "/dashboard/simulados",
  },
]

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

export default function SimuladosPage() {
  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState("Todas")
  const [difficulty, setDifficulty] =
    useState<(typeof difficulties)[number]["value"]>("all")
  const [sort, setSort] =
    useState<(typeof sortOptions)[number]["value"]>("popular")

  const filtered = useMemo(() => {
    return [...simulados]
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
  }, [difficulty, search, sort, subject])

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

        <p className="mt-6 text-lg text-[#7ea0d6]">
          {filtered.length} simulados encontrados
        </p>

        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          {filtered.map((sim) => {
            const href = sim.href ?? "/dashboard/simulados"

            return (
              <Link
                key={sim.id}
                href={href}
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
            )
          })}
        </div>
      </section>
    </div>
  )
}