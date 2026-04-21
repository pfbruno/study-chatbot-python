import { useParams, Navigate, useLocation, Link } from "react-router-dom";
import { ExamHero } from "@/components/exams/ExamHero";
import { Button } from "@/components/ui/button";
import { examEditions, getInstitution } from "@/data/mockExams";
import {
  Trophy,
  Target,
  XCircle,
  Minus,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ExamSubjectPerformanceCard } from "@/components/exams/ExamSubjectPerformanceCard";
import { ReviewCTASection } from "@/components/exams/ReviewCTASection";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const ExamResult = () => {
  const { institutionId, year } = useParams();
  const location = useLocation();
  const institution = getInstitution(institutionId || "");
  const edition = examEditions.find(
    (e) => e.institutionId === institutionId && String(e.year) === year
  );

  const { answers = {}, flagged = [] } = (location.state || {}) as {
    answers?: Record<number, string>;
    flagged?: number[];
  };

  const stats = useMemo(() => {
    if (!edition) return null;
    let correct = 0,
      wrong = 0,
      blank = 0;
    const bySubject = new Map<string, { area: string; correct: number; total: number }>();

    edition.questions.forEach((q, i) => {
      const a = answers[i];
      if (!a) blank++;
      else if (a === q.correctAnswer) correct++;
      else wrong++;

      const cur = bySubject.get(q.subject) ?? { area: q.area, correct: 0, total: 0 };
      cur.total += 1;
      if (a === q.correctAnswer) cur.correct += 1;
      bySubject.set(q.subject, cur);
    });

    const total = edition.questions.length;
    const score = Math.round((correct / total) * 1000); // 0-1000 ENEM-like
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      correct,
      wrong,
      blank,
      total,
      score,
      accuracy,
      bySubject: Array.from(bySubject.entries())
        .map(([subject, v]) => ({ subject, ...v }))
        .sort((a, b) => a.correct / a.total - b.correct / b.total),
    };
  }, [edition, answers]);

  if (!institution || !edition || !stats) return <Navigate to="/app/provas" replace />;

  const performanceLabel =
    stats.accuracy >= 75 ? "Excelente" : stats.accuracy >= 50 ? "Bom" : stats.accuracy >= 30 ? "Regular" : "Precisa melhorar";
  const performanceColor =
    stats.accuracy >= 75 ? "text-accent" : stats.accuracy >= 50 ? "text-primary" : stats.accuracy >= 30 ? "text-yellow-400" : "text-destructive";

  const weakest = stats.bySubject.slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl">
      <Link
        to={`/app/provas/${institution.id}/${edition.year}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar à prova
      </Link>

      {/* Hero result */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/10 p-6 md:p-10">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

        <div className="relative grid md:grid-cols-[auto_1fr_auto] items-center gap-6">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_60px_-10px_hsl(var(--primary)/0.5)]">
            <Trophy className="w-12 h-12 md:w-14 md:h-14 text-primary-foreground" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-accent/15 text-accent border border-accent/30">
              <Sparkles className="w-3 h-3" /> Prova finalizada
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold mt-3">{edition.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Desempenho: <span className={cn("font-semibold", performanceColor)}>{performanceLabel}</span> · {stats.accuracy}% de acerto
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pontuação</p>
            <p className="font-heading text-5xl md:text-6xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
              {stats.score}
            </p>
            <p className="text-[11px] text-muted-foreground">de 1000 pontos</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} value={stats.correct} label="Acertos" color="text-accent" bg="bg-accent/15" />
        <StatCard icon={<XCircle className="w-5 h-5" />} value={stats.wrong} label="Erros" color="text-destructive" bg="bg-destructive/15" />
        <StatCard icon={<Minus className="w-5 h-5" />} value={stats.blank} label="Em branco" color="text-muted-foreground" bg="bg-secondary" />
        <StatCard icon={<Target className="w-5 h-5" />} value={`${stats.accuracy}%`} label="Aproveitamento" color="text-primary" bg="bg-primary/15" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Performance by subject */}
        <div className="lg:col-span-2">
          <ExamSubjectPerformanceCard data={stats.bySubject} />
        </div>

        {/* Priority review */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/15 text-yellow-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-semibold">Prioridades de revisão</h3>
              <p className="text-[11px] text-muted-foreground">Disciplinas com pior desempenho</p>
            </div>
          </div>
          <div className="space-y-2">
            {weakest.map((w, i) => {
              const pct = Math.round((w.correct / w.total) * 100);
              return (
                <div key={w.subject} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border/40">
                  <span className="font-heading font-bold text-yellow-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{w.subject}</p>
                    <p className="text-[10px] text-muted-foreground">{w.area}</p>
                  </div>
                  <span className="text-xs font-semibold text-destructive">{pct}%</span>
                </div>
              );
            })}
          </div>
          <Button asChild variant="outline" className="w-full gap-1.5">
            <Link to="/app/estudo">
              Iniciar revisão guiada <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Question-by-question correction summary */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading font-semibold text-lg">Correção por questão</h3>
            <p className="text-xs text-muted-foreground">Clique em uma questão para ver o gabarito comentado</p>
          </div>
        </div>
        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
          {edition.questions.map((q, i) => {
            const a = answers[i];
            const isCorrect = a === q.correctAnswer;
            const isBlank = !a;
            return (
              <button
                key={q.id}
                title={`Q${i + 1} • ${q.subject} • Gabarito: ${q.correctAnswer}`}
                className={cn(
                  "aspect-square rounded-md text-[11px] font-bold transition-all hover:scale-105",
                  isBlank && "bg-secondary text-muted-foreground",
                  !isBlank && isCorrect && "bg-accent/20 text-accent border border-accent/40",
                  !isBlank && !isCorrect && "bg-destructive/20 text-destructive border border-destructive/40",
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-accent/20 border border-accent/40" /> Acerto</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/40" /> Erro</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-secondary" /> Em branco</span>
        </div>
      </div>

      <ReviewCTASection />
    </div>
  );
};

const StatCard = ({
  icon,
  value,
  label,
  color,
  bg,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  bg: string;
}) => (
  <div className="rounded-xl border border-border/60 bg-card p-4">
    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-2", bg, color)}>{icon}</div>
    <p className={cn("font-heading text-2xl font-bold", color)}>{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default ExamResult;
