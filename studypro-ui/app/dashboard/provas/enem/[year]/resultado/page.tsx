"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Layers3,
  Map,
  MessageSquare,
  ScrollText,
  Target,
  Trophy,
  XCircle,
} from "lucide-react"

type LocalResultByQuestion = {
  question_number: number
  subject: string
  user_answer: string | null
  correct_answer: string | null
  status: "correct" | "wrong" | "blank" | "annulled"
}

type ExamResult = {
  title: string
  exam_type: string
  year: number
  total_questions: number
  correct_answers: number
  wrong_answers: number
  unanswered_count: number
  annulled_count: number
  score_percentage: number
  results_by_question: LocalResultByQuestion[]
  subjects_summary: Array<{
    subject: string
    total: number
    correct: number
    wrong: number
    blank: number
    annulled: number
    accuracy_percentage: number
  }>
}

const OFFICIAL_EXAM_RESULT_PREFIX = "studypro_official_exam_result_"

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[#4b8df7]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

function getPerformanceLabel(value: number) {
  if (value >= 75) return { text: "Excelente", className: "text-emerald-300" }
  if (value >= 50) return { text: "Bom desempenho", className: "text-[#79a6ff]" }
  if (value >= 30) return { text: "Pode melhorar", className: "text-yellow-300" }
  return { text: "Precisa melhorar", className: "text-rose-400" }
}

export default function ExamResultPage() {
  const params = useParams()
  const year = Number(params.year as string)

  const storageKey = `${OFFICIAL_EXAM_RESULT_PREFIX}enem_${year}`

  const result = useMemo<ExamResult | null>(() => {
    if (typeof window === "undefined") return null

    const raw = localStorage.getItem(storageKey)
    if (!raw) return null

    try {
      return JSON.parse(raw) as ExamResult
    } catch {
      return null
    }
  }, [storageKey])

  const weakestSubjects = useMemo(() => {
    if (!result) return []
    return [...result.subjects_summary]
      .sort((a, b) => a.accuracy_percentage - b.accuracy_percentage)
      .slice(0, 3)
  }, [result])

  const performance = getPerformanceLabel(result?.score_percentage ?? 0)

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Nenhum resultado salvo para esta prova ainda.
        </div>

        <Link
          href={`/dashboard/provas/enem/${year}`}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-[#071225] px-5 py-3 text-white transition hover:bg-[#0a1730]"
        >
          <ArrowLeft className="size-4" />
          Voltar à prova
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/provas/enem/${year}`}
        className="inline-flex items-center gap-2 text-lg text-[#7ea0d6] transition hover:text-white"
      >
        <ArrowLeft className="size-5" />
        Voltar à prova
      </Link>

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(41,98,255,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8">
        <div className="grid gap-8 xl:grid-cols-[1fr_220px] xl:items-center">
          <div className="flex items-start gap-5">
            <div className="flex size-28 items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,_rgba(75,141,247,1),_rgba(16,185,129,0.9))]">
              <Trophy className="size-14 text-[#071225]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
                <CheckCircle2 className="size-4" />
                Prova finalizada
              </div>

              <h1 className="mt-5 text-6xl font-bold tracking-tight text-white">
                ENEM {year}
              </h1>

              <p className="mt-4 text-2xl text-[#7ea0d6]">
                Desempenho:{" "}
                <span className={performance.className}>{performance.text}</span>{" "}
                · {result.score_percentage.toFixed(1)}% de acerto
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm uppercase tracking-[0.18em] text-[#7ea0d6]">
              Pontuação
            </div>
            <div className="mt-2 text-7xl font-bold tracking-tight text-[#38c6d9]">
              {Math.round((result.score_percentage / 100) * 1000)}
            </div>
            <div className="text-base text-[#7ea0d6]">de 1000 pontos</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          icon={<CheckCircle2 className="size-6 text-emerald-300" />}
          label="Acertos"
          value={String(result.correct_answers)}
          valueClassName="text-emerald-300"
        />
        <MetricCard
          icon={<XCircle className="size-6 text-rose-400" />}
          label="Erros"
          value={String(result.wrong_answers)}
          valueClassName="text-rose-400"
        />
        <MetricCard
          icon={<Target className="size-6 text-slate-300" />}
          label="Em branco"
          value={String(result.unanswered_count)}
          valueClassName="text-slate-300"
        />
        <MetricCard
          icon={<Target className="size-6 text-[#4b8df7]" />}
          label="Aproveitamento"
          value={`${result.score_percentage.toFixed(1)}%`}
          valueClassName="text-[#4b8df7]"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Desempenho por disciplina
          </h2>
          <p className="mt-2 text-base text-[#7ea0d6]">
            Acertos por área de conhecimento
          </p>

          <div className="mt-6 space-y-5">
            {result.subjects_summary.map((subject) => (
              <div key={subject.subject} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xl font-semibold text-white">
                    {subject.subject}
                  </div>
                  <div className="text-base text-[#7ea0d6]">
                    {subject.correct}/{subject.total} • {subject.accuracy_percentage.toFixed(1)}%
                  </div>
                </div>
                <ProgressBar value={subject.accuracy_percentage} />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-yellow-500/10">
              <AlertTriangle className="size-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Prioridades de revisão
              </h2>
              <p className="mt-1 text-base text-[#7ea0d6]">
                Disciplinas com pior desempenho
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {weakestSubjects.map((subject, index) => (
              <div
                key={subject.subject}
                className="flex items-center justify-between rounded-[22px] border border-white/10 bg-[#0a1428] px-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-yellow-300">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-white">
                      {subject.subject}
                    </div>
                    <div className="text-sm text-[#7ea0d6]">
                      {subject.correct} acerto(s), {subject.wrong} erro(s), {subject.blank} em branco
                    </div>
                  </div>
                </div>

                <div className="text-xl font-bold text-rose-400">
                  {subject.accuracy_percentage.toFixed(1)}%
                </div>
              </div>
            ))}

            <Link
              href="/dashboard/estudo"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-[#030b1d] px-5 py-4 text-xl font-semibold text-white transition hover:bg-[#0a1730]"
            >
              Iniciar revisão guiada
            </Link>
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Correção por questão
        </h2>
        <p className="mt-2 text-base text-[#7ea0d6]">
          Clique em uma questão para ver o gabarito comentado
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {result.results_by_question.map((item) => {
            const colorClass =
              item.status === "correct"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : item.status === "wrong"
                ? "border-rose-500/20 bg-rose-500/10 text-rose-400"
                : item.status === "blank"
                ? "border-white/10 bg-white/5 text-slate-300"
                : "border-yellow-500/20 bg-yellow-500/10 text-yellow-300"

            return (
              <button
                key={item.question_number}
                type="button"
                className={`flex h-12 min-w-12 items-center justify-center rounded-2xl border px-3 text-base font-semibold transition hover:opacity-90 ${colorClass}`}
              >
                {item.question_number}
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-5 text-sm text-[#7ea0d6]">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-emerald-400" />
            Acerto
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-rose-400" />
            Erro
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-slate-400" />
            Em branco
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-full bg-yellow-300" />
            Anulada
          </span>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
        <h2 className="text-3xl font-bold tracking-tight text-white">
          Sua revisão já está pronta
        </h2>
        <p className="mt-2 text-base text-[#7ea0d6]">
          Conecte o resultado à sua área de estudo
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/dashboard/flashcards"
            className="rounded-[24px] border border-white/10 bg-[#12244a] p-5 transition hover:border-[#2f7cff]/40"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f1d3d]">
              <Layers3 className="size-6 text-[#79a6ff]" />
            </div>
            <div className="mt-4 text-2xl font-bold text-white">Gerar flashcards</div>
            <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
              Cards com IA das questões que você errou
            </div>
          </Link>

          <Link
            href="/dashboard/resumos"
            className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,_rgba(16,185,129,0.14),_rgba(14,35,71,0.7))] p-5 transition hover:border-emerald-500/30"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f1d3d]">
              <ScrollText className="size-6 text-emerald-300" />
            </div>
            <div className="mt-4 text-2xl font-bold text-white">Resumo personalizado</div>
            <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
              Resumo focado nos seus pontos fracos
            </div>
          </Link>

          <Link
            href="/dashboard/estudo"
            className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,_rgba(168,85,247,0.14),_rgba(14,35,71,0.7))] p-5 transition hover:border-purple-500/30"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f1d3d]">
              <Map className="size-6 text-purple-300" />
            </div>
            <div className="mt-4 text-2xl font-bold text-white">Mapa mental</div>
            <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
              Visualize conceitos centrais das matérias revisadas
            </div>
          </Link>

          <Link
            href="/dashboard/chat-ia"
            className="rounded-[24px] border border-white/10 bg-[#12244a] p-5 transition hover:border-[#2f7cff]/40"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0f1d3d]">
              <MessageSquare className="size-6 text-[#79a6ff]" />
            </div>
            <div className="mt-4 text-2xl font-bold text-white">Tirar dúvidas com IA</div>
            <div className="mt-2 text-base leading-7 text-[#7ea0d6]">
              Converse sobre as questões da prova
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-white/5">
        {icon}
      </div>
      <div className={`mt-5 text-5xl font-bold tracking-tight ${valueClassName ?? "text-white"}`}>
        {value}
      </div>
      <div className="mt-2 text-xl text-[#7ea0d6]">{label}</div>
    </article>
  )
}