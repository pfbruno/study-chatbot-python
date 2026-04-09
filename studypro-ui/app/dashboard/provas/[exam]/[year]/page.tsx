"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Play, FileText, Clock, HelpCircle } from "lucide-react"
import { use } from "react"

const examNames: Record<string, string> = {
  enem: "ENEM",
  ufrgs: "UFRGS",
  ufsc: "UFSC",
}

export default function ExamDetailPage({
  params,
}: {
  params: Promise<{ exam: string; year: string }>
}) {
  const { exam, year } = use(params)
  const examName = examNames[exam] || exam.toUpperCase()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/provas/${exam}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {examName} {year}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Prova completa com gabarito oficial
          </p>
        </div>
      </div>

      {/* Exam Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações da prova</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Questões</p>
                  <p className="text-xl font-semibold">90</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tempo</p>
                  <p className="text-xl font-semibold">5h30min</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="text-xl font-semibold">Objetiva</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="font-semibold">Áreas do conhecimento</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Linguagens",
                  "Matemática",
                  "Ciências da Natureza",
                  "Ciências Humanas",
                ].map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-border/50 bg-secondary/50 px-3 py-1 text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle>Começar prova</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Realize a prova completa com correção automática e acompanhe seu desempenho.
            </p>
            <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
              <Play className="h-4 w-4" />
              Realizar prova
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Seu progresso será salvo automaticamente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exam Preview Area */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle>Visualização da prova</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border/50 bg-secondary/30">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                Clique em &quot;Realizar prova&quot; para começar
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
