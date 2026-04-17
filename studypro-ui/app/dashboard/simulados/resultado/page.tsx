"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CircleX,
  ClipboardList,
  RotateCcw,
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

const ACTIVE_SIMULATION_KEY = "studypro_active_simulation"
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers"
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result"

export default function ResultadoSimuladoPage() {
  const router = useRouter()

  const [payload, setPayload] = useState<StoredSimulationResult | null>(null)
  const [loadError, setLoadError] = useState("")

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

  const simulation = payload?.simulation ?? null
  const result = payload?.result ?? null
  const answers = payload?.answers ?? {}

  const questionMap = useMemo(() => {
    const map = new Map<number, SimulationQuestion>()
    simulation?.questions.forEach((question) => {
      map.set(question.number, question)
    })
    return map
  }, [simulation])

  function handleNewSimulation() {
    sessionStorage.removeItem(ACTIVE_SIMULATION_KEY)
    sessionStorage.removeItem(ACTIVE_SIMULATION_ANSWERS_KEY)
    sessionStorage.removeItem(LAST_SIMULATION_RESULT_KEY)
    router.push("/dashboard/simulados")
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
        </article>
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