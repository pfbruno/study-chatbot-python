import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface SubjectPerformance {
  subject: string;
  area: string;
  correct: number;
  total: number;
}

interface Props {
  data: SubjectPerformance[];
}

const areaColors: Record<string, string> = {
  Linguagens: "bg-blue-500",
  Humanas: "bg-amber-500",
  Natureza: "bg-emerald-500",
  Matemática: "bg-purple-500",
};

export const ExamSubjectPerformanceCard = ({ data }: Props) => {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 space-y-4">
      <div>
        <h3 className="font-heading font-semibold text-lg">Desempenho por disciplina</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Acertos por área de conhecimento</p>
      </div>
      <div className="space-y-3">
        {data.map((d) => {
          const pct = (d.correct / d.total) * 100;
          const color = areaColors[d.area] ?? "bg-primary";
          return (
            <div key={d.subject} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", color)} />
                  <span className="font-medium">{d.subject}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.area}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums">
                  {d.correct}<span className="text-muted-foreground">/{d.total}</span>
                  <span className={cn("ml-2", pct >= 70 ? "text-accent" : pct >= 40 ? "text-yellow-400" : "text-destructive")}>
                    {Math.round(pct)}%
                  </span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
