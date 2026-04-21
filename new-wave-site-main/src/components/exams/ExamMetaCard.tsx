import { ReactNode } from "react";

interface ExamMetaCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}

export const ExamMetaCard = ({ icon, label, value, hint, accent }: ExamMetaCardProps) => {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"}`}>
          {icon}
        </div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="font-heading text-2xl font-bold">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
};
