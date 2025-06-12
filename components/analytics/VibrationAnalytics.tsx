"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

const vibrationData = [
  { name: "Jan", x: 0.52, y: 0.48, z: 0.61 },
  { name: "Feb", x: 0.54, y: 0.49, z: 0.63 },
  { name: "Mar", x: 0.57, y: 0.51, z: 0.65 },
  { name: "Apr", x: 0.59, y: 0.53, z: 0.68 },
  { name: "May", x: 0.62, y: 0.56, z: 0.71 },
  { name: "Jun", x: 0.65, y: 0.58, z: 0.74 },
  { name: "Jul", x: 0.68, y: 0.61, z: 0.77 },
  { name: "Aug", x: 0.67, y: 0.6, z: 0.76 },
  { name: "Sep", x: 0.64, y: 0.57, z: 0.73 },
  { name: "Oct", x: 0.61, y: 0.55, z: 0.7 },
  { name: "Nov", x: 0.58, y: 0.52, z: 0.67 },
  { name: "Dec", x: 0.55, y: 0.5, z: 0.64 },
]

const vibrationDistribution = [
  { range: "0.0-0.2", x: 12, y: 18, z: 8 },
  { range: "0.2-0.4", x: 45, y: 52, z: 38 },
  { range: "0.4-0.6", x: 128, y: 142, z: 115 },
  { range: "0.6-0.8", x: 87, y: 76, z: 98 },
  { range: "0.8-1.0", x: 32, y: 28, z: 41 },
  { range: "1.0-1.2", x: 15, y: 12, z: 19 },
  { range: ">1.2", x: 6, y: 4, z: 9 },
]

export default function VibrationAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vibration Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vibrationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="x" stroke="#3b82f6" name="X-Axis" strokeWidth={2} />
                <Line type="monotone" dataKey="y" stroke="#16a34a" name="Y-Axis" strokeWidth={2} />
                <Line type="monotone" dataKey="z" stroke="#dc2626" name="Z-Axis" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vibration Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vibrationDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="range" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="x" fill="#3b82f6" name="X-Axis" />
                <Bar dataKey="y" fill="#16a34a" name="Y-Axis" />
                <Bar dataKey="z" fill="#dc2626" name="Z-Axis" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vibration Anomalies</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Vibration anomaly detection visualization will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
