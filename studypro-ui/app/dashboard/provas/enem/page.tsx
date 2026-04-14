"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getExamYears } from "@/lib/api";

export default function EnemPage() {
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getExamYears();
        setYears(data.years || []);
      } catch {
        setYears([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Provas ENEM</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {years.map((year) => (
          <Link
            key={year}
            href={`/dashboard/provas/enem/${year}`}
            className="bg-white p-4 rounded-xl shadow hover:bg-gray-100"
          >
            {year}
          </Link>
        ))}
      </div>
    </div>
  );
}