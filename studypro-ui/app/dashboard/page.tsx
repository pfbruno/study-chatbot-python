"use client";

import { trackStudyEvent } from "@/lib/study-events";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  Clock3,
  FileText,
  Flame,
  GraduationCap,
  History,
  Layers3,
  Loader2,
  Lock,
  Medal,
  Sparkles,
  Star,
  Swords,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AUTH_TOKEN_KEY } from "@/lib/api";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { useGamificationSummary } from "@/hooks/use-gamification";
import {
  achievements as fallbackAchievements,
  gamificationProfile as fallbackProfile,
  recentUnlocks as fallbackRecentUnlocks,
  weeklyEvolution as fallbackWeeklyEvolution,
} from "@/lib/mock-gamification";

type DashboardTab = "evolucao" | "materias" | "simulados" | "detalhes";
type StudyGoal = "enem" | "concursos" | "vestibular" | "faculdade";
type SimulationMode = "balanced" | "random";

type SimulationHistoryEntry = {
  id: string;
  saved_at: string;
  title: string;
  exam_type: string;
  year: number;
  mode: SimulationMode;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_count: number;
  score_percentage: number;
  subjects_summary: Array<{
    subject: string;
    total: number;
    correct: number;
    wrong: number;
    blank: number;
    accuracy_percentage: number;
  }>;
};

type ReviewSummaryPayload = {
  title: string;
  subtitle: string;
  revisionSummary: string;
  weakestSubjects: Array<{
    subject: string;
    accuracy: number;
    correct: number;
    wrong: number;
    blank: number;
  }>;
  generatedAt: string;
};

type ReviewCard = {
  id: string;
  subject: string;
  questionNumber: number;
  front: string;
  back: string;
};

const STUDY_GOAL_KEY = "studypro_goal";
const SIMULATION_HISTORY_KEY = "studypro_simulation_history";
const REVIEW_SUMMARY_KEY = "studypro_review_summary";
const REVIEW_FLASHCARDS_KEY = "studypro_review_flashcards";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatDate(value?: string) {
  if (!value) return "Sem data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getGoalLabel(goal: StudyGoal | null) {
  switch (goal) {
    case "enem":
      return "ENEM";
    case "concursos":
      return "Concursos";
    case "vestibular":
      return "Vestibular";
    case "faculdade":
      return "Faculdade";
    default:
      return "Estudos";
  }
}

function getGoalDescription(goal: StudyGoal | null) {
  switch (goal) {
    case "enem":
      return "Foque em questões, simulados e evolução por área do exame.";
    case "concursos":
      return "Priorize constância, revisão e desempenho por disciplina.";
    case "vestibular":
      return "Mantenha ritmo forte em simulados e identificação de lacunas.";
    case "faculdade":
      return "Acompanhe seu progresso e avance com revisões inteligentes.";
    default:
      return "Defina seu objetivo para personalizar sua experiência.";
  }
}

function getNextAction(goal: StudyGoal | null) {
  switch (goal) {
    case "enem":
      return "Gerar simulado ENEM";
    case "concursos":
      return "Resolver questões de concurso";
    case "vestibular":
      return "Fazer simulado vestibular";
    case "faculdade":
      return "Revisar conteúdo da matéria";
    default:
      return "Começar agora";
  }
}

function getDailyGoal(dataQuestions: number) {
  if (dataQuestions >= 300) return 30;
  if (dataQuestions >= 100) return 20;
  return 10;
}

function rarityLabel(value: string) {
  if (value === "legendary") return "Lendária";
  if (value === "epic") return "Épica";
  if (value === "rare") return "Rara";
  return "Comum";
}

function rarityClass(value: string) {
  if (value === "legendary") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
  }
  if (value === "epic") {
    return "border-purple-400/30 bg-purple-400/10 text-purple-300";
  }
  if (value === "rare") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  }
  return "border-white/10 bg-white/5 text-slate-300";
}

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("evolucao");
  const [goal, setGoal] = useState<StudyGoal | null>(null);
  const [goalLoaded, setGoalLoaded] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState<
    SimulationHistoryEntry[]
  >([]);
  const [reviewSummary, setReviewSummary] =
    useState<ReviewSummaryPayload | null>(null);
  const [reviewFlashcards, setReviewFlashcards] = useState<ReviewCard[]>([]);

  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedGoal = localStorage.getItem(STUDY_GOAL_KEY) as StudyGoal | null;
    const rawHistory = localStorage.getItem(SIMULATION_HISTORY_KEY);
    const rawSummary = localStorage.getItem(REVIEW_SUMMARY_KEY);
    const rawFlashcards = localStorage.getItem(REVIEW_FLASHCARDS_KEY);

    setToken(savedToken);
    setGoal(savedGoal);
    setGoalLoaded(true);

    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory) as SimulationHistoryEntry[];
        if (Array.isArray(parsed)) setSimulationHistory(parsed);
      } catch {
        localStorage.removeItem(SIMULATION_HISTORY_KEY);
      }
    }

    if (rawSummary) {
      try {
        const parsed = JSON.parse(rawSummary) as ReviewSummaryPayload;
        if (parsed?.title && parsed?.revisionSummary) setReviewSummary(parsed);
      } catch {
        localStorage.removeItem(REVIEW_SUMMARY_KEY);
      }
    }

    if (rawFlashcards) {
      try {
        const parsed = JSON.parse(rawFlashcards) as ReviewCard[];
        if (Array.isArray(parsed)) setReviewFlashcards(parsed);
      } catch {
        localStorage.removeItem(REVIEW_FLASHCARDS_KEY);
      }
    }
  }, []);

  const { data, loading, error } = useDashboardData(token);
  const {
    data: billing,
    loading: billingLoading,
    error: billingError,
  } = useBillingStatus(token);

  const {
    data: gamification,
    loading: gamificationLoading,
    error: gamificationError,
  } = useGamificationSummary(token);

  const accuracyRate = useMemo(() => {
    if (!data.questions) return 0;
    return data.correct / data.questions;
  }, [data.correct, data.questions]);

  const accuracyPercent = useMemo(
    () => Number((accuracyRate * 100).toFixed(1)),
    [accuracyRate]
  );

  const baselinePercent = useMemo(() => {
    if (!data.questions) return 58;
    return clamp(Math.round(accuracyPercent - 14), 35, 90);
  }, [accuracyPercent, data.questions]);

  const estimatedTimePerQuestion = useMemo(() => {
    if (!data.questions) return "N/D";
    const seconds = clamp(Math.round(210 - accuracyPercent), 75, 240);
    const min = Math.floor(seconds / 60);
    const sec = String(seconds % 60).padStart(2, "0");
    return `${min}:${sec}`;
  }, [accuracyPercent, data.questions]);

  const currentPlan = billing?.user.plan ?? data.user?.plan ?? "free";
  const isPro = currentPlan === "pro";

  const simulationUsage = billing?.usage.simulations_generated_today ?? 0;
  const simulationLimit = billing?.usage.daily_limit ?? null;
  const simulationRemaining = billing?.usage.remaining_today ?? null;
  const canGenerateSimulation = billing?.usage.can_generate ?? true;

  const hasSmartInsights =
    billing?.entitlements.can_access_smart_insights ??
    data.entitlements?.can_access_smart_insights ??
    isPro;

  const latestSimulation = simulationHistory[0] ?? null;
  const bestSimulationScore =
    simulationHistory.length > 0
      ? Math.max(...simulationHistory.map((item) => item.score_percentage))
      : null;

  const gameProfile =
    token && gamification.profile.userName !== "Usuário"
      ? gamification.profile
      : fallbackProfile;

  const gameAchievements =
    token && gamification.achievements.length > 0
      ? gamification.achievements
      : fallbackAchievements;

  const gameRecentUnlocks =
    token && gamification.recentUnlocks.length > 0
      ? gamification.recentUnlocks
      : fallbackRecentUnlocks;

  const gameWeeklyEvolution =
    token && gamification.weeklyEvolution.length > 0
      ? gamification.weeklyEvolution
      : fallbackWeeklyEvolution;

  const nextWins = gameAchievements
    .filter((item) => item.status === "in_progress")
    .slice(0, 3);

  const unlockedAchievementsCount = gameAchievements.filter(
    (item) => item.status === "unlocked"
  ).length;

  const topCards = useMemo(
    () => [
      {
        title: "Taxa de acerto",
        value: `${accuracyPercent.toFixed(0)}%`,
        subtitle: "Base atual de desempenho",
        icon: <Target className="size-5 text-blue-400" />,
        iconBg: "bg-blue-500/15",
      },
      {
        title: "Questões feitas",
        value: data.questions.toLocaleString("pt-BR"),
        subtitle: `${data.attempts_count} tentativa(s) registradas`,
        icon: <BookOpen className="size-5 text-emerald-400" />,
        iconBg: "bg-emerald-500/15",
      },
      {
        title: "Tempo/questão",
        value: estimatedTimePerQuestion,
        subtitle: "Estimativa local",
        icon: <Clock3 className="size-5 text-blue-400" />,
        iconBg: "bg-blue-500/15",
      },
      {
        title: "Melhor simulado",
        value:
          bestSimulationScore !== null
            ? `${bestSimulationScore.toFixed(1)}%`
            : "N/D",
        subtitle: latestSimulation
          ? `Último: ${latestSimulation.score_percentage.toFixed(1)}%`
          : "Sem histórico local",
        icon: <History className="size-5 text-emerald-400" />,
        iconBg: "bg-emerald-500/15",
      },
    ],
    [
      accuracyPercent,
      data.questions,
      data.attempts_count,
      estimatedTimePerQuestion,
      bestSimulationScore,
      latestSimulation,
    ]
  );

  const evolutionData = useMemo(() => {
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const target = clamp(accuracyPercent || 52, 40, 95);
    const average = clamp(baselinePercent, 35, 90);

    return months.map((month, index) => {
      const progress = index / 11;
      const wave = Math.sin(index * 1.2) * 3;
      const userValue = clamp(
        Math.round(48 + progress * (target - 48) + wave),
        40,
        95
      );
      const avgValue = clamp(
        Math.round(average + Math.sin(index * 0.7) * 1.2),
        35,
        90
      );

      return {
        month,
        voce: userValue,
        media: avgValue,
      };
    });
  }, [accuracyPercent, baselinePercent]);

  const radarData = useMemo(() => {
    const base = clamp(accuracyPercent || 52, 35, 95);

    return [
      { subject: "Mate", voce: clamp(base + 4, 25, 100), media: clamp(base - 6, 20, 100) },
      { subject: "Biol", voce: clamp(base + 2, 25, 100), media: clamp(base - 7, 20, 100) },
      { subject: "Quím", voce: clamp(base + 1, 25, 100), media: clamp(base - 5, 20, 100) },
      { subject: "Físi", voce: clamp(base - 3, 25, 100), media: clamp(base - 9, 20, 100) },
      { subject: "Port", voce: clamp(base + 6, 25, 100), media: clamp(base - 4, 20, 100) },
      { subject: "Hist", voce: clamp(base - 1, 25, 100), media: clamp(base - 8, 20, 100) },
      { subject: "Geog", voce: clamp(base + 1, 25, 100), media: clamp(base - 6, 20, 100) },
      { subject: "Reda", voce: clamp(base + 5, 25, 100), media: clamp(base - 7, 20, 100) },
    ];
  }, [accuracyPercent]);

  const weeklyData = useMemo(() => {
    const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const total = Math.max(data.questions, 0);
    const accuracy = clamp(accuracyPercent || 50, 20, 95);

    return labels.map((day, index) => {
      const multiplier = [0.6, 0.45, 0.75, 0.3, 0.9, 1, 0.55][index];
      const questoes =
        total > 0
          ? Math.max(8, Math.round((total / 10) * multiplier))
          : [120, 90, 150, 60, 180, 200, 110][index];
      const minutos = Math.max(
        15,
        Math.round((questoes * (140 - accuracy)) / 60)
      );

      return {
        day,
        questoes,
        minutos,
      };
    });
  }, [accuracyPercent, data.questions]);

  const dailyGoal = useMemo(() => getDailyGoal(data.questions), [data.questions]);

  const completedToday = useMemo(() => {
    if (!data.questions) return 0;
    return clamp(Math.round(data.questions * 0.08), 0, dailyGoal);
  }, [data.questions, dailyGoal]);

  const dailyGoalPercent = useMemo(() => {
    if (!dailyGoal) return 0;
    return clamp(Math.round((completedToday / dailyGoal) * 100), 0, 100);
  }, [completedToday, dailyGoal]);

  const bestGameDay = [...gameWeeklyEvolution].sort((a, b) => b.xp - a.xp)[0];
  const totalWeekXP = gameWeeklyEvolution.reduce((acc, item) => acc + item.xp, 0);

  function handleSelectGoal(selectedGoal: StudyGoal) {
  localStorage.setItem(STUDY_GOAL_KEY, selectedGoal);
  setGoal(selectedGoal);

  void trackStudyEvent({
    eventType: "study_goal_selected",
    module: "dashboard",
    metadata: {
      goal: selectedGoal,
    },
  });
}

  function handleResetGoal() {
    localStorage.removeItem(STUDY_GOAL_KEY);
    setGoal(null);
  }

  if (!goalLoaded) {
    return (
      <div className="glass-panel rounded-[32px] p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando dashboard...
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[#071225] p-8 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
                <Sparkles className="size-4" />
                Personalize sua jornada
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
                Qual é o seu objetivo principal?
              </h1>

              <p className="mt-4 text-lg leading-8 text-slate-300">
                Escolha um foco inicial para organizar melhor seu painel,
                direcionar seus estudos e preparar sua experiência.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#020b18] px-5 py-5 text-sm text-slate-300 xl:max-w-sm">
              <p className="font-medium text-white">O que muda ao selecionar?</p>
              <ul className="mt-4 space-y-3 text-slate-300">
                <li>• Dashboard mais orientado para ação</li>
                <li>• Próximos passos mais claros</li>
                <li>• Base pronta para analytics e gamificação</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GoalCard
            title="ENEM"
            description="Para quem quer foco em simulados, desempenho por área e ritmo forte de evolução."
            onClick={() => handleSelectGoal("enem")}
          />
          <GoalCard
            title="Concursos"
            description="Para quem precisa de constância, revisão contínua e acompanhamento por disciplina."
            onClick={() => handleSelectGoal("concursos")}
          />
          <GoalCard
            title="Vestibular"
            description="Ideal para preparação direcionada, identificação de lacunas e treino frequente."
            onClick={() => handleSelectGoal("vestibular")}
          />
          <GoalCard
            title="Faculdade"
            description="Para organização acadêmica, revisão de conteúdos e acompanhamento de progresso."
            onClick={() => handleSelectGoal("faculdade")}
          />
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-panel rounded-[32px] p-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando analytics do dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(gamificationError || billingError) ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {[gamificationError, billingError].filter(Boolean).join(" | ")}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Target className="size-4" />
              Foco atual: {getGoalLabel(goal)}
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              Continue evoluindo com estratégia
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              {getGoalDescription(goal)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={
                  !isPro && !canGenerateSimulation
                    ? "/pricing"
                    : "/dashboard/simulados"
                }
                className="rounded-2xl bg-[#2f7cff] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {!isPro && !canGenerateSimulation
                  ? "Desbloquear Pro"
                  : getNextAction(goal)}
              </Link>

              <button
                type="button"
                onClick={handleResetGoal}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Trocar objetivo
              </button>
            </div>
          </div>

          <div className="grid w-full gap-4 xl:max-w-[420px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Meta do dia</p>
              <div className="mt-2 text-3xl font-bold text-white">
                {completedToday}/{dailyGoal}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Questões concluídas hoje
              </p>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#071225]">
                <div
                  className="h-full rounded-full bg-[#2f7cff]"
                  style={{ width: `${dailyGoalPercent}%` }}
                />
              </div>

              <p className="mt-3 text-sm text-slate-400">
                {dailyGoalPercent}% da meta diária
              </p>
            </div>

            <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-amber-100/80">Plano atual</p>
                  <h2 className="mt-2 text-xl font-semibold uppercase text-white">
                    {billingLoading ? "Carregando..." : currentPlan}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-amber-100">
                    {isPro
                      ? "Seu plano PRO está ativo. Os recursos premium já estão liberados."
                      : simulationLimit === null
                      ? "Seu plano gratuito está ativo."
                      : `Hoje você gerou ${simulationUsage}/${simulationLimit} simulado(s).`}
                  </p>

                  {!isPro && typeof simulationRemaining === "number" ? (
                    <p className="mt-2 text-sm text-amber-50/90">
                      Restante hoje: {simulationRemaining}
                    </p>
                  ) : null}
                </div>

                <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/15">
                  <Lock className="size-5 text-amber-200" />
                </div>
              </div>

              {!isPro ? (
                <Link
                  href="/pricing"
                  className="mt-5 inline-flex w-full justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                >
                  Desbloquear Pro
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr_1fr]">
        <GameStatCard
          icon={<Flame className="size-5 text-orange-300" />}
          iconBg="bg-orange-500/15"
          title="Streak atual"
          value={`${gameProfile.streakDays} dias`}
          helper="Sequência real registrada"
        />
        <GameStatCard
          icon={<Sparkles className="size-5 text-blue-300" />}
          iconBg="bg-blue-500/15"
          title="XP total"
          value={`${gameProfile.totalXP}`}
          helper={`Nível ${gameProfile.level}`}
        />
        <GameStatCard
          icon={<Award className="size-5 text-purple-300" />}
          iconBg="bg-purple-500/15"
          title="Conquistas"
          value={`${unlockedAchievementsCount}/${gameAchievements.length}`}
          helper="Coleção desbloqueada"
        />
        <GameStatCard
          icon={<Swords className="size-5 text-emerald-300" />}
          iconBg="bg-emerald-500/15"
          title="Desafios"
          value={`${gameProfile.completedChallenges}`}
          helper="Concluídos recentemente"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                <Trophy className="size-5 text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Gamificação
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Dados reais integrados ao painel principal
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href="/dashboard/conquistas"
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
              >
                Conquistas
              </Link>
              <Link
                href="/dashboard/desafios"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Desafios
              </Link>
              <Link
                href="/dashboard/ranking"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Ranking
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              {gamificationLoading ? (
                <div className="flex items-center gap-3 text-slate-300">
                  <Loader2 className="size-4 animate-spin" />
                  Sincronizando XP...
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">XP atual</p>
                      <p className="mt-2 text-3xl font-bold text-white">
                        {gameProfile.currentXP}/{gameProfile.nextLevelXP}
                      </p>
                    </div>
                    <div className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-300">
                      Nível {gameProfile.level}
                    </div>
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#071225]">
                    <div
                      className="h-full rounded-full bg-[#2f7cff]"
                      style={{
                        width: `${Math.round(
                          (gameProfile.currentXP / Math.max(1, gameProfile.nextLevelXP)) * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-sm text-slate-400">
                    Progresso até o próximo nível
                  </p>
                </>
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Melhor dia recente</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {bestGameDay?.label ?? "N/D"}
              </p>
              <p className="mt-3 text-sm text-slate-300">
                {bestGameDay?.xp ?? 0} XP acumulados
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Total da semana: {totalWeekXP} XP
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-purple-500/10">
              <Star className="size-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Próximas wins
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                O que está mais perto de desbloquear
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {nextWins.length > 0 ? (
              nextWins.map((item) => {
                const percent =
                  item.target > 0 ? Math.round((item.progress / item.target) * 100) : 0;

                return (
                  <div
                    key={item.id}
                    className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-white">
                          {item.title}
                        </div>
                        <div className="mt-2 text-sm text-[#7ea0d6]">
                          {item.progress}/{item.target} • +{item.xpReward} XP
                        </div>
                      </div>

                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${rarityClass(
                          item.rarity
                        )}`}
                      >
                        {rarityLabel(item.rarity)}
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#071225]">
                      <div
                        className="h-full rounded-full bg-[#2f7cff]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4 text-sm text-slate-300">
                Nenhuma conquista em progresso no momento.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Medal className="size-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Conquistas recentes
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Últimos desbloqueios confirmados
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/conquistas"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ver todas
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {gameRecentUnlocks.length > 0 ? (
              gameRecentUnlocks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-white">
                        {item.title}
                      </div>
                      <div className="mt-2 text-sm text-[#7ea0d6]">
                        Desbloqueada em {formatDate(item.unlockedAt)}
                      </div>
                    </div>

                    <div
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${rarityClass(
                        item.rarity
                      )}`}
                    >
                      +{item.xpReward} XP
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4 text-sm text-slate-300">
                Nenhuma conquista desbloqueada ainda.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                <TrendingUp className="size-5 text-blue-300" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Evolução gamificada
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  XP acumulado na última semana
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/ranking"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Abrir ranking
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {gameWeeklyEvolution.map((point) => {
              const max = Math.max(...gameWeeklyEvolution.map((item) => item.xp), 1);
              const percent = Math.max(8, Math.round((point.xp / max) * 100));

              return (
                <div key={point.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-white">{point.label}</span>
                    <span className="text-[#7ea0d6]">{point.xp} XP</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#020b18]">
                    <div
                      className="h-full rounded-full bg-[#2f7cff]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <CrossCtaCard
          href="/dashboard/conquistas"
          icon={<Award className="size-6 text-purple-300" />}
          title="Explorar conquistas"
          description="Veja o catálogo completo, raridades e desbloqueios mais próximos."
        />
        <CrossCtaCard
          href="/dashboard/desafios"
          icon={<Swords className="size-6 text-emerald-300" />}
          title="Acompanhar desafios"
          description="Missões diárias, semanais e especiais com progresso real."
        />
        <CrossCtaCard
          href="/dashboard/ranking"
          icon={<Trophy className="size-6 text-yellow-300" />}
          title="Subir no ranking"
          description="Compare seu XP, streak e evolução com os demais usuários."
        />
      </section>

      {latestSimulation ? (
        <section className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400">Último simulado corrigido</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {latestSimulation.title}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {formatDate(latestSimulation.saved_at)} •{" "}
                {latestSimulation.total_questions} questões •{" "}
                {latestSimulation.mode === "balanced"
                  ? "Balanceado"
                  : "Aleatório"}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="text-3xl font-bold text-white">
                {latestSimulation.score_percentage.toFixed(1)}%
              </div>
              <Link
                href="/dashboard/simulados"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Continuar treinando
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {(reviewSummary || reviewFlashcards.length > 0) && (
        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                  <GraduationCap className="size-5 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Continuar na Área de Estudo
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Seu hub de revisão já está pronto
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/estudo"
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
              >
                Abrir área
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <InfoStat
                label="Resumo salvo"
                value={reviewSummary ? "Sim" : "Não"}
              />
              <InfoStat
                label="Flashcards"
                value={String(reviewFlashcards.length)}
              />
              <InfoStat
                label="Último treino"
                value={latestSimulation ? "Disponível" : "N/D"}
              />
            </div>
          </article>

          {reviewSummary ? (
            <article className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                    <FileText className="size-5 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Último resumo
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Material de revisão salvo localmente
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/resumos"
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                >
                  Abrir resumo
                </Link>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-[#020b18] p-5 text-sm leading-7 text-slate-300">
                {reviewSummary.revisionSummary}
              </div>
            </article>
          ) : null}

          {reviewFlashcards.length > 0 ? (
            <article className="rounded-[24px] border border-white/10 bg-[#071225] p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-500/10">
                    <Layers3 className="size-5 text-blue-300" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Flashcards disponíveis
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Revise erros e questões em branco
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/flashcards"
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                >
                  Abrir flashcards
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <InfoStat
                  label="Total de cards"
                  value={String(reviewFlashcards.length)}
                />
                <InfoStat
                  label="Foco principal"
                  value={reviewFlashcards[0]?.subject ?? "N/D"}
                />
              </div>
            </article>
          ) : null}
        </section>
      )}

      <section>
        <div className="flex items-start gap-3">
          <div className="mt-1 flex size-10 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
            <BarChart3 className="size-5 text-blue-400" />
          </div>

          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Analytics
            </h1>
            <p className="mt-2 text-lg text-slate-300">
              Acompanhe sua evolução e identifique pontos de melhoria.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {topCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[24px] border border-white/10 bg-[#071225] px-5 py-5 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`flex size-10 items-center justify-center rounded-2xl ${card.iconBg}`}
              >
                {card.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-4xl font-bold tracking-tight text-white">
                  {card.value}
                </div>
                <div className="mt-1 text-base text-slate-300">
                  {card.title}
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-slate-400">{card.subtitle}</div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#071225]">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-4">
          <TabButton
            active={activeTab === "evolucao"}
            onClick={() => setActiveTab("evolucao")}
          >
            Evolução
          </TabButton>
          <TabButton
            active={activeTab === "materias"}
            onClick={() => setActiveTab("materias")}
          >
            Matérias
          </TabButton>
          <TabButton
            active={activeTab === "simulados"}
            onClick={() => setActiveTab("simulados")}
          >
            Simulados
          </TabButton>
          <TabButton
            active={activeTab === "detalhes"}
            onClick={() => setActiveTab("detalhes")}
          >
            Detalhes
          </TabButton>
        </div>

        <div className="p-5">
          {activeTab === "evolucao" ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <article className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
                <h2 className="text-xl font-semibold text-white">
                  Evolução de acertos vs média da plataforma
                </h2>

                <div className="mt-6 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="voce"
                        stroke="#2f7cff"
                        strokeWidth={3}
                        dot={false}
                        name="Você"
                      />
                      <Line
                        type="monotone"
                        dataKey="media"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        name="Média"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
                <h2 className="text-xl font-semibold text-white">
                  Radar de habilidades
                </h2>

                <div className="mt-6 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                      <PolarRadiusAxis stroke="#64748b" />
                      <Radar
                        name="Você"
                        dataKey="voce"
                        stroke="#2f7cff"
                        fill="#2f7cff"
                        fillOpacity={0.35}
                      />
                      <Radar
                        name="Média"
                        dataKey="media"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.18}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>
          ) : null}

          {activeTab === "materias" ? (
            <article className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <h2 className="text-xl font-semibold text-white">
                Desempenho por matéria
              </h2>

              <div className="mt-6 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={radarData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="subject" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="voce" fill="#2f7cff" name="Você" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="media" fill="#22c55e" name="Média" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          ) : null}

          {activeTab === "simulados" ? (
            <article className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <h2 className="text-xl font-semibold text-white">
                Estudo da semana
              </h2>

              <div className="mt-6 h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="questoes"
                      fill="#2f7cff"
                      name="Questões"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="minutos"
                      fill="#22c55e"
                      name="Minutos"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>
          ) : null}

          {activeTab === "detalhes" ? (
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <article className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
                <h2 className="text-xl font-semibold text-white">
                  Leitura inteligente do seu momento
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {hasSmartInsights
                    ? data.insights ||
                      "Você ainda não possui tentativas registradas. Resolva uma prova ou simulado para começar a gerar insights."
                    : "Insights inteligentes fazem parte do fluxo premium. Ative o Pro para desbloquear leitura avançada do seu desempenho."}
                </p>

                {!hasSmartInsights ? (
                  <Link
                    href="/pricing"
                    className="mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
                  >
                    Desbloquear insights
                  </Link>
                ) : null}
              </article>

              <article className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
                <h2 className="text-xl font-semibold text-white">
                  Histórico consolidado
                </h2>

                {data.recent_attempts.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-300">
                    Nenhuma tentativa recente encontrada.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {data.recent_attempts.map((attempt, index) => (
                      <div
                        key={`${attempt.created_at}-${index}`}
                        className="rounded-2xl border border-white/10 bg-[#071225] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-semibold text-white">
                              {attempt.title || "Prova"}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {formatDate(attempt.created_at)}
                            </div>
                          </div>

                          <div className="text-sm font-semibold text-blue-300">
                            Nota: {attempt.score_percentage ?? 0}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#071225] px-5 py-4 text-sm text-slate-400">
        Dashboard principal agora consome gamificação real do backend para XP,
        streak, conquistas recentes, desafios concluídos e próximas wins, com
        fallback visual local caso a API falhe.
      </section>
    </div>
  );
}

function GoalCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5 transition hover:border-[#2f7cff]/30 hover:bg-[#0a1730]">
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 rounded-2xl bg-[#2f7cff] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Selecionar objetivo
      </button>
    </article>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-[#2f7cff] text-white"
          : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-[#020b18] p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-bold text-white">{value}</div>
    </div>
  );
}

function GameStatCard({
  icon,
  iconBg,
  title,
  value,
  helper,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex size-10 items-center justify-center rounded-2xl ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-3xl font-bold tracking-tight text-white">
            {value}
          </div>
          <div className="mt-1 text-base text-slate-300">{title}</div>
        </div>
      </div>
      <div className="mt-5 text-sm text-slate-400">{helper}</div>
    </article>
  );
}

function CrossCtaCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[24px] border border-white/10 bg-[#071225] p-5 transition hover:border-[#2f7cff]/30 hover:bg-[#0a1730]"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347]">
        {icon}
      </div>
      <div className="mt-5 text-2xl font-bold tracking-tight text-white">
        {title}
      </div>
      <div className="mt-3 text-sm leading-7 text-[#7ea0d6]">
        {description}
      </div>
    </Link>
  );
}