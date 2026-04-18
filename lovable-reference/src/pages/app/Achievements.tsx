import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Flame,
  Star,
  Target,
  Brain,
  BookOpen,
  Zap,
  Award,
  Crown,
  Medal,
  TrendingUp,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";

type BadgeRarity = "comum" | "raro" | "épico" | "lendário";

interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: typeof Trophy;
  rarity: BadgeRarity;
  unlocked: boolean;
  progress: number;
  total: number;
  xpReward: number;
  unlockedAt?: string;
  category: "estudo" | "social" | "desempenho" | "consistência";
}

const userStats = {
  level: 12,
  xp: 2340,
  xpNext: 3000,
  totalXp: 24340,
  rank: "Estudioso Avançado",
  badgesUnlocked: 18,
  badgesTotal: 42,
  streak: 7,
  longestStreak: 23,
};

const badges: AchievementBadge[] = [
  {
    id: "1",
    title: "Primeiro Passo",
    description: "Complete seu primeiro simulado",
    icon: BookOpen,
    rarity: "comum",
    unlocked: true,
    progress: 1,
    total: 1,
    xpReward: 50,
    unlockedAt: "Há 2 meses",
    category: "estudo",
  },
  {
    id: "2",
    title: "Maratonista",
    description: "Estude por 7 dias consecutivos",
    icon: Flame,
    rarity: "raro",
    unlocked: true,
    progress: 7,
    total: 7,
    xpReward: 200,
    unlockedAt: "Hoje",
    category: "consistência",
  },
  {
    id: "3",
    title: "Centurião",
    description: "Resolva 100 questões",
    icon: Target,
    rarity: "raro",
    unlocked: true,
    progress: 100,
    total: 100,
    xpReward: 150,
    unlockedAt: "Há 1 mês",
    category: "estudo",
  },
  {
    id: "4",
    title: "Mestre do Conhecimento",
    description: "Alcance 90% de acerto em 10 simulados",
    icon: Crown,
    rarity: "lendário",
    unlocked: false,
    progress: 4,
    total: 10,
    xpReward: 1000,
    category: "desempenho",
  },
  {
    id: "5",
    title: "Top 10",
    description: "Esteja entre os 10 melhores da semana",
    icon: Trophy,
    rarity: "épico",
    unlocked: true,
    progress: 1,
    total: 1,
    xpReward: 500,
    unlockedAt: "Há 3 dias",
    category: "desempenho",
  },
  {
    id: "6",
    title: "Mente Brilhante",
    description: "Use o Chat IA 50 vezes",
    icon: Brain,
    rarity: "raro",
    unlocked: false,
    progress: 32,
    total: 50,
    xpReward: 200,
    category: "estudo",
  },
  {
    id: "7",
    title: "Velocista",
    description: "Complete um simulado em menos de 30 minutos",
    icon: Zap,
    rarity: "épico",
    unlocked: false,
    progress: 0,
    total: 1,
    xpReward: 400,
    category: "desempenho",
  },
  {
    id: "8",
    title: "Influenciador",
    description: "Receba 100 curtidas em posts da comunidade",
    icon: Star,
    rarity: "épico",
    unlocked: false,
    progress: 47,
    total: 100,
    xpReward: 350,
    category: "social",
  },
  {
    id: "9",
    title: "Imparável",
    description: "Mantenha sequência de 30 dias",
    icon: Flame,
    rarity: "lendário",
    unlocked: false,
    progress: 7,
    total: 30,
    xpReward: 1500,
    category: "consistência",
  },
  {
    id: "10",
    title: "Sábio",
    description: "Alcance o nível 20",
    icon: Award,
    rarity: "lendário",
    unlocked: false,
    progress: 12,
    total: 20,
    xpReward: 2000,
    category: "desempenho",
  },
  {
    id: "11",
    title: "Colaborador",
    description: "Participe de 5 grupos de estudo",
    icon: Medal,
    rarity: "raro",
    unlocked: true,
    progress: 5,
    total: 5,
    xpReward: 250,
    unlockedAt: "Há 1 semana",
    category: "social",
  },
  {
    id: "12",
    title: "Madrugador",
    description: "Estude antes das 7h por 5 dias",
    icon: Clock,
    rarity: "comum",
    unlocked: false,
    progress: 2,
    total: 5,
    xpReward: 100,
    category: "consistência",
  },
];

const rarityStyles: Record<BadgeRarity, { bg: string; border: string; text: string; label: string }> = {
  comum: {
    bg: "bg-muted/50",
    border: "border-muted-foreground/30",
    text: "text-muted-foreground",
    label: "Comum",
  },
  raro: {
    bg: "bg-primary/10",
    border: "border-primary/40",
    text: "text-primary",
    label: "Raro",
  },
  épico: {
    bg: "bg-accent/10",
    border: "border-accent/40",
    text: "text-accent",
    label: "Épico",
  },
  lendário: {
    bg: "bg-gradient-to-br from-primary/20 to-accent/20",
    border: "border-accent/60",
    text: "text-accent",
    label: "Lendário",
  },
};

const Achievements = () => {
  const [filter, setFilter] = useState<"todas" | "estudo" | "social" | "desempenho" | "consistência">("todas");

  const filteredBadges = filter === "todas" ? badges : badges.filter((b) => b.category === filter);
  const unlockedBadges = filteredBadges.filter((b) => b.unlocked);
  const lockedBadges = filteredBadges.filter((b) => !b.unlocked);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-7 h-7 text-accent" />
          Conquistas
        </h1>
        <p className="text-muted-foreground mt-1">Desbloqueie badges e suba de nível enquanto estuda</p>
      </div>

      {/* Player Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-card to-accent/10 border-primary/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-primary-foreground">
                  {userStats.level}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1.5">
                  <Sparkles className="w-3 h-3 text-accent-foreground" />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Nível</p>
                <p className="font-heading text-2xl font-bold">{userStats.level}</p>
                <p className="text-sm text-primary font-medium">{userStats.rank}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{userStats.xp}/{userStats.xpNext} XP</span>
                </div>
                <Progress value={(userStats.xp / userStats.xpNext) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {userStats.xpNext - userStats.xp} XP para o próximo nível
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span>Total: {userStats.totalXp.toLocaleString()} XP</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 rounded-lg bg-card/50 border border-border">
                <Trophy className="w-5 h-5 text-accent mx-auto mb-1" />
                <p className="text-lg font-bold">{userStats.badgesUnlocked}</p>
                <p className="text-xs text-muted-foreground">de {userStats.badgesTotal}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card/50 border border-border">
                <Flame className="w-5 h-5 text-destructive mx-auto mb-1" />
                <p className="text-lg font-bold">{userStats.streak}</p>
                <p className="text-xs text-muted-foreground">sequência</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-card/50 border border-border">
                <Star className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold">{userStats.longestStreak}</p>
                <p className="text-xs text-muted-foreground">recorde</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="estudo">Estudo</TabsTrigger>
          <TabsTrigger value="desempenho">Desempenho</TabsTrigger>
          <TabsTrigger value="consistência">Consistência</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-6 mt-6">
          {/* Unlocked */}
          {unlockedBadges.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                Desbloqueadas ({unlockedBadges.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {unlockedBadges.map((badge) => {
                  const style = rarityStyles[badge.rarity];
                  return (
                    <Card
                      key={badge.id}
                      className={`${style.bg} ${style.border} border-2 hover:scale-105 transition-transform cursor-pointer`}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <div className={`w-14 h-14 mx-auto rounded-full ${style.bg} border-2 ${style.border} flex items-center justify-center`}>
                          <badge.icon className={`w-7 h-7 ${style.text}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{badge.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{badge.description}</p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <Badge variant="outline" className={`text-xs ${style.text} ${style.border}`}>
                            {style.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">+{badge.xpReward} XP</span>
                        </div>
                        {badge.unlockedAt && (
                          <p className="text-xs text-muted-foreground">{badge.unlockedAt}</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Locked */}
          {lockedBadges.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Em progresso ({lockedBadges.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {lockedBadges.map((badge) => {
                  const style = rarityStyles[badge.rarity];
                  const progressPct = (badge.progress / badge.total) * 100;
                  return (
                    <Card
                      key={badge.id}
                      className="bg-card/50 border-border border-2 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <div className="w-14 h-14 mx-auto rounded-full bg-muted/30 border-2 border-muted flex items-center justify-center relative">
                          <badge.icon className="w-7 h-7 text-muted-foreground/60" />
                          <Lock className="w-3 h-3 text-muted-foreground absolute bottom-0 right-0 bg-card rounded-full p-0.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{badge.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{badge.description}</p>
                        </div>
                        <div className="space-y-1.5">
                          <Progress value={progressPct} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">
                            {badge.progress}/{badge.total}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <Badge variant="outline" className={`text-xs ${style.text} ${style.border}`}>
                            {style.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">+{badge.xpReward} XP</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Achievements;
