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
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState("trend")

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`https://sc.promptlabai.com/suratech/sensors/${params.id}/history`)
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        setHistory(data.history || [])
      } catch (err) {
        console.error("Error fetching history:", err)
        setError("Failed to fetch sensor history")
        setHistory([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [params.id])

  // Helper function to safely get average of array
  const safeAvg = (arr: any): number => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 0
    return arr.reduce((a: number, b: number) => a + b, 0) / arr.length
  }

  // Helper function to safely spread array
  const safeSpread = (arr: any): number[] => {
    if (!arr || !Array.isArray(arr)) return []
    return [...arr]
  }

  // Prepare trend line chart data
  const chartData = useMemo(() => {
    if (!history.length) return null
    
    const labels = history.map((h: any) => {
      try {
        const d = new Date(h.datetime);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      } catch (err) {
        return "Invalid Date";
      }
    })

    return {
      labels,
      datasets: [
        {
          label: "H-axis",
          data: history.map((h: any) => safeAvg(h.h)),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: "V-axis",
          data: history.map((h: any) => safeAvg(h.v)),
          borderColor: "#f59e42",
          backgroundColor: "rgba(245, 158, 66, 0.1)",
          tension: 0.1,
          pointRadius: 0,
        },
        {
          label: "A-axis",
          data: history.map((h: any) => safeAvg(h.a)),
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
    const monthMap: Record<string, { h: number[]; v: number[]; a: number[] }> = {}
    
    history.forEach((h: any) => {
      try {
        const d = new Date(h.datetime)
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        if (!monthMap[month]) monthMap[month] = { h: [], v: [], a: [] }
        
        // Safely spread arrays
        monthMap[month].h.push(...safeSpread(h.h))
        monthMap[month].v.push(...safeSpread(h.v))
        monthMap[month].a.push(...safeSpread(h.a))
      } catch (err) {
        console.error("Error processing history item:", err)
        // Skip this item if there's an error
      }
    })
    
    const months = Object.keys(monthMap).sort()
    
    return {
      labels: months,
      datasets: [
        {
          label: "H-axis",
          data: months.map((m) => safeAvg(monthMap[m].h)),
          backgroundColor: "#3b82f6",
        },
        {
          label: "V-axis",
          data: months.map((m) => safeAvg(monthMap[m].v)),
          backgroundColor: "#f59e42",
        },
        {
          label: "A-axis",
          data: months.map((m) => safeAvg(monthMap[m].a)),
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
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}
        
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
                <div className="flex items-center justify-center h-full">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No historical data available for this sensor
                </div>
              ) : chartType === "trend" ? (
                chartData ? (
                  <Line data={chartData} options={options} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Unable to process trend data
                  </div>
                )
              ) : (
                monthlyBarData ? (
                  <Bar data={monthlyBarData} options={options} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Unable to process monthly data
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 