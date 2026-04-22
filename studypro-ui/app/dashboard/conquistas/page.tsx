"use client";

import {
  Award,
  Brain,
  Crown,
  Flame,
  Layers3,
  Medal,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  achievements,
  gamificationProfile,
  recentUnlocks,
  weeklyEvolution,
  type AchievementItem,
  type AchievementRarity,
  type AchievementStatus,
} from "@/lib/mock-gamification";

type FilterValue = "all" | AchievementStatus;
type CategoryFilter = "all" | AchievementItem["category"];

function rarityStyles(rarity: AchievementRarity) {
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
      return Sparkles;
    case "crown":
      return Crown;
    case "medal":
      return Medal;
    case "layers":
      return Layers3;
    case "calendar":
      return Star;
    default:
      return Award;
  }
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
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
    Math.min(100, Math.round((currentXP / nextLevelXP) * 100))
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

function AchievementCard({ item }: { item: AchievementItem }) {
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

          <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${rarity.badge}`}>
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

export default function ConquistasPage() {
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const filteredAchievements = useMemo(() => {
    return achievements.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    });
  }, [statusFilter, categoryFilter]);

  const unlockedPercent = Math.round(
    (gamificationProfile.unlockedAchievements /
      gamificationProfile.totalAchievements) *
      100
  );

  const totalWeekXP = weeklyEvolution.reduce((acc, item) => acc + item.xp, 0);
  const bestDay = [...weeklyEvolution].sort((a, b) => b.xp - a.xp)[0];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8 shadow-[0_10px_50px_-28px_rgba(99,102,241,0.55)]">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#7c8cff]/25 bg-[#7c8cff]/10 px-4 py-2 text-sm text-[#b7c0ff]">
              <Trophy className="size-4" />
              Gamificação StudyPro
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
              Conquistas
            </h1>

            <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
              Acompanhe sua evolução, desbloqueie marcos de estudo e transforme constância em progresso visível.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <MetricCard label="Nível" value={String(gamificationProfile.level)} />
              <MetricCard label="Streak" value={`${gamificationProfile.streakDays} dias`} />
              <MetricCard
                label="Conquistas"
                value={`${gamificationProfile.unlockedAchievements}/${gamificationProfile.totalAchievements}`}
              />
              <MetricCard label="XP total" value={String(gamificationProfile.totalXP)} />
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#030b1d] p-6">
            <p className="text-sm text-slate-400">Perfil de evolução</p>
            <div className="mt-3 text-4xl font-bold text-white">
              {gamificationProfile.userName}
            </div>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Seu progresso gamificado mostra consistência, qualidade de treino e proximidade dos próximos desbloqueios.
            </p>

            <div className="mt-6">
              <XPProgressBar
                currentXP={gamificationProfile.currentXP}
                nextLevelXP={gamificationProfile.nextLevelXP}
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
                Sequência contínua de estudo
              </p>
            </div>
          </div>

          <div className="mt-6 text-5xl font-bold text-white">
            {gamificationProfile.streakDays} dias
          </div>

          <p className="mt-3 text-base leading-7 text-[#7ea0d6]">
            Sua constância está acima da média recente e favorece evolução de longo prazo.
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
                Soma da evolução dos últimos 7 dias
              </p>
            </div>
          </div>

          <div className="mt-6 text-5xl font-bold text-white">{totalWeekXP}</div>

          <p className="mt-3 text-base leading-7 text-[#7ea0d6]">
            Melhor dia da semana: <span className="font-semibold text-white">{bestDay.label}</span> com {bestDay.xp} XP.
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
                Conquistas mais próximas de desbloquear
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {achievements
              .filter((item) => item.status === "in_progress")
              .slice(0, 3)
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#081224] p-4"
                >
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="mt-2 text-sm text-[#7ea0d6]">
                    {item.progress}/{item.target} • +{item.xpReward} XP
                  </div>
                </div>
              ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Catálogo de conquistas
              </h2>
              <p className="mt-2 text-base text-[#7ea0d6]">
                Filtre e acompanhe seus desbloqueios
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
            {filteredAchievements.map((item) => (
              <AchievementCard key={item.id} item={item} />
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Desbloqueios recentes
            </h2>
            <p className="mt-2 text-base text-[#7ea0d6]">
              Suas últimas conquistas confirmadas
            </p>

            <div className="mt-6 space-y-4">
              {recentUnlocks.map((item) => {
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

                      <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${rarity.badge}`}>
                        +{item.xpReward} XP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Evolução semanal
            </h2>
            <p className="mt-2 text-base text-[#7ea0d6]">
              Distribuição visual do XP acumulado
            </p>

            <div className="mt-6 space-y-4">
              {weeklyEvolution.map((point) => {
                const percent = Math.max(
                  8,
                  Math.round((point.xp / Math.max(...weeklyEvolution.map((item) => item.xp))) * 100)
                );

                return (
                  <div key={point.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-white">{point.label}</span>
                      <span className="text-[#7ea0d6]">{point.xp} XP</span>
                    </div>
                    <ProgressLine value={percent} />
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>
    </div>
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