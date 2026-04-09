"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SimulationMode = "balanced" | "random";

type SimulationQuestion = {
  number: number;
  subject: string;
  statement: string;
  options: Record<string, string>;
  source_pdf_label?: string | null;
};

type SimulationGenerationResponse = {
  simulation_id: string;
  generated_at: string;
  exam_type: string;
  year: number;
  title: string;
  mode: SimulationMode;
  requested_question_count: number;
  generated_question_count: number;
  filters: {
    subjects: string[];
    mode: SimulationMode;
    seed: number | null;
  };
  subjects_used: string[];
  question_numbers: number[];
  questions: SimulationQuestion[];
};

type SimulationSubmissionResponse = {
  exam_type: string;
  year: number;
  title: string;
  total_questions: number;
  valid_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_count: number;
  annulled_count: number;
  score_percentage: number;
  subjects_summary: Array<{
    subject: string;
    total: number;
    correct: number;
    wrong: number;
    blank: number;
    accuracy_percentage: number;
  }>;
  results_by_question: Array<{
    question_number: number;
    subject: string;
    user_answer: string | null;
    correct_answer: string;
    status: "correct" | "wrong" | "blank";
  }>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

const ACTIVE_SIMULATION_KEY = "studypro_active_simulation";
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers";
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result";

const OPTION_ORDER = ["A", "B", "C", "D", "E"];

export default function ResolverSimuladoPage() {
  const router = useRouter();

  const [simulation, setSimulation] = useState<SimulationGenerationResponse | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    try {
      const rawSimulation = sessionStorage.getItem(ACTIVE_SIMULATION_KEY);

      if (!rawSimulation) {
        setLoadError("Nenhum simulado ativo foi encontrado nesta sessão.");
        return;
      }

      const parsedSimulation: SimulationGenerationResponse = JSON.parse(rawSimulation);
      setSimulation(parsedSimulation);

      const rawAnswers = sessionStorage.getItem(ACTIVE_SIMULATION_ANSWERS_KEY);
      if (rawAnswers) {
        const parsedAnswers: Record<number, string> = JSON.parse(rawAnswers);
        setAnswers(parsedAnswers);
      }
    } catch {
      setLoadError("Não foi possível carregar o simulado salvo localmente.");
    }
  }, []);

  useEffect(() => {
    if (!simulation) return;

    sessionStorage.setItem(ACTIVE_SIMULATION_ANSWERS_KEY, JSON.stringify(answers));
  }, [answers, simulation]);

  const questions = simulation?.questions ?? [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] ?? null;

  const answeredCount = useMemo(() => {
    return questions.filter((question) => {
      const value = answers[question.number];
      return typeof value === "string" && value.trim() !== "";
    }).length;
  }, [questions, answers]);

  const unansweredCount = totalQuestions - answeredCount;
  const progressPercentage = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  function handleSelectAnswer(questionNumber: number, optionKey: string) {
    setAnswers((current) => ({
      ...current,
      [questionNumber]: optionKey,
    }));
  }

  function handleClearAnswer(questionNumber: number) {
    setAnswers((current) => {
      const next = { ...current };
      delete next[questionNumber];
      return next;
    });
  }

  function goToQuestion(index: number) {
    if (index < 0 || index >= totalQuestions) return;
    setCurrentIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmitSimulation() {
    if (!simulation) return;

    const confirmed = window.confirm(
      "Deseja finalizar o simulado e enviar para correção?"
    );

    if (!confirmed) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        exam_type: simulation.exam_type,
        year: simulation.year,
        question_numbers: simulation.question_numbers,
        answers: simulation.question_numbers.map((number) => answers[number] ?? null),
      };

      const response = await fetch(`${API_BASE_URL}/simulados/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = await safeReadError(response);
        throw new Error(errorMessage || "Não foi possível corrigir o simulado.");
      }

      const result: SimulationSubmissionResponse = await response.json();

      sessionStorage.setItem(
        LAST_SIMULATION_RESULT_KEY,
        JSON.stringify({
          simulation,
          answers,
          result,
        })
      );

      sessionStorage.removeItem(ACTIVE_SIMULATION_ANSWERS_KEY);

      router.push("/dashboard/simulados/resultado");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao enviar o simulado."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 py-10 text-center">
          <div className="w-full rounded-3xl border border-red-500/30 bg-red-500/10 p-8 shadow-xl">
            <h1 className="text-2xl font-bold">Simulado não encontrado</h1>
            <p className="mt-3 text-sm text-red-100">{loadError}</p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard/simulados"
                className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black"
              >
                Voltar para simulados
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!simulation || !currentQuestion) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-xl">
            <p className="text-sm text-neutral-300">Carregando simulado...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Resolver simulado
              </span>

              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                {simulation.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-300 sm:text-sm">
                <Badge>{simulation.exam_type.toUpperCase()}</Badge>
                <Badge>{String(simulation.year)}</Badge>
                <Badge>
                  {simulation.mode === "balanced" ? "Balanceado" : "Aleatório"}
                </Badge>
                <Badge>{simulation.generated_question_count} questões</Badge>
              </div>
            </div>

            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-neutral-300">Progresso</span>
                <span className="font-semibold text-white">
                  {answeredCount}/{totalQuestions} respondidas
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                <span>{progressPercentage}% concluído</span>
                <span>{unansweredCount} em branco</span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <div className="mb-5 flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-neutral-400">
                  Questão {currentIndex + 1} de {totalQuestions}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  Nº {currentQuestion.number}
                </h2>
                <p className="mt-2 text-sm text-neutral-400">
                  Disciplina: {currentQuestion.subject}
                </p>
                {currentQuestion.source_pdf_label ? (
                  <p className="mt-1 text-xs text-neutral-500">
                    Referência: {currentQuestion.source_pdf_label}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleClearAnswer(currentQuestion.number)}
                  className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Limpar resposta
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="whitespace-pre-line text-sm leading-7 text-neutral-100 sm:text-base">
                  {currentQuestion.statement}
                </p>
              </div>

              <div className="space-y-3">
                {OPTION_ORDER.filter((key) => currentQuestion.options[key]).map((key) => {
                  const isSelected = answers[currentQuestion.number] === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectAnswer(currentQuestion.number, key)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-emerald-400/50 bg-emerald-400/10"
                          : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <span
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                            isSelected
                              ? "border-emerald-300 bg-emerald-300 text-black"
                              : "border-white/20 text-white"
                          }`}
                        >
                          {key}
                        </span>
                        <span className="whitespace-pre-line text-sm leading-6 text-neutral-100">
                          {currentQuestion.options[key]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Questão anterior
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSubmitSimulation}
                  disabled={isSubmitting}
                  className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Enviando..." : "Finalizar e corrigir"}
                </button>

                <button
                  type="button"
                  onClick={() => goToQuestion(currentIndex + 1)}
                  disabled={currentIndex === totalQuestions - 1}
                  className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima questão
                </button>
              </div>
            </div>

            {submitError ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                {submitError}
              </div>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <h3 className="text-lg font-semibold">Mapa de questões</h3>
              <p className="mt-1 text-sm text-neutral-400">
                Clique em uma questão para navegar rapidamente.
              </p>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const selectedAnswer = answers[question.number];
                  const isCurrent = index === currentIndex;
                  const isAnswered = !!selectedAnswer;

                  return (
                    <button
                      key={question.number}
                      type="button"
                      onClick={() => goToQuestion(index)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        isCurrent
                          ? "border-emerald-300 bg-emerald-300 text-black"
                          : isAnswered
                          ? "border-sky-400/40 bg-sky-400/10 text-sky-100"
                          : "border-white/10 bg-black/20 text-neutral-300 hover:bg-white/5"
                      }`}
                    >
                      {question.number}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 space-y-2 text-xs text-neutral-400">
                <Legend color="bg-emerald-300" text="Questão atual" />
                <Legend color="bg-sky-400/70" text="Respondida" />
                <Legend color="bg-white/20" text="Em branco" />
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
              <h3 className="text-lg font-semibold">Resumo</h3>

              <div className="mt-4 space-y-3">
                <InfoRow label="ID do simulado" value={simulation.simulation_id} />
                <InfoRow label="Respondidas" value={String(answeredCount)} />
                <InfoRow label="Em branco" value={String(unansweredCount)} />
                <InfoRow
                  label="Disciplinas"
                  value={simulation.subjects_used.join(", ") || "Todas"}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs leading-6 text-amber-100">
                As respostas são mantidas localmente durante esta sessão para evitar
                perda acidental de progresso.
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
      {children}
    </span>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-3 w-3 rounded-full ${color}`} />
      <span>{text}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 text-sm last:border-b-0 last:pb-0">
      <span className="text-neutral-400">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-white">{value}</span>
    </div>
  );
}

async function safeReadError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: unknown) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: string }).msg);
          }
          return "Erro de validação.";
        })
        .join(" | ");
    }

    return "Erro na requisição.";
  } catch {
    return "Erro na requisição.";
  }
}