import { Building2, Star, Trophy, Users } from "lucide-react"

const highlights = [
  { icon: Users, value: "50k+", label: "alunos ativos" },
  { icon: Trophy, value: "87%", label: "taxa de aprovação" },
  { icon: Star, value: "4.9/5", label: "avaliação média" },
  { icon: Building2, value: "120+", label: "instituições" },
]

export function SocialProof() {
  return (
    <section className="border-y border-border/50 bg-muted/20 py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:grid-cols-4 sm:px-6 lg:px-8">
        {highlights.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/40 bg-background/80 p-4 text-center">
            <item.icon className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-2 text-xl font-semibold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
