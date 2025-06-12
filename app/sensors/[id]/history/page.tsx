"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { ArrowLeft } from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const chartTypes = [
  { value: "trend", label: "Trend Line" },
  { value: "monthly-bar", label: "Monthly Avg Bar Chart" },
]

export default function SensorHistoryPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState("trend")

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      const res = await fetch(`https://sc.promptlabai.com/suratech/sensors/${params.id}/history`)
      const data = await res.json()
      setHistory(data.history || [])
      setLoading(false)
    }
    fetchHistory()
  }, [params.id])

  // Prepare trend line chart data
  const chartData = useMemo(() => {
    if (!history.length) return null
    const labels = history.map((h: any) => new Date(h.datetime).toLocaleString())
    const avg = (arr: number[]) => arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    return {
      labels,
      datasets: [
        {
          label: "X-axis",
          data: history.map((h: any) => avg(h.x)),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: "Y-axis",
          data: history.map((h: any) => avg(h.y)),
          borderColor: "#f59e42",
          backgroundColor: "rgba(245, 158, 66, 0.1)",
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: "Z-axis",
          data: history.map((h: any) => avg(h.z)),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          tension: 0.1,
          pointRadius: 0,
        },
      ],
    }
  }, [history])

  // Prepare monthly average bar chart data
  const monthlyBarData = useMemo(() => {
    if (!history.length) return null
    // Group by month
    const monthMap: Record<string, { x: number[]; y: number[]; z: number[] }> = {}
    history.forEach((h: any) => {
      const d = new Date(h.datetime)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!monthMap[month]) monthMap[month] = { x: [], y: [], z: [] }
      monthMap[month].x.push(...h.x)
      monthMap[month].y.push(...h.y)
      monthMap[month].z.push(...h.z)
    })
    const months = Object.keys(monthMap).sort()
    const avg = (arr: number[]) => arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    return {
      labels: months,
      datasets: [
        {
          label: "H-axis",
          data: months.map((m) => avg(monthMap[m].x)),
          backgroundColor: "#3b82f6",
        },
        {
          label: "V-axis",
          data: months.map((m) => avg(monthMap[m].y)),
          backgroundColor: "#f59e42",
        },
        {
          label: "A-axis",
          data: months.map((m) => avg(monthMap[m].z)),
          backgroundColor: "#10b981",
        },
      ],
    }
  }, [history])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: { display: true, text: chartType === "trend" ? "Date" : "Month", color: "#888" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "#888" },
      },
      y: {
        title: { display: true, text: "Acceleration (G)", color: "#888" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: { color: "#888" },
      },
    },
    plugins: {
      legend: { display: true, labels: { color: "#fff" } },
    },
  }), [chartType])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex items-center p-4 border-b border-gray-800">
        <Button
          variant="outline"
          size="sm"
          className="mr-4 bg-transparent border-gray-700 hover:bg-gray-800"
          onClick={() => router.push(`/sensors/${params.id}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sensor
        </Button>
        <h1 className="text-2xl font-bold">Sensor History</h1>
      </div>
      <div className="p-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center mb-4 justify-between">
              <h2 className="text-lg font-semibold">Historical Vibration Data</h2>
              <div className="flex items-center">
                <label className="mr-2 text-gray-300">Type:</label>
                <select
                  className="bg-gray-800 border border-gray-700 text-white rounded px-2 py-1"
                  value={chartType}
                  onChange={e => setChartType(e.target.value)}
                >
                  {chartTypes.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="h-96">
              {loading ? (
                <div className="flex items-center justify-center h-full">Loading...</div>
              ) : chartType === "trend" ? (
                chartData ? <Line data={chartData} options={options} /> : <div className="flex items-center justify-center h-full">No data available</div>
              ) : (
                monthlyBarData ? <Bar data={monthlyBarData} options={options} /> : <div className="flex items-center justify-center h-full">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 