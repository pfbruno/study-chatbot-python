"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";

import {
  AUTH_TOKEN_KEY,
  getSimulationEntitlement,
  type SimulationEntitlementResponse,
} from "@/lib/api";
import { trackActivityEvent } from "@/lib/activity-events";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

const TRAINING_SESSION_KEY = "studypro_training_session";
const TRAINING_ANSWERS_KEY = "studypro_training_answers";
const TRAINING_FILTER_KEY = "studypro_training_filter";
const TRAINING_CURRENT_INDEX_KEY = "studypro_training_current_index";
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result";

const OPTION_ORDER = ["A", "B", "C", "D", "E"] as const;

type TrainingFilterId =
  | "all"
  | "matematica"
  | "humanas"
  | "naturezas"
  | "linguagens";

type SimulationMode = "balanced" | "random";

type SimulationQuestion = {
  number: number;
  subject: string;
  statement: string;
  options: Record<string, string>;
  source_pdf_label?: string | null;
};

type GeneratedTrainingResponse = {
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
  simulation_source?: string | null;
};

type TrainingSession = {
  filterId: TrainingFilterId;
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
  chunks_loaded: number;
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

type TrainingFilterConfig = {
  id: TrainingFilterId;
  label: string;
  backendPresetId: string;
  chunkSize: number;
  chipTitle: string;
};

const TRAINING_FILTERS: TrainingFilterConfig[] = [
  {
    id: "all",
    label: "Todas",
    backendPresetId: "mix-10",
    chunkSize: 10,
    chipTitle: "Treino geral",
  },
  {
    id: "matematica",
    label: "Matemática",
    backendPresetId: "math-15",
    chunkSize: 10,
    chipTitle: "Treino Matemática",
  },
  {
    id: "humanas",
    label: "Humanas",
    backendPresetId: "humanas-15",
    chunkSize: 10,
    chipTitle: "Treino Humanas",
  },
  {
    id: "naturezas",
    label: "Naturezas",
    backendPresetId: "natureza-15",
    chunkSize: 10,
    chipTitle: "Treino Naturezas",
  },
  {
    id: "linguagens",
    label: "Linguagens",
    backendPresetId: "linguagens-15",
    chunkSize: 10,
    chipTitle: "Treino Linguagens",
  },
];

function getFilterConfig(filterId: TrainingFilterId): TrainingFilterConfig {
  return (
    TRAINING_FILTERS.find((item) => item.id === filterId) ?? TRAINING_FILTERS[0]
  );
}

function isTrainingFilterId(value: string | null): value is TrainingFilterId {
  return TRAINING_FILTERS.some((item) => item.id === value);
}

async function parseApiError(response: Response) {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") return data.detail;

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

    if (typeof data?.message === "string") return data.message;

    return "Erro na requisição.";
  } catch {
    return "Erro na requisição.";
  }
}

async function generateTrainingBatch(
  filterId: TrainingFilterId,
  token?: string | null
): Promise<GeneratedTrainingResponse> {
  const filter = getFilterConfig(filterId);

  const response = await fetch(
    `${API_URL}/simulados/library/${filter.backendPresetId}/generate?exam_type=enem`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ seed: null }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const data = (await response.json()) as GeneratedTrainingResponse;

  return {
    ...data,
    requested_question_count: filter.chunkSize,
    generated_question_count: Math.min(filter.chunkSize, data.questions.length),
    question_numbers: data.question_numbers.slice(0, filter.chunkSize),
    questions: data.questions.slice(0, filter.chunkSize),
  };
}

function mergeTrainingChunks(
  current: TrainingSession | null,
  nextChunk: GeneratedTrainingResponse,
  filterId: TrainingFilterId
): TrainingSession {
  if (!current) {
    return {
      ...nextChunk,
      filterId,
      chunks_loaded: 1,
    };
  }

  return {
    ...current,
    filterId,
    simulation_id: nextChunk.simulation_id,
    generated_at: nextChunk.generated_at,
    title: nextChunk.title,
    requested_question_count:
      current.requested_question_count + nextChunk.requested_question_count,
    generated_question_count:
      current.generated_question_count + nextChunk.generated_question_count,
    question_numbers: [...current.question_numbers, ...nextChunk.question_numbers],
    questions: [...current.questions, ...nextChunk.questions],
    subjects_used: Array.from(
      new Set([...current.subjects_used, ...nextChunk.subjects_used])
    ),
    chunks_loaded: current.chunks_loaded + 1,
  };
}

function getAnsweredCount(answers: Record<number, string>, total: number) {
  let count = 0;

  for (let index = 0; index < total; index += 1) {
    const value = answers[index];
    if (typeof value === "string" && value.trim() !== "") {
      count += 1;
    }
  }

  return count;
}

export default function TreinarPage() {
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] =
    useState<TrainingFilterId>("all");
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [entitlement, setEntitlement] =
    useState<SimulationEntitlementResponse | null>(null);
  const [loadingEntitlement, setLoadingEntitlement] = useState(true);

  const [loadingSession, setLoadingSession] = useState(true);
  const [generatingFirstBatch, setGeneratingFirstBatch] = useState(false);
  const [generatingNextBatch, setGeneratingNextBatch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const totalQuestions = session?.questions.length ?? 0;
  const currentQuestion = session?.questions[currentIndex] ?? null;
  const answeredCount = useMemo(
    () => getAnsweredCount(answers, totalQuestions),
    [answers, totalQuestions]
  );
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercentage = totalQuestions
    ? Math.round((answeredCount / totalQuestions) * 100)
    : 0;

  const isPro = entitlement?.entitlements.is_pro ?? false;
  const canGenerate = entitlement?.usage.can_generate ?? true;
  const remainingToday = entitlement?.usage.remaining_today;
  const dailyLimit = entitlement?.usage.daily_limit;

  useEffect(() => {
    async function loadEntitlement() {
      try {
        setLoadingEntitlement(true);
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const data = await getSimulationEntitlement(token);
        setEntitlement(data);
      } catch {
        setEntitlement(null);
      } finally {
        setLoadingEntitlement(false);
      }
    }

    void loadEntitlement();
  }, []);

  useEffect(() => {
    const savedFilterValue = sessionStorage.getItem(TRAINING_FILTER_KEY);
    const initialFilter = isTrainingFilterId(savedFilterValue)
      ? savedFilterValue
      : "all";

    setSelectedFilter(initialFilter);

    try {
      const rawSession = sessionStorage.getItem(TRAINING_SESSION_KEY);
      const rawAnswers = sessionStorage.getItem(TRAINING_ANSWERS_KEY);
      const rawCurrentIndex = sessionStorage.getItem(TRAINING_CURRENT_INDEX_KEY);

      if (rawSession) {
        const parsedSession = JSON.parse(rawSession) as TrainingSession;

        if (parsedSession?.filterId === initialFilter) {
          setSession(parsedSession);

          if (rawAnswers) {
            const parsedAnswers = JSON.parse(rawAnswers) as Record<number, string>;
            setAnswers(parsedAnswers);
          }

          if (rawCurrentIndex) {
            const parsedIndex = Number(rawCurrentIndex);
            if (!Number.isNaN(parsedIndex) && parsedIndex >= 0) {
              setCurrentIndex(
                Math.min(parsedIndex, (parsedSession.questions?.length ?? 1) - 1)
              );
            }
          }

          setLoadingSession(false);
          return;
        }
      }
    } catch {
      sessionStorage.removeItem(TRAINING_SESSION_KEY);
      sessionStorage.removeItem(TRAINING_ANSWERS_KEY);
      sessionStorage.removeItem(TRAINING_CURRENT_INDEX_KEY);
    }

    void startFreshTraining(initialFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session) return;
    sessionStorage.setItem(TRAINING_SESSION_KEY, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    sessionStorage.setItem(TRAINING_ANSWERS_KEY, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    sessionStorage.setItem(TRAINING_FILTER_KEY, selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    sessionStorage.setItem(TRAINING_CURRENT_INDEX_KEY, String(currentIndex));
  }, [currentIndex]);

  async function trackTrainingStart(
    filterId: TrainingFilterId,
    chunkIndex: number,
    questionCount: number
  ) {
    try {
      await trackActivityEvent({
        event_type: "simulation_started",
        module: "treinar",
        subject: getFilterConfig(filterId).label,
        metadata_json: {
          source: "training_mode",
          filter_id: filterId,
          filter_label: getFilterConfig(filterId).label,
          chunk_index: chunkIndex,
          question_count: questionCount,
        },
      });
    } catch {
      // Não bloqueia o treino se tracking falhar.
    }
  }

  async function startFreshTraining(filterId: TrainingFilterId) {
    if (!canGenerate && !isPro) {
      setLoadError(
        "Você atingiu o limite diário do plano gratuito. Tente novamente amanhã ou vá para o plano Pro."
      );
      setLoadingSession(false);
      return;
    }

    try {
      setGeneratingFirstBatch(true);
      setLoadingSession(true);
      setLoadError("");
      setActionError("");
      setSubmitError("");

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const firstChunk = await generateTrainingBatch(filterId, token);

      const newSession: TrainingSession = {
        ...firstChunk,
        filterId,
        chunks_loaded: 1,
      };

      setSelectedFilter(filterId);
      setSession(newSession);
      setAnswers({});
      setCurrentIndex(0);

      await trackTrainingStart(filterId, 1, firstChunk.questions.length);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o treino agora."
      );
    } finally {
      setGeneratingFirstBatch(false);
      setLoadingSession(false);
    }
  }

  async function appendNextBatch() {
    if (!session) return;

    if (!canGenerate && !isPro) {
      setActionError(
        "Você atingiu o limite diário do plano gratuito. Vá para o Pro ou tente novamente no próximo dia."
      );
      return;
    }

    try {
      setGeneratingNextBatch(true);
      setActionError("");

      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const nextChunk = await generateTrainingBatch(selectedFilter, token);

      const mergedSession = mergeTrainingChunks(session, nextChunk, selectedFilter);

      setSession(mergedSession);
      setCurrentIndex((prev) => prev + 1);

      await trackTrainingStart(
        selectedFilter,
        mergedSession.chunks_loaded,
        nextChunk.questions.length
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar mais questões agora."
      );
    } finally {
      setGeneratingNextBatch(false);
    }
  }

  async function handleChangeFilter(filterId: TrainingFilterId) {
    if (filterId === selectedFilter) return;

    if (answeredCount > 0 || currentIndex > 0) {
      const confirmed = window.confirm(
        "Trocar a disciplina reinicia o treino atual. Deseja continuar?"
      );

      if (!confirmed) return;
    }

    sessionStorage.removeItem(TRAINING_SESSION_KEY);
    sessionStorage.removeItem(TRAINING_ANSWERS_KEY);
    sessionStorage.removeItem(TRAINING_CURRENT_INDEX_KEY);

    setSelectedFilter(filterId);
    setSession(null);
    setAnswers({});
    setCurrentIndex(0);

    await startFreshTraining(filterId);
  }

  function handleSelectAnswer(index: number, optionKey: string) {
    setAnswers((current) => ({
      ...current,
      [index]: optionKey,
    }));
  }

  function handleClearAnswer(index: number) {
    setAnswers((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  }

  function goToQuestion(index: number) {
    if (!session) return;
    if (index < 0 || index >= session.questions.length) return;

    setCurrentIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleNext() {
    if (!session) return;

    if (currentIndex < session.questions.length - 1) {
      goToQuestion(currentIndex + 1);
      return;
    }

    await appendNextBatch();
  }

  async function handleSubmitTraining() {
    if (!session) return;

    const confirmed = window.confirm(
      "Deseja finalizar o treino e enviar para correção?"
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      setSubmitError("");

      const token = localStorage.getItem(AUTH_TOKEN_KEY);

      const payload = {
        exam_type: session.exam_type,
        year: session.year,
        question_numbers: session.question_numbers,
        answers: session.question_numbers.map(
          (_questionNumber, index) => answers[index] ?? null
        ),
      };

      const response = await fetch(`${API_URL}/simulados/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          (await parseApiError(response)) ||
            "Não foi possível corrigir o treino."
        );
      }

      const result =
        (await response.json()) as SimulationSubmissionResponse;

      sessionStorage.setItem(
        LAST_SIMULATION_RESULT_KEY,
        JSON.stringify({
          simulation: {
            ...session,
            title: `${getFilterConfig(selectedFilter).chipTitle} • ${session.questions.length} questões`,
            generated_question_count: session.questions.length,
            requested_question_count: session.questions.length,
            simulation_source: "training_mode",
          },
          answers,
          result,
        })
      );

      sessionStorage.removeItem(TRAINING_SESSION_KEY);
      sessionStorage.removeItem(TRAINING_ANSWERS_KEY);
      sessionStorage.removeItem(TRAINING_CURRENT_INDEX_KEY);

      router.push("/dashboard/simulados/resultado");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao enviar o treino."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentFilterConfig = getFilterConfig(selectedFilter);

  if (loadingSession && !session) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#071225] p-8">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <Loader2 className="size-4 animate-spin" />
          {generatingFirstBatch
            ? "Preparando seu treino..."
            : "Carregando treino..."}
        </div>
      </div>
    );
  }

  if (loadError && !session) {
    return (
      <div className="space-y-4">
        <div className="rounded-[32px] border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
          {loadError}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void startFreshTraining(selectedFilter)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <RotateCcw className="size-4" />
            Tentar novamente
          </button>

          {!isPro ? (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
            >
              <Sparkles className="size-4" />
              Ver plano Pro
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#071225] p-8 text-sm text-slate-300">
        Não foi possível carregar o treino.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Target className="size-4" />
              Modo Treinar
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
              Responda agora, sem etapa intermediária
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-[#7ea0d6]">
              O treino abre direto em questões. O filtro padrão é{" "}
              <span className="font-semibold text-white">Todas</span>, mas você
              pode alternar para uma disciplina específica a qualquer momento.
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5 xl:w-[360px]">
            <p className="text-sm text-slate-400">Seu treino hoje</p>

            <div className="mt-2 text-2xl font-bold text-white">
              {loadingEntitlement
                ? "Carregando..."
                : isPro
                  ? "Plano PRO ativo"
                  : typeof remainingToday === "number" &&
                      typeof dailyLimit === "number"
                    ? `${remainingToday} de ${dailyLimit} geração(ões) restantes`
                    : "Plano Free"}
            </div>

            <p className="mt-3 text-sm leading-7 text-slate-300">
              {isPro
                ? "Você pode estender o treino com muito mais liberdade."
                : "Ao chegar no fim do bloco atual, mais 10 questões são geradas no mesmo modo."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {TRAINING_FILTERS.map((filter) => {
            const isActive = selectedFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => void handleChangeFilter(filter.id)}
                disabled={generatingFirstBatch || generatingNextBatch || isSubmitting}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#2f7cff] text-white"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {actionError}
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {submitError}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[32px] border border-white/10 bg-[#071225] p-6">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
                <BookOpen className="size-3.5" />
                {currentFilterConfig.chipTitle}
              </div>

              <h2 className="mt-3 text-2xl font-bold text-white">
                Questão {currentIndex + 1} de {totalQuestions}
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                Nº {currentQuestion.number} • {currentQuestion.subject}
              </p>

              {currentQuestion.source_pdf_label ? (
                <p className="mt-1 text-xs text-slate-400">
                  Referência: {currentQuestion.source_pdf_label}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => handleClearAnswer(currentIndex)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Limpar resposta
            </button>
          </div>

          <div className="mt-6 whitespace-pre-line text-base leading-8 text-slate-100">
            {currentQuestion.statement}
          </div>

          <div className="mt-6 space-y-3">
            {OPTION_ORDER.filter((key) => currentQuestion.options[key]).map(
              (key) => {
                const isSelected = answers[currentIndex] === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectAnswer(currentIndex, key)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-emerald-400/50 bg-emerald-400/10"
                        : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          isSelected
                            ? "bg-emerald-400/20 text-emerald-200"
                            : "bg-white/10 text-slate-200"
                        }`}
                      >
                        {key}
                      </div>

                      <div className="text-sm leading-7 text-slate-100">
                        {currentQuestion.options[key]}
                      </div>
                    </div>
                  </button>
                );
              }
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="size-4" />
              Anterior
            </button>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmitTraining}
                disabled={isSubmitting || generatingFirstBatch || generatingNextBatch}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {isSubmitting ? "Corrigindo..." : "Finalizar e corrigir"}
              </button>

              <button
                type="button"
                onClick={() => void handleNext()}
                disabled={generatingNextBatch || isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generatingNextBatch ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
                {generatingNextBatch
                  ? "Gerando mais 10..."
                  : currentIndex === totalQuestions - 1
                    ? "Próxima questão"
                    : "Próxima questão"}
              </button>
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[#071225] p-5">
            <p className="text-sm text-slate-400">Progresso do treino</p>

            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="text-3xl font-bold text-white">
                {progressPercentage}%
              </div>

              <div className="text-right text-sm text-slate-300">
                {answeredCount}/{totalQuestions} respondidas
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#2f7cff] transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#020b18] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Carregadas
                </p>
                <div className="mt-2 text-2xl font-bold text-white">
                  {totalQuestions}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#020b18] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Em branco
                </p>
                <div className="mt-2 text-2xl font-bold text-white">
                  {unansweredCount}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              Sempre que você chegar ao fim deste bloco e tocar em{" "}
              <span className="font-semibold text-white">Próxima questão</span>,
              o sistema gera mais 10 perguntas no modo atual.
            </p>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#071225] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">Navegação rápida</p>
              <span className="text-xs text-slate-400">
                Lote {session.chunks_loaded}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2">
              {session.questions.map((question, index) => {
                const isCurrent = index === currentIndex;
                const isAnswered =
                  typeof answers[index] === "string" &&
                  answers[index].trim() !== "";

                return (
                  <button
                    key={`${question.number}-${index}`}
                    type="button"
                    onClick={() => goToQuestion(index)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      isCurrent
                        ? "bg-[#2f7cff] text-white"
                        : isAnswered
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
                          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/10 bg-[#071225] p-5">
            <p className="text-sm font-medium text-white">Ações rápidas</p>

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void startFreshTraining(selectedFilter)}
                disabled={generatingFirstBatch || generatingNextBatch || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="size-4" />
                Reiniciar este treino
              </button>

              <Link
                href="/dashboard/simulados"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                <BookOpen className="size-4" />
                Ir para simulados
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}