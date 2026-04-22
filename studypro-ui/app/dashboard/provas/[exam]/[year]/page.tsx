"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Crown,
  ExternalLink,
  FileText,
  Flame,
  Loader2,
  PauseCircle,
  Rocket,
  Send,
  ShieldCheck,
  Trophy,
  XCircle,
} from "lucide-react"

import {
  AUTH_TOKEN_KEY,
  createCheckoutSession,
  generateRandomSimulation,
  getBillingStatus,
  getExamByTypeAndYear,
  submitExamAnswers,
  type BillingStatusResponse,
  type ExamDetail,
} from "@/lib/api"
import { saveRecentAttempt } from "@/lib/activity"

const ALTERNATIVES = ["A", "B", "C", "D", "E"] as const
const ACTIVE_SIMULATION_KEY = "studypro_active_simulation"
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers"

type QuestionResultItem = {
  question_number: number
  status: "correct" | "wrong" | "blank" | "annulled"
  user_answer: string | null
  correct_answer: string | null
}

type ExamSubmissionResponse = {
  correct_answers: number
  wrong_answers: number
  unanswered_count: number
  annulled_count: number
  valid_questions: number
  total_questions: number
  score_percentage: number
  results_by_question: QuestionResultItem[]
}

type ExamVisualStatus = "not_started" | "in_progress" | "finished"

function decodeParam(value: string) {
  return decodeURIComponent(value).trim()
}

export default function ExamYearDetailPage() {
  const params = useParams<{ exam: string; year: string }>()
  const router = useRouter()

  const examParam = decodeParam(params.exam).toLowerCase()
  const yearParam = Number(params.year)

  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [answers, setAnswers] = useState<Array<string | null>>([])
  const [result, setResult] = useState<ExamSubmissionResponse | null>(null)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [fallbackWarning, setFallbackWarning] = useState("")

  const [billing, setBilling] = useState<BillingStatusResponse | null>(null)
  const [billingLoading, setBillingLoading] = useState(true)
  const [generationError, setGenerationError] = useState("")
  const [isGeneratingSimulation, setIsGeneratingSimulation] = useState(false)
  const [questionCount, setQuestionCount] = useState(10)
  const [showGenerationPaywall, setShowGenerationPaywall] = useState(false)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)

  useEffect(() => {
    async function loadExam() {
      try {
        setLoading(true)
        setError("")
        setFallbackWarning("")

        const data = await getExamByTypeAndYear(examParam, yearParam)
        setExam(data)
        setAnswers(Array.from({ length: data.question_count }, () => null))
        setSelectedPdfUrl(data.pdfs?.[0]?.url ?? null)

        if (!data.pdfs?.length) {
          setFallbackWarning(
            "A API publicada não retornou esta prova com PDFs em produção. O sistema exibiu os dados disponíveis da prova oficial."
          )
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar a prova."
        )
      } finally {
        setLoading(false)
      }
    }

    if (!Number.isNaN(yearParam)) {
      loadExam()
    } else {
      setError("Ano inválido.")
      setLoading(false)
    }
  }, [examParam, yearParam])

  useEffect(() => {
    async function loadBilling() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(AUTH_TOKEN_KEY)
          : null

      if (!token) {
        setBilling(null)
        setBillingLoading(false)
        return
      }

      try {
        setBillingLoading(true)
        const data = await getBillingStatus(token)
        setBilling(data)
      } catch {
        setBilling(null)
      } finally {
        setBillingLoading(false)
      }
    }

    loadBilling()
  }, [])

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = next[index] === value ? null : value
      return next
    })
  }

  async function handleSubmit() {
    if (!exam) return

    try {
      setSubmitting(true)
      setSubmitError("")

      const response = (await submitExamAnswers(
        exam.exam_type,
        exam.year,
        answers,
        typeof window !== "undefined"
          ? localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined
          : undefined
      )) as ExamSubmissionResponse

      setResult(response)

      if (response.unanswered_count === 0) {
        saveRecentAttempt({
          id: `prova-${exam.exam_type}-${exam.year}-${Date.now()}`,
          module: "provas",
          title: exam.title,
          scorePercentage: response.score_percentage,
          correctAnswers: response.correct_answers,
          totalQuestions: response.total_questions,
          createdAt: new Date().toISOString(),
        })
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Não foi possível corrigir a prova."
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGenerateSimulation() {
    if (!exam) return

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(AUTH_TOKEN_KEY)
        : null

    try {
      setIsGeneratingSimulation(true)
      setGenerationError("")
      setShowGenerationPaywall(false)

      const simulation = await generateRandomSimulation(
        {
          exam_type: exam.exam_type,
          year: exam.year,
          question_count: questionCount,
          mode: "balanced",
          subjects: null,
          seed: null,
        },
        token
      )

      if (typeof window !== "undefined") {
        sessionStorage.setItem(ACTIVE_SIMULATION_KEY, JSON.stringify(simulation))
        sessionStorage.removeItem(ACTIVE_SIMULATION_ANSWERS_KEY)
      }

      router.push("/dashboard/simulados/resolver")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível gerar o simulado."

      setGenerationError(message)

      if (
        message.toLowerCase().includes("limite diário") ||
        message.toLowerCase().includes("plano gratuito") ||
        message.toLowerCase().includes("upgrade") ||
        message.toLowerCase().includes("modo convidado")
      ) {
        setShowGenerationPaywall(true)
      }
    } finally {
      setIsGeneratingSimulation(false)
    }
  }

  async function handleStartCheckout() {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(AUTH_TOKEN_KEY)
        : null

    if (!token) {
      router.push("/login?redirect=/pricing")
      return
    }

    try {
      setIsStartingCheckout(true)
      const data = await createCheckoutSession(token)
      window.location.href = data.checkout_url
    } catch (err) {
      setGenerationError(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar o checkout."
      )
    } finally {
      setIsStartingCheckout(false)
    }
  }

  const answeredCount = useMemo(
    () => answers.filter((answer) => answer !== null).length,
    [answers]
  )

  const unansweredCount = useMemo(
    () => answers.filter((answer) => answer === null).length,
    [answers]
  )

  const questionResultsMap = useMemo(() => {
    if (!result) return new Map<number, QuestionResultItem>()
    return new Map(
      result.results_by_question.map((item) => [item.question_number, item])
    )
  }, [result])

  const visualStatus = useMemo<ExamVisualStatus>(() => {
    if (!result) {
      return answeredCount > 0 ? "in_progress" : "not_started"
    }

    if (result.unanswered_count === 0) {
      return "finished"
    }

    return "in_progress"
  }, [answeredCount, result])

  const statusMeta = useMemo(() => {
    if (visualStatus === "finished") {
      return {
        label: "Prova finalizada",
        icon: <CheckCircle2 className="size-4" />,
        className:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      }
    }

    if (visualStatus === "in_progress") {
      return {
        label: "Prova em andamento",
        icon: <PauseCircle className="size-4" />,
        className:
          "border-amber-500/20 bg-amber-500/10 text-amber-200",
      }
    }

    return {
      label: "Prova não iniciada",
      icon: <AlertTriangle className="size-4" />,
      className:
        "border-white/10 bg-white/5 text-slate-300",
    }
  }, [visualStatus])

  const planLabel = billing?.user.plan?.toUpperCase() ?? "VISITANTE"
  const usageLabel =
    billing?.usage.daily_limit !== null && billing?.usage.remaining_today !== null
      ? `${billing.usage.remaining_today} de ${billing.usage.daily_limit} geração(ões) restantes hoje`
      : billing?.user.plan === "pro"
      ? "Uso ilimitado"
      : "Faça login para liberar mais controle"

  if (loading) {
    return (
      <div className="glass-panel rounded-[32px] p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando prova...
        </div>
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="space-y-4">
        <Link
          href={`/dashboard/provas/${encodeURIComponent(examParam)}`}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Link>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error || "Prova não encontrada."}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/provas/${encodeURIComponent(examParam)}`}
        className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Voltar para os anos
      </Link>

      {fallbackWarning ? (
        <section className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {fallbackWarning}
        </section>
      ) : null}

      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm ${statusMeta.className}`}
            >
              {statusMeta.icon}
              {statusMeta.label}
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white md:text-5xl">
              {exam.title}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              {exam.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <MetaBadge value={exam.institution} />
              <MetaBadge value={String(exam.year)} />
              <MetaBadge value={`${exam.question_count} questões`} />
              <MetaBadge value={exam.has_answer_key ? "Com gabarito" : "Sem gabarito"} />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-sm text-muted-foreground">Resumo da folha</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <StatCard label="Respondidas" value={String(answeredCount)} />
              <StatCard label="Em branco" value={String(unansweredCount)} />
              <StatCard label="Total" value={String(exam.question_count)} />
            </div>

            {!exam.has_answer_key ? (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Esta prova não possui gabarito disponível. A correção automática está desabilitada.
              </div>
            ) : visualStatus === "in_progress" ? (
              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Esta prova ainda está em andamento. Enquanto houver questões em branco, o sistema exibirá apenas uma prévia parcial, não o resultado final.
              </div>
            ) : visualStatus === "not_started" ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Marque suas respostas e clique em <span className="font-semibold text-white">Realizar correção</span> para ver o desempenho.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[32px] p-6 md:p-8">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-sm text-primary">
              <Rocket className="size-4" />
              Gerar simulado
            </div>

            <h2 className="mt-5 text-2xl font-bold tracking-tight text-white md:text-4xl">
              Transforme esta prova em treino imediato
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Gere um simulado deste ano e siga direto para a resolução. Esse é o
              ponto de maior intenção: quando o aluno quer continuar estudando sem perder ritmo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[10, 20, 30].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${
                    questionCount === count
                      ? "border-primary/30 bg-primary text-primary-foreground"
                      : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {count} questões
                </button>
              ))}
            </div>

            {generationError ? (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {generationError}
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-sm text-muted-foreground">Seu acesso atual</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <StatCard
                label="Plano"
                value={billingLoading ? "..." : planLabel}
              />
              <StatCard
                label="Uso"
                value={billingLoading ? "..." : usageLabel}
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateSimulation}
              disabled={isGeneratingSimulation}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGeneratingSimulation ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Gerando simulado...
                </>
              ) : (
                <>
                  <Rocket className="size-4" />
                  Gerar simulado agora
                </>
              )}
            </button>

            <p className="mt-3 text-xs leading-6 text-slate-400">
              O fluxo envia direto para a resolução assim que o backend liberar a geração.
            </p>
          </div>
        </div>
      </section>

      {showGenerationPaywall ? (
        <section className="glass-panel rounded-[32px] border border-primary/20 bg-primary/[0.08] p-6 md:p-8 shadow-[0_18px_60px_-24px_rgba(59,130,246,0.65)]">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-slate-950/60 px-4 py-1 text-sm text-primary">
                <Crown className="size-4" />
                Limite gratuito atingido
              </div>

              <h2 className="mt-5 text-2xl font-bold text-white md:text-4xl">
                Você atingiu o limite gratuito
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
                Você já chegou no ponto mais valioso do fluxo: continuar treinando
                agora. O Pro existe para evitar que esse momento seja interrompido.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <MiniBenefit
                  icon={<Flame className="size-4 text-primary" />}
                  label="Mais constância"
                />
                <MiniBenefit
                  icon={<Clock3 className="size-4 text-primary" />}
                  label="Menos interrupção"
                />
                <MiniBenefit
                  icon={<ShieldCheck className="size-4 text-primary" />}
                  label="Checkout seguro"
                />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <span className="font-semibold text-white">R$ 29/mês</span>{" "}
                para continuar com mais prática, mais ritmo e menos fricção no StudyPro.
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <div className="space-y-3 text-sm text-slate-300">
                <PaywallItem text="Gerar mais simulados sem travar o fluxo" />
                <PaywallItem text="Continuar estudando no momento de maior foco" />
                <PaywallItem text="Desbloquear o Pro com checkout direto" />
              </div>

              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-slate-200">
                Quanto mais vezes você trava no gratuito, maior a chance de perder ritmo.
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleStartCheckout}
                  disabled={isStartingCheckout}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isStartingCheckout ? "Redirecionando..." : "Desbloquear Pro agora"}
                </button>

                <Link
                  href="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Ver comparação completa
                </Link>
              </div>

              <p className="mt-4 text-xs leading-6 text-slate-400">
                Pagamento processado com Stripe e ativação automática no retorno.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-panel rounded-[32px] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Visualização da prova
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                PDFs e página oficial, quando disponíveis
              </p>
            </div>
          </div>

          {exam.pdfs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              Nenhum PDF disponível para esta prova.
            </div>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-3">
                {exam.pdfs.map((pdf) => {
                  const isSelected = selectedPdfUrl === pdf.url

                  return (
                    <button
                      key={pdf.url}
                      type="button"
                      onClick={() => setSelectedPdfUrl(pdf.url)}
                      className={`rounded-2xl border px-4 py-3 text-sm transition ${
                        isSelected
                          ? "border-primary/30 bg-primary text-primary-foreground"
                          : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      {pdf.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {selectedPdfUrl ? (
                  <a
                    href={selectedPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                  >
                    <ExternalLink className="size-4" />
                    Abrir PDF em nova guia
                  </a>
                ) : null}

                {exam.official_page_url ? (
                  <a
                    href={exam.official_page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition hover:bg-white/10"
                  >
                    <ExternalLink className="size-4" />
                    Página oficial
                  </a>
                ) : null}
              </div>

              {selectedPdfUrl ? (
                <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/70">
                  <iframe
                    src={selectedPdfUrl}
                    title={`PDF ${exam.title}`}
                    className="h-[720px] w-full"
                  />
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                  Selecione um PDF para visualizar.
                </div>
              )}

              <p className="mt-4 text-xs text-muted-foreground">
                Se o PDF não carregar no visualizador, use o botão “Abrir PDF em nova guia”.
              </p>
            </>
          )}
        </article>

        <article className="space-y-6">
          {result && visualStatus === "finished" ? (
            <div className="glass-panel rounded-[32px] p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
                  <Trophy className="size-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Resultado final da correção
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Resumo consolidado do desempenho
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <StatCard label="Acertos" value={String(result.correct_answers)} />
                <StatCard label="Erros" value={String(result.wrong_answers)} />
                <StatCard
                  label="Percentual"
                  value={`${result.score_percentage.toFixed(1)}%`}
                />
                <StatCard label="Em branco" value={String(result.unanswered_count)} />
                <StatCard label="Anuladas" value={String(result.annulled_count)} />
                <StatCard label="Válidas" value={String(result.valid_questions)} />
              </div>
            </div>
          ) : result && visualStatus === "in_progress" ? (
            <div className="glass-panel rounded-[32px] p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
                  <PauseCircle className="size-5 text-amber-200" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Prévia parcial
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ainda não é um resultado final, pois a prova tem questões em branco
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <StatCard label="Respondidas" value={String(answeredCount)} />
                <StatCard label="Em branco" value={String(result.unanswered_count)} />
                <StatCard label="Acertos parciais" value={String(result.correct_answers)} />
                <StatCard label="Erros parciais" value={String(result.wrong_answers)} />
              </div>

              <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                Finalize as respostas para liberar o desempenho final da prova.
              </div>
            </div>
          ) : null}

          <div className="glass-panel rounded-[32px] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Folha de respostas
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Marque as alternativas e envie para correção
                </p>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !exam.has_answer_key}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Realizar correção
              </button>
            </div>

            {submitError ? (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {submitError}
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Status atual:{" "}
              <span className="font-semibold text-white">
                {visualStatus === "finished"
                  ? "Prova finalizada"
                  : visualStatus === "in_progress"
                  ? "Prova em andamento"
                  : "Prova não iniciada"}
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: exam.question_count }, (_, index) => {
                const questionNumber = index + 1
                const questionResult = questionResultsMap.get(questionNumber)

                return (
                  <article
                    key={questionNumber}
                    className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-white">
                        Questão {questionNumber}
                      </span>

                      {questionResult ? (
                        <QuestionStatusBadge status={questionResult.status} />
                      ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {ALTERNATIVES.map((alternative) => {
                        const selected = answers[index] === alternative

                        return (
                          <button
                            key={alternative}
                            type="button"
                            onClick={() => updateAnswer(index, alternative)}
                            className={`inline-flex h-10 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                              selected
                                ? "border-primary/30 bg-primary text-primary-foreground"
                                : "border-white/10 bg-slate-950/70 text-white hover:bg-white/10"
                            }`}
                          >
                            {alternative}
                          </button>
                        )
                      })}
                    </div>

                    {questionResult ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-xs text-slate-300">
                        Sua resposta:{" "}
                        <span className="font-semibold text-white">
                          {questionResult.user_answer ?? "-"}
                        </span>
                        {" · "}
                        Gabarito:{" "}
                        <span className="font-semibold text-white">
                          {questionResult.correct_answer ?? "-"}
                        </span>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}

function PaywallItem({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      {text}
    </div>
  )
}

function MiniBenefit({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div>{icon}</div>
      <p className="mt-3 text-sm font-medium text-white">{label}</p>
    </div>
  )
}

function MetaBadge({ value }: { value: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
      {value}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function QuestionStatusBadge({
  status,
}: {
  status: "correct" | "wrong" | "blank" | "annulled"
}) {
  if (status === "correct") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
        <CheckCircle2 className="size-3.5" />
        Correta
      </span>
    )
  }

  if (status === "wrong") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300">
        <XCircle className="size-3.5" />
        Errada
      </span>
    )
  }

  if (status === "annulled") {
    return (
      <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-200">
        AN
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
      BR
    </span>
  )
}