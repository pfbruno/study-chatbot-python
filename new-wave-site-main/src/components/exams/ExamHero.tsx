import { ReactNode } from "react";
import { GraduationCap } from "lucide-react";

interface ExamHeroProps {
  title: string;
  subtitle: string;
  badge?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  stats?: { label: string; value: string | number }[];
}

export const ExamHero = ({ title, subtitle, badge, icon, actions, stats }: ExamHeroProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-secondary/30 p-6 md:p-8">
      {/* Decorative glow */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center">
            {icon ?? <GraduationCap className="w-7 h-7 text-primary" />}
          </div>
          <div className="space-y-2">
            {badge && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/15 text-primary border border-primary/20">
                {badge}
              </span>
            )}
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{subtitle}</p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/50">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="font-heading text-xl md:text-2xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
