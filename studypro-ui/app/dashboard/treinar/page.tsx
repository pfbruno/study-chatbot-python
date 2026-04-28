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
  generateRandomSimulation,
  getSimulationEntitlement,
  type RandomSimulationResponse,
  type SimulationEntitlementResponse,
} from "@/lib/api";
import { trackActivityEvent } from "@/lib/activity-events";

const ACTIVE_SIMULATION_KEY = "studypro_active_simulation";
const ACTIVE_SIMULATION_ANSWERS_KEY = "studypro_active_simulation_answers";
const LAST_SIMULATION_RESULT_KEY = "studypro_last_simulation_result";

type TrainingPreset = {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  duration: number;
  subjects?: string[] | null;
  mode: "balanced" | "random";
  tag: string;
};

const TRAINING_PRESETS: TrainingPreset[] = [
  {
    id: "treino-misto-10",
    title: "Treino rápido misto",
    description:
      "Questões variadas para entrar no ritmo sem precisar configurar nada.",
    questionCount: 10,
    duration: 20,
    subjects: null,
    mode: "random",
    tag: "Começar agora",
  },
  {
    id: "treino-matematica-10",
    title: "Treino Matemática",
    description:
      "Sessão curta para ganhar velocidade de raciocínio e cálculo.",
    questionCount: 10,
    duration: 22,
    subjects: ["Matemática"],
    mode: "random",
    tag: "Foco",
  },
  {
    id: "treino-humanas-10",
    title: "Treino Humanas",
    description:
      "Questões aleatórias de Ciências Humanas para treinar leitura e interpretação.",
    questionCount: 10,
    duration: 22,
    subjects: ["Ciências Humanas"],
    mode: "random",
    tag: "Foco",
  },
  {
    id: "treino-natureza-10",
    title: "Treino Natureza",
    description:
      "Treino rápido com questões aleatórias de Ciências da Natureza.",
    questionCount: 10,
    duration: 22,
    subjects: ["Ciências da Natureza"],
    mode: "random",
    tag: "Foco",
  },
  {
    id: "treino-linguagens-10",
    title: "Treino Linguagens",
    description:
      "Sessão curta para fortalecer leitura, interpretação e linguagem.",
    questionCount: 10,
    duration: 20,
    subjects: ["Linguagens"],
    mode: "random",
    tag: "Foco",
  },
  {
    id: "treino-intensivo-20",
    title: "Treino intensivo misto",
    description:
      "Mais volume para uma sessão de estudo mais forte, ainda sem configuração manual.",
    questionCount: 20,
    duration: 40,
    subjects: null,
    mode: "random",
    tag: "Intensivo",
  },
];

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
          : "O modo Treinar foi pensado para começar rápido. No Pro você amplia volume e reduz limites diários."}
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

      <div className="mt-5">
        <button
          type="button"
          onClick={() => onStart(preset)}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4b8df7] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {loading ? "Preparando treino..." : "Começar treino"}
        </button>
      </div>
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

      const simulation: RandomSimulationResponse = await generateRandomSimulation(
        {
          exam_type: "enem",
          year: 2022,
          question_count: preset.questionCount,
          subjects: preset.subjects ?? null,
          mode: preset.mode,
          seed: null,
        },
        token
      );

      try {
        await trackActivityEvent({
          event_type: "simulation_started",
          module: "treinar",
          subject:
            preset.subjects && preset.subjects.length > 0
              ? preset.subjects.join(", ")
              : "Geral",
          metadata_json: {
            source: "training_mode",
            preset_id: preset.id,
            preset_title: preset.title,
            question_count: preset.questionCount,
            mode: preset.mode,
          },
        });
      } catch {
        // não bloqueia o treino se o tracking falhar
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
              Sem montar simulado, sem escolher várias opções, sem perder tempo.
              O treino gera questões aleatórias para você começar agora.
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