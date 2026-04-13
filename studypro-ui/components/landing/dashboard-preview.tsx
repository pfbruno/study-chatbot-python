import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardPreview() {
  return (
    <section className="border-t border-border/50 py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Preview do dashboard
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Visão completa da sua performance</h2>
          <p className="mt-4 text-muted-foreground">
            Indicadores de progresso, simulados recentes e recomendações da IA em uma única tela para decisões rápidas.
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link href="/dashboard">
              Explorar dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-2xl shadow-primary/5">
          <div className="grid gap-4 sm:grid-cols-3">
            {["72% acerto", "5 simulados", "+18% semana"].map((value) => (
              <div key={value} className="rounded-xl border border-border/60 bg-background/80 p-3 text-center text-sm font-medium">
                {value}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border/60 bg-background/80 p-4">
            <p className="text-sm font-semibold">Recomendação de hoje</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Priorize trigonometria e interpretação de texto para elevar seu desempenho global.
            </p>
          </div>
          <div className="mt-4 h-28 rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/5" />
        </div>
      </div>
    </section>
  )
}
