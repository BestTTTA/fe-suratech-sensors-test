"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSensorReadings } from "@/lib/data/sensors"
import type { SensorReading } from "@/lib/types"
import { SensorLineChart } from "@/components/charts/SensorLineChart"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

interface SensorDetailChartsProps {
  sensorId: string
  historical?: boolean
}

// Function to generate deterministic random number based on seed
function seededRandom(seed: string, index: number): number {
  const seedNum = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + index
  return (Math.sin(seedNum) + 1) / 2 // Returns a number between 0 and 1
}

// Generate mock temperature analysis data
function generateTemperatureAnalysisData(sensorId: string) {
  // Daily pattern data (24 hours)
  const dailyPattern = Array.from({ length: 24 }).map((_, i) => {
    const baseTemp = 22 + seededRandom(sensorId, i) * 8
    return {
      hour: `${i}:00`,
      temperature: Number.parseFloat(baseTemp.toFixed(1)),
    }
  })

  // Weekly trend data (7 days)
  const weeklyTrend = Array.from({ length: 7 }).map((_, i) => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const baseTemp = 23 + seededRandom(sensorId, i + 100) * 7
    return {
      day: dayNames[i],
      average: Number.parseFloat(baseTemp.toFixed(1)),
      min: Number.parseFloat((baseTemp - 2 - seededRandom(sensorId, i + 200) * 3).toFixed(1)),
      max: Number.parseFloat((baseTemp + 2 + seededRandom(sensorId, i + 300) * 3).toFixed(1)),
    }
  })

  // Temperature distribution data
  const temperatureRanges = ["15-18°C", "18-21°C", "21-24°C", "24-27°C", "27-30°C", "30-33°C", ">33°C"]
  const distribution = temperatureRanges.map((range, i) => {
    return {
      range,
      count: Math.floor(10 + seededRandom(sensorId, i + 400) * 90),
    }
  })

  // Anomaly data
  const anomalies = Array.from({ length: 5 })
    .map((_, i) => {
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - Math.floor(seededRandom(sensorId, i + 500) * 30))

      return {
        timestamp: timestamp.toISOString().split("T")[0],
        temperature: Number.parseFloat((35 + seededRandom(sensorId, i + 600) * 5).toFixed(1)),
        duration: Math.floor(5 + seededRandom(sensorId, i + 700) * 55) + " minutes",
        severity: seededRandom(sensorId, i + 800) > 0.7 ? "High" : "Medium",
      }
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return {
    dailyPattern,
    weeklyTrend,
    distribution,
    anomalies,
    forecast: {
      nextDay: Number.parseFloat((24 + seededRandom(sensorId, 900) * 6).toFixed(1)),
      nextWeek: Number.parseFloat((24 + seededRandom(sensorId, 901) * 6).toFixed(1)),
      trend: seededRandom(sensorId, 902) > 0.5 ? "increasing" : "stable",
    },
  }
}

// Generate mock vibration analysis data
function generateVibrationAnalysisData(sensorId: string) {
  // Frequency analysis data
  const frequencyAnalysis = Array.from({ length: 10 }).map((_, i) => {
    const frequency = (i + 1) * 10
    return {
      frequency: `${frequency} Hz`,
      amplitudeX: Number.parseFloat((0.1 + seededRandom(sensorId, i + 1000) * 0.9).toFixed(2)),
      amplitudeY: Number.parseFloat((0.1 + seededRandom(sensorId, i + 1100) * 0.8).toFixed(2)),
      amplitudeZ: Number.parseFloat((0.1 + seededRandom(sensorId, i + 1200) * 0.7).toFixed(2)),
    }
  })

  // Axis comparison over time
  const axisComparison = Array.from({ length: 7 }).map((_, i) => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return {
      day: dayNames[i],
      x: Number.parseFloat((0.3 + seededRandom(sensorId, i + 1300) * 0.7).toFixed(2)),
      y: Number.parseFloat((0.3 + seededRandom(sensorId, i + 1400) * 0.6).toFixed(2)),
      z: Number.parseFloat((0.3 + seededRandom(sensorId, i + 1500) * 0.8).toFixed(2)),
    }
  })

  // Anomaly data
  const anomalies = Array.from({ length: 3 })
    .map((_, i) => {
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - Math.floor(seededRandom(sensorId, i + 1600) * 30))

      return {
        timestamp: timestamp.toISOString().split("T")[0],
        axis: ["X", "Y", "Z"][Math.floor(seededRandom(sensorId, i + 1700) * 3)],
        value: Number.parseFloat((1.2 + seededRandom(sensorId, i + 1800) * 0.8).toFixed(2)),
        duration: Math.floor(5 + seededRandom(sensorId, i + 1900) * 25) + " minutes",
        possibleCause: ["Loose mounting", "Bearing wear", "Misalignment", "Imbalance"][
          Math.floor(seededRandom(sensorId, i + 2000) * 4)
        ],
      }
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Correlation with temperature
  const correlation = Array.from({ length: 8 }).map((_, i) => {
    const temperature = 20 + i * 2
    return {
      temperature: `${temperature}°C`,
      vibration: Number.parseFloat((0.3 + i * 0.1 + seededRandom(sensorId, i + 2100) * 0.2).toFixed(2)),
    }
  })

  return {
    frequencyAnalysis,
    axisComparison,
    anomalies,
    correlation,
    healthAssessment: {
      overall: seededRandom(sensorId, 2200) > 0.7 ? "Good" : seededRandom(sensorId, 2200) > 0.4 ? "Fair" : "Poor",
      xAxis: seededRandom(sensorId, 2300) > 0.6 ? "Good" : "Fair",
      yAxis: seededRandom(sensorId, 2400) > 0.6 ? "Good" : "Fair",
      zAxis: seededRandom(sensorId, 2500) > 0.6 ? "Good" : "Fair",
    },
  }
}

export default function SensorDetailCharts({ sensorId, historical = false }: SensorDetailChartsProps) {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState(historical ? "all" : "24h")
  const [dataStats, setDataStats] = useState<{
    temperature: { min: number; max: number; avg: number; trend: "up" | "down" | "stable" }
    vibration: { min: number; max: number; avg: number; trend: "up" | "down" | "stable" }
  } | null>(null)
  const [temperatureAnalysis, setTemperatureAnalysis] = useState(generateTemperatureAnalysisData(sensorId))
  const [vibrationAnalysis, setVibrationAnalysis] = useState(generateVibrationAnalysisData(sensorId))
  const [analysisTab, setAnalysisTab] = useState("patterns")
  const [vibrationAnalysisTab, setVibrationAnalysisTab] = useState("frequency")

  useEffect(() => {
    const fetchReadings = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getSensorReadings(sensorId, historical)

        // Filter data based on selected time range
        let filteredData = [...data]
        const now = Date.now()

        if (timeRange === "24h") {
          filteredData = data.filter((r) => r.timestamp > now - 24 * 60 * 60 * 1000)
        } else if (timeRange === "7d") {
          filteredData = data.filter((r) => r.timestamp > now - 7 * 24 * 60 * 60 * 1000)
        } else if (timeRange === "30d") {
          filteredData = data.filter((r) => r.timestamp > now - 30 * 24 * 60 * 60 * 1000)
        }

        setReadings(filteredData)

        // Calculate statistics
        if (filteredData.length > 0) {
          const temps = filteredData.map((r) => r.temperature)
          const vibX = filteredData.map((r) => r.vibrationX)
          const vibY = filteredData.map((r) => r.vibrationY)
          const vibZ = filteredData.map((r) => r.vibrationZ)

          // Calculate average vibration magnitude
          const vibMagnitudes = filteredData.map((r) =>
            Math.sqrt(r.vibrationX ** 2 + r.vibrationY ** 2 + r.vibrationZ ** 2),
          )

          // Determine trends (comparing first half to second half)
          const midpoint = Math.floor(filteredData.length / 2)
          const firstHalfTemp = temps.slice(0, midpoint).reduce((sum, val) => sum + val, 0) / midpoint
          const secondHalfTemp = temps.slice(midpoint).reduce((sum, val) => sum + val, 0) / (temps.length - midpoint)

          const firstHalfVib = vibMagnitudes.slice(0, midpoint).reduce((sum, val) => sum + val, 0) / midpoint
          const secondHalfVib =
            vibMagnitudes.slice(midpoint).reduce((sum, val) => sum + val, 0) / (vibMagnitudes.length - midpoint)

          const tempTrend =
            secondHalfTemp > firstHalfTemp * 1.05 ? "up" : secondHalfTemp < firstHalfTemp * 0.95 ? "down" : "stable"

          const vibTrend =
            secondHalfVib > firstHalfVib * 1.05 ? "up" : secondHalfVib < firstHalfVib * 0.95 ? "down" : "stable"

          setDataStats({
            temperature: {
              min: Math.min(...temps),
              max: Math.max(...temps),
              avg: temps.reduce((sum, val) => sum + val, 0) / temps.length,
              trend: tempTrend,
            },
            vibration: {
              min: Math.min(...vibMagnitudes),
              max: Math.max(...vibMagnitudes),
              avg: vibMagnitudes.reduce((sum, val) => sum + val, 0) / vibMagnitudes.length,
              trend: vibTrend,
            },
          })
        } else {
          // If no readings, create mock dataStats
          setDataStats({
            temperature: {
              min: 20 + seededRandom(sensorId, 2600) * 5,
              max: 25 + seededRandom(sensorId, 2700) * 10,
              avg: 22 + seededRandom(sensorId, 2800) * 8,
              trend: ["up", "down", "stable"][Math.floor(seededRandom(sensorId, 2900) * 3)] as "up" | "down" | "stable",
            },
            vibration: {
              min: 0.2 + seededRandom(sensorId, 3000) * 0.3,
              max: 0.6 + seededRandom(sensorId, 3100) * 0.6,
              avg: 0.4 + seededRandom(sensorId, 3200) * 0.4,
              trend: ["up", "down", "stable"][Math.floor(seededRandom(sensorId, 3300) * 3)] as "up" | "down" | "stable",
            },
          })
        }
      } catch (error) {
        console.error("Error fetching sensor readings:", error)
        setError("Failed to load sensor data. Please try again later.")

        // Create mock dataStats even on error
        setDataStats({
          temperature: {
            min: 20 + seededRandom(sensorId, 3400) * 5,
            max: 25 + seededRandom(sensorId, 3500) * 10,
            avg: 22 + seededRandom(sensorId, 3600) * 8,
            trend: ["up", "down", "stable"][Math.floor(seededRandom(sensorId, 3700) * 3)] as "up" | "down" | "stable",
          },
          vibration: {
            min: 0.2 + seededRandom(sensorId, 3800) * 0.3,
            max: 0.6 + seededRandom(sensorId, 3900) * 0.6,
            avg: 0.4 + seededRandom(sensorId, 4000) * 0.4,
            trend: ["up", "down", "stable"][Math.floor(seededRandom(sensorId, 4100) * 3)] as "up" | "down" | "stable",
          },
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchReadings()

    // Generate unique analysis data for this sensor
    setTemperatureAnalysis(generateTemperatureAnalysisData(sensorId))
    setVibrationAnalysis(generateVibrationAnalysisData(sensorId))
  }, [sensorId, historical, timeRange])

  const handleExportData = () => {
    // Create CSV content
    const headers = "Timestamp,Temperature,VibrationX,VibrationY,VibrationZ\n"
    const rows = readings
      .map(
        (r) =>
          `${new Date(r.timestamp).toISOString()},${r.temperature},${r.vibrationX},${r.vibrationY},${r.vibrationZ}`,
      )
      .join("\n")

    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `sensor_${sensorId}_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getTrendBadge = (trend: "up" | "down" | "stable", isTemperature: boolean) => {
    if (trend === "up") {
      return (
        <Badge
          variant="outline"
          className={isTemperature ? "bg-red-900 text-red-200" : "bg-yellow-900 text-yellow-200"}
        >
          ↑ Increasing
        </Badge>
      )
    } else if (trend === "down") {
      return (
        <Badge
          variant="outline"
          className={isTemperature ? "bg-blue-900 text-blue-200" : "bg-green-900 text-green-200"}
        >
          ↓ Decreasing
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-gray-800 text-gray-200">
          → Stable
        </Badge>
      )
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64 text-white">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-400 py-8">{error}</div>
  }

  if (readings.length === 0) {
    return <div className="text-center text-gray-400 py-8">No data available</div>
  }

  return (
    <div className="space-y-4">
      {historical && (
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleExportData} className="border-gray-600 text-white hover:bg-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      )}

      {dataStats && !historical && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Temperature Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-white">{dataStats.temperature.avg.toFixed(1)}°C</div>
                  <div className="text-sm text-gray-400">
                    Min: {dataStats.temperature.min.toFixed(1)}°C, Max: {dataStats.temperature.max.toFixed(1)}°C
                  </div>
                </div>
                {getTrendBadge(dataStats.temperature.trend, true)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white">Vibration Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-white">{dataStats.vibration.avg.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">
                    Min: {dataStats.vibration.min.toFixed(2)}, Max: {dataStats.vibration.max.toFixed(2)}
                  </div>
                </div>
                {getTrendBadge(dataStats.vibration.trend, false)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="temperature" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2 bg-gray-800">
          <TabsTrigger
            value="temperature"
            className="text-gray-200 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
          >
            Temperature
          </TabsTrigger>
          <TabsTrigger
            value="vibration"
            className="text-gray-200 data-[state=active]:bg-gray-700 data-[state=active]:text-white"
          >
            Vibration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="temperature" className="h-full">
          <div className="h-full">
            <SensorLineChart data={readings} dataKey="temperature" yAxisLabel="Temperature (°C)" color="#2563eb" />
          </div>

          {dataStats && (
            <div className="mt-4 p-4 bg-gray-800 rounded-md">
              <h3 className="font-medium mb-4 text-white">Detailed Temperature Analysis</h3>

              <Tabs value={analysisTab} onValueChange={setAnalysisTab} className="w-full">
                <TabsList className="grid w-full md:w-auto grid-cols-4 bg-gray-700">
                  <TabsTrigger
                    value="patterns"
                    className="text-gray-200 data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                  >
                    Daily Patterns
                  </TabsTrigger>
                  <TabsTrigger
                    value="weekly"
                    className="text-gray-200 data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                  >
                    Weekly Trends
                  </TabsTrigger>
                  <TabsTrigger
                    value="distribution"
                    className="text-gray-200 data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                  >
                    Distribution
                  </TabsTrigger>
                  <TabsTrigger
                    value="anomalies"
                    className="text-gray-200 data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                  >
                    Anomalies
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="patterns" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Daily Temperature Pattern</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={temperatureAnalysis.dailyPattern}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="hour" stroke="#9CA3AF" />
                            <YAxis domain={["auto", "auto"]} stroke="#9CA3AF" />
                            <Tooltip
                              formatter={(value) => [`${value}°C`, "Temperature"]}
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                color: "#F9FAFB",
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="temperature"
                              stroke="#2563eb"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-sm text-gray-300">
                        <p>
                          This chart shows the typical daily temperature pattern for this sensor over a 24-hour period.
                          The pattern indicates{" "}
                          {temperatureAnalysis.dailyPattern[12].temperature >
                          temperatureAnalysis.dailyPattern[0].temperature
                            ? "higher temperatures during daytime hours"
                            : "relatively stable temperatures throughout the day"}
                          .
                        </p>
                        <p className="mt-2">
                          Peak temperature typically occurs around{" "}
                          {temperatureAnalysis.dailyPattern.reduce(
                            (max, item, index, arr) => (item.temperature > arr[max].temperature ? index : max),
                            0,
                          )}
                          :00.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="weekly" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Weekly Temperature Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={temperatureAnalysis.weeklyTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="day" stroke="#9CA3AF" />
                            <YAxis domain={["auto", "auto"]} stroke="#9CA3AF" />
                            <Tooltip
                              formatter={(value) => [`${value}°C`, "Temperature"]}
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                color: "#F9FAFB",
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="average" stroke="#2563eb" strokeWidth={2} name="Average" />
                            <Line
                              type="monotone"
                              dataKey="min"
                              stroke="#94a3b8"
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              name="Min"
                            />
                            <Line
                              type="monotone"
                              dataKey="max"
                              stroke="#1d4ed8"
                              strokeWidth={1.5}
                              strokeDasharray="5 5"
                              name="Max"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-sm text-gray-300">
                        <p>
                          This chart shows the weekly temperature trends with minimum, average, and maximum values for
                          each day.
                        </p>
                        <p className="mt-2">
                          Weekly average:{" "}
                          {(
                            temperatureAnalysis.weeklyTrend.reduce((sum, day) => sum + day.average, 0) /
                            temperatureAnalysis.weeklyTrend.length
                          ).toFixed(1)}
                          °C
                        </p>
                        <p className="mt-1">
                          Temperature variance:{" "}
                          {(
                            Math.max(...temperatureAnalysis.weeklyTrend.map((day) => day.max)) -
                            Math.min(...temperatureAnalysis.weeklyTrend.map((day) => day.min))
                          ).toFixed(1)}
                          °C
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="distribution" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Temperature Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={temperatureAnalysis.distribution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="range" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                              formatter={(value) => [`${value} readings`, "Count"]}
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                color: "#F9FAFB",
                              }}
                            />
                            <Legend />
                            <Bar dataKey="count" fill="#3b82f6" name="Reading Count" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-sm text-gray-300">
                        <p>
                          This chart shows the distribution of temperature readings across different temperature ranges.
                        </p>
                        <p className="mt-2">
                          Most common temperature range:{" "}
                          {
                            temperatureAnalysis.distribution.reduce(
                              (max, item) => (item.count > max.count ? item : max),
                              temperatureAnalysis.distribution[0],
                            ).range
                          }
                        </p>
                        <p className="mt-1">
                          Total readings analyzed:{" "}
                          {temperatureAnalysis.distribution.reduce((sum, item) => sum + item.count, 0)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="anomalies" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Temperature Anomalies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-2 text-gray-300">Date</th>
                              <th className="text-left py-2 text-gray-300">Temperature</th>
                              <th className="text-left py-2 text-gray-300">Duration</th>
                              <th className="text-left py-2 text-gray-300">Severity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {temperatureAnalysis.anomalies.map((anomaly, index) => (
                              <tr key={index} className="border-b border-gray-700">
                                <td className="py-2 text-gray-200">{anomaly.timestamp}</td>
                                <td className="py-2 text-gray-200">{anomaly.temperature}°C</td>
                                <td className="py-2 text-gray-200">{anomaly.duration}</td>
                                <td className="py-2">
                                  <Badge
                                    variant="outline"
                                    className={
                                      anomaly.severity === "High"
                                        ? "bg-red-900 text-red-200"
                                        : "bg-yellow-900 text-yellow-200"
                                    }
                                  >
                                    {anomaly.severity}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 text-sm text-gray-300">
                        <p>This table shows detected temperature anomalies over the past month.</p>
                        <p className="mt-2">Forecast:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>Next 24 hours: Expected temperature around {temperatureAnalysis.forecast.nextDay}°C</li>
                          <li>
                            Next week: Temperature trend is {temperatureAnalysis.forecast.trend}, expected average of{" "}
                            {temperatureAnalysis.forecast.nextWeek}°C
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </TabsContent>

        <TabsContent value="vibration" className="h-full">
          <div className="h-full min-h-[300px]">
            <SensorLineChart
              data={readings}
              dataKey={["vibrationX", "vibrationY", "vibrationZ"]}
              yAxisLabel="Vibration"
              color={["#2563eb", "#16a34a", "#dc2626"]}
            />
          </div>

          {dataStats && (
            <div className="mt-4 p-4 bg-gray-800 rounded-md">
              <h3 className="font-medium mb-4 text-white">Detailed Vibration Analysis</h3>

              <Tabs value={vibrationAnalysisTab} onValueChange={setVibrationAnalysisTab} className="w-full">
                <TabsList className="grid w-full md:w-auto grid-cols-4 bg-gray-700">
                  <TabsTrigger
                    value="frequency"
                    className="text-gray-200 data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                  >
                    Frequency Analysis
                  </TabsTrigger>
                  <TabsTrigger
                    value="axis"
                    className="text-gray-200 data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                  >
                    Axis Comparison
                  </TabsTrigger>
                  <TabsTrigger
                    value="anomalies"
                    className="text-gray-200 data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                  >
                    Anomalies
                  </TabsTrigger>
                  <TabsTrigger
                    value="correlation"
                    className="text-gray-200 data-[state=active]:bg-gray-600 data-[state=active]:text-white"
                  >
                    Temperature Correlation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="frequency" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Vibration Frequency Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={vibrationAnalysis.frequencyAnalysis}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="frequency" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                color: "#F9FAFB",
                              }}
                            />
                            <Legend />
                            <Bar dataKey="amplitudeX" fill="#3b82f6" name="X-Axis" />
                            <Bar dataKey="amplitudeY" fill="#16a34a" name="Y-Axis" />
                            <Bar dataKey="amplitudeZ" fill="#dc2626" name="Z-Axis" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-sm text-gray-300">
                        <p>This chart shows the vibration amplitude across different frequency bands for each axis.</p>
                        <p className="mt-2">
                          Dominant frequency:{" "}
                          {
                            vibrationAnalysis.frequencyAnalysis.reduce(
                              (max, item) => {
                                const totalAmplitude = item.amplitudeX + item.amplitudeY + item.amplitudeZ
                                return totalAmplitude > max.amplitude
                                  ? { frequency: item.frequency, amplitude: totalAmplitude }
                                  : max
                              },
                              { frequency: "", amplitude: 0 },
                            ).frequency
                          }
                        </p>
                        <p className="mt-1">
                          Health assessment:{" "}
                          <span
                            className={
                              vibrationAnalysis.healthAssessment.overall === "Good"
                                ? "text-green-400"
                                : vibrationAnalysis.healthAssessment.overall === "Fair"
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }
                          >
                            {vibrationAnalysis.healthAssessment.overall}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="axis" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Axis Comparison Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vibrationAnalysis.axisComparison}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="day" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                color: "#F9FAFB",
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="x" stroke="#3b82f6" name="X-Axis" strokeWidth={2} />
                            <Line type="monotone" dataKey="y" stroke="#16a34a" name="Y-Axis" strokeWidth={2} />
                            <Line type="monotone" dataKey="z" stroke="#dc2626" name="Z-Axis" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-sm text-gray-300">
                        <p>This chart compares vibration levels across all three axes over time.</p>
                        <p className="mt-2">Axis health assessment:</p>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <div>
                            X-Axis:{" "}
                            <span
                              className={
                                vibrationAnalysis.healthAssessment.xAxis === "Good"
                                  ? "text-green-400"
                                  : "text-yellow-400"
                              }
                            >
                              {vibrationAnalysis.healthAssessment.xAxis}
                            </span>
                          </div>
                          <div>
                            Y-Axis:{" "}
                            <span
                              className={
                                vibrationAnalysis.healthAssessment.yAxis === "Good"
                                  ? "text-green-400"
                                  : "text-yellow-400"
                              }
                            >
                              {vibrationAnalysis.healthAssessment.yAxis}
                            </span>
                          </div>
                          <div>
                            Z-Axis:{" "}
                            <span
                              className={
                                vibrationAnalysis.healthAssessment.zAxis === "Good"
                                  ? "text-green-400"
                                  : "text-yellow-400"
                              }
                            >
                              {vibrationAnalysis.healthAssessment.zAxis}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="anomalies" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Vibration Anomalies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-700">
                              <th className="text-left py-2 text-gray-300">Date</th>
                              <th className="text-left py-2 text-gray-300">Axis</th>
                              <th className="text-left py-2 text-gray-300">Value</th>
                              <th className="text-left py-2 text-gray-300">Duration</th>
                              <th className="text-left py-2 text-gray-300">Possible Cause</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vibrationAnalysis.anomalies.map((anomaly, index) => (
                              <tr key={index} className="border-b border-gray-700">
                                <td className="py-2 text-gray-200">{anomaly.timestamp}</td>
                                <td className="py-2 text-gray-200">{anomaly.axis}-Axis</td>
                                <td className="py-2 text-gray-200">{anomaly.value}</td>
                                <td className="py-2 text-gray-200">{anomaly.duration}</td>
                                <td className="py-2 text-gray-200">{anomaly.possibleCause}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 text-sm text-gray-300">
                        <p>This table shows detected vibration anomalies over the past month.</p>
                        <p className="mt-2">Recommendations:</p>
                        <ul className="list-disc list-inside mt-1">
                          {vibrationAnalysis.anomalies.length > 0 ? (
                            <>
                              <li>Check for {vibrationAnalysis.anomalies[0].possibleCause.toLowerCase()}</li>
                              <li>Inspect mounting and connections</li>
                              <li>Schedule maintenance if anomalies persist</li>
                            </>
                          ) : (
                            <li>No action required - vibration levels are normal</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="correlation" className="mt-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Temperature-Vibration Correlation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vibrationAnalysis.correlation}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="temperature" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                              formatter={(value) => [value, "Vibration"]}
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                color: "#F9FAFB",
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="vibration" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-sm text-gray-300">
                        <p>This chart shows the correlation between temperature and vibration levels.</p>
                        <p className="mt-2">
                          Analysis:{" "}
                          {vibrationAnalysis.correlation[vibrationAnalysis.correlation.length - 1].vibration >
                          vibrationAnalysis.correlation[0].vibration * 1.5
                            ? "Strong positive correlation between temperature and vibration. Higher temperatures are associated with increased vibration levels."
                            : vibrationAnalysis.correlation[vibrationAnalysis.correlation.length - 1].vibration >
                                vibrationAnalysis.correlation[0].vibration * 1.2
                              ? "Moderate correlation between temperature and vibration."
                              : "Weak correlation between temperature and vibration. Temperature changes have minimal impact on vibration levels."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {historical && (
        <div className="mt-4">
          <h3 className="font-medium mb-2 text-white">Anomaly Detection</h3>
          <div className="p-4 bg-gray-800 rounded-md">
            {readings.some(
              (r) => r.temperature > 35 || r.vibrationX > 1.2 || r.vibrationY > 1.2 || r.vibrationZ > 1.2,
            ) ? (
              <div className="text-red-400">
                <p className="font-medium">Potential anomalies detected:</p>
                <ul className="list-disc list-inside mt-2">
                  {readings.some((r) => r.temperature > 35) && <li>Temperature exceeded critical threshold (35°C)</li>}
                  {readings.some((r) => r.vibrationX > 1.2 || r.vibrationY > 1.2 || r.vibrationZ > 1.2) && (
                    <li>Vibration exceeded critical threshold (1.2)</li>
                  )}
                </ul>
                <p className="mt-2 text-sm">Recommendation: Schedule maintenance inspection</p>
              </div>
            ) : (
              <div className="text-green-400">
                <p className="font-medium">No anomalies detected in the selected time period.</p>
                <p className="mt-2 text-sm">All readings are within normal operating parameters.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
