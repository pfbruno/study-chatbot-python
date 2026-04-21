import { useParams, Link, Navigate } from "react-router-dom";
import { ExamHero } from "@/components/exams/ExamHero";
import { ExamYearCard } from "@/components/exams/ExamYearCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, GraduationCap, BookOpenCheck, Trophy, FileText, Clock } from "lucide-react";
import { getInstitution, getEditionsByInstitution } from "@/data/mockExams";
import { ExamMetaCard } from "@/components/exams/ExamMetaCard";

const InstitutionHub = () => {
  const { institutionId } = useParams();
  const institution = getInstitution(institutionId || "");
  const editions = getEditionsByInstitution(institutionId || "");

  if (!institution) return <Navigate to="/app/provas" replace />;

  const completed = editions.filter((e) => e.status === "completed").length;
  const inProgress = editions.find((e) => e.status === "in_progress");
  const totalQuestions = editions.reduce((acc, e) => acc + e.totalQuestions, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <Link to="/app/provas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" /> Voltar ao catálogo
      </Link>

      <ExamHero
        title={institution.shortName}
        subtitle={institution.longDescription}
        badge={institution.name}
        icon={<GraduationCap className="w-7 h-7 text-primary" />}
        actions={
          inProgress && (
            <Button asChild className="gap-1.5">
              <Link to={`/app/provas/${institution.id}/${inProgress.year}`}>
                <Clock className="w-4 h-4" /> Continuar {inProgress.year}
              </Link>
            </Button>
          )
        }
      />

      {/* Meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ExamMetaCard icon={<BookOpenCheck className="w-4 h-4" />} label="Edições" value={editions.length} hint="provas disponíveis" />
        <ExamMetaCard icon={<FileText className="w-4 h-4" />} label="Questões" value={totalQuestions.toLocaleString("pt-BR")} hint="total no catálogo" />
        <ExamMetaCard icon={<Trophy className="w-4 h-4" />} label="Concluídas" value={completed} hint="por você" accent />
        <ExamMetaCard icon={<Clock className="w-4 h-4" />} label="Em andamento" value={inProgress ? 1 : 0} hint="continue depois" />
      </div>

      {/* Editions grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold">Edições disponíveis</h2>
          <span className="text-xs text-muted-foreground">Mais recentes primeiro</span>
        </div>
        {editions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma edição cadastrada para esta instituição ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {editions.map((ed) => (
              <ExamYearCard key={ed.id} edition={ed} institutionId={institution.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionHub;
