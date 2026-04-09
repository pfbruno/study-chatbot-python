"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Send,
  Trophy,
  XCircle,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getExamByTypeAndYear,
  submitExamAnswers,
  type ExamDetail,
  type ExamSubmissionResponse,
} from "@/lib/api"

const ALTERNATIVES = ["A", "B", "C", "D", "E"]

export default function ExamYearDetailPage() {
  const params = useParams<{ exam: string; year: string }>()
  const examParam = decodeURIComponent(params.exam)
  const yearParam = Number(params.year)

  const [exam, setExam] = useState<ExamDetail | null>(null)
  const [answers, setAnswers] = useState<Array<string | null>>([])
  const [result, setResult] = useState<ExamSubmissionResponse | null>(null)
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function loadExam() {
      try {
        setLoading(true)
        setError(null)

        const data = await getExamByTypeAndYear(examParam, yearParam)
        setExam(data)
        setAnswers(Array.from({ length: data.question_count }, () => null))
        setSelectedPdfUrl(data.pdfs?.[0]?.url ?? null)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Não foi possível carregar a prova."

        setError(message)
      } finally {
        setLoading(false)
      }
    }

    if (!Number.isNaN(yearParam)) {
      void loadExam()
    } else {
      setError("Ano inválido.")
      setLoading(false)
    }
  }, [examParam, yearParam])

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
      setSubmitError(null)

      const response = await submitExamAnswers(exam.exam_type, exam.year, answers)
      setResult(response)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível corrigir a prova."

      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const answeredCount = useMemo(
    () => answers.filter((answer) => answer !== null).length,
    [answers],
  )

  const unansweredCount = useMemo(
    () => answers.filter((answer) => answer === null).length,
    [answers],
  )

  const questionResultsMap = useMemo(() => {
    if (!result) return new Map<number, (typeof result.results_by_question)[number]>()

    return new Map(result.results_by_question.map((item) => [item.question_number, item]))
  }, [result])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="space-y-6">
        <Link
          href={`/dashboard/provas/${examParam}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error || "Prova não encontrada."}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard/provas/${examParam}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para os anos
      </Link>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          Prova selecionada
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{exam.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{exam.description}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border border-border/60 bg-background/50 px-2 py-1">
            {exam.institution}
          </span>
          <span className="rounded-md border border-border/60 bg-background/50 px-2 py-1">
            {exam.year}
          </span>
          <span className="rounded-md border border-border/60 bg-background/50 px-2 py-1">
            {exam.question_count} questões
          </span>
          <span className="rounded-md border border-border/60 bg-background/50 px-2 py-1">
            {exam.has_answer_key ? "Com gabarito" : "Sem gabarito"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Visualização da prova</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {exam.pdfs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum PDF disponível para esta prova.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {exam.pdfs.map((pdf) => {
                      const isSelected = selectedPdfUrl === pdf.url

                      return (
                        <button
                          key={pdf.url}
                          type="button"
                          onClick={() => setSelectedPdfUrl(pdf.url)}
                          className={`rounded-lg border px-3 py-2 text-sm transition ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 bg-background/50 text-foreground hover:border-primary/60"
                          }`}
                        >
                          {pdf.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {selectedPdfUrl ? (
                      <a
                        href={selectedPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/60"
                      >
                        Abrir PDF em nova guia
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}

                    {exam.official_page_url ? (
                      <a
                        href={exam.official_page_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/60"
                      >
                        Página oficial
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>

                  {selectedPdfUrl ? (
                    <div className="overflow-hidden rounded-xl border border-border/60 bg-black">
                      <iframe
                        src={selectedPdfUrl}
                        title="Visualizador de PDF da prova"
                        className="h-[900px] w-full"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-10 text-center text-sm text-muted-foreground">
                      Selecione um PDF para visualizar.
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Se o PDF não carregar no visualizador, use o botão “Abrir PDF em nova guia”.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Resumo da resolução</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Respondidas</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{answeredCount}</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Em branco</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{unansweredCount}</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total de questões
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {exam.question_count}
                </p>
              </div>
            </CardContent>
          </Card>

          {result ? (
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-primary" />
                  Resultado da correção
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Acertos
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {result.correct_answers}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Erros</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {result.wrong_answers}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Percentual
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {result.score_percentage.toFixed(1)}%
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Em branco
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {result.unanswered_count}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Anuladas
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {result.annulled_count}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Válidas
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {result.valid_questions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle className="text-base">Folha de respostas</CardTitle>

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || !exam.has_answer_key}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Realizar correção
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            {!exam.has_answer_key ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Esta prova não possui gabarito disponível no momento. Você ainda pode marcar as
                respostas, mas a correção automática está desabilitada.
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}

            <div className="grid gap-3">
              {Array.from({ length: exam.question_count }, (_, index) => {
                const questionNumber = index + 1
                const questionResult = questionResultsMap.get(questionNumber)

                return (
                  <div
                    key={questionNumber}
                    className="rounded-xl border border-border/60 bg-background/35 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-border/60 bg-background/60 px-2 py-1 text-sm font-semibold text-foreground">
                          Questão {questionNumber}
                        </span>

                        {questionResult?.status === "correct" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Correta
                          </span>
                        ) : null}

                        {questionResult?.status === "wrong" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-300">
                            <XCircle className="h-3.5 w-3.5" />
                            Incorreta
                          </span>
                        ) : null}

                        {questionResult?.status === "annulled" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">
                            Anulada
                          </span>
                        ) : null}

                        {questionResult?.status === "blank" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-500/30 bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-300">
                            Em branco
                          </span>
                        ) : null}
                      </div>

                      {questionResult ? (
                        <div className="text-xs text-muted-foreground">
                          Sua resposta:{" "}
                          <span className="font-medium text-foreground">
                            {questionResult.user_answer ?? "-"}
                          </span>
                          {" • "}
                          Gabarito:{" "}
                          <span className="font-medium text-foreground">
                            {questionResult.correct_answer ?? "-"}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {ALTERNATIVES.map((alternative) => {
                        const selected = answers[index] === alternative

                        return (
                          <button
                            key={alternative}
                            type="button"
                            onClick={() => updateAnswer(index, alternative)}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/60 bg-background/50 text-foreground hover:border-primary/60"
                            }`}
                          >
                            {alternative}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}