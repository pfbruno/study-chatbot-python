import { Award, BookOpen, ShieldCheck, Target } from "lucide-react"

const highlights = [
  { icon: BookOpen, value: "Provas oficiais", label: "organizadas por exame e ano" },
  { icon: Target, value: "Simulados", label: "com correção automática" },
  { icon: ShieldCheck, value: "Plano Free", label: "para começar sem cartão" },
  { icon: Award, value: "Evolução", label: "com leitura por disciplina" },
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