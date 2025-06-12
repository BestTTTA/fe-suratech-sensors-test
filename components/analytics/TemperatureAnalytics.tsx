"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"

const temperatureData = [
  { name: "Jan", avg: 22.4, min: 18.2, max: 26.8 },
  { name: "Feb", avg: 23.1, min: 19.0, max: 27.3 },
  { name: "Mar", avg: 23.8, min: 19.5, max: 28.1 },
  { name: "Apr", avg: 24.2, min: 20.1, max: 28.5 },
  { name: "May", avg: 24.9, min: 20.8, max: 29.2 },
  { name: "Jun", avg: 25.6, min: 21.3, max: 30.1 },
  { name: "Jul", avg: 26.2, min: 21.9, max: 30.8 },
  { name: "Aug", avg: 26.0, min: 21.7, max: 30.5 },
  { name: "Sep", avg: 25.3, min: 21.0, max: 29.8 },
  { name: "Oct", avg: 24.5, min: 20.3, max: 28.9 },
  { name: "Nov", avg: 23.7, min: 19.4, max: 27.9 },
  { name: "Dec", avg: 22.9, min: 18.6, max: 27.1 },
]

const temperatureDistribution = [
  { range: "15-18°C", count: 42 },
  { range: "18-21°C", count: 128 },
  { range: "21-24°C", count: 347 },
  { range: "24-27°C", count: 256 },
  { range: "27-30°C", count: 117 },
  { range: "30-33°C", count: 32 },
  { range: ">33°C", count: 8 },
]

export default function TemperatureAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Temperature Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temperatureData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="min" stackId="1" stroke="#94a3b8" fill="#f1f5f9" name="Min Temp" />
                <Area type="monotone" dataKey="avg" stackId="2" stroke="#3b82f6" fill="#dbeafe" name="Avg Temp" />
                <Area type="monotone" dataKey="max" stackId="3" stroke="#1d4ed8" fill="#bfdbfe" name="Max Temp" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temperature Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={temperatureDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="#dbeafe" name="Sensor Count" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temperature Anomalies</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Temperature anomaly detection visualization will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
