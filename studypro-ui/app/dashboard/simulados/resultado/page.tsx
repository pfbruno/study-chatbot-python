"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { saveRecentAttempt } from "@/lib/activity";

const RESULT_KEY = "studypro_last_simulation_result";

type ResultData = {
  simulation: any;
  answers: Record<number, string>;
  result: {
    total_questions: number;
    correct_answers: number;
    wrong_answers: number;
    unanswered_count: number;
    score_percentage: number;
    subjects_summary: any[];
    results_by_question: any[];
  };
};

export default function ResultadoSimuladoPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RESULT_KEY);
      if (!raw) {
        setError("Nenhum resultado encontrado.");
        return;
      }

      const parsed = JSON.parse(raw) as ResultData;
      setData(parsed);

      saveRecentAttempt({
        id: `simulado-${parsed.simulation.simulation_id}` ,
        module: "simulados",
        title: parsed.simulation.title ?? "Simulado",
        scorePercentage: parsed.result.score_percentage,
        correctAnswers: parsed.result.correct_answers,
        totalQuestions: parsed.result.total_questions,
        createdAt: new Date().toISOString(),
        subjects: parsed.result.subjects_summary?.map((item: any) => ({
          subject: item.subject,
          accuracyPercentage: item.accuracy_percentage,
        })) ?? [],
      });
    } catch {
      setError("Erro ao carregar resultado.");
    }
  }, []);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-black">
        <div className="text-center">
          <p>{error}</p>
          <Link href="/dashboard/simulados" className="text-emerald-400">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white bg-black">
        Carregando...
      </main>
    );
  }

  const { result } = data;

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <h1 className="text-3xl font-bold">Resultado do Simulado</h1>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <Stat label="Nota" value={`${result.score_percentage}%`} />
            <Stat label="Acertos" value={result.correct_answers} />
            <Stat label="Erros" value={result.wrong_answers} />
            <Stat label="Brancos" value={result.unanswered_count} />
          </div>
        </div>

        {/* POR DISCIPLINA */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Desempenho por disciplina</h2>

          <div className="space-y-3">
            {result.subjects_summary.map((s, i) => (
              <div key={i} className="border border-white/10 p-4 rounded-xl">
                <p className="font-semibold">{s.subject}</p>
                <p className="text-sm text-neutral-400">
                  {s.correct}/{s.total} acertos — {s.accuracy_percentage}%
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* QUESTÕES */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Correção detalhada</h2>

          <div className="space-y-3">
            {result.results_by_question.map((q, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border ${
                  q.status === "correct"
                    ? "border-green-500/30 bg-green-500/10"
                    : q.status === "wrong"
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-yellow-500/30 bg-yellow-500/10"
                }`}
              >
                <p className="font-semibold">Questão {q.question_number}</p>

                <p className="text-sm mt-1">
                  Sua resposta:{" "}
                  <span className="font-bold">
                    {q.user_answer || "—"}
                  </span>
                </p>

                <p className="text-sm">
                  Gabarito:{" "}
                  <span className="font-bold">{q.correct_answer}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AÇÕES */}
        <div className="flex gap-4">
          <Link
            href="/dashboard/simulados"
            className="bg-emerald-400 text-black px-6 py-3 rounded-xl font-semibold"
          >
            Novo simulado
          </Link>

          <button
            onClick={() => window.location.href = "/dashboard/simulados/resolver"}
            className="border border-white/20 px-6 py-3 rounded-xl"
          >
            Refazer
          </button>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="bg-black/30 p-4 rounded-xl">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}