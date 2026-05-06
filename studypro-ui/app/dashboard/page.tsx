"use client";

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
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AUTH_TOKEN_KEY } from "@/lib/api";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { useGamificationSummary } from "@/hooks/use-gamification";

type DashboardTab = "evolucao" | "materias" | "simulados" | "detalhes";
type StudyGoal = "enem";
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

const STUDY_GOAL_KEY = "studypro_goal";
const SIMULATION_HISTORY_KEY = "studypro_simulation_history";

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
  return goal === "enem" ? "ENEM" : "ENEM";
}

function getGoalDescription(_goal: StudyGoal | null) {
  return "Foque em provas, simulados, treino rápido, correção detalhada e evolução por área do ENEM.";
}

function getNextAction(_goal: StudyGoal | null) {
  return "Gerar simulado ENEM";
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

  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const rawHistory = localStorage.getItem(SIMULATION_HISTORY_KEY);

    setToken(savedToken);
    localStorage.setItem(STUDY_GOAL_KEY, "enem");
    setGoal("enem");
    setGoalLoaded(true);

    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory) as SimulationHistoryEntry[];
        if (Array.isArray(parsed)) setSimulationHistory(parsed);
      } catch {
        localStorage.removeItem(SIMULATION_HISTORY_KEY);
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

  const gameProfile = gamification.profile;
  const gameAchievements = gamification.achievements;
  const gameRecentUnlocks = gamification.recentUnlocks;
  const gameWeeklyEvolution = gamification.weeklyEvolution;

  const hasGamificationData =
    !!token &&
    !gamificationLoading &&
    !gamificationError &&
    (gameProfile.totalXP > 0 ||
      gameProfile.streakDays > 0 ||
      gameAchievements.length > 0 ||
      gameRecentUnlocks.length > 0 ||
      gameWeeklyEvolution.length > 0 ||
      gamification.challenges.length > 0);

  const nextWins = gameAchievements
    .filter((item) => item.status === "in_progress")
    .slice(0, 3);

  const unlockedAchievementsCount = gameAchievements.filter(
    (item) => item.status === "unlocked"
  ).length;

  const todayQuestions = useMemo(() => {
    const today = new Date().toDateString();

    return simulationHistory.reduce((total, item) => {
      const itemDate = new Date(item.saved_at);
      if (Number.isNaN(itemDate.getTime())) return total;
      return itemDate.toDateString() === today
        ? total + item.total_questions
        : total;
    }, 0);
  }, [simulationHistory]);

  const topCards = useMemo(
    () => [
      {
        title: "Taxa de acerto",
        value: `${accuracyPercent.toFixed(0)}%`,
        subtitle:
          data.questions > 0
            ? "Calculada com questões registradas"
            : "Sem questões registradas",
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
        title: "Erros registrados",
        value: data.wrong.toLocaleString("pt-BR"),
        subtitle: `${data.correct.toLocaleString("pt-BR")} acerto(s) registrados`,
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
      data.correct,
      data.wrong,
      bestSimulationScore,
      latestSimulation,
    ]
  );

  const evolutionData = useMemo(() => {
    return [...simulationHistory]
      .reverse()
      .slice(-12)
      .map((item, index) => ({
        label: `${index + 1}`,
        acerto: Number(item.score_percentage.toFixed(1)),
      }));
  }, [simulationHistory]);

  const subjectData = useMemo(() => {
    const buckets = new Map<
      string,
      {
        subject: string;
        total: number;
        correct: number;
        wrong: number;
        blank: number;
      }
    >();

    for (const attempt of simulationHistory) {
      for (const subject of attempt.subjects_summary ?? []) {
        const current = buckets.get(subject.subject) ?? {
          subject: subject.subject,
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
        };

        current.total += subject.total;
        current.correct += subject.correct;
        current.wrong += subject.wrong;
        current.blank += subject.blank;
        buckets.set(subject.subject, current);
      }
    }

    return Array.from(buckets.values())
      .map((item) => ({
        ...item,
        acerto:
          item.total > 0
            ? Number(((item.correct / item.total) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [simulationHistory]);

  const weeklyData = useMemo(() => {
    const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - offset));
      return {
        key: date.toDateString(),
        day: labels[date.getDay()],
        questoes: 0,
      };
    });

    const byKey = new Map(days.map((item) => [item.key, item]));

    for (const attempt of simulationHistory) {
      const date = new Date(attempt.saved_at);
      if (Number.isNaN(date.getTime())) continue;

      const bucket = byKey.get(date.toDateString());
      if (bucket) {
        bucket.questoes += attempt.total_questions;
      }
    }

    return days;
  }, [simulationHistory]);

  const bestGameDay = [...gameWeeklyEvolution].sort((a, b) => b.xp - a.xp)[0];
  const totalWeekXP = gameWeeklyEvolution.reduce((acc, item) => acc + item.xp, 0);
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
      {gamificationError || billingError ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {[gamificationError, billingError].filter(Boolean).join(" | ")}
        </div>
      ) : null}

      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Target className="size-4" />
              Foco atual: ENEM
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white">
              Continue evoluindo com estratégia
            </h1>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              Foque em provas, simulados, treino rápido, correção detalhada e evolução por área do ENEM.
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
                  : "Gerar simulado ENEM"}
              </Link>

              <Link
                href="/dashboard/treinar"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:text-white"
              >
                Treinar agora
              </Link>
            </div>
          </div>

          <div className="grid w-full gap-4 xl:max-w-[420px]">
            <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <p className="text-sm text-slate-400">Atividade de hoje</p>
              <div className="mt-2 text-3xl font-bold text-white">
                {todayQuestions}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Questões registradas hoje em simulados locais
              </p>

              <p className="mt-5 text-sm leading-6 text-slate-400">
                Este número usa apenas histórico real salvo após correções de simulados.
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
          value={hasGamificationData ? `${gameProfile.streakDays} dias` : "N/D"}
          helper={hasGamificationData ? "Sequência real registrada" : "Sem registros de streak"}
        />
        <GameStatCard
          icon={<Sparkles className="size-5 text-blue-300" />}
          iconBg="bg-blue-500/15"
          title="XP total"
          value={hasGamificationData ? `${gameProfile.totalXP}` : "N/D"}
          helper={hasGamificationData ? `Nível ${gameProfile.level}` : "Sem XP registrado"}
        />
        <GameStatCard
          icon={<Award className="size-5 text-purple-300" />}
          iconBg="bg-purple-500/15"
          title="Conquistas"
          value={hasGamificationData ? `${unlockedAchievementsCount}/${gameAchievements.length}` : "N/D"}
          helper={hasGamificationData ? "Coleção desbloqueada" : "Sem conquistas registradas"}
        />
        <GameStatCard
          icon={<Swords className="size-5 text-emerald-300" />}
          iconBg="bg-emerald-500/15"
          title="Desafios"
          value={hasGamificationData ? `${gameProfile.completedChallenges}` : "N/D"}
          helper={hasGamificationData ? "Concluídos recentemente" : "Sem desafios concluídos"}
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
              ) : !hasGamificationData ? (
                <div className="text-sm leading-7 text-slate-400">
                  Nenhum XP real registrado ainda. Conclua atividades para iniciar a progressão.
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
              {gameWeeklyEvolution.length > 0 ? (
                <>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {bestGameDay?.label ?? "N/D"}
                  </p>
                  <p className="mt-3 text-sm text-slate-300">
                    {bestGameDay?.xp ?? 0} XP acumulados
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Total da semana: {totalWeekXP} XP
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Sem evolução semanal registrada.
                </p>
              )}
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
            {gameWeeklyEvolution.length > 0 ? (
              gameWeeklyEvolution.map((point) => {
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
              })
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4 text-sm text-slate-300">
                Nenhum XP semanal registrado ainda.
              </div>
            )}
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
            <article className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <h2 className="text-xl font-semibold text-white">
                Evolução de acertos
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Gráfico gerado somente a partir do histórico real de simulados corrigidos.
              </p>

              <div className="mt-6 h-[320px]">
                {evolutionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="acerto"
                        stroke="#2f7cff"
                        strokeWidth={3}
                        dot={false}
                        name="Taxa de acerto"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-[#071225] p-6 text-center text-sm leading-7 text-slate-400">
                    Sem histórico suficiente. Resolva e corrija simulados para exibir evolução real.
                  </div>
                )}
              </div>
            </article>
          ) : null}

          {activeTab === "materias" ? (
            <article className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <h2 className="text-xl font-semibold text-white">
                Desempenho por matéria
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Dados agregados a partir dos simulados corrigidos no histórico local.
              </p>

              <div className="mt-6 h-[360px]">
                {subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="subject" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="acerto" fill="#2f7cff" name="Taxa de acerto" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-[#071225] p-6 text-center text-sm leading-7 text-slate-400">
                    Sem dados por matéria. Corrija simulados com disciplinas identificadas para preencher esta seção.
                  </div>
                )}
              </div>
            </article>
          ) : null}

          {activeTab === "simulados" ? (
            <article className="rounded-[24px] border border-white/10 bg-[#020b18] p-5">
              <h2 className="text-xl font-semibold text-white">
                Questões registradas na semana
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Contabiliza somente questões de simulados salvos no histórico local.
              </p>

              <div className="mt-6 h-[360px]">
                {weeklyData.some((item) => item.questoes > 0) ? (
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
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-[#071225] p-6 text-center text-sm leading-7 text-slate-400">
                    Sem questões registradas nesta semana no histórico local.
                  </div>
                )}
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
        Dashboard principal sem dados mockados: as métricas exibidas vêm do backend
        ou do histórico local real de simulados corrigidos.
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
