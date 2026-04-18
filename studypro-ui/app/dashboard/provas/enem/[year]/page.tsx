"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getExamByTypeAndYear, type ExamDetail } from "@/lib/api";

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

function buildFallbackExam(year: number): ExamDetail {
  if (year === 2022) {
    return {
      exam_type: "enem",
      institution: "ENEM",
      year: 2022,
      title: "ENEM 2022 — Prova Oficial",
      description:
        "Prova oficial do ENEM 2022 disponível para resolução completa e revisão posterior.",
      question_count: 180,
      pdfs: [],
      has_answer_key: true,
      official_page_url:
        "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2022",
    };
  }

  return {
    ...EMPTY_EXAM,
    year,
    title: `ENEM ${year}`,
    description: "Metadados oficiais da prova selecionada.",
  };
}

export default function ExamYearPage() {
  const params = useParams();
  const yearParam = params.year as string;

  const [exam, setExam] = useState<ExamDetail>(EMPTY_EXAM);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setWarning(null);

        const year = Number(yearParam);

        if (!Number.isInteger(year)) {
          throw new Error("Ano da prova inválido.");
        }

        try {
          const data = await getExamByTypeAndYear("enem", year);
          setExam(data);
        } catch {
          setExam(buildFallbackExam(year));
          setWarning(
            "A API publicada não retornou esta prova em produção. Foi exibido o fallback local da prova oficial."
          );
        }
      } finally {
        setLoading(false);
      }
    }

    if (yearParam) {
      void load();
    }
  }, [yearParam]);

  if (loading) {
    return <div className="p-6 text-white">Carregando prova...</div>;
  }

  return (
    <div className="space-y-6 p-6 text-white">
      {warning ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {warning}
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-bold">
          {exam.title || `ENEM ${yearParam}`}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {exam.description || "Metadados oficiais da prova selecionada."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard label="Instituição" value={exam.institution || "ENEM"} />
        <InfoCard label="Ano" value={String(exam.year || yearParam)} />
        <InfoCard label="Questões" value={String(exam.question_count || 0)} />
      </div>

      <div className="rounded-xl border border-white/10 bg-[#071225] p-4 shadow">
        <h2 className="mb-3 font-semibold text-white">Recursos disponíveis</h2>

        <div className="space-y-2 text-sm text-slate-300">
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
                className="text-blue-400 underline"
              >
                Abrir fonte oficial
              </a>
            ) : (
              "Não informada"
            )}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#071225] p-4 shadow">
        <h2 className="mb-3 font-semibold text-white">PDFs oficiais</h2>

        {exam.pdfs.length === 0 ? (
          <p className="text-sm text-slate-400">
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
                className="block rounded-lg border border-white/10 bg-[#020b18] p-3 transition hover:bg-[#0a1830]"
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
    <div className="rounded-xl border border-white/10 bg-[#071225] p-4 shadow">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}