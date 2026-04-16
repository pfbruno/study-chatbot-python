import { Award, BookOpen, TrendingUp, Users } from "lucide-react"

const highlights = [
  { icon: Users, value: "50.000+", label: "alunos ativos" },
  { icon: BookOpen, value: "100.000+", label: "questões resolvidas" },
  { icon: TrendingUp, value: "87%", label: "taxa de aprovação" },
  { icon: Award, value: "200+", label: "professores parceiros" },
]

export function SocialProof() {
  return (
    <section className="pb-8 pt-16 md:pb-10 md:pt-20">
      <div className="container-shell">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.label}
                className="glass-panel rounded-[24px] p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white/6 text-primary ring-1 ring-white/10">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{item.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {item.label}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}