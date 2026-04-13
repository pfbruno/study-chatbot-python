import { SimulationV2AnalyticsResponse } from "@/lib/api"

export function InsightsPanel({ analytics }: { analytics: SimulationV2AnalyticsResponse | null }) {
  if (!analytics) {
    return <p className="text-sm text-muted-foreground">Selecione um simulado para visualizar insights.</p>
  }

  const hardQuestions = analytics.questions.filter((question) => question.difficulty === "hard").length
  const mediumQuestions = analytics.questions.filter((question) => question.difficulty === "medium").length

  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>Foram registradas {analytics.attempts_count} tentativas no período selecionado.</p>
      <p>
        Questões difíceis: <span className="font-medium text-foreground">{hardQuestions}</span> · médias: <span className="font-medium text-foreground">{mediumQuestions}</span>
      </p>
      <p>
        Alternativa mais marcada: <span className="font-medium text-foreground">{analytics.most_marked_option?.option ?? "N/A"}</span>
      </p>
    </div>
  )
}
