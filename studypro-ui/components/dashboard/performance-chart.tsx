"use client"

import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#10b981", "#ef4444"]

export function PerformanceChart({ accuracyRate, errorRate }: { accuracyRate: number; errorRate: number }) {
  const data = [
    { name: "Acerto", value: Number((accuracyRate * 100).toFixed(1)) },
    { name: "Erro", value: Number((errorRate * 100).toFixed(1)) },
  ]

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
