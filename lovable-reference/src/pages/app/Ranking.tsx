import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal, Award, Flame, Sparkles } from "lucide-react";

type Period = "semanal" | "mensal" | "geral";
type Scope = "global" | "amigos" | "turma";

interface Player {
  rank: number;
  prevRank: number;
  name: string;
  level: number;
  xp: number;
  weekXp: number;
  streak: number;
  isCurrentUser?: boolean;
}

const players: Player[] = [
  { rank: 1, prevRank: 2, name: "Mariana Silva", level: 28, xp: 58420, weekXp: 4820, streak: 45 },
  { rank: 2, prevRank: 1, name: "Pedro Oliveira", level: 27, xp: 56100, weekXp: 4350, streak: 38 },
  { rank: 3, prevRank: 3, name: "Ana Costa", level: 26, xp: 54200, weekXp: 4120, streak: 22 },
  { rank: 4, prevRank: 6, name: "Lucas Santos", level: 24, xp: 48900, weekXp: 3980, streak: 15 },
  { rank: 5, prevRank: 4, name: "Beatriz Lima", level: 23, xp: 47200, weekXp: 3650, streak: 28 },
  { rank: 6, prevRank: 5, name: "Rafael Souza", level: 22, xp: 45100, weekXp: 3420, streak: 12 },
  { rank: 7, prevRank: 9, name: "Juliana Alves", level: 21, xp: 43500, weekXp: 3290, streak: 19 },
  { rank: 8, prevRank: 8, name: "Carlos Rocha", level: 20, xp: 41800, weekXp: 3150, streak: 9 },
  { rank: 9, prevRank: 7, name: "Fernanda Dias", level: 19, xp: 39500, weekXp: 3020, streak: 14 },
  { rank: 10, prevRank: 12, name: "Thiago Mendes", level: 18, xp: 37200, weekXp: 2890, streak: 7 },
  { rank: 47, prevRank: 52, name: "João Pedro (Você)", level: 12, xp: 24340, weekXp: 1820, streak: 7, isCurrentUser: true },
];

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

const RankChange = ({ rank, prev }: { rank: number; prev: number }) => {
  const diff = prev - rank;
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-accent font-medium">
        <TrendingUp className="w-3 h-3" /> {diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs text-destructive font-medium">
        <TrendingDown className="w-3 h-3" /> {Math.abs(diff)}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="w-3 h-3" />
    </span>
  );
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-accent" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
  if (rank === 3) return <Award className="w-5 h-5 text-primary" />;
  return null;
};

const Ranking = () => {
  const [period, setPeriod] = useState<Period>("semanal");
  const [scope, setScope] = useState<Scope>("global");

  const top3 = players.slice(0, 3);
  const rest = players.slice(3, 10);
  const currentUser = players.find((p) => p.isCurrentUser);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Trophy className="w-7 h-7 text-accent" />
          Ranking
        </h1>
        <p className="text-muted-foreground mt-1">Compita com outros estudantes e suba no ranking</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="semanal">Semanal</TabsTrigger>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <TabsList>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="amigos">Amigos</TabsTrigger>
            <TabsTrigger value="turma">Turma</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Podium - Top 3 */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 items-end">
        {[top3[1], top3[0], top3[2]].map((player, idx) => {
          const positions = [
            { order: 2, height: "h-32 md:h-40", color: "from-muted-foreground/20 to-muted-foreground/5", icon: Medal, iconColor: "text-muted-foreground" },
            { order: 1, height: "h-40 md:h-52", color: "from-accent/30 to-accent/5", icon: Crown, iconColor: "text-accent" },
            { order: 3, height: "h-24 md:h-32", color: "from-primary/30 to-primary/5", icon: Award, iconColor: "text-primary" },
          ];
          const pos = positions[idx];
          const Icon = pos.icon;
          return (
            <div key={player.name} className="flex flex-col items-center">
              <div className="mb-2 relative">
                <Avatar className="w-12 h-12 md:w-16 md:h-16 border-2 border-card">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                    {getInitials(player.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 bg-card rounded-full p-1 border border-border">
                  <Icon className={`w-3 h-3 md:w-4 md:h-4 ${pos.iconColor}`} />
                </div>
              </div>
              <p className="text-xs md:text-sm font-semibold text-center line-clamp-1 px-1">{player.name}</p>
              <p className="text-xs text-muted-foreground">Nível {player.level}</p>
              <Card className={`w-full mt-2 bg-gradient-to-b ${pos.color} border-border ${pos.height} flex items-center justify-center`}>
                <CardContent className="p-2 text-center">
                  <p className="text-2xl md:text-3xl font-heading font-bold">{player.rank}</p>
                  <p className="text-xs text-muted-foreground mt-1">{player.weekXp.toLocaleString()} XP</p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Top Estudantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rest.map((player) => (
            <div
              key={player.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors"
            >
              <div className="w-8 text-center font-bold text-muted-foreground">{player.rank}</div>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-secondary text-foreground text-xs font-semibold">
                  {getInitials(player.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{player.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Nível {player.level}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Flame className="w-3 h-3 text-destructive" /> {player.streak}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{player.weekXp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
              <RankChange rank={player.rank} prev={player.prevRank} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Current user position */}
      {currentUser && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/40 border-2 sticky bottom-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-primary border-primary">
                Sua posição
              </Badge>
              <div className="w-8 text-center font-bold">{currentUser.rank}º</div>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentUser.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Nível {currentUser.level}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5">
                    <Flame className="w-3 h-3 text-destructive" /> {currentUser.streak}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{currentUser.weekXp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </div>
              <RankChange rank={currentUser.rank} prev={currentUser.prevRank} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Ranking;
