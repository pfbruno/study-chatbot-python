import { useState, useMemo } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Flag, Check, Eye, ArrowLeft } from "lucide-react";
import { examEditions, getInstitution } from "@/data/mockExams";
import { QuestionNavigator } from "@/components/exams/QuestionNavigator";
import { AnswerSheetPanel } from "@/components/exams/AnswerSheetPanel";
import { ExamProgressCard } from "@/components/exams/ExamProgressCard";
import { ExamOptionButton } from "@/components/exams/ExamOptionButton";
import { AutoSaveIndicator } from "@/components/exams/AutoSaveIndicator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const ExamResolver = () => {
  const { institutionId, year } = useParams();
  const navigate = useNavigate();
  const institution = getInstitution(institutionId || "");
  const edition = examEditions.find(
    (e) => e.institutionId === institutionId && String(e.year) === year
  );

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [saveTrigger, setSaveTrigger] = useState(0);

  if (!institution || !edition) return <Navigate to="/app/provas" replace />;

  const question = edition.questions[current];
  const total = edition.questions.length;
  const answeredCount = Object.keys(answers).length;

  const select = (label: string) => {
    setAnswers((p) => ({ ...p, [current]: label }));
    setSaveTrigger((s) => s + 1);
  };

  const toggleFlag = (idx?: number) => {
    const target = idx ?? current;
    setFlagged((p) => {
      const next = new Set(p);
      if (next.has(target)) next.delete(target);
      else next.add(target);
      return next;
    });
    setSaveTrigger((s) => s + 1);
  };

  const finish = () => {
    navigate(`/app/provas/${institution.id}/${edition.year}/resultado`, {
      state: { answers, flagged: Array.from(flagged) },
    });
  };

  const goTo = (idx: number) => setCurrent(Math.max(0, Math.min(total - 1, idx)));

  const dayBadgeColor =
    question.day === 1 ? "bg-blue-500/15 text-blue-400 border-blue-500/30" : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

  return (
    <div className="-m-4 md:-m-6 min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Top exam header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="px-4 md:px-6 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
            <Link to={`/app/provas/${institution.id}/${edition.year}`}>
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Sair</span>
            </Link>
          </Button>
          <div className="h-6 w-px bg-border/60" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">{institution.shortName} · {edition.year}</p>
            <p className="text-sm font-semibold truncate">Questão {current + 1} de {total}</p>
          </div>
          <AutoSaveIndicator trigger={saveTrigger} className="hidden md:inline-flex" />
          <AnswerSheetPanel
            questions={edition.questions}
            answers={answers}
            flagged={flagged}
            current={current}
            onSelect={(i) => goTo(i)}
            onToggleFlag={(i) => toggleFlag(i)}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Check className="w-4 h-4" /> <span className="hidden sm:inline">Finalizar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalizar prova?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você respondeu {answeredCount} de {total} questões. Após finalizar, sua tentativa será corrigida e você verá o resultado completo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continuar prova</AlertDialogCancel>
                <AlertDialogAction onClick={finish}>Finalizar e corrigir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {/* progress bar */}
        <div className="h-0.5 bg-secondary">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>
      </header>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
        {/* Question */}
        <div className="space-y-5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider", dayBadgeColor)}>
              Dia {question.day}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-primary/30 text-primary">
              {question.area}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-border/60">
              {question.subject}
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground font-mono">
              #{String(question.number).padStart(3, "0")}
            </span>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 md:p-7 space-y-5">
            <div className="flex items-start gap-4">
              <div className="hidden md:flex shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 items-center justify-center">
                <span className="font-heading font-bold text-primary">{current + 1}</span>
              </div>
              <p className="text-[15px] md:text-base leading-relaxed flex-1">{question.statement}</p>
            </div>

            {question.imageUrl && (
              <div className="rounded-xl overflow-hidden border border-border/60">
                <img src={question.imageUrl} alt="Imagem da questão" className="w-full" />
              </div>
            )}

            <div className="space-y-3">
              {question.alternatives.map((alt) => (
                <ExamOptionButton
                  key={alt.label}
                  label={alt.label}
                  text={alt.text}
                  selected={answers[current] === alt.label}
                  onClick={() => select(alt.label)}
                />
              ))}
            </div>
          </div>

          {/* Bottom controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Button variant="outline" onClick={() => goTo(current - 1)} disabled={current === 0} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button
              variant="ghost"
              onClick={() => toggleFlag()}
              className={cn(
                "gap-1.5",
                flagged.has(current) && "text-yellow-400 hover:text-yellow-400 bg-yellow-500/10",
              )}
            >
              <Flag className="w-4 h-4" />
              {flagged.has(current) ? "Marcada" : "Marcar para revisão"}
            </Button>
            {current < total - 1 ? (
              <Button onClick={() => goTo(current + 1)} className="gap-1.5">
                Próxima <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Check className="w-4 h-4" /> Finalizar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Finalizar prova?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {answeredCount} de {total} questões respondidas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Revisar</AlertDialogCancel>
                    <AlertDialogAction onClick={finish}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Sidebar — desktop only */}
        <aside className="hidden lg:flex flex-col gap-4">
          <ExamProgressCard answered={answeredCount} total={total} flagged={flagged.size} />
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Navegação rápida
            </p>
            <QuestionNavigator
              total={total}
              current={current}
              answers={answers}
              flagged={flagged}
              onSelect={goTo}
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamResolver;
