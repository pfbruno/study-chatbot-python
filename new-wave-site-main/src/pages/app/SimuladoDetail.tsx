import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Users, BookOpen, Crown, ArrowLeft, Play, User } from "lucide-react";
import { mockSimulados } from "@/data/mockSimulados";

const difficultyLabels: Record<string, string> = { easy: "Fácil", medium: "Médio", hard: "Difícil" };
const difficultyColors: Record<string, string> = {
  easy: "bg-accent/20 text-accent border-accent/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-destructive/20 text-destructive border-destructive/30",
};

const SimuladoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const sim = mockSimulados.find((s) => s.id === id);

  if (!sim) return <div className="text-center py-20 text-muted-foreground">Simulado não encontrado.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/simulados")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">{sim.title}</h1>
            <p className="text-muted-foreground mt-2">{sim.description}</p>
          </div>
          {sim.isPremium && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 gap-1 shrink-0">
              <Crown className="h-3.5 w-3.5" /> Premium
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>por <span className="text-foreground font-medium">{sim.author}</span></span>
          <Badge variant="outline" className="text-xs ml-1">{sim.authorType === "teacher" ? "Professor" : "Aluno"}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={difficultyColors[sim.difficulty]}>{difficultyLabels[sim.difficulty]}</Badge>
          {sim.tags.map((t) => (<Badge key={t} variant="outline">{t}</Badge>))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: "Questões", value: sim.questionCount },
          { icon: Clock, label: "Duração", value: `${sim.duration} min` },
          { icon: Users, label: "Realizações", value: sim.timesCompleted.toLocaleString() },
          { icon: Star, label: "Avaliação", value: `${sim.rating} (${sim.ratingCount})` },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="border-border/50">
            <CardContent className="p-4 text-center space-y-1">
              <Icon className="h-5 w-5 mx-auto text-primary" />
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-heading font-bold text-lg">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-lg">Disciplinas abordadas</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {sim.subjects.map((s) => (<Badge key={s} className="bg-primary/10 text-primary border-primary/20">{s}</Badge>))}
        </CardContent>
      </Card>

      <Button size="lg" className="w-full gap-2 text-base font-semibold h-14" onClick={() => navigate(`/app/simulados/${sim.id}/resolver`)}>
        <Play className="h-5 w-5" /> Iniciar Simulado
      </Button>
    </div>
  );
};

export default SimuladoDetail;
