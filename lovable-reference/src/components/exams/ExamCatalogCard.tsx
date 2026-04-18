import { Link } from "react-router-dom";
import { ChevronRight, Layers } from "lucide-react";
import type { Institution } from "@/data/mockExams";

interface ExamCatalogCardProps {
  institution: Institution;
}

export const ExamCatalogCard = ({ institution }: ExamCatalogCardProps) => {
  return (
    <Link
      to={`/app/provas/${institution.id}`}
      className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card hover:border-primary/40 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.3)]"
    >
      <div className={`h-24 bg-gradient-to-br ${institution.color} relative`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_60%)]" />
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-background/30 backdrop-blur text-[10px] font-semibold text-white border border-white/20">
          {institution.totalEditions} edições
        </div>
        {institution.highlight && (
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
            Em destaque
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{institution.name}</p>
          <h3 className="font-heading text-xl font-bold mt-0.5">{institution.shortName}</h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{institution.description}</p>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs flex items-center gap-1.5 text-muted-foreground">
            <Layers className="w-3.5 h-3.5" />
            Catálogo oficial
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
            Acessar <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
};
