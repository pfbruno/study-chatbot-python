import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Brain,
  BookOpen,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// Mock data
const evolutionData = [
  { month: "Jan", acerto: 52, media: 55 },
  { month: "Fev", acerto: 58, media: 56 },
  { month: "Mar", acerto: 55, media: 57 },
  { month: "Abr", acerto: 63, media: 58 },
  { month: "Mai", acerto: 67, media: 58 },
  { month: "Jun", acerto: 65, media: 59 },
  { month: "Jul", acerto: 72, media: 59 },
  { month: "Ago", acerto: 70, media: 60 },
  { month: "Set", acerto: 75, media: 60 },
  { month: "Out", acerto: 78, media: 61 },
  { month: "Nov", acerto: 76, media: 61 },
  { month: "Dez", acerto: 82, media: 62 },
];

const subjectAccuracy = [
  { subject: "Matemática", acerto: 78, media: 62, questions: 342, color: "hsl(217 91% 60%)" },
  { subject: "Biologia", acerto: 72, media: 58, questions: 289, color: "hsl(160 84% 39%)" },
  { subject: "Química", acerto: 65, media: 55, questions: 198, color: "hsl(280 70% 55%)" },
  { subject: "Física", acerto: 60, media: 52, questions: 231, color: "hsl(35 90% 55%)" },
  { subject: "Português", acerto: 85, media: 65, questions: 412, color: "hsl(340 75% 55%)" },
  { subject: "História", acerto: 70, media: 60, questions: 178, color: "hsl(190 80% 45%)" },
  { subject: "Geografia", acerto: 68, media: 57, questions: 156, color: "hsl(45 90% 50%)" },
  { subject: "Redação", acerto: 74, media: 58, questions: 45, color: "hsl(120 60% 45%)" },
];

const radarData = subjectAccuracy.map((s) => ({
  subject: s.subject.slice(0, 4),
  voce: s.acerto,
  media: s.media,
}));

const weeklyStudyData = [
  { day: "Seg", tempo: 120, questoes: 35 },
  { day: "Ter", tempo: 90, questoes: 28 },
  { day: "Qua", tempo: 150, questoes: 42 },
  { day: "Qui", tempo: 60, questoes: 18 },
  { day: "Sex", tempo: 180, questoes: 52 },
  { day: "Sáb", tempo: 200, questoes: 60 },
  { day: "Dom", tempo: 110, questoes: 30 },
];

const hardestQuestions = [
  { id: "Q42", subject: "Física", topic: "Termodinâmica", accuracy: 12, avgTime: "4:32" },
  { id: "Q18", subject: "Química", topic: "Equilíbrio Químico", accuracy: 18, avgTime: "3:45" },
  { id: "Q67", subject: "Matemática", topic: "Geometria Analítica", accuracy: 22, avgTime: "5:10" },
  { id: "Q33", subject: "Biologia", topic: "Genética", accuracy: 25, avgTime: "3:20" },
  { id: "Q91", subject: "Física", topic: "Eletromagnetismo", accuracy: 28, avgTime: "4:55" },
];

const simuladoHistory = [
  { name: "ENEM 2024 CN", score: 72, avg: 58, date: "Dez 2024", questions: 45 },
  { name: "FUVEST 1ª Fase", score: 65, avg: 52, date: "Nov 2024", questions: 90 },
  { name: "UNICAMP Mat", score: 80, avg: 60, date: "Nov 2024", questions: 30 },
  { name: "ENEM 2024 MT", score: 68, avg: 55, date: "Out 2024", questions: 45 },
  { name: "ENEM 2023 CN", score: 75, avg: 57, date: "Out 2024", questions: 45 },
];

const overallStats = {
  totalQuestions: 1851,
  totalSimulados: 34,
  avgAccuracy: 72,
  platformAvg: 58,
  avgTimePerQuestion: "2:15",
  avgTimePerSimulado: "1h 42min",
  streak: 7,
  bestSubject: "Português",
  worstSubject: "Física",
  improvement: 30,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium">{p.value}{typeof p.value === 'number' && p.value <= 100 ? '%' : ''}</span>
        </p>
      ))}
    </div>
  );
};

const TrendBadge = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-accent">
      <ArrowUp className="w-3 h-3" /> +{value}{suffix}
    </span>
  );
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-destructive">
      <ArrowDown className="w-3 h-3" /> {value}{suffix}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
      <Minus className="w-3 h-3" /> 0{suffix}
    </span>
  );
};

const Analytics = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Acompanhe sua evolução e identifique pontos de melhoria.</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.avgAccuracy}%</p>
                <p className="text-xs text-muted-foreground">Taxa de acerto</p>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Média: {overallStats.platformAvg}%</span>
              <TrendBadge value={overallStats.avgAccuracy - overallStats.platformAvg} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.totalQuestions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Questões feitas</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">{overallStats.totalSimulados} simulados</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overallStats.avgTimePerQuestion}</p>
                <p className="text-xs text-muted-foreground">Tempo/questão</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">Simulado: {overallStats.avgTimePerSimulado}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">+{overallStats.improvement}%</p>
                <p className="text-xs text-muted-foreground">Evolução total</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-muted-foreground">nos últimos 12 meses</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="evolution" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="subjects">Matérias</TabsTrigger>
          <TabsTrigger value="simulados">Simulados</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        {/* EVOLUTION TAB */}
        <TabsContent value="evolution" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Evolução de Acertos vs Média da Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData}>
                      <defs>
                        <linearGradient id="colorAcerto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(217 91% 60%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                      <XAxis dataKey="month" stroke="hsl(215 20% 55%)" tick={{ fontSize: 12 }} />
                      <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 12 }} domain={[40, 90]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="acerto" stroke="hsl(217 91% 60%)" fill="url(#colorAcerto)" strokeWidth={2} name="Você" />
                      <Line type="monotone" dataKey="media" stroke="hsl(215 20% 55%)" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Média" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Radar de Habilidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(222 30% 18%)" />
                      <PolarAngleAxis dataKey="subject" stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Você" dataKey="voce" stroke="hsl(217 91% 60%)" fill="hsl(217 91% 60%)" fillOpacity={0.2} strokeWidth={2} />
                      <Radar name="Média" dataKey="media" stroke="hsl(160 84% 39%)" fill="hsl(160 84% 39%)" fillOpacity={0.1} strokeWidth={1.5} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly study */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Estudo da Semana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStudyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                    <XAxis dataKey="day" stroke="hsl(215 20% 55%)" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" stroke="hsl(215 20% 55%)" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(215 20% 55%)" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar yAxisId="left" dataKey="tempo" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} name="Minutos" opacity={0.8} />
                    <Bar yAxisId="right" dataKey="questoes" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} name="Questões" opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUBJECTS TAB */}
        <TabsContent value="subjects" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-4">
            {subjectAccuracy.map((s) => {
              const diff = s.acerto - s.media;
              return (
                <Card key={s.subject} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="font-medium">{s.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendBadge value={diff} />
                        <span className="text-xs text-muted-foreground">vs média</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Seu acerto</span>
                        <span className="font-bold" style={{ color: s.color }}>{s.acerto}%</span>
                      </div>
                      <div className="relative w-full bg-secondary rounded-full h-2.5">
                        <div className="absolute top-0 left-0 h-2.5 rounded-full transition-all" style={{ width: `${s.acerto}%`, backgroundColor: s.color }} />
                        <div className="absolute top-0 h-2.5 w-0.5 bg-foreground/50 rounded" style={{ left: `${s.media}%` }} title={`Média: ${s.media}%`} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Média da plataforma: {s.media}%</span>
                        <span>{s.questions} questões</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Subject bar chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Comparação por Matéria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectAccuracy} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                    <XAxis type="number" domain={[0, 100]} stroke="hsl(215 20% 55%)" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="subject" type="category" stroke="hsl(215 20% 55%)" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="acerto" fill="hsl(217 91% 60%)" radius={[0, 4, 4, 0]} name="Você" opacity={0.9} />
                    <Bar dataKey="media" fill="hsl(215 20% 55%)" radius={[0, 4, 4, 0]} name="Média" opacity={0.4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SIMULADOS TAB */}
        <TabsContent value="simulados" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Histórico de Simulados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {simuladoHistory.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div>
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.questions} questões · {s.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${s.score >= 70 ? "text-accent" : "text-primary"}`}>{s.score}%</p>
                      <p className="text-xs text-muted-foreground">Média: {s.avg}%</p>
                    </div>
                    <TrendBadge value={s.score - s.avg} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Simulado evolution chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Evolução nos Simulados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...simuladoHistory].reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215 20% 55%)" tick={{ fontSize: 10 }} />
                    <YAxis stroke="hsl(215 20% 55%)" tick={{ fontSize: 12 }} domain={[40, 90]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="score" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(217 91% 60%)" }} name="Sua nota" />
                    <Line type="monotone" dataKey="avg" stroke="hsl(215 20% 55%)" strokeDasharray="5 5" strokeWidth={1.5} dot={false} name="Média" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DETAILS TAB */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Hardest questions */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-destructive" />
                  Questões Mais Difíceis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hardestQuestions.map((q) => (
                  <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-sm">{q.subject} - {q.topic}</p>
                      <p className="text-xs text-muted-foreground">{q.id} · Tempo médio: {q.avgTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-destructive">{q.accuracy}%</p>
                      <p className="text-xs text-muted-foreground">acerto</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Best & worst */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-6 h-6 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Melhor matéria</p>
                      <p className="text-xl font-bold text-accent">{overallStats.bestSubject}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você está {subjectAccuracy.find(s => s.subject === overallStats.bestSubject)!.acerto - subjectAccuracy.find(s => s.subject === overallStats.bestSubject)!.media}% acima da média da plataforma nessa matéria.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingDown className="w-6 h-6 text-destructive" />
                    <div>
                      <p className="text-sm text-muted-foreground">Precisa melhorar</p>
                      <p className="text-xl font-bold text-destructive">{overallStats.worstSubject}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A IA recomenda focar em exercícios de {overallStats.worstSubject} essa semana para equilibrar seu desempenho.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5 text-destructive" />
                    <span className="font-medium">Sequência Atual</span>
                  </div>
                  <p className="text-3xl font-bold">{overallStats.streak} dias</p>
                  <p className="text-xs text-muted-foreground">Continue estudando para não perder sua sequência!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
