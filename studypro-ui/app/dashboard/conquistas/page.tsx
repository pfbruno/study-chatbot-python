"use client";

import {
  Award,
  Brain,
  Crown,
  Flame,
  Layers3,
  Loader2,
  Medal,
  Moon,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  AUTH_TOKEN_KEY,
  type GamificationAchievement,
} from "@/lib/api";
import { useGamificationSummary } from "@/hooks/use-gamification";

type FilterValue = "all" | GamificationAchievement["status"];
type CategoryFilter = "all" | GamificationAchievement["category"];

function rarityStyles(rarity: GamificationAchievement["rarity"]) {
  if (rarity === "legendary") {
    return {
      badge: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
      ring: "from-yellow-400/30 via-amber-300/20 to-orange-400/20",
      label: "Lendária",
    };
  }

  if (rarity === "epic") {
    return {
      badge: "border-purple-400/30 bg-purple-400/10 text-purple-300",
      ring: "from-purple-400/30 via-fuchsia-400/20 to-violet-400/20",
      label: "Épica",
    };
  }

  if (rarity === "rare") {
    return {
      badge: "border-blue-400/30 bg-blue-400/10 text-blue-300",
      ring: "from-blue-400/30 via-cyan-400/20 to-sky-400/20",
      label: "Rara",
    };
  }

  return {
    badge: "border-white/10 bg-white/5 text-slate-300",
    ring: "from-white/10 via-white/5 to-white/5",
    label: "Comum",
  };
}

function iconForAchievement(icon: string) {
  switch (icon) {
    case "flame":
      return Flame;
    case "target":
      return Target;
    case "brain":
      return Brain;
    case "moon":
      return Moon;
    case "crown":
      return Crown;
    case "medal":
      return Medal;
    case "layers":
      return Layers3;
    case "calendar":
      return Star;
    case "sparkles":
      return Sparkles;
    case "trophy":
      return Trophy;
    default:
      return Award;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(date);
}

function ProgressLine({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-[#4b8df7]"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function XPProgressBar({
  currentXP,
  nextLevelXP,
}: {
  currentXP: number;
  nextLevelXP: number;
}) {
  const percent = Math.max(
    0,
    Math.min(100, Math.round((currentXP / Math.max(1, nextLevelXP)) * 100))
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>XP atual</span>
        <span>
          {currentXP} / {nextLevelXP}
        </span>
      </div>
      <ProgressLine value={percent} />
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#020b18] p-6">
      <div className="flex size-11 items-center justify-center rounded-2xl bg-white/5 text-blue-300">
        <Award className="size-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}

function AchievementCard({ item }: { item: GamificationAchievement }) {
  const rarity = rarityStyles(item.rarity);
  const Icon = iconForAchievement(item.icon);
  const progress =
    item.target > 0 ? Math.round((item.progress / item.target) * 100) : 0;

  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#071225] transition hover:border-[#2f7cff]/30 hover:bg-[#0a1730]">
      <div className={`h-2 bg-gradient-to-r ${rarity.ring}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
            <Icon className="size-6" />
          </div>

          <div
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${rarity.badge}`}
          >
            {rarity.label}
          </div>
        </div>

        <h3 className="mt-5 text-2xl font-bold tracking-tight text-white">
          {item.title}
        </h3>

        <p className="mt-3 min-h-[72px] text-sm leading-7 text-[#7ea0d6]">
          {item.description}
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-[#081224] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Status</span>
            <span className="font-semibold text-white">
              {item.status === "unlocked"
                ? "Desbloqueada"
                : item.status === "in_progress"
                  ? "Em progresso"
                  : "Bloqueada"}
            </span>
          </div>

          <div className="mt-4">
            <ProgressLine value={progress} />
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-[#7ea0d6]">
            <span>
              {item.progress}/{item.target}
            </span>
            <span>+{item.xpReward} XP</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>Categoria: {item.category}</span>
          <span>{item.unlockedAt ? formatDate(item.unlockedAt) : "Pendente"}</span>
        </div>
      </div>
    </article>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
    </article>
  );
}

export default function ConquistasPage() {
  const [token, setToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  useEffect(() => {
    setToken(localStorage.getItem(AUTH_TOKEN_KEY));
  }, []);

  const { data, loading, error } = useGamificationSummary(token);

  const achievements = data.achievements;
  const recentUnlocks = data.recentUnlocks;
  const weeklyEvolution = data.weeklyEvolution;
  const profile = data.profile;

  const hasAnyGamificationData =
    !!token &&
    !loading &&
    !error &&
    (profile.totalXP > 0 ||
      profile.streakDays > 0 ||
      achievements.length > 0 ||
      recentUnlocks.length > 0 ||
      weeklyEvolution.length > 0);

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    });
  }, [achievements, categoryFilter, statusFilter]);

  const unlockedPercent =
    profile.totalAchievements > 0
      ? Math.round(
          (profile.unlockedAchievements / Math.max(1, profile.totalAchievements)) *
            100
        )
      : 0;

  const totalWeekXP = weeklyEvolution.reduce((acc, item) => acc + item.xp, 0);
  const bestDay = [...weeklyEvolution].sort((a, b) => b.xp - a.xp)[0];

  if (!token) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[#071225] p-8">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Conquistas
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Faça login para acompanhar conquistas, XP e streaks reais.
          </p>
        </section>

        <EmptyState
          title="Sessão não encontrada"
          description="A área de conquistas não exibe dados de exemplo. Entre na sua conta para visualizar apenas informações reais."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#071225] p-6 text-sm text-slate-300">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin" />
          Carregando conquistas reais...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        {error}
      </div>
    );
  }

  if (!hasAnyGamificationData) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/10 bg-[#071225] p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7c8cff]/25 bg-[#7c8cff]/10 px-4 py-2 text-sm text-[#b7c0ff]">
            <Trophy className="size-4" />
            Gamificação MinhAprovação
          </div>

          <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
            Conquistas
          </h1>

          <p className="mt-4 max-w-3xl text-xl leading-9 text-[#7ea0d6]">
            Esta área exibirá somente dados reais registrados pela sua conta.
          </p>
        </section>

        <EmptyState
          title="Nenhuma conquista registrada ainda"
          description="Resolva simulados, revise conteúdos e conclua atividades para gerar XP e desbloquear conquistas reais."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8 shadow-[0_10px_50px_-28px_rgba(99,102,241,0.55)]">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#7c8cff]/25 bg-[#7c8cff]/10 px-4 py-2 text-sm text-[#b7c0ff]">
              <Trophy className="size-4" />
              Gamificação MinhAprovação
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
              Conquistas
            </h1>

            <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
              Acompanhe somente conquistas, XP e streaks registrados pelo backend.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <MetricCard label="Nível" value={String(profile.level)} />
              <MetricCard label="Streak" value={`${profile.streakDays} dias`} />
              <MetricCard
                label="Conquistas"
                value={`${profile.unlockedAchievements}/${profile.totalAchievements}`}
              />
              <MetricCard label="XP total" value={String(profile.totalXP)} />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#030b1d] p-6">
            <p className="text-sm text-slate-400">Perfil de evolução</p>
            <div className="mt-3 text-4xl font-bold text-white">
              {profile.userName}
            </div>

            <p className="mt-4 text-lg leading-8 text-slate-300">
              Os dados abaixo vêm da atividade real registrada na sua conta.
            </p>

            <div className="mt-6">
              <XPProgressBar
                currentXP={profile.currentXP}
                nextLevelXP={profile.nextLevelXP}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Coleção desbloqueada</span>
                <span className="font-semibold text-white">{unlockedPercent}%</span>
              </div>
              <div className="mt-3">
                <ProgressLine value={unlockedPercent} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.95fr_0.95fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
              <Flame className="size-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Streak atual
              </h2>
              <p className="mt-1 text-sm text-[#7ea0d6]">
                Sequência registrada
              </p>
            </div>
          </div>

          <div className="mt-6 text-5xl font-bold text-white">
            {profile.streakDays} dias
          </div>

          <p className="mt-3 text-base leading-7 text-[#7ea0d6]">
            Este valor é calculado a partir das atividades registradas.
          </p>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                XP semanal
              </h2>
              <p className="mt-1 text-sm text-[#7ea0d6]">
                Soma dos registros recentes
              </p>
            </div>
          </div>

          <div className="mt-6 text-5xl font-bold text-white">{totalWeekXP}</div>

          <p className="mt-3 text-base leading-7 text-[#7ea0d6]">
            Melhor dia:{" "}
            <span className="font-semibold text-white">
              {bestDay?.label ?? "—"}
            </span>{" "}
            com {bestDay?.xp ?? 0} XP.
          </p>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
              <Medal className="size-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Próximas vitórias
              </h2>
              <p className="mt-1 text-sm text-[#7ea0d6]">
                Conquistas em progresso
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {achievements.filter((item) => item.status === "in_progress").length > 0 ? (
              achievements
                .filter((item) => item.status === "in_progress")
                .slice(0, 3)
                .map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#081224] p-4"
                  >
                    <div className="text-sm font-semibold text-white">
                      {item.title}
                    </div>
                    <div className="mt-2 text-sm text-[#7ea0d6]">
                      {item.progress}/{item.target} • +{item.xpReward} XP
                    </div>
                  </div>
                ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-[#081224] p-4 text-sm text-slate-400">
                Nenhuma conquista em progresso no momento.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Catálogo de conquistas
              </h2>
              <p className="mt-2 text-base text-[#7ea0d6]">
                Filtre e acompanhe desbloqueios reais
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterValue)}
                className="h-12 rounded-2xl border border-white/10 bg-[#081224] px-4 text-sm font-medium text-white outline-none"
              >
                <option value="all">Todos os status</option>
                <option value="unlocked">Desbloqueadas</option>
                <option value="in_progress">Em progresso</option>
                <option value="locked">Bloqueadas</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as CategoryFilter)
                }
                className="h-12 rounded-2xl border border-white/10 bg-[#081224] px-4 text-sm font-medium text-white outline-none"
              >
                <option value="all">Todas as categorias</option>
                <option value="study">Estudo</option>
                <option value="consistency">Constância</option>
                <option value="performance">Desempenho</option>
                <option value="social">Social</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {filteredAchievements.length > 0 ? (
              filteredAchievements.map((item) => (
                <AchievementCard key={item.id} item={item} />
              ))
            ) : (
              <div className="xl:col-span-2">
                <EmptyState
                  title="Nenhuma conquista neste filtro"
                  description="Altere os filtros ou conclua novas atividades para desbloquear conquistas."
                />
              </div>
            )}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Desbloqueios recentes
            </h2>
            <p className="mt-2 text-base text-[#7ea0d6]">
              Últimas conquistas confirmadas
            </p>

            <div className="mt-6 space-y-4">
              {recentUnlocks.length > 0 ? (
                recentUnlocks.map((item) => {
                  const rarity = rarityStyles(item.rarity);

                  return (
                    <div
                      key={item.id}
                      className="rounded-[22px] border border-white/10 bg-[#081224] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-lg font-semibold text-white">
                            {item.title}
                          </div>
                          <div className="mt-2 text-sm text-[#7ea0d6]">
                            Desbloqueada em {formatDate(item.unlockedAt)}
                          </div>
                        </div>

                        <div
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${rarity.badge}`}
                        >
                          +{item.xpReward} XP
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  title="Nenhum desbloqueio recente"
                  description="As conquistas desbloqueadas aparecerão aqui."
                />
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Evolução semanal
            </h2>
            <p className="mt-2 text-base text-[#7ea0d6]">
              Distribuição do XP acumulado
            </p>

            <div className="mt-6 space-y-4">
              {weeklyEvolution.length > 0 ? (
                weeklyEvolution.map((point) => {
                  const max = Math.max(
                    ...weeklyEvolution.map((item) => item.xp),
                    1
                  );
                  const percent = Math.max(
                    8,
                    Math.round((point.xp / max) * 100)
                  );

                  return (
                    <div key={point.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-white">
                          {point.label}
                        </span>
                        <span className="text-[#7ea0d6]">{point.xp} XP</span>
                      </div>
                      <ProgressLine value={percent} />
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  title="Sem evolução semanal"
                  description="O gráfico será exibido quando houver eventos de XP registrados."
                />
              )}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
