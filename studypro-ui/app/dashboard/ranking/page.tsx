"use client";

import {
  Crown,
  Flame,
  Loader2,
  Medal,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AUTH_TOKEN_KEY, type RankingUser } from "@/lib/api";
import { useGamificationRanking } from "@/hooks/use-gamification";

type RankingScope = "weekly" | "monthly" | "global";
type RankingAudience = "global" | "friends" | "course";

function scopeLabel(scope: RankingScope) {
  if (scope === "weekly") return "Semanal";
  if (scope === "monthly") return "Mensal";
  return "Global";
}

function movementLabel(movement: RankingUser["movement"]) {
  if (movement === "up") return "▲";
  if (movement === "down") return "▼";
  return "•";
}

function movementClass(movement: RankingUser["movement"]) {
  if (movement === "up") return "text-emerald-300";
  if (movement === "down") return "text-rose-300";
  return "text-slate-400";
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
    </article>
  );
}

function PodiumCard({
  user,
  place,
}: {
  user: RankingUser;
  place: 1 | 2 | 3;
}) {
  const heights = {
    1: "h-48",
    2: "h-40",
    3: "h-32",
  };

  const placeStyles = {
    1: "from-yellow-400/30 via-amber-300/20 to-orange-400/20 border-yellow-400/25",
    2: "from-slate-300/20 via-slate-200/10 to-slate-400/10 border-white/10",
    3: "from-orange-400/25 via-amber-400/15 to-yellow-500/10 border-orange-400/20",
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-3xl bg-[#0e2347] text-xl font-bold text-white">
        {user.avatar}
      </div>

      <div className="text-center">
        <div className="text-lg font-semibold text-white">{user.name}</div>
        <div className="mt-1 text-sm text-[#7ea0d6]">{user.xp} XP</div>
      </div>

      <div
        className={`mt-5 flex w-full max-w-[220px] flex-col items-center justify-end rounded-t-[28px] border bg-gradient-to-t px-4 pb-5 pt-6 ${heights[place]} ${placeStyles[place]}`}
      >
        <div className="text-sm text-slate-300">#{place}</div>
        <div className="mt-2 text-3xl font-bold text-white">{user.level}</div>
        <div className="text-sm text-slate-300">nível</div>
      </div>
    </div>
  );
}

export default function RankingPage() {
  const [token, setToken] = useState<string | null>(null);
  const [scope, setScope] = useState<RankingScope>("weekly");
  const [audience, setAudience] = useState<RankingAudience>("global");

  useEffect(() => {
    setToken(localStorage.getItem(AUTH_TOKEN_KEY));
  }, []);

  const { data, loading, error } = useGamificationRanking(token, scope);

  const ranking = data.items;
  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const currentUser = ranking.find((user) => user.highlight) ?? ranking[0];
  const topXP = ranking[0]?.xp ?? 1;
  const myGap = currentUser ? Math.max(0, topXP - currentUser.xp) : 0;

  return (
    <div className="space-y-8">
      {error ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(234,179,8,0.14),_rgba(3,11,29,1)_48%,_rgba(8,20,46,1)_100%)] p-8 shadow-[0_10px_50px_-28px_rgba(234,179,8,0.4)]">
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-300">
              <Trophy className="size-4" />
              Competição e progressão
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white">
              Ranking
            </h1>

            <p className="mt-4 max-w-3xl text-2xl leading-10 text-[#7ea0d6]">
              Compare evolução, acompanhe sua posição e use o ranking como alavanca de motivação e constância.
            </p>

            {loading ? (
              <div className="mt-8 flex items-center gap-3 text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                Carregando ranking real...
              </div>
            ) : (
              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <MetricCard label="Sua posição" value={currentUser ? `#${ranking.findIndex((u) => u.highlight) + 1}` : "—"} />
                <MetricCard label="Seu XP" value={String(currentUser?.xp ?? 0)} />
                <MetricCard label="Streak" value={`${currentUser?.streak ?? 0} dias`} />
                <MetricCard label="Gap para o topo" value={String(myGap)} />
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#030b1d] p-6">
            <p className="text-sm text-slate-400">Filtros de visualização</p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-3 text-sm text-slate-300">Período</div>
                <div className="flex flex-wrap gap-3">
                  {(["weekly", "monthly", "global"] as RankingScope[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setScope(item)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        scope === item
                          ? "bg-[#4b8df7] text-white"
                          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {scopeLabel(item)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-sm text-slate-300">Recorte</div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: "global", label: "Global", icon: Trophy },
                    { value: "friends", label: "Amigos", icon: Users },
                    { value: "course", label: "Turma", icon: Medal },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setAudience(item.value as RankingAudience)}
                        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                          audience === item.value
                            ? "bg-[#4b8df7] text-white"
                            : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                O backend real já alimenta o ranking por período. O recorte por amigos/turma fica preparado para a próxima etapa social.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
              <Crown className="size-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Pódio {scopeLabel(scope).toLowerCase()}
              </h2>
              <p className="mt-1 text-sm text-[#7ea0d6]">
                Top 3 do período selecionado
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex items-center gap-3 text-slate-300">
              <Loader2 className="size-4 animate-spin" />
              Montando pódio...
            </div>
          ) : (
            <div className="mt-8 grid items-end gap-5 md:grid-cols-3">
              {podium[1] ? <PodiumCard user={podium[1]} place={2} /> : <div />}
              {podium[0] ? <PodiumCard user={podium[0]} place={1} /> : <div />}
              {podium[2] ? <PodiumCard user={podium[2]} place={3} /> : <div />}
            </div>
          )}
        </article>

        <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Sua posição
              </h2>
              <p className="mt-1 text-sm text-[#7ea0d6]">
                Visão rápida do seu momento competitivo
              </p>
            </div>
          </div>

          {!loading && currentUser ? (
            <div className="mt-6 rounded-[24px] border border-[#2f7cff]/25 bg-[#2f7cff]/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-[#b8ccff]">Usuário</div>
                  <div className="mt-2 text-3xl font-bold text-white">
                    {currentUser.name}
                  </div>
                </div>

                <div className="rounded-full bg-[#0f1d3d] px-4 py-2 text-sm font-semibold text-[#79a6ff]">
                  #{ranking.findIndex((u) => u.id === currentUser.id) + 1}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <MiniInfo label="XP" value={String(currentUser.xp)} />
                <MiniInfo label="Aproveitamento" value={`${currentUser.accuracy}%`} />
                <MiniInfo label="Streak" value={`${currentUser.streak} dias`} />
                <MiniInfo label="Desafios" value={String(currentUser.completedChallenges)} />
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Distância para o topo</span>
                  <span>{myGap} XP</span>
                </div>
                <div className="mt-3">
                  <ProgressLine value={Math.round((currentUser.xp / topXP) * 100)} />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex items-center gap-3 text-slate-300">
              <Loader2 className="size-4 animate-spin" />
              Carregando sua posição...
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Continue completando desafios e mantendo constância para subir no ranking de forma sustentável.
          </div>
        </article>
      </section>

      {!loading ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
            <MetricCard label="Melhor XP do período" value={String(topXP)} />
            <MetricCard
              label="Maior streak do top 3"
              value={`${Math.max(...podium.map((item) => item?.streak ?? 0))} dias`}
            />
            <MetricCard
              label="Média de aproveitamento"
              value={`${Math.round(
                ranking.reduce((acc, item) => acc + item.accuracy, 0) / Math.max(1, ranking.length)
              )}%`}
            />
          </section>

          <section className="space-y-5">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">
                Ranking completo
              </h2>
              <p className="mt-2 text-base text-[#7ea0d6]">
                Classificação detalhada por XP, streak e desempenho
              </p>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#071225]">
              <div className="grid grid-cols-[80px_1.4fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 border-b border-white/10 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                <div>Pos.</div>
                <div>Usuário</div>
                <div>XP</div>
                <div>Streak</div>
                <div>Aproveit.</div>
                <div>Nível</div>
              </div>

              <div className="divide-y divide-white/10">
                {ranking.map((user, index) => (
                  <div
                    key={user.id}
                    className={`grid grid-cols-[80px_1.4fr_0.8fr_0.8fr_0.8fr_0.6fr] gap-4 px-6 py-5 ${
                      user.highlight ? "bg-[#0d1e3c]" : "bg-[#071225]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">#{index + 1}</span>
                      <span className={`text-sm font-semibold ${movementClass(user.movement)}`}>
                        {movementLabel(user.movement)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-[#0e2347] text-sm font-bold text-white">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-base font-semibold text-white">{user.name}</div>
                        {user.highlight ? (
                          <div className="mt-1 text-sm text-[#79a6ff]">Você</div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center text-base font-semibold text-white">
                      {user.xp}
                    </div>

                    <div className="flex items-center gap-2 text-base text-slate-300">
                      <Flame className="size-4 text-orange-300" />
                      {user.streak}
                    </div>

                    <div className="flex items-center text-base text-slate-300">
                      {user.accuracy}%
                    </div>

                    <div className="flex items-center text-base font-semibold text-white">
                      {user.level}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
                  <TrendingUp className="size-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Insight competitivo
                  </h2>
                  <p className="mt-1 text-sm text-[#7ea0d6]">
                    O que mais impacta sua subida
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-[#081224] p-5">
                <p className="text-lg leading-8 text-white">
                  Seu melhor caminho para subir no ranking ainda é combinar streak com conclusão de desafios semanais.
                </p>
                <p className="mt-4 text-sm leading-7 text-[#7ea0d6]">
                  Volume sem constância tende a oscilar mais do que uma rotina curta, porém contínua.
                </p>
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0e2347] text-[#79a6ff]">
                  <Star className="size-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    Próxima meta de posição
                  </h2>
                  <p className="mt-1 text-sm text-[#7ea0d6]">
                    Alvo sugerido para o próximo ciclo
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-[#081224] p-5">
                <div className="text-sm text-slate-400">Meta sugerida</div>
                <div className="mt-3 text-4xl font-bold text-white">
                  Subir 1 posição
                </div>
                <div className="mt-3 text-base leading-8 text-[#7ea0d6]">
                  Ganhe cerca de {Math.max(120, myGap - 40)} XP adicionais para disputar a posição imediatamente acima no recorte atual.
                </div>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#081224] p-4">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-xl font-bold text-white">{value}</div>
    </div>
  );
}