import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  FileText,
  Video,
  DollarSign,
  TrendingUp,
  Star,
  Eye,
  MessageSquare,
  Calendar,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";

const mockTeacherStats = {
  totalStudents: 1243,
  activeTurmas: 8,
  publishedContent: 47,
  publishedSimulados: 23,
  monthlyRevenue: 12450,
  totalViews: 89340,
  avgRating: 4.8,
  pendingComments: 12,
};

const turmas = [
  { id: 1, name: "Turma ENEM 2025 - Biologia", students: 156, avgAccuracy: 72, progress: 65 },
  { id: 2, name: "Turma Vestibular - Química", students: 98, avgAccuracy: 68, progress: 50 },
  { id: 3, name: "Intensivo Matemática", students: 234, avgAccuracy: 75, progress: 80 },
  { id: 4, name: "Redação ENEM - Avançado", students: 187, avgAccuracy: 70, progress: 55 },
];

const topContent = [
  { title: "Resumo: Genética e Hereditariedade", views: 12340, rating: 4.9, type: "Resumo" },
  { title: "Simulado ENEM - Ciências da Natureza", views: 8920, rating: 4.7, type: "Simulado" },
  { title: "Lista: Funções Orgânicas", views: 6780, rating: 4.8, type: "Exercício" },
  { title: "Curso: Biologia Celular Completa", views: 5430, rating: 4.6, type: "Curso" },
];

const upcomingClasses = [
  { title: "Revisão Final - Biologia Molecular", date: "Hoje, 19h", enrolled: 234, status: "live" },
  { title: "Aula: Termoquímica", date: "Amanhã, 14h", enrolled: 156, status: "scheduled" },
  { title: "Q&A - Dúvidas Pré-Prova", date: "Sex, 20h", enrolled: 312, status: "scheduled" },
];

const recentComments = [
  { question: "ENEM 2023 Q42 - Biologia", student: "Maria S.", time: "2h atrás", preview: "Professor, essa questão sobre mitose..." },
  { question: "Simulado Bio - Q15", student: "Pedro L.", time: "5h atrás", preview: "Não entendi a alternativa C..." },
  { question: "FUVEST 2024 Q8", student: "Ana R.", time: "1 dia atrás", preview: "A explicação sobre enzimas..." },
];

const revenueBreakdown = [
  { source: "Cursos Premium", value: 5200, percent: 42 },
  { source: "Simulados", value: 3100, percent: 25 },
  { source: "Mentorias", value: 2400, percent: 19 },
  { source: "Resumos", value: 1750, percent: 14 },
];

const TeacherDashboard = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Painel do Professor 📚</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas turmas, conteúdos e acompanhe seus resultados.</p>
        </div>
        <div className="hidden md:flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/app/conteudos">
              <FileText className="w-4 h-4 mr-2" />
              Novo Conteúdo
            </Link>
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" asChild>
            <Link to="/app/aulas">
              <Video className="w-4 h-4 mr-2" />
              Agendar Aula
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockTeacherStats.totalStudents.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Alunos totais</p>
              </div>
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
                <p className="text-2xl font-bold">{mockTeacherStats.publishedContent}</p>
                <p className="text-xs text-muted-foreground">Conteúdos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {(mockTeacherStats.monthlyRevenue / 1000).toFixed(1)}k</p>
                <p className="text-xs text-muted-foreground">Receita mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockTeacherStats.avgRating}</p>
                <p className="text-xs text-muted-foreground">Avaliação média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Turmas */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Minhas Turmas
                </CardTitle>
                <Badge variant="secondary">{mockTeacherStats.activeTurmas} ativas</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {turmas.map((t) => (
                <div key={t.id} className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{t.name}</p>
                    <span className="text-xs text-muted-foreground">{t.students} alunos</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={t.progress} className="h-1.5" />
                    </div>
                    <span className="text-xs font-medium text-accent">{t.avgAccuracy}% acerto</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Revenue breakdown */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accent" />
                Receita por Fonte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {revenueBreakdown.map((item) => (
                <div key={item.source} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.source}</span>
                    <span className="font-medium">R$ {item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium">Total do mês</span>
                <span className="text-lg font-bold text-accent">R$ {mockTeacherStats.monthlyRevenue.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Top content */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Conteúdo Mais Acessado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topContent.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <div>
                      <p className="font-medium text-sm">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{c.type}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {c.views.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-accent">
                    <Star className="w-3.5 h-3.5 fill-accent" />
                    <span className="text-sm font-medium">{c.rating}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming classes */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" />
                Aulas ao Vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingClasses.map((c) => (
                <div key={c.title} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{c.title}</p>
                    {c.status === "live" && (
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">AO VIVO</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {c.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {c.enrolled} inscritos
                    </span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-primary" asChild>
                <Link to="/app/aulas">
                  Ver agenda completa <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pending comments */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  Comentários Pendentes
                </CardTitle>
                <Badge variant="secondary">{mockTeacherStats.pendingComments}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentComments.map((c, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{c.student}</p>
                    <span className="text-xs text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.question}</p>
                  <p className="text-xs text-foreground/80 line-clamp-1">{c.preview}</p>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-primary">
                Ver todos <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Resumo do Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Simulados respondidos</span>
                <span className="font-medium">3.421</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Questões comentadas</span>
                <span className="font-medium">189</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Horas assistidas</span>
                <span className="font-medium">1.230h</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Novos alunos</span>
                <span className="font-medium text-accent">+87</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
