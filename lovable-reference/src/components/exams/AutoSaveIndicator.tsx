import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AutoSaveIndicatorProps {
  trigger: number; // changes to trigger save animation
  className?: string;
}

export const AutoSaveIndicator = ({ trigger, className }: AutoSaveIndicatorProps) => {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (trigger === 0) return;
    setState("saving");
    const t1 = setTimeout(() => setState("saved"), 500);
    const t2 = setTimeout(() => setState("idle"), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [trigger]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium transition-opacity",
        state === "idle" ? "opacity-50 text-muted-foreground" : "opacity-100",
        state === "saved" && "text-accent",
        state === "saving" && "text-primary",
        className,
      )}
    >
      {state === "saving" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Check className="w-3 h-3" />
      )}
      {state === "saving" ? "Salvando..." : state === "saved" ? "Progresso salvo" : "Salvamento automático"}
    </div>
  );
};
