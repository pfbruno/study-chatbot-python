import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

const exams = [
  {
    id: "enem",
    name: "ENEM",
    description: "Exame Nacional do Ensino Médio",
    totalExams: 26,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "ufrgs",
    name: "UFRGS",
    description: "Universidade Federal do Rio Grande do Sul",
    totalExams: 20,
    color: "from-red-500 to-red-600",
  },
  {
    id: "ufsc",
    name: "UFSC",
    description: "Universidade Federal de Santa Catarina",
    totalExams: 18,
    color: "from-green-500 to-green-600",
  },
]

export default function ProvasPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Provas</h1>
        <p className="mt-1 text-muted-foreground">
          Escolha uma prova para começar a estudar
        </p>
      </div>

      {/* Exam Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map((exam) => (
          <Link key={exam.id} href={`/dashboard/provas/${exam.id}`}>
            <Card className="group h-full border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="flex h-full flex-col p-6">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${exam.color}`}>
                  <span className="text-lg font-bold text-white">
                    {exam.name.slice(0, 2)}
                  </span>
                </div>
                <h3 className="text-xl font-semibold">{exam.name}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">
                  {exam.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {exam.totalExams} provas disponíveis
                  </span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
