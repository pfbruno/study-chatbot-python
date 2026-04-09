import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/4 right-0 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Mais de 10.000 questões disponíveis
          </div>
          
          <h1 className="text-pretty text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="text-foreground">Conquiste sua vaga com </span>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              provas reais
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Pratique com ENEM e vestibulares, acompanhe seu desempenho e evolua com feedback inteligente
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="group h-12 gap-2 bg-primary px-8 hover:bg-primary/90">
              <Link href="/register">
                Começar agora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 gap-2 border-border/50 px-8">
              <Link href="#planos">
                <Play className="h-4 w-4" />
                Ver planos
              </Link>
            </Button>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">50k+</span> estudantes
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">95%</span> aprovação
            </div>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="font-semibold text-foreground">4.9</span> avaliação
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
