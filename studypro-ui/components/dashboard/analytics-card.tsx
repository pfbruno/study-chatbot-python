import { Card, CardContent } from "@/components/ui/card"

export function AnalyticsCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle?: string
  icon?: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">
              {value}
            </p>
            {subtitle ? (
              <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
            ) : null}
          </div>

          {icon ? (
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}