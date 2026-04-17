"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleX,
  ClipboardList,
  GraduationCap,
  Layers3,
  RotateCcw,
  Sparkles,
} from "lucide-react"

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

type StoredSimulationResult = {
  simulation: SimulationGenerationResponse
  answers: Record<number, string>
  result: SimulationSubmissionResponse
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
  subjects_summary: SimulationSubmissionResponse["subjects_summary"]
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

const ACTIVE_SIMULATION_KEY = "studypro_active_simulation"
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers"
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result"
const SIMULATION_HISTORY_KEY = "studypro_simulation_history"
const REVIEW_FLASHCARDS_KEY = "studypro_review_flashcards"
const REVIEW_SUMMARY_KEY = "studypro_review_summary"
const MAX_HISTORY_ITEMS = 20

export default function ResultadoSimuladoPage() {
  const router = useRouter()

  const [payload, setPayload] = useState<StoredSimulationResult | null>(null)
  const [history, setHistory] = useState<SimulationHistoryEntry[]>([])
  const [loadError, setLoadError] = useState("")
  const [historySaved, setHistorySaved] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_SIMULATION_RESULT_KEY)

      if (!raw) {
        setLoadError("Nenhum resultado recente foi encontrado nesta sessão.")
        return
      }

      const parsed = JSON.parse(raw) as StoredSimulationResult
      setPayload(parsed)
    } catch {
      setLoadError("Não foi possível carregar o resultado do simulado.")
    }
  }, [])

  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem(SIMULATION_HISTORY_KEY)
      if (!rawHistory) {
        setHistory([])
        return
      }

      const parsedHistory = JSON.parse(rawHistory) as SimulationHistoryEntry[]
      if (Array.isArray(parsedHistory)) {
        setHistory(parsedHistory)
      } else {
        setHistory([])
      }
    } catch {
      setHistory([])
    }
  }, [])

  useEffect(() => {
    if (!payload || historySaved) return

    const entry: SimulationHistoryEntry = {
      id: payload.simulation.simulation_id,
      saved_at: new Date().toISOString(),
      title: payload.result.title,
      exam_type: payload.result.exam_type,
      year: payload.result.year,
      mode: payload.simulation.mode,
      total_questions: payload.result.total_questions,
      correct_answers: payload.result.correct_answers,
      wrong_answers: payload.result.wrong_answers,
      unanswered_count: payload.result.unanswered_count,
      score_percentage: payload.result.score_percentage,
      subjects_summary: payload.result.subjects_summary,
    }

    try {
      const rawHistory = localStorage.getItem(SIMULATION_HISTORY_KEY)
      const currentHistory = rawHistory
        ? (JSON.parse(rawHistory) as SimulationHistoryEntry[])
        : []

      const deduped = currentHistory.filter((item) => item.id !== entry.id)
      const nextHistory = [entry, ...deduped].slice(0, MAX_HISTORY_ITEMS)

      localStorage.setItem(SIMULATION_HISTORY_KEY, JSON.stringify(nextHistory))
      setHistory(nextHistory)
      setHistorySaved(true)
    } catch {
      setHistorySaved(true)
    }
  }, [historySaved, payload])

  const simulation = payload?.simulation ?? null
  const result = payload?.result ?? null

  const questionMap = useMemo(() => {
    const map = new Map<number, SimulationQuestion>()
    simulation?.questions.forEach((question) => {
      map.set(question.number, question)
    })
    return map
  }, [simulation])

  const weakestSubjects = useMemo(() => {
    if (!result) return []
    return [...result.subjects_summary]
      .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)
      .slice(0, 3)
  }, [result])

  const weakestSubjectsText = useMemo(() => {
    if (weakestSubjects.length === 0) return "não identificadas"
    return weakestSubjects.map((item) => item.subject).join(", ")
  }, [weakestSubjects])

  const reviewCards = useMemo<ReviewCard[]>(() => {
    if (!result) return []

    return result.results_by_question
      .filter((entry) => entry.status !== "correct")
      .slice(0, 8)
      .map((entry) => {
        const question = questionMap.get(entry.question_number)
        const correctOptionText =
          question?.options?.[entry.correct_answer] ?? "Resposta correta indisponível"

        return {
          id: `${entry.question_number}-${entry.status}`,
          subject: entry.subject,
          questionNumber: entry.question_number,
          front: `Questão ${entry.question_number} • ${entry.subject}: qual alternativa correta e por que sua escolha precisa ser revista?`,
          back: `Resposta correta: ${entry.correct_answer} — ${correctOptionText}. ${
            entry.user_answer
              ? `Sua resposta foi ${entry.user_answer}.`
              : "A questão ficou em branco."
          } Revise o enunciado, as alternativas e o conteúdo-base dessa disciplina.`,
        }
      })
  }, [questionMap, result])

  useEffect(() => {
    if (reviewCards.length === 0) return
    localStorage.setItem(REVIEW_FLASHCARDS_KEY, JSON.stringify(reviewCards))
  }, [reviewCards])

  const revisionSummary = useMemo(() => {
    if (!result) return null

    if (result.correct_answers === result.valid_questions && result.valid_questions > 0) {
      return "Excelente resultado. Seu próximo foco deve ser manutenção de desempenho com novos simulados e revisão leve dos tópicos."
    }

    if (weakestSubjects.length === 0) {
      return "Seu resultado já está disponível. Priorize revisar as questões incorretas antes de iniciar um novo simulado."
    }

    const subjectNames = weakestSubjects.map((item) => item.subject).join(", ")
    return `Priorize revisão em ${subjectNames}. O melhor próximo passo é revisar erros, refazer questões semelhantes e gerar um novo treino direcionado.`
  }, [result, weakestSubjects])

  useEffect(() => {
    if (!result || !revisionSummary) return

    const summaryPayload: ReviewSummaryPayload = {
      title: `${result.title} — Resumo de revisão`,
      subtitle: `Resumo gerado a partir do desempenho do ${result.exam_type.toUpperCase()} ${result.year}.`,
      revisionSummary,
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
  }, [result, revisionSummary, weakestSubjects])

  const summaryPrompt = useMemo(() => {
    if (!result) return ""
    return `Gere um resumo de revisão com base no meu último simulado do ${result.exam_type.toUpperCase()} ${result.year}. Tive ${result.score_percentage.toFixed(
      1
    )}% de aproveitamento, ${result.correct_answers} acertos, ${result.wrong_answers} erros e ${result.unanswered_count} em branco. Minhas principais disciplinas para revisar são: ${weakestSubjectsText}.`
  }, [result, weakestSubjectsText])

  const flashcardsPrompt = useMemo(() => {
    if (!result) return ""
    return `Gere flashcards de revisão com base no meu último simulado do ${result.exam_type.toUpperCase()} ${result.year}. Tive ${result.score_percentage.toFixed(
      1
    )}% de aproveitamento. Foque principalmente nas disciplinas: ${weakestSubjectsText}. Considere meus erros e questões em branco como prioridade.`
  }, [result, weakestSubjectsText])

  function handleNewSimulation() {
    sessionStorage.removeItem(ACTIVE_SIMULATION_KEY)
    sessionStorage.removeItem(ACTIVE_SIMULATION_ANSWERS_KEY)
    sessionStorage.removeItem(LAST_SIMULATION_RESULT_KEY)
    router.push("/dashboard/simulados")
  }

  function handleClearHistory() {
    localStorage.removeItem(SIMULATION_HISTORY_KEY)
    setHistory([])
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-rose-500/20 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-white">
            Resultado não encontrado
          </h1>
          <p className="mt-3 text-sm text-rose-100">{loadError}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard/simulados"
              className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Voltar para simulados
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir para o dashboard
            </Link>
          </div>
        </section>
      </div>
    )
  }

  if (!simulation || !result) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#071225] p-6 text-sm text-slate-300">
        Carregando resultado...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <BarChart3 className="size-4" />
              Resultado do simulado
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              {result.title}
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              Confira seu desempenho geral, por disciplina e por questão.
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
              <Badge>{result.exam_type.toUpperCase()}</Badge>
              <Badge>{String(result.year)}</Badge>
              <Badge>{result.total_questions} questões</Badge>
              <Badge>
                {simulation.mode === "balanced" ? "Balanceado" : "Aleatório"}
              </Badge>
            </div>
          </div>

          <div className="w-full xl:max-w-[360px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Aproveitamento</p>
              <div className="mt-2 text-4xl font-bold text-white">
                {result.score_percentage.toFixed(1)}%
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#071225]">
                <div
                  className="h-full rounded-full bg-[#2f7cff]"
                  style={{ width: `${Math.max(0, Math.min(100, result.score_percentage))}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-300">
                {result.correct_answers} acerto(s) em {result.valid_questions} questão(ões) válidas
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              <GraduationCap className="size-4" />
              Continuidade de estudo
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white">
              Sua revisão já está pronta na Área de Estudo
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Flashcards, resumos e mapa de revisão já foram preparados a partir deste resultado.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <Link
              href="/dashboard/estudo"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Ir para Área de Estudo
            </Link>

            <Link
              href="/dashboard/flashcards"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Abrir flashcards
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Acertos"
          value={String(result.correct_answers)}
          tone="success"
        />
        <StatCard
          label="Erros"
          value={String(result.wrong_answers)}
          tone="danger"
        />
        <StatCard
          label="Em branco"
          value={String(result.unanswered_count)}
          tone="neutral"
        />
        <StatCard
          label="Anuladas"
          value={String(result.annulled_count)}
          tone="neutral"
        />
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Sparkles className="size-4" />
              Revisão com IA
            </div>

            <h2 className="mt-4 text-2xl font-semibold text-white">
              Transforme este resultado em material de estudo
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use o chat para gerar um resumo ou flashcards com base no seu desempenho.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <Link
              href={`/dashboard/chat?autorun=1&prompt=${encodeURIComponent(summaryPrompt)}`}
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Gerar resumo com IA
            </Link>

            <Link
              href={`/dashboard/chat?autorun=1&prompt=${encodeURIComponent(flashcardsPrompt)}`}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Gerar flashcards com IA
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
              <ClipboardList className="size-5 text-blue-300" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">
                Desempenho por disciplina
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Veja onde foi melhor e onde precisa revisar.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {result.subjects_summary.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm text-slate-300">
                Não houve resumo por disciplina disponível.
              </div>
            ) : (
              result.subjects_summary.map((subject) => (
                <div
                  key={subject.subject}
                  className="rounded-[24px] border border-white/10 bg-[#020b18] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {subject.subject}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {subject.correct} acerto(s), {subject.wrong} erro(s), {subject.blank} em branco
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {subject.accuracy_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">
                        {subject.total} questão(ões)
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#071225]">
                    <div
                      className="h-full rounded-full bg-[#2f7cff]"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, subject.accuracy_percentage)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Últimos resultados
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Histórico local salvo neste navegador.
              </p>
            </div>

            {history.length > 0 ? (
              <button
                type="button"
                onClick={handleClearHistory}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Limpar histórico
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            {history.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm text-slate-300">
                Ainda não há histórico salvo localmente.
              </div>
            ) : (
              history.map((entry) => (
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
                        {formatLocalDate(entry.saved_at)} • {entry.total_questions} questões •{" "}
                        {entry.mode === "balanced" ? "Balanceado" : "Aleatório"}
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
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                <BookOpen className="size-5 text-blue-300" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Resumo de revisão
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Direção prática para o próximo estudo.
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
            {revisionSummary}
          </div>

          <div className="mt-6 space-y-4">
            {weakestSubjects.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm text-slate-300">
                Não houve disciplinas suficientes para destacar prioridade.
              </div>
            ) : (
              weakestSubjects.map((subject, index) => (
                <div
                  key={`${subject.subject}-${index}`}
                  className="rounded-[24px] border border-white/10 bg-[#020b18] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {index + 1}. {subject.subject}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {subject.correct} acerto(s), {subject.wrong} erro(s), {subject.blank} em branco
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {subject.accuracy_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-slate-400">acurácia</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                <Layers3 className="size-5 text-blue-300" />
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Flashcards automáticos
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Gerados localmente com base nos erros e questões em branco.
                </p>
              </div>
            </div>

            {reviewCards.length > 0 ? (
              <Link
                href="/dashboard/flashcards"
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
              >
                Abrir flashcards
              </Link>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            {reviewCards.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm text-slate-300">
                Nenhum flashcard foi necessário. Seu resultado foi totalmente correto nas questões válidas.
              </div>
            ) : (
              reviewCards.slice(0, 3).map((card) => (
                <div
                  key={card.id}
                  className="rounded-[24px] border border-white/10 bg-[#020b18] p-5"
                >
                  <div className="text-sm font-medium text-blue-300">
                    {card.subject} • Questão {card.questionNumber}
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">
                    Frente
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {card.front}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
        <h2 className="text-2xl font-semibold text-white">
          Correção por questão
        </h2>

        <div className="mt-6 space-y-4">
          {result.results_by_question.map((entry) => {
            const question = questionMap.get(entry.question_number)
            const selectedOption =
              entry.user_answer && question?.options?.[entry.user_answer]
                ? question.options[entry.user_answer]
                : null
            const correctOption =
              question?.options?.[entry.correct_answer] ?? null

            return (
              <div
                key={entry.question_number}
                className="rounded-[24px] border border-white/10 bg-[#020b18] p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">
                        Questão {entry.question_number}
                      </span>
                      <StatusBadge status={entry.status} />
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {entry.subject}
                    </p>

                    {question?.statement ? (
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {question.statement}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <AnswerBox
                    label="Sua resposta"
                    value={
                      entry.user_answer
                        ? `${entry.user_answer}${selectedOption ? ` — ${selectedOption}` : ""}`
                        : "Em branco"
                    }
                  />
                  <AnswerBox
                    label="Resposta correta"
                    value={`${entry.correct_answer}${correctOption ? ` — ${correctOption}` : ""}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Próximas ações
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Reinicie o treino ou volte ao painel principal.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={handleNewSimulation}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <RotateCcw className="size-4" />
              Novo simulado
            </button>

            <Link
              href="/dashboard/simulados"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="size-4" />
              Voltar para simulados
            </Link>
          </div>
        </div>
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "success" | "danger" | "neutral"
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/10"
      : tone === "danger"
      ? "border-rose-500/20 bg-rose-500/10"
      : "border-white/10 bg-[#071225]"

  return (
    <article className={`rounded-[24px] border p-5 ${toneClass}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
    </article>
  )
}

function StatusBadge({
  status,
}: {
  status: "correct" | "wrong" | "blank"
}) {
  if (status === "correct") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
        <CheckCircle2 className="size-3.5" />
        Correta
      </span>
    )
  }

  if (status === "wrong") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-200">
        <CircleX className="size-3.5" />
        Incorreta
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
      Em branco
    </span>
  )
}

function AnswerBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-7 text-white">{value}</p>
    </div>
  )
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