"use client"

import { Card, CardContent } from "@/components/ui/card"

export function PerformanceChart({
  accuracyRate,
  errorRate,
  totalQuestions,
}: {
  accuracyRate: number
  errorRate: number
  totalQuestions: number
}) {
  const accuracyPercent = Number((accuracyRate * 100).toFixed(1))
  const errorPercent = Number((errorRate * 100).toFixed(1))

  return (
    <Card className="rounded-[32px] border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-6 md:p-7">
        <p className="text-sm text-muted-foreground">Performance</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Distribuição de acertos e erros
        </h2>

        <div className="mt-8">
          <div className="h-5 overflow-hidden rounded-full border border-white/10 bg-slate-950/70">
            <div className="flex h-full w-full">
              <div
                className="h-full bg-primary"
                style={{ width: `${accuracyPercent}%` }}
              />
              <div
                className="h-full bg-rose-400/80"
                style={{ width: `${errorPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm text-muted-foreground">Acertos</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {accuracyPercent}%
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm text-muted-foreground">Erros</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {errorPercent}%
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Total de questões consideradas:{" "}
            <span className="font-semibold text-white">{totalQuestions}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}