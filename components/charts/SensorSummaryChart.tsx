"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface SensorSummaryChartProps {
  data: any[]
  dataKey: string
  period: "daily" | "weekly" | "monthly"
}

export function SensorSummaryChart({ data, dataKey, period }: SensorSummaryChartProps) {
  const formatXAxis = (value: string) => {
    if (period === "daily") {
      // Format as hour
      return value
    } else if (period === "weekly") {
      // Format as day of week
      return value
    } else {
      // Format as day of month
      return value
    }
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tickFormatter={formatXAxis} stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip />
        <Area type="monotone" dataKey="min" stackId="1" stroke="#94a3b8" fill="#f1f5f9" />
        <Area type="monotone" dataKey="avg" stackId="2" stroke="#3b82f6" fill="#dbeafe" />
        <Area type="monotone" dataKey="max" stackId="3" stroke="#1d4ed8" fill="#bfdbfe" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
