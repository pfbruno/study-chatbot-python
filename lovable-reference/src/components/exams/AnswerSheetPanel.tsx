import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ClipboardList, Flag, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExamQuestion } from "@/data/mockExams";

interface AnswerSheetPanelProps {
  questions: ExamQuestion[];
  answers: Record<number, string>;
  flagged: Set<number>;
  current: number;
  onSelect: (idx: number) => void;
  onToggleFlag: (idx: number) => void;
}

type FilterMode = "all" | "answered" | "unanswered" | "flagged";

export const AnswerSheetPanel = (props: AnswerSheetPanelProps) => {
  const [filter, setFilter] = useState<FilterMode>("all");

  const filtered = props.questions
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => {
      if (filter === "answered") return !!props.answers[i];
      if (filter === "unanswered") return !props.answers[i];
      if (filter === "flagged") return props.flagged.has(i);
      return true;
    });

  const answeredCount = Object.keys(props.answers).length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-border/60">
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">Folha de respostas</span>
          <span className="px-1.5 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-semibold ml-1">
            {answeredCount}/{props.questions.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-border/60">
          <SheetTitle className="font-heading text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Folha de Respostas
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {answeredCount} de {props.questions.length} questões respondidas •{" "}
            {props.flagged.size} marcadas para revisão
          </p>
        </SheetHeader>

        <div className="px-5 pt-4 flex items-center gap-1.5 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {(["all", "answered", "unanswered", "flagged"] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80",
              )}
            >
              {f === "all" && "Todas"}
              {f === "answered" && "Respondidas"}
              {f === "unanswered" && "Em branco"}
              {f === "flagged" && "Revisão"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-3 space-y-1.5">
          {filtered.length === 0 && (
            <p className="text-center py-12 text-sm text-muted-foreground">Nenhuma questão neste filtro.</p>
          )}
          {filtered.map(({ q, i }) => {
            const answer = props.answers[i];
            const isCurrent = i === props.current;
            const isFlagged = props.flagged.has(i);
            return (
              <div
                key={q.id}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer",
                  isCurrent
                    ? "border-primary bg-primary/10"
                    : "border-border/40 bg-secondary/30 hover:bg-secondary/60",
                )}
                onClick={() => props.onSelect(i)}
              >
                <span className="w-8 text-center text-xs font-semibold text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{q.subject}</p>
                  <p className="text-[10px] text-muted-foreground">Dia {q.day} • {q.area}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(["A", "B", "C", "D", "E"] as const).map((l) => (
                    <span
                      key={l}
                      className={cn(
                        "w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center",
                        answer === l
                          ? "bg-accent text-accent-foreground"
                          : "bg-background/60 text-muted-foreground/40",
                      )}
                    >
                      {l}
                    </span>
                  ))}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onToggleFlag(i);
                    }}
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center transition-colors",
                      isFlagged ? "text-yellow-400 bg-yellow-500/15" : "text-muted-foreground/40 hover:text-yellow-400",
                    )}
                  >
                    <Flag className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
