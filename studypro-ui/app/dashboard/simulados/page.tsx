import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Clock, HelpCircle, Target } from "lucide-react"

const simulados = [
  {
    title: "Simulado Semanal #13",
    questions: 45,
    time: "2h30min",
    difficulty: "Médio",
    areas: ["Linguagens", "Matemática"],
  },
  {
    title: "Simulado ENEM Completo",
    questions: 90,
    time: "5h30min",
    difficulty: "Avançado",
    areas: ["Todas as áreas"],
  },
  {
    title: "Simulado Rápido",
    questions: 20,
    time: "45min",
    difficulty: "Fácil",
    areas: ["Ciências Humanas"],
  },
]

export default function SimuladosPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Simulados</h1>
        <p className="mt-1 text-muted-foreground">
          Pratique com simulados personalizados
        </p>
      </div>

      {/* Quick Start */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row">
          <div>
            <h2 className="text-lg font-semibold">Simulado rápido</h2>
            <p className="text-sm text-muted-foreground">
              20 questões aleatórias em 45 minutos
            </p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Play className="h-4 w-4" />
            Iniciar agora
          </Button>
        </CardContent>
      </Card>

      {/* Simulados Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {simulados.map((simulado, index) => (
          <Card key={index} className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">{simulado.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HelpCircle className="h-4 w-4" />
                  <span>{simulado.questions} questões</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{simulado.time}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>{simulado.difficulty}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {simulado.areas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full bg-secondary/50 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {area}
                  </span>
                ))}
              </div>
              <Button variant="outline" className="w-full">
                Iniciar simulado
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
