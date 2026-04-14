"use client";

import { useEffect, useState } from "react";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("token");
    setToken(saved);
  }, []);

  const { data, loading, error } = useDashboardData(token);

  if (loading) return <div className="p-6">Carregando...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Questões resolvidas" value={data?.questions ?? 0} />
        <Card title="Acertos" value={data?.correct ?? 0} />
        <Card title="Erros" value={data?.wrong ?? 0} />
      </div>

      {/* INSIGHTS */}
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="font-semibold mb-2">Insights</h2>
        <p>{data?.insights || "Sem dados disponíveis"}</p>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}