"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SimulationMode = "balanced" | "random";

type SubjectMetadata = {
  name: string;
  count: number;
};

type SimulationConfigResponse = {
  exam_type?: string;
  year?: number;
  title: string;
  total_questions: number;
  valid_questions: number;
  subjects: SubjectMetadata[];
};

type SimulationQuestion = {
  number: number;
  subject: string;
  statement: string;
  options: Record<string, string>;
  source_pdf_label?: string | null;
};

type EntitlementResponse = {
  authenticated: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    plan: "free" | "pro";
    is_active: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  usage: {
    scope: "guest" | "user";
    plan: "guest" | "free" | "pro";
    usage_date: string;
    simulations_generated_today: number;
    daily_limit: number | null;
    remaining_today: number | null;
    can_generate: boolean;
  };
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
  access?: {
    auth_scope: "guest" | "user";
    user: {
      id: number;
      name: string;
      email: string;
      plan: "free" | "pro";
      is_active: boolean;
      created_at: string;
      updated_at: string;
    } | null;
    usage: {
      scope: "guest" | "user";
      plan: "guest" | "free" | "pro";
      usage_date: string;
      simulations_generated_today: number;
      daily_limit: number | null;
      remaining_today: number | null;
      can_generate: boolean;
    };
  };
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

const DEFAULT_EXAM_TYPE = "enem";
const DEFAULT_YEAR = new Date().getFullYear() - 1;
const DEFAULT_QUESTION_COUNT = 10;

const SESSION_STORAGE_KEY = "studypro_active_simulation";
const AUTH_TOKEN_KEY = "studypro_auth_token";
const AUTH_USER_KEY = "studypro_auth_user";

export default function SimuladosPage() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<EntitlementResponse | null>(null);
  const [isLoadingEntitlement, setIsLoadingEntitlement] = useState(true);
  const [entitlementError, setEntitlementError] = useState("");

  const [examType, setExamType] = useState(DEFAULT_EXAM_TYPE);
  const [year, setYear] = useState<number>(DEFAULT_YEAR);
  const [questionCount, setQuestionCount] = useState<number>(DEFAULT_QUESTION_COUNT);
  const [mode, setMode] = useState<SimulationMode>("balanced");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [seed, setSeed] = useState<string>("");

  const [config, setConfig] = useState<SimulationConfigResponse | null>(null);
  const [generatedSimulation, setGeneratedSimulation] =
    useState<SimulationGenerationResponse | null>(null);

  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [configError, setConfigError] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const availableSubjects = useMemo(() => config?.subjects ?? [], [config]);

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    setAuthToken(storedToken);
  }, []);

  useEffect(() => {
    async function loadEntitlement() {
      setIsLoadingEntitlement(true);
      setEntitlementError("");

      try {
        const headers: HeadersInit = {};
        const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

        if (storedToken) {
          headers.Authorization = `Bearer ${storedToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/simulados/entitlement`, {
          method: "GET",
          headers,
          cache: "no-store",
        });

        if (!response.ok) {
          const message = await safeReadError(response);
          throw new Error(message || "Não foi possível carregar o status do plano.");
        }

        const data: EntitlementResponse = await response.json();
        setEntitlement(data);

        if (!data.authenticated) {
          localStorage.removeItem(AUTH_USER_KEY);
        } else if (data.user) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        }
      } catch (error) {
        setEntitlementError(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar o status do plano."
        );
      } finally {
        setIsLoadingEntitlement(false);
      }
    }

    loadEntitlement();
  }, [authToken]);

  useEffect(() => {
    async function loadSimulationConfig() {
      setIsLoadingConfig(true);
      setConfigError("");
      setGeneratedSimulation(null);
      setSuccessMessage("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/simulados/config/${encodeURIComponent(examType)}/${year}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          const errorData = await safeReadError(response);
          throw new Error(errorData || "Não foi possível carregar a configuração do simulado.");
        }

        const data: SimulationConfigResponse = await response.json();
        setConfig(data);

        setSelectedSubjects((current) =>
          current.filter((subject) =>
            (data.subjects ?? []).some((item) => item.name === subject)
          )
        );

        setQuestionCount((current) => {
          const maxAllowed = Math.max(1, data.valid_questions || data.total_questions || 1);
          if (current > maxAllowed) {
            return maxAllowed;
          }
          if (current < 1) {
            return 1;
          }
          return current;
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Erro inesperado ao carregar configuração do simulado.";
        setConfig(null);
        setConfigError(message);
      } finally {
        setIsLoadingConfig(false);
      }
    }

    loadSimulationConfig();
  }, [examType, year]);

  function toggleSubject(subjectName: string) {
    setSelectedSubjects((current) =>
      current.includes(subjectName)
        ? current.filter((subject) => subject !== subjectName)
        : [...current, subjectName]
    );
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setAuthToken(null);
    setEntitlement(null);
    setGeneratedSimulation(null);
    setSuccessMessage("");
  }

  async function handleGenerateSimulation() {
    setIsGenerating(true);
    setGenerationError("");
    setSuccessMessage("");
    setGeneratedSimulation(null);

    try {
      const payload = {
        exam_type: examType,
        year,
        question_count: questionCount,
        subjects: selectedSubjects.length > 0 ? selectedSubjects : null,
        mode,
        seed: seed.trim() ? Number(seed) : null,
      };

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/simulados/random`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await safeReadError(response);
        throw new Error(errorData || "Não foi possível gerar o simulado.");
      }

      const data: SimulationGenerationResponse = await response.json();
      setGeneratedSimulation(data);

      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      setSuccessMessage("Simulado gerado com sucesso. Você já pode seguir para resolver.");

      if (data.access?.usage) {
        setEntitlement((current) => {
          if (!current) {
            return {
              authenticated: !!data.access?.user,
              user: data.access?.user ?? null,
              usage: data.access.usage,
            };
          }

          return {
            authenticated: !!data.access?.user,
            user: data.access?.user ?? current.user,
            usage: data.access.usage,
          };
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro inesperado ao gerar o simulado.";
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  const maxQuestionCount = config?.valid_questions || config?.total_questions || 1;
  const canGenerate = entitlement?.usage?.can_generate ?? true;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Simulados
              </span>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Monte um simulado personalizado
              </h1>

              <p className="mt-3 max-w-3xl text-sm text-neutral-300 sm:text-base">
                Escolha prova, ano, quantidade de questões e disciplinas. O sistema usa o
                banco estruturado e exclui questões anuladas da geração.
              </p>
            </div>

            <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-lg font-semibold">Conta e plano</h2>

              {isLoadingEntitlement ? (
                <p className="mt-3 text-sm text-neutral-400">Carregando status...</p>
              ) : entitlementError ? (
                <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                  {entitlementError}
                </div>
              ) : entitlement ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <PlanInfoCard
                      label="Modo"
                      value={
                        entitlement.authenticated
                          ? entitlement.user?.plan === "pro"
                            ? "Usuário PRO"
                            : "Usuário Free"
                          : "Convidado"
                      }
                    />
                    <PlanInfoCard
                      label="Uso hoje"
                      value={`${entitlement.usage.simulations_generated_today}`}
                    />
                    <PlanInfoCard
                      label="Limite diário"
                      value={
                        entitlement.usage.daily_limit === null
                          ? "Ilimitado"
                          : String(entitlement.usage.daily_limit)
                      }
                    />
                    <PlanInfoCard
                      label="Restante hoje"
                      value={
                        entitlement.usage.remaining_today === null
                          ? "Ilimitado"
                          : String(entitlement.usage.remaining_today)
                      }
                    />
                  </div>

                  {entitlement.user ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                      Logado como{" "}
                      <span className="font-semibold text-white">
                        {entitlement.user.name}
                      </span>{" "}
                      ({entitlement.user.email})
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                      Você está usando como convidado. Crie uma conta para ampliar o uso e
                      preparar a ativação do plano PRO.
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {entitlement.authenticated ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Sair
                      </button>
                    ) : (
                      <>
                        <Link
                          href="/login?redirect=/dashboard/simulados"
                          className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-95"
                        >
                          Entrar
                        </Link>
                        <Link
                          href="/cadastro?redirect=/dashboard/simulados"
                          className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                        >
                          Criar conta
                        </Link>
                      </>
                    )}

                    {entitlement.user?.plan !== "pro" ? (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-200"
                      >
                        Upgrade PRO
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Configuração</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Defina os filtros antes de gerar o simulado.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FieldBlock label="Tipo de prova">
                <input
                  value={examType}
                  onChange={(event) => setExamType(event.target.value.toLowerCase())}
                  placeholder="enem"
                  className={inputClassName}
                />
              </FieldBlock>

              <FieldBlock label="Ano">
                <input
                  type="number"
                  value={year}
                  onChange={(event) => setYear(Number(event.target.value))}
                  min={1900}
                  max={2100}
                  className={inputClassName}
                />
              </FieldBlock>

              <FieldBlock label="Quantidade de questões">
                <input
                  type="number"
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                  min={1}
                  max={maxQuestionCount}
                  className={inputClassName}
                />
              </FieldBlock>

              <FieldBlock label="Modo de distribuição">
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value as SimulationMode)}
                  className={inputClassName}
                >
                  <option value="balanced">Balanceado</option>
                  <option value="random">Aleatório</option>
                </select>
              </FieldBlock>

              <FieldBlock
                label="Seed opcional"
                description="Use um número para reproduzir a mesma seleção."
              >
                <input
                  type="number"
                  value={seed}
                  onChange={(event) => setSeed(event.target.value)}
                  placeholder="Ex.: 123"
                  className={inputClassName}
                />
              </FieldBlock>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-neutral-300">
                    Disciplinas
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    Se nada for marcado, o simulado usará todas as disciplinas disponíveis.
                  </p>
                </div>
              </div>

              {isLoadingConfig ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
                  Carregando disciplinas e configuração do banco...
                </div>
              ) : configError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {configError}
                </div>
              ) : availableSubjects.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
                  Nenhuma disciplina disponível para esse tipo/ano.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {availableSubjects.map((subject) => {
                    const isSelected = selectedSubjects.includes(subject.name);

                    return (
                      <button
                        key={subject.name}
                        type="button"
                        onClick={() => toggleSubject(subject.name)}
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-emerald-400/50 bg-emerald-400/10"
                            : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{subject.name}</p>
                            <p className="mt-1 text-sm text-neutral-400">
                              {subject.count} questões válidas
                            </p>
                          </div>
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? "border-emerald-300 bg-emerald-300 text-black"
                                : "border-white/20 text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {!canGenerate && entitlement ? (
              <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                {entitlement.authenticated
                  ? "Seu limite diário do plano gratuito foi atingido. Faça upgrade para o PRO."
                  : "Seu limite diário como convidado foi atingido. Crie uma conta para continuar."}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleGenerateSimulation}
                disabled={
                  isGenerating || isLoadingConfig || !!configError || !canGenerate
                }
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? "Gerando simulado..." : "Gerar simulado"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSubjects([]);
                  setMode("balanced");
                  setSeed("");
                  setQuestionCount(DEFAULT_QUESTION_COUNT);
                  setGeneratedSimulation(null);
                  setGenerationError("");
                  setSuccessMessage("");
                }}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Limpar filtros
              </button>

              {generatedSimulation ? (
                <Link
                  href="/dashboard/simulados/resolver"
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
                >
                  Resolver agora
                </Link>
              ) : null}
            </div>

            {generationError ? (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {generationError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                {successMessage}
              </div>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <h2 className="text-xl font-semibold">Resumo do banco</h2>

              {isLoadingConfig ? (
                <p className="mt-4 text-sm text-neutral-400">Carregando resumo...</p>
              ) : config ? (
                <div className="mt-5 space-y-4">
                  <InfoRow label="Título" value={config.title} />
                  <InfoRow label="Tipo" value={examType.toUpperCase()} />
                  <InfoRow label="Ano" value={String(year)} />
                  <InfoRow
                    label="Questões válidas"
                    value={String(config.valid_questions || config.total_questions)}
                  />
                  <InfoRow label="Disciplinas" value={String(config.subjects.length)} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-neutral-400">
                  Selecione um tipo e ano válidos para carregar o banco.
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <h2 className="text-xl font-semibold">Último simulado gerado</h2>

              {!generatedSimulation ? (
                <p className="mt-4 text-sm text-neutral-400">
                  Ainda não há simulado gerado nesta sessão.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  <InfoRow label="ID" value={generatedSimulation.simulation_id} />
                  <InfoRow label="Prova" value={generatedSimulation.title} />
                  <InfoRow
                    label="Quantidade"
                    value={String(generatedSimulation.generated_question_count)}
                  />
                  <InfoRow
                    label="Modo"
                    value={
                      generatedSimulation.mode === "balanced" ? "Balanceado" : "Aleatório"
                    }
                  />
                  <InfoRow
                    label="Disciplinas usadas"
                    value={generatedSimulation.subjects_used.join(", ") || "Todas"}
                  />

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="mb-2 text-sm font-semibold text-neutral-200">
                      Questões selecionadas
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {generatedSimulation.question_numbers.map((number) => (
                        <span
                          key={number}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200"
                        >
                          {number}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/simulados/resolver"
                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-95"
                    >
                      Ir para resolução
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PlanInfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-neutral-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function FieldBlock({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-200">{label}</span>
      {children}
      {description ? (
        <span className="mt-2 block text-xs text-neutral-400">{description}</span>
      ) : null}
    </label>
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

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-500 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20";

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