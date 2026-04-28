"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import {
  Award,
  BarChart3,
  BookOpen,
  Clock,
  Crown,
  Flame,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";

import { useAnalyticsOverview } from "@/hooks/use-analytics-overview";

type AnalyticsTab = "evolution" | "subjects" | "history" | "gamification";

function StatCard({
  icon,
  value,
  label,
  helper,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  helper: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#071225] p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{label}</p>
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-400">{helper}</div>
    </article>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-2xl px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-[#2f7cff] text-white"
          : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
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
    <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-5">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, loading, error } = useAnalyticsOverview();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("evolution");

  const subjectData = useMemo(() => {
    return data?.subjectAccuracy?.filter((item) => item.questions > 0) ?? [];
  }, [data]);

  const evolutionData = useMemo(() => {
    return data?.evolutionData?.filter((item) => item.acerto > 0) ?? [];
  }, [data]);

  const weeklyQuestionData = useMemo(() => {
    return data?.weeklyStudyData?.filter((item) => item.questoes > 0) ?? [];
  }, [data]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-[#071225] p-6 text-slate-300">
        Carregando analytics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <section className="rounded-[32px] border border-red-500/20 bg-red-500/10 p-6">
          <h1 className="text-2xl font-semibold text-white">
            Não foi possível abrir o analytics
          </h1>
          <p className="mt-3 text-sm text-red-200">
            {error || "Erro inesperado ao carregar analytics."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#071225] transition hover:opacity-90"
            >
              Voltar ao dashboard
            </Link>

            <Link
              href="/dashboard/simulados"
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir para simulados
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const { overallStats, gamification } = data;

  const readyToClaim = gamification.challenges.filter((item) =>
    String(item.status) === "ready_to_claim"
  );

  const trackedChallenge =
    gamification.challenges.find((item) => Boolean(item.isTracked)) ?? null;

  return (
    <div className="max-w-7xl space-y-6">
      <section className="rounded-[32px] border border-white/10 bg-[#071225] p-6 shadow-[0_10px_40px_-28px_rgba(59,130,246,0.5)]">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white md:text-3xl">
            <BarChart3 className="size-7 text-blue-400" />
            Analytics
          </h1>
          <p className="mt-2 text-slate-400">
            Dados baseados nas tentativas, simulados, provas e eventos registrados.
            Esta página não exibe médias artificiais ou comparações inventadas.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Target className="size-5" />}
          value={`${overallStats.avgAccuracy}%`}
          label="Taxa de acerto"
          helper="Calculada com base nas tentativas registradas"
        />
        <StatCard
          icon={<BookOpen className="size-5 text-emerald-300" />}
          value={overallStats.totalQuestions.toLocaleString("pt-BR")}
          label="Questões feitas"
          helper={`${overallStats.totalSessions} sessão(ões) registradas`}
        />
        <StatCard
          icon={<Clock className="size-5" />}
          value={overallStats.avgTimePerQuestion}
          label="Tempo/questão"
          helper={`Sessão: ${overallStats.avgTimePerSession}`}
        />
        <StatCard
          icon={<TrendingUp className="size-5 text-emerald-300" />}
          value={`${overallStats.improvement > 0 ? "+" : ""}${overallStats.improvement}%`}
          label="Evolução"
          helper="Baseada no histórico disponível"
        />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Crown className="size-5 text-amber-300" />}
          value={`Nv ${gamification.profile.level}`}
          label="Nível atual"
          helper={`${gamification.profile.currentXP}/${gamification.profile.nextLevelXP} XP no nível`}
        />
        <StatCard
          icon={<Sparkles className="size-5 text-sky-300" />}
          value={gamification.profile.totalXP.toLocaleString("pt-BR")}
          label="XP total"
          helper="XP registrado na jornada do aluno"
        />
        <StatCard
          icon={<Trophy className="size-5 text-emerald-300" />}
          value={String(gamification.profile.completedChallenges)}
          label="Desafios concluídos"
          helper={`${readyToClaim.length} pronto(s) para resgate`}
        />
        <StatCard
          icon={<Award className="size-5 text-fuchsia-300" />}
          value={String(gamification.profile.unlockedAchievements)}
          label="Conquistas desbloqueadas"
          helper={`${gamification.profile.totalAchievements} no total`}
        />
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071225] p-4">
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "evolution"}
            onClick={() => setActiveTab("evolution")}
            label="Evolução"
          />
          <TabButton
            active={activeTab === "subjects"}
            onClick={() => setActiveTab("subjects")}
            label="Matérias"
          />
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            label="Histórico"
          />
          <TabButton
            active={activeTab === "gamification"}
            onClick={() => setActiveTab("gamification")}
            label="Gamificação"
          />
        </div>
      </section>

      {activeTab === "evolution" ? (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-lg font-semibold text-white">
              Evolução de acertos
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Exibe somente a evolução registrada do usuário. Nenhuma média de
              plataforma é exibida.
            </p>

            <div className="mt-6 h-[320px]">
              {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolutionData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="rgba(255,255,255,0.55)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.55)"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020b18",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 16,
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="acerto"
                      name="Taxa de acerto"
                      stroke="#4b8df7"
                      strokeWidth={3}
                      dot={{ fill: "#4b8df7", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="Sem evolução suficiente"
                  description="Resolva provas ou simulados para gerar histórico de evolução."
                />
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-lg font-semibold text-white">
              Questões registradas por dia
            </h2>

            <div className="mt-6 h-[320px]">
              {weeklyQuestionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.weeklyStudyData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="rgba(255,255,255,0.55)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.55)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020b18",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 16,
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="questoes"
                      name="Questões"
                      fill="#4b8df7"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="Sem ritmo semanal suficiente"
                  description="Os dados semanais aparecerão depois que houver tentativas registradas."
                />
              )}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "subjects" ? (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-lg font-semibold text-white">
              Desempenho por disciplina
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Apenas taxa de acerto real do usuário, sem comparação artificial.
            </p>

            <div className="mt-6 h-[360px]">
              {subjectData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="subject"
                      stroke="rgba(255,255,255,0.55)"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.55)"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020b18",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 16,
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="acerto"
                      name="Taxa de acerto"
                      fill="#4b8df7"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="Sem dados por disciplina"
                  description="Resolva atividades com disciplinas identificadas para preencher esta análise."
                />
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-lg font-semibold text-white">
              Resumo das matérias
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {subjectData.length > 0 ? (
                subjectData.map((item) => (
                  <article
                    key={item.subject}
                    className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
                  >
                    <p className="text-sm text-slate-400">{item.subject}</p>
                    <div className="mt-2 text-2xl font-bold text-white">
                      {item.acerto}%
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      {item.questions} questão(ões)
                    </p>
                  </article>
                ))
              ) : (
                <div className="md:col-span-2 xl:col-span-4">
                  <EmptyState
                    title="Nenhuma matéria registrada"
                    description="As matérias aparecerão quando houver tentativas com classificação por disciplina."
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "history" ? (
        <section className="space-y-6">
          <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
            <h2 className="text-lg font-semibold text-white">
              Histórico recente
            </h2>

            <div className="mt-6 space-y-4">
              {data.simuladoHistory.length === 0 ? (
                <EmptyState
                  title="Sem histórico suficiente"
                  description="Ainda não há histórico suficiente para exibir nesta aba."
                />
              ) : (
                data.simuladoHistory.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                          {item.type === "simulado" ? "Simulado" : "Prova"}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-white">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.date} • {item.questions} questão(ões)
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {item.score}%
                        </div>
                        <div className="text-sm text-slate-400">
                          desempenho registrado
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        </section>
      ) : null}

      {activeTab === "gamification" ? (
        <div className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-lg font-semibold text-white">
                Conquistas recentes
              </h2>

              <div className="mt-6 space-y-3">
                {data.gamification.recentUnlocks.length === 0 ? (
                  <EmptyState
                    title="Sem conquistas recentes"
                    description="Ainda não há conquistas recentes desbloqueadas."
                  />
                ) : (
                  data.gamification.recentUnlocks.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[22px] border border-white/10 bg-[#020b18] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-400">{item.rarity}</p>
                          <h3 className="mt-1 text-base font-semibold text-white">
                            {item.title}
                          </h3>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold text-white">
                            +{item.xpReward} XP
                          </div>
                          <div className="text-sm text-slate-400">
                            desbloqueada
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[28px] border border-white/10 bg-[#071225] p-6">
              <h2 className="text-lg font-semibold text-white">
                Leitura da progressão
              </h2>

              <div className="mt-6 grid gap-4">
                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Desafio em foco</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {trackedChallenge?.title || "Nenhum desafio acompanhado"}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Prontos para resgate</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {readyToClaim.length}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-[#020b18] p-4">
                  <p className="text-sm text-slate-400">Streak atual</p>
                  <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-white">
                    <Flame className="size-5 text-amber-300" />
                    {gamification.profile.streakDays} dias
                  </div>
                </div>
              </div>
            </article>
          </section>
        </div>
      ) : null}
    </div>
  );
}