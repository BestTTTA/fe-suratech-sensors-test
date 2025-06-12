"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const machinePerformance = [
  { name: "Pump-01", uptime: 99.8, alerts: 2, efficiency: 94 },
  { name: "Pump-02", uptime: 98.5, alerts: 5, efficiency: 92 },
  { name: "Motor-01", uptime: 99.9, alerts: 1, efficiency: 97 },
  { name: "Motor-02", uptime: 97.2, alerts: 8, efficiency: 89 },
  { name: "Compressor-01", uptime: 99.1, alerts: 4, efficiency: 93 },
  { name: "Turbine-01", uptime: 99.7, alerts: 3, efficiency: 95 },
]

const alertsByMachine = [
  { name: "Pump-01", value: 2 },
  { name: "Pump-02", value: 5 },
  { name: "Motor-01", value: 1 },
  { name: "Motor-02", value: 8 },
  { name: "Compressor-01", value: 4 },
  { name: "Turbine-01", value: 3 },
]

const COLORS = ["#3b82f6", "#16a34a", "#dc2626", "#f59e0b", "#8b5cf6", "#ec4899"]

export default function MachineAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Machine Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machinePerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="efficiency" fill="#3b82f6" name="Efficiency %" />
                <Bar dataKey="uptime" fill="#16a34a" name="Uptime %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts by Machine</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertsByMachine}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {alertsByMachine.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Machine Maintenance Forecast</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Machine maintenance forecast visualization will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
