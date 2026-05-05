"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  BookOpen,
  Crown,
  Loader2,
  Play,
  Sparkles,
  Target,
} from "lucide-react";

import {
  AUTH_TOKEN_KEY,
  getSimulationEntitlement,
  type RandomSimulationResponse,
  type SimulationEntitlementResponse,
} from "@/lib/api";
import { trackActivityEvent } from "@/lib/activity-events";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com";

const ACTIVE_SIMULATION_KEY = "studypro_active_simulation";
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers";
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result";

type TrainingPreset = {
  id: string;
  backendPresetId: string;
  title: string;
  description: string;
  questionCount: number;
  duration: number;
  tag: string;
  subjectLabel: string;
};

const TRAINING_PRESETS: TrainingPreset[] = [
  {
    id: "treino-misto-10",
    backendPresetId: "mix-10",
    title: "Treino rápido misto",
    description:
      "Questões variadas de todos os anos disponíveis para começar sem configurar nada.",
    questionCount: 10,
    duration: 20,
    tag: "Começar agora",
    subjectLabel: "Geral",
  },
  {
    id: "treino-matematica-15",
    backendPresetId: "math-15",
    title: "Treino Matemática",
    description:
      "Sessão curta para ganhar velocidade de raciocínio e cálculo.",
    questionCount: 15,
    duration: 30,
    tag: "Foco",
    subjectLabel: "Matemática",
  },
  {
    id: "treino-humanas-15",
    backendPresetId: "humanas-15",
    title: "Treino Humanas",
    description:
      "Questões de Ciências Humanas usando o banco consolidado multi-ano.",
    questionCount: 15,
    duration: 30,
    tag: "Foco",
    subjectLabel: "Ciências Humanas",
  },
  {
    id: "treino-natureza-15",
    backendPresetId: "natureza-15",
    title: "Treino Natureza",
    description:
      "Treino com questões de Ciências da Natureza de todos os anos disponíveis.",
    questionCount: 15,
    duration: 30,
    tag: "Foco",
    subjectLabel: "Ciências da Natureza",
  },
  {
    id: "treino-linguagens-15",
    backendPresetId: "linguagens-15",
    title: "Treino Linguagens",
    description:
      "Sessão para fortalecer leitura, interpretação e linguagem.",
    questionCount: 15,
    duration: 30,
    tag: "Foco",
    subjectLabel: "Linguagens",
  },
  {
    id: "treino-intensivo-20",
    backendPresetId: "mix-20-balanced",
    title: "Treino intensivo misto",
    description:
      "Sessão balanceada com mais volume, usando questões de diferentes anos.",
    questionCount: 20,
    duration: 40,
    tag: "Intensivo",
    subjectLabel: "Geral",
  },
];

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

async function generateTrainingSimulation(
  presetId: string,
  token?: string | null
) {
  const response = await fetch(
    `${API_URL}/simulados/library/${presetId}/generate?exam_type=enem`,
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

  return response.json() as Promise<RandomSimulationResponse>;
}

function EntitlementCard({
  entitlement,
  loading,
}: {
  entitlement: SimulationEntitlementResponse | null;
  loading: boolean;
}) {
  const isPro = entitlement?.entitlements.is_pro ?? false;
  const remaining = entitlement?.usage.remaining_today;
  const dailyLimit = entitlement?.usage.daily_limit;

  return (
    <div className="rounded-[24px] border border-white/10 bg-[#081224] p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
          <Sparkles className="size-4 text-blue-300" />
        </div>

        <div>
          <p className="text-sm text-slate-400">Seu treino hoje</p>
          <h3 className="text-lg font-semibold text-white">
            {loading
              ? "Carregando..."
              : isPro
                ? "Plano PRO ativo"
                : typeof remaining === "number" && typeof dailyLimit === "number"
                  ? `${remaining} de ${dailyLimit} geração(ões) restantes`
                  : "Plano Free"}
          </h3>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">
        {loading
          ? "Verificando acesso da sua conta."
          : isPro
            ? "Você pode iniciar treinos sem interrupção e com mais liberdade de uso."
            : "O modo Treinar gera uma sessão pronta em um clique. No Pro você amplia volume e reduz limites diários."}
      </p>
    </div>
  );
}

function TrainingCard({
  preset,
  onStart,
  loading,
}: {
  preset: TrainingPreset;
  onStart: (preset: TrainingPreset) => void;
  loading: boolean;
}) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-[#071225] p-5 transition hover:border-[#2f7cff]/30 hover:bg-[#0a1730]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
          <Target className="size-6" />
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
          {preset.tag}
        </span>
      </div>

      <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">
        {preset.title}
      </h3>

      <p className="mt-3 min-h-[72px] text-sm leading-7 text-[#7ea0d6]">
        {preset.description}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-[#020b18] p-4">
          <p className="text-sm text-slate-400">Questões</p>
          <div className="mt-2 text-2xl font-bold text-white">
            {preset.questionCount}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#020b18] p-4">
          <p className="text-sm text-slate-400">Tempo estimado</p>
          <div className="mt-2 text-2xl font-bold text-white">
            {preset.duration} min
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onStart(preset)}
        disabled={loading}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4b8df7] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        {loading ? "Preparando treino..." : "Começar treino"}
      </button>
    </article>
  );
}

export default function TreinarPage() {
  const router = useRouter();

  const [entitlement, setEntitlement] =
    useState<SimulationEntitlementResponse | null>(null);
  const [loadingEntitlement, setLoadingEntitlement] = useState(true);
  const [actionError, setActionError] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);

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

  const isPro = entitlement?.entitlements.is_pro ?? false;
  const canGenerate = entitlement?.usage.can_generate ?? true;

  const primaryPreset = useMemo(() => TRAINING_PRESETS[0], []);
  const otherPresets = useMemo(() => TRAINING_PRESETS.slice(1), []);

  async function handleStartTraining(preset: TrainingPreset) {
    if (!canGenerate && !isPro) {
      setActionError(
        "Você atingiu o limite diário do plano gratuito. Vá para o Pro ou tente novamente no próximo dia."
      );
      return;
    }

    try {
      setActionError("");
      setGeneratingId(preset.id);

      const token = localStorage.getItem(AUTH_TOKEN_KEY);

      const simulation = await generateTrainingSimulation(
        preset.backendPresetId,
        token
      );

      try {
        await trackActivityEvent({
          event_type: "simulation_started",
          module: "treinar",
          subject: preset.subjectLabel,
          metadata_json: {
            source: "training_mode",
            preset_id: preset.id,
            backend_preset_id: preset.backendPresetId,
            preset_title: preset.title,
            question_count: preset.questionCount,
            simulation_source: simulation.simulation_source ?? "library",
          },
        });
      } catch {
        // Não bloqueia o treino se o tracking falhar.
      }

      sessionStorage.setItem(ACTIVE_SIMULATION_KEY, JSON.stringify(simulation));
      sessionStorage.removeItem(ACTIVE_SIMULATION_ANSWERS_KEY);
      sessionStorage.removeItem(LAST_SIMULATION_RESULT_KEY);

      router.push("/dashboard/simulados/resolver");
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Não foi possível preparar o treino agora."
      );
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8 shadow-[0_10px_50px_-28px_rgba(59,130,246,0.45)]">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Brain className="size-4" />
              Modo Treinar
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
              Clique e comece a responder
            </h1>

            <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
              O treino usa questões do banco consolidado de provas disponíveis.
              Você escolhe um modo e começa em um clique.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleStartTraining(primaryPreset)}
                disabled={generatingId === primaryPreset.id}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generatingId === primaryPreset.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                {generatingId === primaryPreset.id
                  ? "Preparando treino..."
                  : "Começar treino agora"}
              </button>

              <Link
                href="/dashboard/simulados"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <BookOpen className="size-4" />
                Ver simulados
              </Link>

              {!isPro ? (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/15"
                >
                  <Crown className="size-4" />
                  Ver plano Pro
                </Link>
              ) : null}
            </div>

            {actionError ? (
              <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {actionError}
              </div>
            ) : null}
          </div>

          <EntitlementCard
            entitlement={entitlement}
            loading={loadingEntitlement}
          />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {otherPresets.map((preset) => (
          <TrainingCard
            key={preset.id}
            preset={preset}
            onStart={handleStartTraining}
            loading={generatingId === preset.id}
          />
        ))}
      </section>
    </div>
  );
}
