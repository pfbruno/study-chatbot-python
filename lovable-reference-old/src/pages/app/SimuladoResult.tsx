import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Clock, CheckCircle2, XCircle, ArrowLeft, ChevronDown, ChevronUp, MessageSquare, AlertTriangle, Lightbulb, Target, Eye } from "lucide-react";
import { mockSimulados, type TeacherComment } from "@/data/mockSimulados";

const commentTypeConfig: Record<string, { icon: typeof Lightbulb; label: string; color: string }> = {
  explanation: { icon: Lightbulb, label: "Explicação", color: "text-primary" },
  trap: { icon: AlertTriangle, label: "Pegadinha", color: "text-yellow-400" },
  strategy: { icon: Target, label: "Estratégia", color: "text-accent" },
  observation: { icon: Eye, label: "Observação", color: "text-purple-400" },
};

const SimuladoResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const sim = mockSimulados.find((s) => s.id === id);
  const { results, totalTime } = (location.state as any) || { results: [], totalTime: 0 };

  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [userRating, setUserRating] = useState(0);

  if (!sim || !results.length) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">Resultado não encontrado.</p>
        <Button onClick={() => navigate("/app/simulados")}>Voltar aos simulados</Button>
      </div>
    );
  }

  const correct = results.filter((r: any) => r.isCorrect).length;
  const total = results.length;
  const percentage = Math.round((correct / total) * 100);
  const avgTime = Math.round(totalTime / total);
  const totalMins = Math.floor(totalTime / 60);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/simulados")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {/* Score overview */}
      <Card className="border-border/50 overflow-hidden">
        <div className={`p-6 text-center space-y-3 ${percentage >= 70 ? "bg-accent/10" : percentage >= 50 ? "bg-yellow-500/10" : "bg-destructive/10"}`}>
          <h1 className="font-heading text-4xl font-bold">{percentage}%</h1>
          <p className="text-muted-foreground">Você acertou <span className="text-foreground font-semibold">{correct}</span> de <span className="text-foreground font-semibold">{total}</span> questões</p>
          <Progress value={percentage} className="h-3 max-w-xs mx-auto" />
          <div className="flex justify-center gap-6 text-sm pt-2">
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {totalMins} min</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-muted-foreground" /> ~{avgTime}s/questão</span>
          </div>
        </div>
      </Card>

      {/* Rating */}
      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Avalie este simulado</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setUserRating(s)}>
                <Star className={`h-6 w-6 transition-colors ${s <= userRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Questions review */}
      <div>
        <h2 className="font-heading text-xl font-bold mb-4">Revisão detalhada</h2>
        <div className="space-y-3">
          {sim.questions.map((q, i) => {
            const r = results[i];
            const expanded = expandedQ === i;
            return (
              <Card key={q.id} className={`border-border/50 transition-colors ${r.isCorrect ? "border-l-4 border-l-accent" : "border-l-4 border-l-destructive"}`}>
                <button className="w-full text-left p-4 flex items-center justify-between gap-3" onClick={() => setExpandedQ(expanded ? null : i)}>
                  <div className="flex items-center gap-3 min-w-0">
                    {r.isCorrect ? <CheckCircle2 className="h-5 w-5 text-accent shrink-0" /> : <XCircle className="h-5 w-5 text-destructive shrink-0" />}
                    <span className="text-sm font-medium truncate">Questão {q.number}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{q.subject}</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{r.timeSpent || 0}s</span>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {expanded && (
                  <CardContent className="px-4 pb-4 pt-0 space-y-4 border-t border-border/50">
                    <p className="text-sm leading-relaxed pt-3">{q.text}</p>

                    {/* Alternatives */}
                    <div className="space-y-2">
                      {q.alternatives.map((alt) => {
                        const isCorrect = alt.label === q.correctAnswer;
                        const isSelected = alt.label === r.selected;
                        let classes = "border-border/50 bg-secondary/30";
                        if (isCorrect) classes = "border-accent bg-accent/10";
                        else if (isSelected && !r.isCorrect) classes = "border-destructive bg-destructive/10";

                        return (
                          <div key={alt.label} className={`p-3 rounded-lg border flex items-start gap-3 ${classes}`}>
                            <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${isCorrect ? "bg-accent text-accent-foreground" : isSelected ? "bg-destructive text-destructive-foreground" : "bg-secondary text-muted-foreground"}`}>
                              {alt.label}
                            </span>
                            <span className="text-sm pt-0.5">{alt.text}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm font-medium text-primary mb-1">Explicação</p>
                      <p className="text-sm text-muted-foreground">{q.explanation}</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Taxa de acerto", value: `${q.accuracyRate}%` },
                        { label: "Taxa de erro", value: `${q.errorRate}%` },
                        { label: "Tempo médio", value: `${q.avgTime}s` },
                        { label: "Mais marcada", value: q.mostChosenAlternative },
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center p-2 bg-secondary/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="font-semibold text-sm">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Teacher comments */}
                    {q.teacherComments.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-primary" /> Comentários dos professores</p>
                        {q.teacherComments.map((c: TeacherComment, ci: number) => {
                          const cfg = commentTypeConfig[c.type] || commentTypeConfig.observation;
                          const Icon = cfg.icon;
                          return (
                            <div key={ci} className="bg-card border border-border/50 rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold">{c.teacherAvatar}</div>
                                  <span className="text-sm font-medium">{c.teacherName}</span>
                                </div>
                                <Badge variant="outline" className={`text-xs gap-1 ${cfg.color}`}>
                                  <Icon className="h-3 w-3" /> {cfg.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{c.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 justify-center pb-8">
        <Button variant="outline" onClick={() => navigate(`/app/simulados/${sim.id}`)}>Refazer simulado</Button>
        <Button onClick={() => navigate("/app/simulados")}>Voltar aos simulados</Button>
      </div>
    </div>
  );
};

export default SimuladoResult;
