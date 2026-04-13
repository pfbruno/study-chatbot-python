import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from "lucide-react";
import { mockSimulados } from "@/data/mockSimulados";
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

const SimuladoResolver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const sim = mockSimulados.find((s) => s.id === id);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState((sim?.duration || 30) * 60);
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
  const [questionStart, setQuestionStart] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => (t <= 0 ? 0 : t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setQuestionStart(Date.now());
  }, [current]);

  if (!sim) return <div className="text-center py-20 text-muted-foreground">Simulado não encontrado.</div>;

  const question = sim.questions[current];
  const progress = ((Object.keys(answers).length) / sim.questions.length) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const selectAnswer = (label: string) => {
    setAnswers((prev) => ({ ...prev, [current]: label }));
  };

  const trackTime = () => {
    const elapsed = Math.round((Date.now() - questionStart) / 1000);
    setQuestionTimes((prev) => ({ ...prev, [current]: (prev[current] || 0) + elapsed }));
  };

  const goTo = (idx: number) => {
    trackTime();
    setCurrent(idx);
  };

  const finish = () => {
    trackTime();
    const results = sim.questions.map((q, i) => ({
      questionId: q.id,
      selected: answers[i] || null,
      correct: q.correctAnswer,
      isCorrect: answers[i] === q.correctAnswer,
      timeSpent: questionTimes[i] || 0,
    }));
    const totalTime = (sim.duration * 60) - timeLeft;
    navigate(`/app/simulados/${sim.id}/resultado`, {
      state: { results, totalTime, simuladoId: sim.id },
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading font-bold text-lg truncate">{sim.title}</h2>
          <p className="text-sm text-muted-foreground">Questão {current + 1} de {sim.questions.length}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1.5 rounded-lg ${timeLeft < 300 ? "bg-destructive/20 text-destructive" : "bg-secondary text-foreground"}`}>
            <Clock className="h-4 w-4" />
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10">
                <Flag className="h-4 w-4" /> Finalizar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-400" /> Finalizar simulado?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você respondeu {Object.keys(answers).length} de {sim.questions.length} questões. Deseja finalizar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continuar</AlertDialogCancel>
                <AlertDialogAction onClick={finish}>Finalizar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      {/* Question navigator */}
      <div className="flex flex-wrap gap-1.5">
        {sim.questions.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
              i === current
                ? "bg-primary text-primary-foreground"
                : answers[i]
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{question.subject}</Badge>
            <Badge variant="outline" className="text-xs">{question.difficulty === "easy" ? "Fácil" : question.difficulty === "medium" ? "Médio" : "Difícil"}</Badge>
          </div>
          <p className="text-base leading-relaxed">{question.text}</p>
          <div className="space-y-3">
            {question.alternatives.map((alt) => (
              <button
                key={alt.label}
                onClick={() => selectAnswer(alt.label)}
                className={`w-full text-left p-4 rounded-lg border transition-all flex items-start gap-3 ${
                  answers[current] === alt.label
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-border/50 hover:border-primary/30 hover:bg-secondary/50"
                }`}
              >
                <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  answers[current] === alt.label ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}>
                  {alt.label}
                </span>
                <span className="text-sm pt-1">{alt.text}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goTo(Math.max(0, current - 1))} disabled={current === 0} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        {current < sim.questions.length - 1 ? (
          <Button onClick={() => goTo(current + 1)} className="gap-1.5">
            Próxima <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Flag className="h-4 w-4" /> Finalizar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalizar simulado?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você respondeu {Object.keys(answers).length} de {sim.questions.length} questões.
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
  );
};

export default SimuladoResolver;
