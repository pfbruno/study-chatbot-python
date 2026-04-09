import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, CheckCircle, Clock, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Provas realizadas",
    value: "24",
    change: "+3 esta semana",
    icon: FileText,
  },
  {
    title: "Questões acertadas",
    value: "847",
    change: "73% de acerto",
    icon: CheckCircle,
  },
  {
    title: "Tempo de estudo",
    value: "48h",
    change: "+12h esta semana",
    icon: Clock,
  },
  {
    title: "Ranking geral",
    value: "#142",
    change: "+28 posições",
    icon: TrendingUp,
  },
]

const recentActivity = [
  { exam: "ENEM 2024 - Dia 1", score: "76%", date: "Hoje" },
  { exam: "UFRGS 2024 - Matemática", score: "82%", date: "Ontem" },
  { exam: "Simulado Semanal #12", score: "71%", date: "3 dias atrás" },
  { exam: "ENEM 2023 - Dia 2", score: "68%", date: "5 dias atrás" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Acompanhe seu progresso e evolua nos estudos
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Desempenho por área</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { area: "Linguagens", progress: 78 },
              { area: "Matemática", progress: 65 },
              { area: "Ciências da Natureza", progress: 72 },
              { area: "Ciências Humanas", progress: 81 },
              { area: "Redação", progress: 70 },
            ].map((item) => (
              <div key={item.area} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.area}</span>
                  <span className="text-muted-foreground">{item.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Atividade recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{activity.exam}</p>
                  <p className="text-sm text-muted-foreground">{activity.date}</p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {activity.score}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
