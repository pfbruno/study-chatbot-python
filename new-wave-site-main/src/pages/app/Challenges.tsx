import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Target,
  Flame,
  Zap,
  CheckCircle2,
  Clock,
  Gift,
  Trophy,
  Calendar,
  BookOpen,
  Brain,
  MessageSquare,
  Users,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type ChallengeType = "diário" | "semanal" | "especial";
type ChallengeStatus = "ativo" | "completo" | "expirado";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  progress: number;
  total: number;
  xpReward: number;
  bonusReward?: string;
  icon: typeof Target;
  expiresIn: string;
  difficulty: "fácil" | "médio" | "difícil";
}

const challenges: Challenge[] = [
  {
    id: "d1",
    title: "Resolva 20 questões",
    description: "Pratique resolvendo 20 questões hoje",
    type: "diário",
    status: "ativo",
    progress: 14,
    total: 20,
    xpReward: 100,
    icon: BookOpen,
    expiresIn: "7h 23min",
    difficulty: "fácil",
  },
  {
    id: "d2",
    title: "Use o Chat IA",
    description: "Tire 3 dúvidas no Chat IA",
    type: "diário",
    status: "completo",
    progress: 3,
    total: 3,
    xpReward: 50,
    icon: Brain,
    expiresIn: "7h 23min",
    difficulty: "fácil",
  },
  {
    id: "d3",
    title: "Estude 1 hora",
    description: "Acumule 60 minutos de estudo hoje",
    type: "diário",
    status: "ativo",
    progress: 35,
    total: 60,
    xpReward: 80,
    icon: Clock,
    expiresIn: "7h 23min",
    difficulty: "fácil",
  },
  {
    id: "d4",
    title: "Acerte 80% em um simulado",
    description: "Complete um simulado com pelo menos 80% de acerto",
    type: "diário",
    status: "ativo",
    progress: 0,
    total: 1,
    xpReward: 150,
    bonusReward: "Badge Precisão",
    icon: Target,
    expiresIn: "7h 23min",
    difficulty: "médio",
  },
  {
    id: "w1",
    title: "Maratona da Semana",
    description: "Resolva 150 questões esta semana",
    type: "semanal",
    status: "ativo",
    progress: 87,
    total: 150,
    xpReward: 500,
    bonusReward: "+10% XP por 24h",
    icon: Flame,
    expiresIn: "3 dias",
    difficulty: "médio",
  },
  {
    id: "w2",
    title: "Diversidade de Matérias",
    description: "Pratique pelo menos 5 matérias diferentes",
    type: "semanal",
    status: "ativo",
    progress: 3,
    total: 5,
    xpReward: 400,
    icon: Sparkles,
    expiresIn: "3 dias",
    difficulty: "médio",
  },
  {
    id: "w3",
    title: "Participação Social",
    description: "Faça 10 interações na comunidade",
    type: "semanal",
    status: "ativo",
    progress: 4,
    total: 10,
    xpReward: 300,
    icon: Users,
    expiresIn: "3 dias",
    difficulty: "fácil",
  },
  {
    id: "w4",
    title: "Sequência Imparável",
    description: "Mantenha sequência de estudos por toda semana",
    type: "semanal",
    status: "ativo",
    progress: 5,
    total: 7,
    xpReward: 600,
    bonusReward: "Badge Imparável",
    icon: Flame,
    expiresIn: "3 dias",
    difficulty: "difícil",
  },
  {
    id: "s1",
    title: "Desafio ENEM 2026",
    description: "Complete 5 simulados estilo ENEM com média de 70%",
    type: "especial",
    status: "ativo",
    progress: 2,
    total: 5,
    xpReward: 1500,
    bonusReward: "Badge Lendário + Aula exclusiva",
    icon: Trophy,
    expiresIn: "15 dias",
    difficulty: "difícil",
  },
];

const difficultyColors = {
  fácil: "text-accent border-accent/40 bg-accent/10",
  médio: "text-primary border-primary/40 bg-primary/10",
  difícil: "text-destructive border-destructive/40 bg-destructive/10",
};

const Challenges = () => {
  const [tab, setTab] = useState<ChallengeType>("diário");
  const [claimed, setClaimed] = useState<Set<string>>(new Set());

  const filtered = challenges.filter((c) => c.type === tab);
  const activeCount = challenges.filter((c) => c.status === "ativo").length;
  const completedToday = challenges.filter((c) => c.type === "diário" && c.status === "completo").length;
  const totalDailyXp = challenges
    .filter((c) => c.type === "diário")
    .reduce((sum, c) => sum + c.xpReward, 0);
  const earnedDailyXp = challenges
    .filter((c) => c.type === "diário" && c.status === "completo")
    .reduce((sum, c) => sum + c.xpReward, 0);

  const handleClaim = (challenge: Challenge) => {
    if (claimed.has(challenge.id)) return;
    setClaimed((prev) => new Set(prev).add(challenge.id));
    toast.success(`+${challenge.xpReward} XP recebidos!`, {
      description: challenge.bonusReward ? `Bônus: ${challenge.bonusReward}` : undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Target className="w-7 h-7 text-primary" />
          Desafios
        </h1>
        <p className="text-muted-foreground mt-1">Complete missões e ganhe XP extra</p>
      </div>

      {/* Daily progress overview */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Progresso Diário</p>
              <p className="text-2xl font-heading font-bold mt-1">
                {completedToday}/{challenges.filter((c) => c.type === "diário").length}
              </p>
              <Progress
                value={(completedToday / challenges.filter((c) => c.type === "diário").length) * 100}
                className="h-1.5 mt-2"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">XP Hoje</p>
              <p className="text-2xl font-heading font-bold mt-1 flex items-center gap-1">
                <Zap className="w-5 h-5 text-accent" />
                {earnedDailyXp}/{totalDailyXp}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Desafios Ativos</p>
              <p className="text-2xl font-heading font-bold mt-1 flex items-center gap-1">
                <Target className="w-5 h-5 text-primary" />
                {activeCount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Próximo Reset</p>
              <p className="text-2xl font-heading font-bold mt-1 flex items-center gap-1">
                <Clock className="w-5 h-5 text-muted-foreground" />
                7h 23m
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as ChallengeType)}>
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="diário" className="gap-2">
            <Calendar className="w-4 h-4" /> Diários
          </TabsTrigger>
          <TabsTrigger value="semanal" className="gap-2">
            <TrendingUp className="w-4 h-4" /> Semanais
          </TabsTrigger>
          <TabsTrigger value="especial" className="gap-2">
            <Sparkles className="w-4 h-4" /> Especiais
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-3 mt-6">
          {filtered.map((challenge) => {
            const pct = (challenge.progress / challenge.total) * 100;
            const isComplete = challenge.status === "completo";
            const isClaimed = claimed.has(challenge.id);
            return (
              <Card
                key={challenge.id}
                className={`bg-card border-border transition-colors ${
                  isComplete && !isClaimed ? "border-accent/50 bg-accent/5" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                        isComplete ? "bg-accent/20" : "bg-primary/10"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-6 h-6 text-accent" />
                      ) : (
                        <challenge.icon className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{challenge.title}</p>
                          <p className="text-sm text-muted-foreground">{challenge.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-xs ${difficultyColors[challenge.difficulty]}`}>
                            {challenge.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Clock className="w-3 h-3" /> {challenge.expiresIn}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Progresso: {challenge.progress}/{challenge.total}
                          </span>
                          <span className="font-medium">{Math.round(pct)}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 font-semibold text-accent">
                            <Zap className="w-4 h-4" /> +{challenge.xpReward} XP
                          </span>
                          {challenge.bonusReward && (
                            <span className="flex items-center gap-1 text-xs text-primary">
                              <Gift className="w-3 h-3" /> {challenge.bonusReward}
                            </span>
                          )}
                        </div>
                        {isComplete && (
                          <Button
                            size="sm"
                            onClick={() => handleClaim(challenge)}
                            disabled={isClaimed}
                            className={
                              isClaimed
                                ? ""
                                : "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                            }
                          >
                            {isClaimed ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Resgatado
                              </>
                            ) : (
                              <>
                                <Gift className="w-4 h-4 mr-1" /> Resgatar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Challenges;
