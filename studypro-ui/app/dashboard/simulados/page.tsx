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
const DEFAULT_YEAR = 2022;
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
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  const [mode, setMode] = useState<SimulationMode>("balanced");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [seed, setSeed] = useState("");

  const [config, setConfig] = useState<SimulationConfigResponse | null>(null);
  const [generatedSimulation, setGeneratedSimulation] =
    useState<SimulationGenerationResponse | null>(null);

  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [configError, setConfigError] = useState("");
  const [generationError, setGenerationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const availableSubjects = useMemo(
    () => config?.subjects ?? [],
    [config]
  );

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    setAuthToken(storedToken);

    const storedSimulation = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSimulation) {
      try {
        setGeneratedSimulation(
          JSON.parse(storedSimulation) as SimulationGenerationResponse
        );
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
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
          throw new Error(
            errorData || "Não foi possível carregar a configuração do simulado."
          );
        }

        const data: SimulationConfigResponse = await response.json();
        setConfig(data);

        setSelectedSubjects((current) =>
          current.filter((subject) =>
            (data.subjects ?? []).some((item) => item.name === subject)
          )
        );

        setQuestionCount((current) => {
          const maxAllowed = Math.max(
            1,
            data.valid_questions || data.total_questions || 1
          );

          if (current > maxAllowed) return maxAllowed;
          if (current < 1) return 1;
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
        error instanceof Error
          ? error.message
          : "Erro inesperado ao gerar o simulado.";
      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  const maxQuestionCount = config?.valid_questions || config?.total_questions || 1;
  const canGenerate = entitlement?.usage?.can_generate ?? true;

  return (
    <main className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="mb-6 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
            Simulados
          </div>

          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-white">
            Monte um simulado personalizado
          </h1>

          <p className="mt-6 max-w-3xl text-xl leading-9 text-neutral-300">
            Escolha prova, ano, quantidade de questões e disciplinas. O sistema
            usa o banco estruturado e exclui questões anuladas da geração.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold text-white">Conta e plano</h2>

          {isLoadingEntitlement ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
              Carregando status...
            </div>
          ) : entitlementError ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {entitlementError}
            </div>
          ) : entitlement ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <PlanInfoCard
                  label="Modo"
                  value={
                    entitlement.usage.plan === "pro"
                      ? "Usuário PRO"
                      : entitlement.authenticated
                      ? "Usuário Free"
                      : "Convidado"
                  }
                />
                <PlanInfoCard
                  label="Uso hoje"
                  value={String(entitlement.usage.simulations_generated_today)}
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

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
                {entitlement.user ? (
                  <>
                    <span className="font-medium text-white">Logado como </span>
                    <span className="font-semibold text-white">
                      {entitlement.user.name}
                    </span>{" "}
                    ({entitlement.user.email})
                  </>
                ) : (
                  "Você está usando como convidado. Crie uma conta para ampliar o uso e preparar a ativação do plano PRO."
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
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
                      href="/login"
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      Entrar
                    </Link>

                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      Criar conta
                    </Link>
                  </>
                )}

                {entitlement.user?.plan !== "pro" ? (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-95"
                  >
                    Upgrade PRO
                  </Link>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-3xl font-semibold text-white">Configuração</h2>
          <p className="mt-3 text-base text-neutral-400">
            Defina os filtros antes de gerar o simulado.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <FieldBlock label="Tipo de prova">
              <input
                value={examType}
                onChange={(event) =>
                  setExamType(event.target.value.toLowerCase())
                }
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
                onChange={(event) =>
                  setQuestionCount(Number(event.target.value))
                }
                min={1}
                max={maxQuestionCount}
                className={inputClassName}
              />
            </FieldBlock>

            <FieldBlock label="Modo de distribuição">
              <select
                value={mode}
                onChange={(event) =>
                  setMode(event.target.value as SimulationMode)
                }
                className={inputClassName}
              >
                <option value="balanced">Balanceado</option>
                <option value="random">Aleatório</option>
              </select>
            </FieldBlock>

            <FieldBlock
              label="Seed opcional"
              description="Use um número para reproduzir o mesmo sorteio depois."
            >
              <input
                value={seed}
                onChange={(event) => setSeed(event.target.value)}
                placeholder="Ex.: 123"
                className={inputClassName}
              />
            </FieldBlock>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-semibold uppercase tracking-[0.2em] text-neutral-300">
              Disciplinas
            </h3>
            <p className="mt-3 text-base text-neutral-400">
              Se nada for marcado, o simulado usará todas as disciplinas
              disponíveis.
            </p>

            <div className="mt-6">
              {isLoadingConfig ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
                  Carregando disciplinas e configuração do banco...
                </div>
              ) : configError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                  {configError}
                </div>
              ) : availableSubjects.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
                  Nenhuma disciplina disponível para esse tipo/ano.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                            <p className="text-lg font-semibold text-white">
                              {subject.name}
                            </p>
                            <p className="mt-2 text-sm text-neutral-400">
                              {subject.count} questões válidas
                            </p>
                          </div>

                          <div
                            className={`mt-1 h-5 w-5 rounded-full border ${
                              isSelected
                                ? "border-emerald-300 bg-emerald-400"
                                : "border-white/20 bg-transparent"
                            }`}
                          >
                            {isSelected ? (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-black">
                                ✓
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {!canGenerate && entitlement ? (
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              {entitlement.authenticated
                ? "Seu limite diário do plano gratuito foi atingido. Faça upgrade para o PRO."
                : "Seu limite diário como convidado foi atingido. Crie uma conta para continuar."}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerateSimulation}
              disabled={isGenerating || isLoadingConfig || !canGenerate}
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
                className="inline-flex items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/10 px-5 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/15"
              >
                Resolver agora
              </Link>
            ) : null}
          </div>

          {generationError ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              {generationError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              {successMessage}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
            <h2 className="text-3xl font-semibold text-white">Resumo do banco</h2>

            {isLoadingConfig ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
                Carregando resumo...
              </div>
            ) : config ? (
              <div className="mt-6 space-y-4">
                <InfoRow label="Título" value={config.title} />
                <InfoRow label="Tipo" value={String(config.exam_type ?? examType).toUpperCase()} />
                <InfoRow label="Ano" value={String(config.year ?? year)} />
                <InfoRow
                  label="Questões válidas"
                  value={String(config.valid_questions)}
                />
                <InfoRow
                  label="Disciplinas"
                  value={String(config.subjects?.length ?? 0)}
                />
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
                Selecione um tipo e ano válidos para carregar o banco.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
            <h2 className="text-3xl font-semibold text-white">
              Último simulado gerado
            </h2>

            {!generatedSimulation ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-neutral-300">
                Ainda não há simulado gerado nesta sessão.
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm uppercase tracking-[0.18em] text-neutral-400">
                  Questões selecionadas
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {generatedSimulation.question_numbers.map((number) => (
                    <span
                      key={number}
                      className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-white"
                    >
                      {number}
                    </span>
                  ))}
                </div>

                <Link
                  href="/dashboard/simulados/resolver"
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Ir para resolução
                </Link>
              </div>
            )}
          </section>
        </div>
      </section>
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
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        {label}
      </p>
      <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
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
    <label className="block space-y-2">
      <span className="text-sm font-medium text-white">{label}</span>
      {children}
      {description ? (
        <span className="block text-xs text-neutral-500">{description}</span>
      ) : null}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
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