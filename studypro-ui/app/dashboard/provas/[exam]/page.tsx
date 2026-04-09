import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Calendar } from "lucide-react"
import { notFound } from "next/navigation"

const examData: Record<string, { name: string; startYear: number; endYear: number }> = {
  enem: { name: "ENEM", startYear: 2000, endYear: 2025 },
  ufrgs: { name: "UFRGS", startYear: 2005, endYear: 2025 },
  ufsc: { name: "UFSC", startYear: 2007, endYear: 2025 },
}

export default async function ExamYearsPage({
  params,
}: {
  params: Promise<{ exam: string }>
}) {
  const { exam } = await params
  const data = examData[exam]

  if (!data) {
    notFound()
  }

  const years = Array.from(
    { length: data.endYear - data.startYear + 1 },
    (_, i) => data.endYear - i
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/provas">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{data.name}</h1>
          <p className="mt-1 text-muted-foreground">
            Selecione o ano da prova
          </p>
        </div>
      </div>

      {/* Years Grid */}
      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {years.map((year) => (
          <Link key={year} href={`/dashboard/provas/${exam}/${year}`}>
            <Card className="group border-border/50 bg-card transition-all hover:border-primary/50 hover:bg-primary/5">
              <CardContent className="flex items-center justify-center gap-2 p-4">
                <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                <span className="font-semibold group-hover:text-primary">{year}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
