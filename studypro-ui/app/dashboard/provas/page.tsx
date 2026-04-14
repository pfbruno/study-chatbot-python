"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExamTypes, type ExamType } from "@/lib/api";

export default function ProvasPage() {
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true);
        setError(null);

        const data = await getExamTypes();
        setExamTypes(data.exam_types || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao carregar provas."
        );
      } finally {
        setLoading(false);
      }
    }

    loadExams();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (examTypes.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Provas</h1>
        <p className="text-muted-foreground">
          Nenhuma instituição disponível no catálogo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provas</h1>
        <p className="text-muted-foreground">
          Escolha uma instituição para visualizar as provas disponíveis.
        </p>
        <Link
          href="/dashboard/provas/enem"
          className="mt-3 inline-flex rounded-lg border border-primary/40 bg-primary/10 px-3 py-1 text-sm text-primary"
        >
          Explorar ENEM
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {examTypes.map((exam) => (
          <Link key={exam.key} href={`/dashboard/provas/${exam.key}`}>
            <Card className="cursor-pointer transition hover:border-primary">
              <CardHeader className="flex flex-row items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>{exam.label}</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {exam.years.length} provas disponíveis
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}