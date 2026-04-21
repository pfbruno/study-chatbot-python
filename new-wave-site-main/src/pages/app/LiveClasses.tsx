import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Video,
  Calendar,
  Clock,
  Users,
  Bell,
  BellOff,
  Play,
  Search,
  Radio,
  CheckCircle2,
  Star,
} from "lucide-react";

type Class = {
  id: string;
  title: string;
  teacher: string;
  teacherInitials: string;
  subject: string;
  date: string;
  time: string;
  duration: string;
  status: "live" | "upcoming" | "recorded";
  viewers?: number;
  attendees?: number;
  thumbnail: string;
  description: string;
  registered?: boolean;
  rating?: number;
};

const mockClasses: Class[] = [
  {
    id: "1",
    title: "Revisão Geral: Funções e Equações para o ENEM",
    teacher: "Profa. Mariana Lopes",
    teacherInitials: "ML",
    subject: "Matemática",
    date: "Hoje",
    time: "19:00",
    duration: "90 min",
    status: "live",
    viewers: 1248,
    thumbnail: "from-primary/30 to-accent/30",
    description: "Aula ao vivo cobrindo os principais tópicos cobrados no ENEM dos últimos 5 anos.",
    registered: true,
  },
  {
    id: "2",
    title: "Como estruturar uma redação nota 1000",
    teacher: "Prof. Ricardo Alves",
    teacherInitials: "RA",
    subject: "Redação",
    date: "Amanhã",
    time: "20:00",
    duration: "120 min",
    status: "upcoming",
    attendees: 489,
    thumbnail: "from-accent/30 to-primary/30",
    description: "Estrutura, repertório sociocultural e proposta de intervenção em detalhes.",
    registered: true,
  },
  {
    id: "3",
    title: "Química Orgânica: Reações de Substituição",
    teacher: "Prof. Daniel Santos",
    teacherInitials: "DS",
    subject: "Química",
    date: "Sex, 18 abr",
    time: "18:30",
    duration: "60 min",
    status: "upcoming",
    attendees: 156,
    thumbnail: "from-primary/20 to-secondary/30",
    description: "Mecanismos de SN1 e SN2 explicados com exemplos práticos.",
  },
  {
    id: "4",
    title: "História do Brasil: República Velha completa",
    teacher: "Profa. Helena Costa",
    teacherInitials: "HC",
    subject: "História",
    date: "Sáb, 19 abr",
    time: "10:00",
    duration: "90 min",
    status: "upcoming",
    attendees: 234,
    thumbnail: "from-accent/20 to-primary/20",
    description: "Da Proclamação à Revolução de 1930, com foco em questões de vestibulares.",
  },
  {
    id: "5",
    title: "Física: Eletromagnetismo do zero ao avançado",
    teacher: "Prof. Almeida",
    teacherInitials: "AL",
    subject: "Física",
    date: "10 abr",
    time: "19:00",
    duration: "110 min",
    status: "recorded",
    viewers: 3421,
    thumbnail: "from-primary/30 to-accent/20",
    description: "Aula gravada com todo o conteúdo de eletromagnetismo para o ENEM.",
    rating: 4.9,
  },
  {
    id: "6",
    title: "Biologia Celular: Mitose e Meiose",
    teacher: "Profa. Mariana Lopes",
    teacherInitials: "ML",
    subject: "Biologia",
    date: "5 abr",
    time: "20:00",
    duration: "75 min",
    status: "recorded",
    viewers: 2189,
    thumbnail: "from-accent/30 to-primary/20",
    description: "Comparação detalhada com diagramas animados.",
    rating: 4.8,
  },
];

const LiveClasses = () => {
  const [classes, setClasses] = useState(mockClasses);
  const [search, setSearch] = useState("");

  const live = classes.filter((c) => c.status === "live");
  const upcoming = classes.filter((c) => c.status === "upcoming");
  const recorded = classes.filter(
    (c) =>
      c.status === "recorded" &&
      (c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.subject.toLowerCase().includes(search.toLowerCase())),
  );

  const toggleRegister = (id: string) => {
    setClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, registered: !c.registered } : c)),
    );
  };

  const renderClass = (c: Class) => (
    <Card key={c.id} className="overflow-hidden hover:border-primary/30 transition-all hover:shadow-md">
      <div className={`relative h-40 bg-gradient-to-br ${c.thumbnail} flex items-center justify-center`}>
        <Video className="w-12 h-12 text-foreground/20" />
        {c.status === "live" && (
          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground border-0 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            AO VIVO
          </Badge>
        )}
        {c.status === "recorded" && (
          <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border-0">
            Gravada
          </Badge>
        )}
        <Badge variant="secondary" className="absolute top-3 right-3">
          {c.subject}
        </Badge>
        {c.status === "recorded" && (
          <Button
            size="icon"
            className="absolute inset-0 m-auto w-14 h-14 rounded-full opacity-0 hover:opacity-100 transition-opacity bg-background/90 text-foreground hover:bg-background"
          >
            <Play className="w-6 h-6 fill-current" />
          </Button>
        )}
      </div>
      <CardHeader className="pb-2">
        <h3 className="font-heading font-semibold leading-tight line-clamp-2">{c.title}</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>

        <div className="flex items-center gap-2">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="text-xs bg-accent/10 text-accent">
              {c.teacherInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{c.teacher}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{c.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {c.time} • {c.duration}
            </span>
          </div>
          {c.status === "live" && (
            <div className="flex items-center gap-1.5 text-destructive col-span-2">
              <Radio className="w-3.5 h-3.5" />
              <span>{c.viewers} assistindo agora</span>
            </div>
          )}
          {c.status === "upcoming" && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Users className="w-3.5 h-3.5" />
              <span>{c.attendees} inscritos</span>
            </div>
          )}
          {c.status === "recorded" && (
            <>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{c.viewers} views</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-accent text-accent" />
                <span>{c.rating}</span>
              </div>
            </>
          )}
        </div>

        {c.status === "live" && (
          <Button className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            <Play className="w-4 h-4 fill-current" />
            Entrar agora
          </Button>
        )}
        {c.status === "upcoming" && (
          <Button
            variant={c.registered ? "outline" : "default"}
            className="w-full"
            onClick={() => toggleRegister(c.id)}
          >
            {c.registered ? (
              <>
                <BellOff className="w-4 h-4" />
                Cancelar lembrete
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Receber lembrete
              </>
            )}
          </Button>
        )}
        {c.status === "recorded" && (
          <Button variant="outline" className="w-full">
            <Play className="w-4 h-4" />
            Assistir gravação
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold">Aulas ao Vivo</h1>
        <p className="text-muted-foreground">
          Assista, interaja e aprenda em tempo real com os melhores professores.
        </p>
      </header>

      {/* Live banner */}
      {live.length > 0 && (
        <Card className="bg-gradient-to-r from-destructive/10 via-primary/10 to-accent/10 border-destructive/30">
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive flex items-center justify-center">
                <Radio className="w-5 h-5 text-destructive-foreground animate-pulse" />
              </div>
              <div>
                <div className="font-heading font-semibold">
                  {live.length} aula{live.length > 1 ? "s" : ""} ao vivo agora
                </div>
                <p className="text-xs text-muted-foreground">
                  Não perca! Os professores estão online esperando você.
                </p>
              </div>
            </div>
            <Button>
              <Play className="w-4 h-4 fill-current" />
              Ver aulas ao vivo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Ao vivo agora", value: live.length, icon: Radio, color: "text-destructive" },
          { label: "Próximas aulas", value: upcoming.length, icon: Calendar, color: "text-primary" },
          {
            label: "Inscrito em",
            value: classes.filter((c) => c.registered).length,
            icon: CheckCircle2,
            color: "text-accent",
          },
          { label: "Aulas gravadas", value: 142, icon: Video, color: "text-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="proximas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="aovivo">Ao vivo ({live.length})</TabsTrigger>
          <TabsTrigger value="proximas">Próximas ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="gravadas">Gravadas</TabsTrigger>
        </TabsList>

        <TabsContent value="aovivo">
          {live.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                Nenhuma aula ao vivo no momento. Confira a agenda das próximas!
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {live.map(renderClass)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="proximas">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcoming.map(renderClass)}
          </div>
        </TabsContent>

        <TabsContent value="gravadas" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aulas gravadas..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recorded.map(renderClass)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveClasses;
