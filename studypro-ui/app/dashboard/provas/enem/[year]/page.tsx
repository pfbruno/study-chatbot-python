"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getExamByYear } from "@/lib/api";

export default function ExamYearPage() {
  const params = useParams();
  const year = params.year as string;

  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getExamByYear(year);
        setQuestions(data.questions || []);
      } catch {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    if (year) load();
  }, [year]);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">ENEM {year}</h1>

      {questions.map((q, index) => (
        <div key={index} className="bg-white p-4 rounded-xl shadow">
          <p className="font-medium">{q.question}</p>

          <ul className="mt-2 space-y-1">
            {q.options?.map((opt: string, i: number) => (
              <li key={i} className="text-sm">
                {opt}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}