import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Users,
  Plus,
  Search,
  Lock,
  Globe,
  Calendar,
  MessageSquare,
  TrendingUp,
  Crown,
} from "lucide-react";

type Group = {
  id: string;
  name: string;
  description: string;
  members: number;
  maxMembers: number;
  category: string;
  privacy: "public" | "private";
  activity: "high" | "medium" | "low";
  joined?: boolean;
  nextMeeting?: string;
  owner: string;
};

const mockGroups: Group[] = [
  {
    id: "1",
    name: "Maratona ENEM 2025",
    description: "Grupo focado em revisão diária de questões do ENEM. Encontros 3x por semana.",
    members: 248,
    maxMembers: 300,
    category: "ENEM",
    privacy: "public",
    activity: "high",
    joined: true,
    nextMeeting: "Hoje, 19h",
    owner: "Profa. Mariana",
  },
  {
    id: "2",
    name: "Redação Nota 1000",
    description: "Correção colaborativa de redações com feedback de professores e alunos.",
    members: 156,
    maxMembers: 200,
    category: "Redação",
    privacy: "public",
    activity: "high",
    joined: true,
    nextMeeting: "Amanhã, 20h",
    owner: "Prof. Ricardo",
  },
  {
    id: "3",
    name: "Medicina USP - Foco Total",
    description: "Grupo restrito para candidatos a Medicina na USP. Foco em FUVEST.",
    members: 45,
    maxMembers: 50,
    category: "FUVEST",
    privacy: "private",
    activity: "high",
    owner: "Carlos E.",
  },
  {
    id: "4",
    name: "Física Quântica Descomplicada",
    description: "Estudos avançados em Física moderna para vestibulares específicos.",
    members: 89,
    maxMembers: 150,
    category: "Física",
    privacy: "public",
    activity: "medium",
    owner: "Prof. Almeida",
  },
  {
    id: "5",
    name: "Inglês para Vestibular",
    description: "Reading, gramática e interpretação de textos em inglês.",
    members: 312,
    maxMembers: 500,
    category: "Idiomas",
    privacy: "public",
    activity: "medium",
    owner: "Profa. Helena",
  },
  {
    id: "6",
    name: "Química Orgânica Hardcore",
    description: "Mergulho profundo em mecanismos de reações orgânicas.",
    members: 67,
    maxMembers: 100,
    category: "Química",
    privacy: "public",
    activity: "low",
    owner: "Prof. Daniel",
  },
];

const activityColor = {
  high: "bg-accent/10 text-accent border-accent/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-muted",
};

const activityLabel = { high: "Muito ativo", medium: "Ativo", low: "Pouco ativo" };

const StudyGroups = () => {
  const [groups, setGroups] = useState(mockGroups);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const myGroups = groups.filter((g) => g.joined);
  const exploreGroups = groups.filter(
    (g) => !g.joined && g.name.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleJoin = (id: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, joined: !g.joined, members: g.joined ? g.members - 1 : g.members + 1 }
          : g,
      ),
    );
  };

  const renderGroup = (g: Group) => (
    <Card key={g.id} className="hover:border-primary/30 transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold leading-tight">{g.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {g.category}
                </Badge>
                {g.privacy === "private" ? (
                  <Lock className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Globe className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
          <Badge className={activityColor[g.activity]} variant="outline">
            {activityLabel[g.activity]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{g.description}</p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Crown className="w-3 h-3" /> {g.owner}
          </span>
          <span>
            {g.members}/{g.maxMembers} membros
          </span>
        </div>

        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${(g.members / g.maxMembers) * 100}%` }}
          />
        </div>

        {g.nextMeeting && (
          <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-primary/5 border border-primary/10">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>
              Próximo encontro: <strong>{g.nextMeeting}</strong>
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant={g.joined ? "outline" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => toggleJoin(g.id)}
          >
            {g.joined ? "Sair do grupo" : "Entrar"}
          </Button>
          {g.joined && (
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Grupos de Estudo</h1>
          <p className="text-muted-foreground">
            Estude em grupo, troque conhecimento e mantenha-se motivado.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4" />
              Criar grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo grupo de estudo</DialogTitle>
              <DialogDescription>
                Configure seu grupo e convide outros estudantes para participar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome do grupo</Label>
                <Input placeholder="Ex: Maratona ENEM 2025" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descreva o objetivo e a rotina do grupo..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input placeholder="Ex: ENEM, FUVEST..." />
                </div>
                <div className="space-y-2">
                  <Label>Limite de membros</Label>
                  <Input type="number" placeholder="100" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setOpen(false)}>Criar grupo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Meus grupos", value: myGroups.length, icon: Users },
          { label: "Grupos disponíveis", value: groups.length, icon: Globe },
          { label: "Encontros hoje", value: 3, icon: Calendar },
          { label: "Mensagens novas", value: 24, icon: MessageSquare },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="meus" className="space-y-6">
        <TabsList>
          <TabsTrigger value="meus">Meus grupos ({myGroups.length})</TabsTrigger>
          <TabsTrigger value="explorar">Explorar</TabsTrigger>
          <TabsTrigger value="recomendados">Recomendados</TabsTrigger>
        </TabsList>

        <TabsContent value="meus" className="space-y-4">
          {myGroups.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Você ainda não participa de nenhum grupo. Explore os disponíveis!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGroups.map(renderGroup)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="explorar" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exploreGroups.map(renderGroup)}
          </div>
        </TabsContent>

        <TabsContent value="recomendados" className="space-y-4">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-accent" />
              <p className="text-sm">
                Grupos recomendados com base no seu perfil de estudo e desempenho recente.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.slice(0, 3).map(renderGroup)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudyGroups;
