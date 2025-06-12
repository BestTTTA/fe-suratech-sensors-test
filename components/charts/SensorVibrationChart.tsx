"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface SensorVibrationChartProps {
  data: any[]
  period: "daily" | "weekly" | "monthly"
}

export function SensorVibrationChart({ data, period }: SensorVibrationChartProps) {
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
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tickFormatter={formatXAxis} stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip formatter={(value) => value.toFixed(2)} />
        <Legend />
        <Line type="monotone" dataKey="x" name="X-Axis" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="y" name="Y-Axis" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="z" name="Z-Axis" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
