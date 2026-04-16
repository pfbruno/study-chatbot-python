import { Card, CardContent } from "@/components/ui/card"

export function InsightsPanel({
  insights,
  streak,
  bestStreak,
  accuracyRate,
}: {
  insights: string
  streak: number
  bestStreak: number
  accuracyRate: number
}) {
  const normalizedInsights =
    insights?.trim() || "Continue praticando para gerar insights mais detalhados."

  return (
    <Card className="rounded-[32px] border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-6 md:p-7">
        <p className="text-sm text-muted-foreground">Insights</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Leitura inteligente do seu momento
        </h2>

        <div className="mt-6 rounded-[24px] border border-white/10 bg-slate-950/60 p-5">
          <p className="text-sm leading-8 text-slate-300">{normalizedInsights}</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-muted-foreground">Sequência atual</p>
            <p className="mt-2 text-2xl font-bold text-white">{streak}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-muted-foreground">Melhor sequência</p>
            <p className="mt-2 text-2xl font-bold text-white">{bestStreak}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-muted-foreground">Aproveitamento</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {(accuracyRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}