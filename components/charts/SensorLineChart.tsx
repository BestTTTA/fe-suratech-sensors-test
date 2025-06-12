"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { SensorReading } from "@/lib/types"

interface SensorLineChartProps {
  data: SensorReading[]
  dataKey: string | string[]
  yAxisLabel?: string
  color?: string | string[]
}

export function SensorLineChart({ data, dataKey, yAxisLabel, color = "#2563eb" }: SensorLineChartProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatTooltipValue = (value: number) => {
    return typeof value === "number" ? value.toFixed(2) : value
  }

  const renderLines = () => {
    if (Array.isArray(dataKey)) {
      return dataKey.map((key, index) => {
        const lineColor = Array.isArray(color) ? color[index % color.length] : color
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())

        return (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={label}
            stroke={lineColor}
            activeDot={{ r: 6 }}
            strokeWidth={2}
          />
        )
      })
    }

    return (
      <Line
        type="monotone"
        dataKey={dataKey}
        stroke={Array.isArray(color) ? color[0] : color}
        activeDot={{ r: 6 }}
        strokeWidth={2}
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="timestamp" tickFormatter={formatDate} stroke="#9ca3af" />
        <YAxis
          label={{
            value: yAxisLabel,
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle", fill: "#6b7280" },
          }}
          stroke="#9ca3af"
        />
        <Tooltip formatter={formatTooltipValue} labelFormatter={(label) => new Date(label).toLocaleString()} />
        <Legend />
        {renderLines()}
      </LineChart>
    </ResponsiveContainer>
  )
}
