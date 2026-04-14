"use client";

import { useEffect, useState } from "react";
import { AUTH_TOKEN_KEY } from "@/lib/api";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_TOKEN_KEY);
    setToken(saved);
  }, []);

  const { data, loading, error } = useDashboardData(token);

  if (loading) {
    return <div className="p-6">Carregando dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumo real da sua atividade recente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card title="Questões resolvidas" value={data.questions} />
        <Card title="Acertos estimados" value={data.correct} />
        <Card title="Erros estimados" value={data.wrong} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Streak atual" value={data.streak} />
        <Card title="Melhor streak" value={data.best_streak} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Insights</h2>
        <p>{data.insights}</p>
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-3 font-semibold">Tentativas recentes</h2>

        {data.recent_attempts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma tentativa recente encontrada.
          </p>
        ) : (
          <div className="space-y-3">
            {data.recent_attempts.map((attempt, index) => (
              <div
                key={`${attempt.exam_id ?? "exam"}-${index}`}
                className="rounded-lg border p-3"
              >
                <p className="font-medium">{attempt.title || "Prova"}</p>
                <p className="text-sm text-gray-500">
                  Nota: {attempt.score_percentage ?? 0}%
                </p>
                <p className="text-xs text-gray-400">
                  {attempt.created_at || "Sem data"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}