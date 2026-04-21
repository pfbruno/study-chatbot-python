import { cn } from "@/lib/utils";

interface ExamOptionButtonProps {
  label: string;
  text: string;
  selected?: boolean;
  onClick?: () => void;
  state?: "neutral" | "correct" | "wrong";
}

export const ExamOptionButton = ({ label, text, selected, onClick, state = "neutral" }: ExamOptionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 md:p-5 rounded-xl border transition-all flex items-start gap-4 group",
        state === "neutral" && selected && "border-primary bg-primary/10 ring-1 ring-primary/30",
        state === "neutral" && !selected && "border-border/50 hover:border-primary/40 hover:bg-secondary/40",
        state === "correct" && "border-accent bg-accent/10 ring-1 ring-accent/30",
        state === "wrong" && "border-destructive bg-destructive/10 ring-1 ring-destructive/30",
      )}
    >
      <span
        className={cn(
          "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-colors",
          state === "neutral" && selected && "bg-primary text-primary-foreground",
          state === "neutral" && !selected && "bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary",
          state === "correct" && "bg-accent text-accent-foreground",
          state === "wrong" && "bg-destructive text-destructive-foreground",
        )}
      >
        {label}
      </span>
      <span className="text-sm md:text-[15px] leading-relaxed pt-1.5 flex-1">{text}</span>
    </button>
  );
};
