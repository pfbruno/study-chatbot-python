import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Brain,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  ArrowRight,
  Flame,
  Star,
  Video,
  Users,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const mockStats = {
  questionsToday: 42,
  questionsGoal: 60,
  studyTime: "2h 35min",
  streak: 7,
  weeklyAccuracy: 78,
  level: 12,
  xp: 2340,
  xpNext: 3000,
};

const recentSimulados = [
  { id: 1, title: "ENEM 2024 - Ciências da Natureza", score: 72, questions: 45, date: "Hoje" },
  { id: 2, title: "FUVEST 2024 - 1ª Fase", score: 65, questions: 90, date: "Ontem" },
  { id: 3, title: "UNICAMP 2024 - Matemática", score: 80, questions: 30, date: "2 dias atrás" },
];

const achievements = [
  { icon: Flame, label: "7 dias seguidos", color: "text-destructive" },
  { icon: Star, label: "100 questões", color: "text-primary" },
  { icon: Trophy, label: "Top 10%", color: "text-accent" },
];

const upcomingLive = [
  { title: "Revisão de Matemática - Funções", teacher: "Prof. Carlos", time: "Hoje, 19h", attendees: 234 },
  { title: "Redação ENEM - Estrutura", teacher: "Profa. Ana", time: "Amanhã, 14h", attendees: 156 },
];

const aiRecommendations = [
  "Você errou 60% das questões de trigonometria. Que tal revisar?",
  "Sua velocidade em português melhorou 15% essa semana!",
  "Novo simulado de biologia disponível baseado nos seus pontos fracos.",
];

const Dashboard = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Bom dia, João! 👋</h1>
          <p className="text-muted-foreground mt-1">Continue estudando, você está indo muito bem!</p>
        </div>
        <Button asChild className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold hidden md:flex">
          <Link to="/app/simulados">
            Novo Simulado
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.questionsToday}</p>
                <p className="text-xs text-muted-foreground">Questões hoje</p>
              </div>
            </div>
            <Progress value={(mockStats.questionsToday / mockStats.questionsGoal) * 100} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">Meta: {mockStats.questionsGoal}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.studyTime}</p>
                <p className="text-xs text-muted-foreground">Tempo de estudo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.streak} dias</p>
                <p className="text-xs text-muted-foreground">Sequência</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockStats.weeklyAccuracy}%</p>
                <p className="text-xs text-muted-foreground">Acerto semanal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommendations */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="w-5 h-5 text-accent" />
                Recomendações da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border">
                  <Brain className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent simulados */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Simulados Recentes</CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-primary">
                  <Link to="/app/simulados">Ver todos</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSimulados.map((sim) => (
                <div key={sim.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div>
                    <p className="font-medium text-sm">{sim.title}</p>
                    <p className="text-xs text-muted-foreground">{sim.questions} questões · {sim.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${sim.score >= 70 ? "text-accent" : "text-primary"}`}>
                      {sim.score}%
                    </span>
                    <TrendingUp className={`w-4 h-4 ${sim.score >= 70 ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Level */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-lg font-bold text-primary-foreground">
                  {mockStats.level}
                </div>
                <div>
                  <p className="font-semibold">Nível {mockStats.level}</p>
                  <p className="text-xs text-muted-foreground">{mockStats.xp}/{mockStats.xpNext} XP</p>
                </div>
              </div>
              <Progress value={(mockStats.xp / mockStats.xpNext) * 100} className="h-2" />
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Conquistas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((a) => (
                <div key={a.label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <a.icon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <span className="text-sm">{a.label}</span>
                </div>
              ))}
              <Button asChild variant="ghost" size="sm" className="w-full text-primary">
                <Link to="/app/conquistas">Ver todas</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming live */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="w-4 h-4 text-primary" />
                Próximas Aulas ao Vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingLive.map((live) => (
                <div key={live.title} className="p-3 rounded-lg bg-secondary/50 space-y-1">
                  <p className="font-medium text-sm">{live.title}</p>
                  <p className="text-xs text-muted-foreground">{live.teacher}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary font-medium">{live.time}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" /> {live.attendees}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
