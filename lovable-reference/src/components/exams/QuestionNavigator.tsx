import { cn } from "@/lib/utils";

interface QuestionNavigatorProps {
  total: number;
  current: number;
  answers: Record<number, string>;
  flagged: Set<number>;
  onSelect: (idx: number) => void;
  className?: string;
  compact?: boolean;
}

export const QuestionNavigator = ({
  total,
  current,
  answers,
  flagged,
  onSelect,
  className,
  compact,
}: QuestionNavigatorProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {!compact && (
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <Legend color="bg-primary" label="Atual" />
          <Legend color="bg-accent/30 border border-accent/50" label="Respondida" />
          <Legend color="bg-secondary border border-border/50" label="Em branco" />
          <Legend color="bg-yellow-500/20 border border-yellow-500/50" label="Revisão" />
        </div>
      )}
      <div className={cn("grid gap-1.5", compact ? "grid-cols-10" : "grid-cols-6 sm:grid-cols-8")}>
        {Array.from({ length: total }).map((_, i) => {
          const isCurrent = i === current;
          const isAnswered = !!answers[i];
          const isFlagged = flagged.has(i);
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={cn(
                "aspect-square rounded-md text-[11px] font-semibold transition-all flex items-center justify-center relative",
                isCurrent && "bg-primary text-primary-foreground shadow-[0_0_0_2px_hsl(var(--primary)/0.3)] scale-105",
                !isCurrent && isAnswered && !isFlagged && "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25",
                !isCurrent && !isAnswered && !isFlagged && "bg-secondary text-muted-foreground border border-border/40 hover:border-primary/30",
                !isCurrent && isFlagged && "bg-yellow-500/15 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/25",
              )}
            >
              {i + 1}
              {isFlagged && <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-yellow-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <div className="flex items-center gap-1.5">
    <span className={cn("w-3 h-3 rounded", color)} />
    <span className="text-muted-foreground">{label}</span>
  </div>
);
