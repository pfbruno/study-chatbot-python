import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, FileText, Play, RotateCcw } from "lucide-react";
import type { ExamEdition } from "@/data/mockExams";
import { cn } from "@/lib/utils";

interface ExamYearCardProps {
  edition: ExamEdition;
  institutionId: string;
}

const statusConfig = {
  available: { label: "Disponível", className: "bg-secondary text-muted-foreground border-border/50" },
  in_progress: { label: "Em andamento", className: "bg-primary/15 text-primary border-primary/30" },
  completed: { label: "Concluída", className: "bg-accent/15 text-accent border-accent/30" },
};

export const ExamYearCard = ({ edition, institutionId }: ExamYearCardProps) => {
  const status = statusConfig[edition.status];
  const isCompleted = edition.status === "completed";
  const isInProgress = edition.status === "in_progress";

  return (
    <div className="group rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Edição</p>
            <h3 className="font-heading text-3xl font-bold mt-0.5 leading-none">{edition.year}</h3>
          </div>
          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold border", status.className)}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {edition.totalQuestions} questões
          </span>
          {edition.lastAccess && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {edition.lastAccess}
            </span>
          )}
        </div>

        {(isInProgress || isCompleted) && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold text-foreground">{edition.progress}%</span>
            </div>
            <Progress value={edition.progress} className="h-1.5" />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {isCompleted ? (
            <>
              <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5">
                <Link to={`/app/provas/${institutionId}/${edition.year}`}>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resultado
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="gap-1.5">
                <Link to={`/app/provas/${institutionId}/${edition.year}/resolver`}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="flex-1 gap-1.5">
              <Link to={`/app/provas/${institutionId}/${edition.year}`}>
                <Play className="w-3.5 h-3.5" />
                {isInProgress ? "Continuar" : "Resolver"}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
