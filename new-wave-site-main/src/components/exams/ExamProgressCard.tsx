import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock } from "lucide-react";

interface ExamProgressCardProps {
  answered: number;
  total: number;
  flagged: number;
  timeLeft?: string;
}

export const ExamProgressCard = ({ answered, total, flagged, timeLeft }: ExamProgressCardProps) => {
  const pct = (answered / total) * 100;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Progresso</p>
            <p className="text-sm font-semibold">
              {answered} <span className="text-muted-foreground">/ {total}</span>
            </p>
          </div>
        </div>
        {timeLeft && (
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {timeLeft}
          </div>
        )}
      </div>
      <Progress value={pct} className="h-1.5" />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{Math.round(pct)}% completo</span>
        <span>{flagged} para revisão</span>
      </div>
    </div>
  );
};
