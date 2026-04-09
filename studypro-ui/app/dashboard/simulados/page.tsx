"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Loader2, Play, RotateCcw, Send, XCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getExamTypes, type ExamType } from "@/lib/api"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

const ALTERNATIVES = ["A", "B", "C", "D", "E"] as const

type SubjectConfig = {
  name: string
  count: number
}

type SimulationConfigResponse = {
  exam_type: string
  year: number
  title: string
  total_questions_registered: number
  total_valid_questions: number
  annulled_questions: number
  subjects: SubjectConfig[]
}

type SimulationQuestion = {
  number: number
  subject: string
  statement: string
  options: Record<string, string>
  source_pdf_label?: string | null
}

type RandomSimulationResponse = {
  exam_type: string
  year: number
  title: string
  mode: "random" | "balanced"
  requested_question_count: number
  generated_question_count: number
  subjects_used: string[]
  questions: SimulationQuestion[]
}

type SimulationResultItem = {
  question_number: number
  subject: string
  user_answer: string | null
  correct_answer: string | null
  status: "correct" | "wrong" | "blank"
}

type SimulationSubmitResponse = {
  exam_type: string
  year: number
  total_questions: number
  valid_questions: number
  correct_answers: number
  wrong_answers: number
  unanswered_count: number
  annulled_count: number
  score_percentage: number
  results_by_question: SimulationResultItem[]
}

export default function SimuladosPage() {
  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [questionCount, setQuestionCount] = useState(10)
  const [mode, setMode] = useState<"balanced" | "random">("balanced")

  const [availableSubjects, setAvailableSubjects] = useState<SubjectConfig[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  const [simulation, setSimulation] = useState<RandomSimulationResponse | null>(null)
  const [answers, setAnswers] = useState<Array<string | null>>([])
  const [result, setResult] = useState<SimulationSubmitResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [configError, setConfigError] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    async function loadExamCatalog() {
      try {
        setLoading(true)
        const data = await getExamTypes()
        setExamTypes(Array.isArray(data.exam_types) ? data.exam_types : [])
      } finally {
        setLoading(false)
      }
    }

    void loadExamCatalog()
  }, [])

  const selectedExamData = useMemo(
    () => examTypes.find((exam) => exam.key === selectedExam) || null,
    [examTypes, selectedExam],
  )

  async function loadSubjects(examType: string, year: string) {
    try {
      setLoadingConfig(true)
      setConfigError(null)
      setAvailableSubjects([])
      setSelectedSubjects([])

      const response = await fetch(
        `${API_BASE_URL}/simulados/config/${encodeURIComponent(examType)}/${year}`,
        {
          cache: "no-store",
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || "Não foi possível carregar as disciplinas.")
      }

      const data: SimulationConfigResponse = await response.json()
      const subjects = Array.isArray(data.subjects) ? data.subjects : []

      setAvailableSubjects(subjects)
      setSelectedSubjects(subjects.map((subject) => subject.name))
    } catch (error) {
      setConfigError(
        error instanceof Error ? error.message : "Erro ao carregar disciplinas do simulado.",
      )
    } finally {
      setLoadingConfig(false)
    }
  }

  function toggleSubject(subjectName: string) {
    setSelectedSubjects((prev) =>
      prev.includes(subjectName)
        ? prev.filter((subject) => subject !== subjectName)
        : [...prev, subjectName],
    )
  }

  async function generateSimulation() {
    try {
      setGenerating(true)
      setGenerateError(null)
      setSubmitError(null)
      setResult(null)
      setSimulation(null)
      setAnswers([])

      const response = await fetch(`${API_BASE_URL}/simulados/random`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exam_type: selectedExam,
          year: Number(selectedYear),
          question_count: Number(questionCount),
          subjects:
            selectedSubjects.length > 0 && selectedSubjects.length !== availableSubjects.length
              ? selectedSubjects
              : null,
          mode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || "Não foi possível gerar o simulado.")
      }

      const data: RandomSimulationResponse = await response.json()

      setSimulation(data)
      setAnswers(Array.from({ length: data.questions.length }, () => null))
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Erro ao gerar simulado.")
    } finally {
      setGenerating(false)
    }
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = next[index] === value ? null : value
      return next
    })
  }

  async function submitSimulation() {
    if (!simulation) return

    try {
      setSubmitting(true)
      setSubmitError(null)

      const response = await fetch(`${API_BASE_URL}/simulados/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exam_type: simulation.exam_type,
          year: simulation.year,
          question_numbers: simulation.questions.map((question) => question.number),
          answers,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || "Não foi possível corrigir o simulado.")
      }

      const data: SimulationSubmitResponse = await response.json()
      setResult(data)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Erro ao corrigir simulado.")
    } finally {
      setSubmitting(false)
    }
  }

  function resetSimulation() {
    setSimulation(null)
    setResult(null)
    setAnswers([])
    setGenerateError(null)
    setSubmitError(null)
  }

  const answeredCount = useMemo(
    () => answers.filter((answer) => answer !== null).length,
    [answers],
  )

  const resultMap = useMemo(() => {
    if (!result) return new Map<number, SimulationResultItem>()
    return new Map(result.results_by_question.map((item) => [item.question_number, item]))
  }, [result])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Simulados</h1>
        <p className="text-sm text-muted-foreground">
          Monte simulados com questões reais do banco cadastrado, sem incluir anuladas.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle>Configurar simulado</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prova</label>
              <select
                value={selectedExam}
                onChange={(e) => {
                  setSelectedExam(e.target.value)
                  setSelectedYear("")
                  setAvailableSubjects([])
                  setSelectedSubjects([])
                  resetSimulation()
                }}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                <option value="">Escolha a prova</option>
                {examTypes.map((exam) => (
                  <option key={exam.key} value={exam.key}>
                    {exam.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Ano</label>
              <select
                value={selectedYear}
                disabled={!selectedExamData}
                onChange={(e) => {
                  const year = e.target.value
                  setSelectedYear(year)
                  resetSimulation()

                  if (selectedExam && year) {
                    void loadSubjects(selectedExam, year)
                  }
                }}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Escolha o ano</option>
                {selectedExamData?.years.map((year) => (
                  <option key={year.year} value={year.year}>
                    {year.year}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Quantidade de questões</label>
              <input
                type="number"
                min={1}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Modo</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "balanced" | "random")}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              >
                <option value="balanced">Equilibrado por matéria</option>
                <option value="random">Aleatório geral</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Disciplinas</p>
                <p className="text-xs text-muted-foreground">
                  Se nenhuma disciplina for desmarcada, o sistema usa todas.
                </p>
              </div>

              {loadingConfig ? (
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando disciplinas...
                </div>
              ) : null}
            </div>

            {configError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {configError}
              </div>
            ) : null}

            {availableSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((subject) => {
                  const active = selectedSubjects.includes(subject.name)

                  return (
                    <button
                      key={subject.name}
                      type="button"
                      onClick={() => toggleSubject(subject.name)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:border-primary/60"
                      }`}
                    >
                      {subject.name} ({subject.count})
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-background/40 px-4 py-6 text-sm text-muted-foreground">
                Selecione a prova e o ano para carregar as disciplinas disponíveis.
              </div>
            )}
          </div>

          {generateError ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {generateError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void generateSimulation()}
            disabled={
              !selectedExam ||
              !selectedYear ||
              questionCount <= 0 ||
              loadingConfig ||
              generating
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Gerar simulado
          </button>
        </CardContent>
      </Card>

      {simulation ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{simulation.title}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {simulation.generated_question_count} questões geradas • modo{" "}
                    {simulation.mode === "balanced" ? "equilibrado" : "aleatório"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetSimulation}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Novo simulado
                </button>
              </CardHeader>

              <CardContent className="space-y-4">
                {simulation.questions.map((question, index) => {
                  const questionResult = resultMap.get(question.number)

                  return (
                    <div
                      key={`${question.number}-${index}`}
                      className="rounded-xl border border-border/60 bg-background/35 p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Questão {question.number}
                          </p>
                          <p className="text-xs text-muted-foreground">{question.subject}</p>
                        </div>

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

                        {questionResult?.status === "blank" ? (
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-500/30 bg-slate-500/10 px-2 py-1 text-xs font-medium text-slate-300">
                            Em branco
                          </span>
                        ) : null}
                      </div>

                      <p className="mb-4 text-sm leading-6 text-foreground">{question.statement}</p>

                      <div className="space-y-2">
                        {ALTERNATIVES.map((alternative) => {
                          const text = question.options?.[alternative] || ""
                          const selected = answers[index] === alternative
                          const isCorrect = questionResult?.correct_answer === alternative
                          const isWrongSelected =
                            questionResult?.user_answer === alternative &&
                            questionResult?.status === "wrong"

                          return (
                            <button
                              key={alternative}
                              type="button"
                              onClick={() => updateAnswer(index, alternative)}
                              disabled={submitting}
                              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm transition ${
                                selected
                                  ? "border-primary bg-primary/15 text-foreground"
                                  : "border-border bg-background/50 text-foreground hover:border-primary/60"
                              } ${
                                result && isCorrect
                                  ? "border-emerald-500/50 bg-emerald-500/10"
                                  : ""
                              } ${
                                result && isWrongSelected
                                  ? "border-rose-500/50 bg-rose-500/10"
                                  : ""
                              }`}
                            >
                              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-current text-xs font-semibold">
                                {alternative}
                              </span>
                              <span>{text}</span>
                            </button>
                          )
                        })}
                      </div>

                      {questionResult ? (
                        <div className="mt-3 text-xs text-muted-foreground">
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
                  )
                })}
              </CardContent>
            </Card>
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <Card className="border-border/60 bg-card/80 backdrop-blur">
              <CardHeader>
                <CardTitle>Resumo do simulado</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Respondidas
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{answeredCount}</p>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Em branco
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">
                      {simulation.questions.length - answeredCount}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Disciplinas usadas
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {simulation.subjects_used.join(", ")}
                  </p>
                </div>

                {submitError ? (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {submitError}
                  </div>
                ) : null}

                {!result ? (
                  <button
                    type="button"
                    onClick={() => void submitSimulation()}
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Corrigir simulado
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Acertos
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {result.correct_answers}
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Erros
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {result.wrong_answers}
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Percentual
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {result.score_percentage.toFixed(1)}%
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Em branco
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-foreground">
                          {result.unanswered_count}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={resetSimulation}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/60"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Gerar outro simulado
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}