"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Layers3,
  RotateCcw,
} from "lucide-react"

type StudyTab = "flashcards" | "resumos" | "mapas"
type SubjectKey =
  | "todas"
  | "biologia"
  | "fisica"
  | "historia"
  | "quimica"
  | "portugues"
  | "geografia"
  | "matematica"
  | "geral"

type FlashcardDifficulty = "fÃ¡cil" | "mÃ©dio" | "difÃ­cil"

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

type FlashcardItem = {
  id: string
  subject: string
  subjectKey: SubjectKey
  difficulty: FlashcardDifficulty
  question: string
  answer: string
}

type SummaryItem = {
  id: string
  subject: string
  subjectKey: SubjectKey
  title: string
  time: string
  tags: string[]
  content: string[]
}

type MindMapItem = {
  id: string
  subject: string
  subjectKey: SubjectKey
  title: string
  subtitle: string
  branches: {
    label: string
    children: string[]
  }[]
}

const REVIEW_FLASHCARDS_KEY = "MinhAprovação_review_flashcards"
const REVIEW_SUMMARY_KEY = "MinhAprovação_review_summary"
const MASTERED_FLASHCARDS_KEY = "MinhAprovação_mastered_flashcards"

function normalizeSubjectKey(subject: string): SubjectKey {
  const value = subject.trim().toLowerCase()

  if (value.includes("biolog")) return "biologia"
  if (value.includes("fÃ­s") || value.includes("fis")) return "fisica"
  if (value.includes("hist")) return "historia"
  if (value.includes("quÃ­") || value.includes("qui")) return "quimica"
  if (value.includes("port")) return "portugues"
  if (value.includes("geog")) return "geografia"
  if (value.includes("mate")) return "matematica"

  return "geral"
}

function formatLocalDate(value?: string) {
  if (!value) return "Sem data"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function inferDifficulty(text: string): FlashcardDifficulty {
  const size = text.length
  if (size < 120) return "fÃ¡cil"
  if (size < 220) return "mÃ©dio"
  return "difÃ­cil"
}

function buildFlashcards(cards: ReviewCard[]): FlashcardItem[] {
  return cards.map((card) => ({
    id: card.id,
    subject: card.subject,
    subjectKey: normalizeSubjectKey(card.subject),
    difficulty: inferDifficulty(card.back),
    question: card.front,
    answer: card.back,
  }))
}

function buildSummaries(summary: ReviewSummaryPayload | null): SummaryItem[] {
  if (!summary) return []

  const generalSummary: SummaryItem = {
    id: "summary-geral",
    subject: "Geral",
    subjectKey: "geral",
    title: summary.title,
    time: "4 min",
    tags: ["RevisÃ£o", "Desempenho", "Plano de aÃ§Ã£o"],
    content: [summary.subtitle, summary.revisionSummary],
  }

  const weakestSummaries = summary.weakestSubjects.map((item, index) => ({
    id: `summary-${item.subject}-${index}`,
    subject: item.subject,
    subjectKey: normalizeSubjectKey(item.subject),
    title: `${item.subject} â€” foco de revisÃ£o`,
    time: "3 min",
    tags: [
      `${item.accuracy.toFixed(1)}%`,
      `${item.wrong} erro(s)`,
      `${item.blank} em branco`,
    ],
    content: [
      `Disciplina prioritÃ¡ria para revisÃ£o imediata: ${item.subject}.`,
      `VocÃª teve ${item.correct} acerto(s), ${item.wrong} erro(s) e ${item.blank} questÃ£o(Ãµes) em branco nesta disciplina.`,
      "Use os flashcards e um novo simulado direcionado para consolidar essa recuperaÃ§Ã£o.",
    ],
  }))

  return [generalSummary, ...weakestSummaries]
}

function buildMindMaps(summary: ReviewSummaryPayload | null): MindMapItem[] {
  if (!summary) return []

  return summary.weakestSubjects.map((item, index) => ({
    id: `mindmap-${item.subject}-${index}`,
    subject: item.subject,
    subjectKey: normalizeSubjectKey(item.subject),
    title: `${item.subject} â€” mapa mental de revisÃ£o`,
    subtitle: "3 ramificaÃ§Ãµes principais",
    branches: [
      {
        label: "DiagnÃ³stico",
        children: [
          `${item.accuracy.toFixed(1)}% de acurÃ¡cia`,
          `${item.wrong} erro(s)`,
          `${item.blank} em branco`,
        ],
      },
      {
        label: "PrÃ³ximo passo",
        children: [
          "Revisar conceitos centrais",
          "Refazer questÃµes similares",
          "Conferir alternativas incorretas",
        ],
      },
      {
        label: "ConsolidaÃ§Ã£o",
        children: [
          "Usar flashcards",
          "Gerar novo simulado focado",
          "Comparar evoluÃ§Ã£o no resultado seguinte",
        ],
      },
    ],
  }))
}

function StatCard({
  value,
  label,
  extra,
}: {
  value: string
  label: string
  extra?: React.ReactNode
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071224] p-6 text-center">
      <div className="text-5xl font-bold tracking-tight text-white">{value}</div>
      <div className="mt-3 text-2xl text-white/70">{label}</div>
      {extra ? <div className="mt-4">{extra}</div> : null}
    </article>
  )
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-[18px] border px-5 py-3 text-xl transition",
        active
          ? "border-[#4b8df7] bg-[#4b8df7] text-white"
          : "border-white/10 bg-transparent text-white/85 hover:border-[#2f66d0] hover:bg-[#09182f]",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/75">
      {children}
    </span>
  )
}

export function StudyArea() {
  const [tab, setTab] = useState<StudyTab>("flashcards")
  const [filter, setFilter] = useState<SubjectKey>("todas")
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedSummary, setSelectedSummary] = useState<SummaryItem | null>(null)
  const [selectedMindMap, setSelectedMindMap] = useState<MindMapItem | null>(null)
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([])
  const [summaries, setSummaries] = useState<SummaryItem[]>([])
  const [mindMaps, setMindMaps] = useState<MindMapItem[]>([])
  const [masteredIds, setMasteredIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const rawFlashcards = localStorage.getItem(REVIEW_FLASHCARDS_KEY)
      const rawSummary = localStorage.getItem(REVIEW_SUMMARY_KEY)
      const rawMastered = localStorage.getItem(MASTERED_FLASHCARDS_KEY)

      const parsedCards = rawFlashcards
        ? (JSON.parse(rawFlashcards) as ReviewCard[])
        : []
      const parsedSummary = rawSummary
        ? (JSON.parse(rawSummary) as ReviewSummaryPayload)
        : null
      const parsedMastered = rawMastered
        ? (JSON.parse(rawMastered) as string[])
        : []

      const nextFlashcards = Array.isArray(parsedCards)
        ? buildFlashcards(parsedCards)
        : []
      const nextSummaries = buildSummaries(parsedSummary)
      const nextMindMaps = buildMindMaps(parsedSummary)

      setFlashcards(nextFlashcards)
      setSummaries(nextSummaries)
      setMindMaps(nextMindMaps)
      setMasteredIds(Array.isArray(parsedMastered) ? parsedMastered : [])
    } catch {
      setFlashcards([])
      setSummaries([])
      setMindMaps([])
      setMasteredIds([])
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(MASTERED_FLASHCARDS_KEY, JSON.stringify(masteredIds))
  }, [masteredIds])

  const filters = useMemo(() => {
    const base = [{ key: "todas" as SubjectKey, label: "Todas" }]
    const subjects = new Set<SubjectKey>()

    flashcards.forEach((item) => subjects.add(item.subjectKey))
    summaries.forEach((item) => subjects.add(item.subjectKey))
    mindMaps.forEach((item) => subjects.add(item.subjectKey))

    const labels: Record<SubjectKey, string> = {
      todas: "Todas",
      biologia: "Biologia",
      fisica: "FÃ­sica",
      historia: "HistÃ³ria",
      quimica: "QuÃ­mica",
      portugues: "PortuguÃªs",
      geografia: "Geografia",
      matematica: "MatemÃ¡tica",
      geral: "Geral",
    }

    return [
      ...base,
      ...Array.from(subjects).map((key) => ({
        key,
        label: labels[key],
      })),
    ]
  }, [flashcards, summaries, mindMaps])

  const filteredFlashcards = useMemo(() => {
    if (filter === "todas") return flashcards
    return flashcards.filter((item) => item.subjectKey === filter)
  }, [filter, flashcards])

  const filteredSummaries = useMemo(() => {
    if (filter === "todas") return summaries
    return summaries.filter((item) => item.subjectKey === filter)
  }, [filter, summaries])

  const filteredMindMaps = useMemo(() => {
    if (filter === "todas") return mindMaps
    return mindMaps.filter((item) => item.subjectKey === filter)
  }, [filter, mindMaps])

  const currentFlashcard =
    filteredFlashcards[flashcardIndex] ?? filteredFlashcards[0] ?? null

  const masteredCount = useMemo(
    () => flashcards.filter((item) => masteredIds.includes(item.id)).length,
    [flashcards, masteredIds]
  )

  const pendingCount = Math.max(0, flashcards.length - masteredCount)
  const completion =
    flashcards.length > 0 ? Math.round((masteredCount / flashcards.length) * 100) : 0

  function resetFlashcards() {
    setFlashcardIndex(0)
    setShowAnswer(false)
  }

  function nextFlashcard() {
    if (!filteredFlashcards.length) return
    setShowAnswer(false)
    setFlashcardIndex((prev) =>
      prev + 1 >= filteredFlashcards.length ? 0 : prev + 1
    )
  }

  function prevFlashcard() {
    if (!filteredFlashcards.length) return
    setShowAnswer(false)
    setFlashcardIndex((prev) =>
      prev === 0 ? filteredFlashcards.length - 1 : prev - 1
    )
  }

  function markCurrentAsMastered() {
    if (!currentFlashcard) return
    setMasteredIds((current) =>
      current.includes(currentFlashcard.id)
        ? current
        : [...current, currentFlashcard.id]
    )
    nextFlashcard()
  }

  function handleFilterChange(nextFilter: SubjectKey) {
    setFilter(nextFilter)
    setFlashcardIndex(0)
    setShowAnswer(false)
    setSelectedSummary(null)
    setSelectedMindMap(null)
  }

  if (selectedSummary) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedSummary(null)}
          className="inline-flex items-center gap-2 text-lg font-medium text-white hover:text-[#79a6ff]"
        >
          <ChevronLeft className="size-5" />
          Voltar
        </button>

        <section className="rounded-[32px] border border-white/10 bg-[#071224] p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <Pill>{selectedSummary.subject}</Pill>
            <Pill>{selectedSummary.time} de leitura</Pill>
          </div>

          <h2 className="mt-5 text-4xl font-bold tracking-tight text-white">
            {selectedSummary.title}
          </h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {selectedSummary.tags.map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>

          <div className="mt-8 space-y-5">
            <h3 className="text-2xl font-semibold text-white">Resumo</h3>
            {selectedSummary.content.map((paragraph, index) => (
              <p
                key={`${selectedSummary.id}-${index}`}
                className="text-lg leading-8 text-white/80"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (selectedMindMap) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedMindMap(null)}
          className="inline-flex items-center gap-2 text-lg font-medium text-white hover:text-[#79a6ff]"
        >
          <ChevronLeft className="size-5" />
          Voltar
        </button>

        <section className="rounded-[32px] border border-white/10 bg-[#071224] p-8">
          <Pill>{selectedMindMap.subject}</Pill>

          <h2 className="mt-5 text-4xl font-bold tracking-tight text-white">
            {selectedMindMap.title}
          </h2>

          <p className="mt-3 text-lg text-white/65">{selectedMindMap.subtitle}</p>

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            {selectedMindMap.branches.map((branch) => (
              <article
                key={branch.label}
                className="rounded-[24px] border border-white/10 bg-[#0a1830] p-6"
              >
                <h3 className="text-xl font-semibold text-white">{branch.label}</h3>

                <div className="mt-5 space-y-3">
                  {branch.children.map((child) => (
                    <div
                      key={child}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white/80"
                    >
                      {child}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#061120] p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-500/10">
            <Brain className="size-8 text-[#4b8df7]" />
          </div>

          <div>
            <h1 className="text-5xl font-bold tracking-tight text-white">
              Ãrea de Estudo
            </h1>
            <p className="mt-4 text-2xl text-white/60">
              Flashcards, resumos inteligentes e mapas mentais para acelerar seu aprendizado
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-8 border-b border-white/10">
          <button
            type="button"
            onClick={() => setTab("flashcards")}
            className={`relative flex items-center gap-2 pb-4 text-lg font-medium ${
              tab === "flashcards" ? "text-[#4b8df7]" : "text-white/60"
            }`}
          >
            <Layers3 className="size-5" />
            Flashcards
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-sm text-white">
              {flashcards.length}
            </span>
            {tab === "flashcards" ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#4b8df7]" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setTab("resumos")}
            className={`relative flex items-center gap-2 pb-4 text-lg font-medium ${
              tab === "resumos" ? "text-[#4b8df7]" : "text-white/60"
            }`}
          >
            <FileText className="size-5" />
            Resumos
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-sm text-white">
              {summaries.length}
            </span>
            {tab === "resumos" ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#4b8df7]" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setTab("mapas")}
            className={`relative flex items-center gap-2 pb-4 text-lg font-medium ${
              tab === "mapas" ? "text-[#4b8df7]" : "text-white/60"
            }`}
          >
            <Brain className="size-5" />
            Mapas Mentais
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-sm text-white">
              {mindMaps.length}
            </span>
            {tab === "mapas" ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#4b8df7]" />
            ) : null}
          </button>
        </div>

        {tab === "flashcards" ? (
          <>
            <div className="mt-8 grid gap-4 xl:grid-cols-4">
              <StatCard value={String(flashcards.length)} label="Total" />
              <StatCard value={String(masteredCount)} label="Dominados" />
              <StatCard value={String(pendingCount)} label="Pendentes" />
              <StatCard
                value={`${completion}%`}
                label="completo"
                extra={
                  <div className="mx-auto h-3 w-40 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#4b8df7]"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                }
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {filters.map((item) => (
                <FilterChip
                  key={item.key}
                  active={filter === item.key}
                  onClick={() => handleFilterChange(item.key)}
                >
                  {item.label}
                </FilterChip>
              ))}
            </div>

            <div className="mt-8 rounded-[32px] border border-white/10 bg-[#071224] p-8">
              <button
                type="button"
                onClick={() => setShowAnswer((prev) => !prev)}
                className="w-full rounded-[28px] border border-white/10 bg-[#0a1830] p-8 text-left transition hover:border-[#2f66d0] hover:bg-[#09182f]"
              >
                {currentFlashcard ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Pill>{currentFlashcard.subject}</Pill>
                        <Pill>{currentFlashcard.difficulty}</Pill>
                      </div>

                      <div className="inline-flex items-center gap-2 text-white/60">
                        <Eye className="size-4" />
                        {showAnswer ? "Ocultar resposta" : "Mostrar resposta"}
                      </div>
                    </div>

                    <h3 className="mt-8 text-3xl font-semibold leading-tight text-white">
                      {showAnswer
                        ? currentFlashcard.answer
                        : currentFlashcard.question}
                    </h3>

                    <p className="mt-6 text-lg text-white/55">
                      {showAnswer
                        ? "Clique para voltar Ã  pergunta"
                        : "Clique para ver a resposta"}
                    </p>
                  </>
                ) : (
                  <div className="py-10 text-center text-xl text-white/60">
                    Nenhum flashcard encontrado para este filtro.
                  </div>
                )}
              </button>

              {currentFlashcard ? (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-4">
                    <button
                      type="button"
                      onClick={prevFlashcard}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:bg-white/10"
                    >
                      <ChevronLeft className="size-5" />
                    </button>

                    <span className="text-lg text-white/65">
                      {flashcardIndex + 1} / {filteredFlashcards.length}
                    </span>

                    <button
                      type="button"
                      onClick={nextFlashcard}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white transition hover:bg-white/10"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={markCurrentAsMastered}
                      className="rounded-2xl bg-[#4b8df7] px-5 py-3 text-lg font-medium text-white transition hover:opacity-90"
                    >
                      Dominei!
                    </button>

                    <button
                      type="button"
                      onClick={resetFlashcards}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-lg font-medium text-white transition hover:bg-white/10"
                    >
                      <RotateCcw className="size-4" />
                      RecomeÃ§ar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {tab === "resumos" ? (
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {filteredSummaries.map((summary) => (
              <button
                key={summary.id}
                type="button"
                onClick={() => setSelectedSummary(summary)}
                className="rounded-[24px] border border-white/10 bg-[#071224] p-6 text-left transition hover:border-[#2f66d0] hover:bg-[#09182f]"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Pill>{summary.subject}</Pill>
                  <Pill>{summary.time}</Pill>
                  <Pill>{formatLocalDate(undefined)}</Pill>
                </div>

                <h3 className="mt-5 text-2xl font-semibold text-white">
                  {summary.title}
                </h3>

                <div className="mt-4 flex flex-wrap gap-2">
                  {summary.tags.map((tag) => (
                    <Pill key={tag}>{tag}</Pill>
                  ))}
                </div>
              </button>
            ))}

            {filteredSummaries.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#071224] p-8 text-lg text-white/60">
                Nenhum resumo disponÃ­vel para este filtro.
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "mapas" ? (
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            {filteredMindMaps.map((map) => (
              <button
                key={map.id}
                type="button"
                onClick={() => setSelectedMindMap(map)}
                className="rounded-[24px] border border-white/10 bg-[#071224] p-6 text-left transition hover:border-[#2f66d0] hover:bg-[#09182f]"
              >
                <Pill>{map.subject}</Pill>

                <h3 className="mt-5 text-2xl font-semibold text-white">
                  {map.title}
                </h3>

                <div className="mt-2 text-lg text-white/60">{map.subtitle}</div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {map.branches.map((branch) => (
                    <Pill key={branch.label}>{branch.label}</Pill>
                  ))}
                </div>
              </button>
            ))}

            {filteredMindMaps.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#071224] p-8 text-lg text-white/60">
                Nenhum mapa mental disponÃ­vel para este filtro.
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}
