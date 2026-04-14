"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getExamByYear, type ExamDetail } from "@/lib/api";

const EMPTY_EXAM: ExamDetail = {
  exam_type: "enem",
  institution: "ENEM",
  year: 0,
  title: "",
  description: "",
  question_count: 0,
  pdfs: [],
  has_answer_key: false,
  official_page_url: null,
};

export default function ExamYearPage() {
  const params = useParams();
  const year = params.year as string;

  const [exam, setExam] = useState<ExamDetail>(EMPTY_EXAM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getExamByYear(year);
        setExam(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar a prova."
        );
        setExam(EMPTY_EXAM);
      } finally {
        setLoading(false);
      }
    }

    if (year) {
      load();
    }
  }, [year]);

  if (loading) return <div className="p-6">Carregando prova...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{exam.title || `ENEM ${year}`}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {exam.description || "Metadados oficiais da prova selecionada."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard label="Instituição" value={exam.institution || "ENEM"} />
        <InfoCard label="Ano" value={String(exam.year || year)} />
        <InfoCard
          label="Questões"
          value={String(exam.question_count || 0)}
        />
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-3 font-semibold">Recursos disponíveis</h2>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Correção automática:</strong>{" "}
            {exam.has_answer_key ? "Disponível" : "Ainda não cadastrada"}
          </p>

          <p>
            <strong>Página oficial:</strong>{" "}
            {exam.official_page_url ? (
              <a
                href={exam.official_page_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                Abrir fonte oficial
              </a>
            ) : (
              "Não informada"
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-3 font-semibold">PDFs oficiais</h2>

        {exam.pdfs.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum PDF oficial cadastrado para esta edição.
          </p>
        ) : (
          <div className="space-y-3">
            {exam.pdfs.map((pdf) => (
              <a
                key={pdf.url}
                href={pdf.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border p-3 transition hover:bg-gray-50"
              >
                {pdf.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}