"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getExamYears } from "@/lib/api";

export default function EnemPage() {
  const [years, setYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getExamYears();
        setYears(data.years || []);
      } catch (err) {
        setYears([]);
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar os anos do ENEM."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <div className="p-6">Carregando provas do ENEM...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-bold">Provas ENEM</h1>

      {years.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhum ano disponível no catálogo.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {years.map((year) => (
            <Link
              key={year}
              href={`/dashboard/provas/enem/${year}`}
              className="rounded-xl bg-white p-4 shadow transition hover:bg-gray-100"
            >
              {year}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}