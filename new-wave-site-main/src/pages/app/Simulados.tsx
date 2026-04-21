import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, Clock, Users, BookOpen, Crown, Filter, TrendingUp } from "lucide-react";
import { mockSimulados, subjects, difficulties } from "@/data/mockSimulados";

const difficultyColors: Record<string, string> = {
  easy: "bg-accent/20 text-accent border-accent/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  hard: "bg-destructive/20 text-destructive border-destructive/30",
};
const difficultyLabels: Record<string, string> = { easy: "Fácil", medium: "Médio", hard: "Difícil" };

const sortOptions = [
  { value: "popular", label: "Mais feitos" },
  { value: "rating", label: "Melhor avaliados" },
  { value: "recent", label: "Mais recentes" },
];

const Simulados = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("Todas");
  const [difficulty, setDifficulty] = useState("all");
  const [sort, setSort] = useState("popular");

  const filtered = mockSimulados
    .filter((s) => {
      if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (subject !== "Todas" && !s.subjects.includes(subject)) return false;
      if (difficulty !== "all" && s.difficulty !== difficulty) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "popular") return b.timesCompleted - a.timesCompleted;
      if (sort === "rating") return b.rating - a.rating;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Simulados</h1>
        <p className="text-muted-foreground mt-1">Treine com simulados reais e acompanhe sua evolução</p>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar simulados..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-full sm:w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>{subjects.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{difficulties.map((d) => (<SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-[160px]"><TrendingUp className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>{sortOptions.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-muted-foreground">{filtered.length} simulados encontrados</div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((sim) => (
          <Card key={sim.id} className="border-border/50 hover:border-primary/40 transition-colors cursor-pointer group" onClick={() => navigate(`/app/simulados/${sim.id}`)}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors leading-tight">{sim.title}</h3>
                {sim.isPremium && <Crown className="h-5 w-5 text-yellow-400 shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{sim.description}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className={difficultyColors[sim.difficulty]}>{difficultyLabels[sim.difficulty]}</Badge>
                {sim.tags.slice(0, 2).map((t) => (<Badge key={t} variant="outline" className="text-xs">{t}</Badge>))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{sim.questionCount}q</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{sim.duration}min</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{sim.timesCompleted.toLocaleString()}</span>
                <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />{sim.rating}</span>
              </div>
              <div className="text-xs text-muted-foreground">por <span className="text-foreground">{sim.author}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Simulados;
