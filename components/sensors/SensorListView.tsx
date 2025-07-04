"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Pagination } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { getSensors } from "@/lib/data/sensors"
import type { Sensor } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { getAxisTopPeakStats, SENSOR_CONSTANTS } from "@/lib/utils/sensorCalculations"

// Create a custom MUI theme for the pagination component
const paginationTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6", // blue-500
    },
    text: {
      primary: "#ffffff",
      secondary: "#ffffff",
    },
    background: {
      paper: "#1f2937",
    },
  },
  components: {
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          color: "#ffffff",
          "&.Mui-selected": {
            backgroundColor: "#3b82f6",
            color: "#ffffff",
          },
          "&:hover": {
            backgroundColor: "rgba(59, 130, 246, 0.2)",
          },
        },
        icon: {
          color: "#ffffff",
        },
      },
    },
  },
})

interface SensorListViewProps {
  onRefresh?: () => void
}

export default function SensorListView({ onRefresh }: SensorListViewProps) {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const sensorsPerPage = 200 // More sensors per page for simple list view
  const hasInitiallyLoaded = useRef(false)

  const fetchSensors = useCallback(
    async (isManualRefresh = false) => {
      if (!isManualRefresh && !hasInitiallyLoaded.current) {
        setLoading(true)
      }

      try {
        const { sensors: fetchedSensors, total } = await getSensors({
          page,
          limit: sensorsPerPage,
        })

        setSensors(fetchedSensors)
        setTotalPages(Math.ceil(total / sensorsPerPage))
        hasInitiallyLoaded.current = true

        if (onRefresh) {
          onRefresh()
        }
      } catch (error) {
        console.error("Error fetching sensors:", error)
      } finally {
        setLoading(false)
      }
    },
    [page, sensorsPerPage, onRefresh],
  )

  // Initial fetch only
  useEffect(() => {
    if (!hasInitiallyLoaded.current) {
      fetchSensors(false)
    }
  }, []) // Empty dependency array - only run once

  // Page change effect
  useEffect(() => {
    if (hasInitiallyLoaded.current) {
      fetchSensors(false)
    }
  }, [page]) // Only when page changes

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSensorClick = (sensorId: string) => {
    router.push(`/sensors/${sensorId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-600 text-white"
      case "standby":
        return "bg-gray-600 text-white"
      case "alarm":
        return "bg-red-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getVibrationColor = (sensor: Sensor, axis: 'h' | 'v' | 'a') => {
    if (sensor.connectivity === "offline") {
      return "bg-gray-400"
    }
    
    // Calculate velocity-based vibration status
    if (sensor.last_data && sensor.last_data.data) {
      const timeInterval = 1 / SENSOR_CONSTANTS.SAMPLING_RATE
      const axisData = axis === 'h' ? sensor.last_data.data.h : 
                      axis === 'v' ? sensor.last_data.data.v : 
                      sensor.last_data.data.a
      
      if (axisData && axisData.length > 0) {
        const stats = getAxisTopPeakStats(axisData, timeInterval)
        const velocityValue = parseFloat(stats.velocityTopPeak)
        
        if (velocityValue < SENSOR_CONSTANTS.MIN_TRASH_HOLE) {
          return "bg-green-500"
        } else if (velocityValue > SENSOR_CONSTANTS.MAX_TRASH_HOLE) {
          return "bg-red-500"
        } else {
          return "bg-yellow-500"
        }
      }
    }
    
    // Fallback to sensor's stored vibration level
    const level = axis === 'h' ? sensor.vibrationH : 
                 axis === 'v' ? sensor.vibrationV : 
                 sensor.vibrationA
    
    switch (level) {
      case "normal":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "critical":
        return "bg-red-500"
      default:
        return "bg-green-500"
    }
  }

  const getTemperatureColor = (temp: number) => {
    if (temp > 35) {
      return "text-red-500"
    } else if (temp > 30) {
      return "text-yellow-500"
    } else {
      return "text-green-500"
    }
  }

  if (loading && !hasInitiallyLoaded.current) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-800 animate-pulse rounded" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {/* 3 Tables Layout */}
      <div className="grid grid-cols-3 gap-4">
        {/* Table 1 */}
        <div className="space-y-0">
          <div className="flex items-center px-2 py-0.5 bg-gray-800 rounded text-xs font-semibold text-gray-300">
            <div className="flex-1">Sensor Name</div>
            <div className="w-12 text-center">Status</div>
            <div className="w-16 text-center">H</div>
            <div className="w-16 text-center">V</div>
            <div className="w-16 text-center">A</div>
            <div className="w-20 text-center">Temp</div>
          </div>
          <div className="space-y-0">
            {sensors.slice(0, Math.ceil(sensors.length / 3)).map((sensor) => {
              const safeReadings = sensor?.readings || []
              const latestReading = safeReadings.length > 0 ? safeReadings[safeReadings.length - 1] : null
              const currentTemp = latestReading ? Math.round(latestReading.temperature) : 0

              return (
                <div
                  key={sensor.id}
                  className="flex items-center px-2 py-0.5 bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer rounded text-xs border-b border-gray-800"
                  onClick={() => handleSensorClick(sensor.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-1 h-1 rounded-full ${
                          sensor.connectivity === "online" ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                      <div>
                        <div className="font-medium text-white text-xs">
                          {sensor.name || "Unknown Sensor"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 flex justify-center">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(sensor.operationalStatus || "standby").replace('text-white', '')}`} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <div className={`w-1 h-2 ${getVibrationColor(sensor, 'h')} rounded-full border border-gray-600`} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <div className={`w-1 h-2 ${getVibrationColor(sensor, 'v')} rounded-full border border-gray-600`} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <div className={`w-1 h-2 ${getVibrationColor(sensor, 'a')} rounded-full border border-gray-600`} />
                  </div>
                  <div className="w-20 flex justify-center">
                    <span className={`font-semibold text-xs ${getTemperatureColor(currentTemp)}`}>
                      {currentTemp > 0 ? currentTemp : "0"}°C
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Table 2 */}
        <div className="space-y-0">
          <div className="flex items-center px-2 py-0.5 bg-gray-800 rounded text-xs font-semibold text-gray-300">
            <div className="flex-1">Sensor Name</div>
            <div className="w-12 text-center">Status</div>
            <div className="w-16 text-center">H</div>
            <div className="w-16 text-center">V</div>
            <div className="w-16 text-center">A</div>
            <div className="w-20 text-center">Temp</div>
          </div>
          <div className="space-y-0">
            {sensors.slice(Math.ceil(sensors.length / 3), Math.ceil(sensors.length * 2 / 3)).map((sensor) => {
              const safeReadings = sensor?.readings || []
              const latestReading = safeReadings.length > 0 ? safeReadings[safeReadings.length - 1] : null
              const currentTemp = latestReading ? Math.round(latestReading.temperature) : 0

              return (
                <div
                  key={sensor.id}
                  className="flex items-center px-2 py-0.5 bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer rounded text-xs border-b border-gray-800"
                  onClick={() => handleSensorClick(sensor.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-1 h-1 rounded-full ${
                          sensor.connectivity === "online" ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                      <div>
                        <div className="font-medium text-white text-xs">
                          {sensor.name || "Unknown Sensor"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 flex justify-center">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(sensor.operationalStatus || "standby").replace('text-white', '')}`} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <div className={`w-1 h-2 ${getVibrationColor(sensor, 'h')} rounded-full border border-gray-600`} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <div className={`w-1 h-2 ${getVibrationColor(sensor, 'v')} rounded-full border border-gray-600`} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <div className={`w-1 h-2 ${getVibrationColor(sensor, 'a')} rounded-full border border-gray-600`} />
                  </div>
                  <div className="w-20 flex justify-center">
                    <span className={`font-semibold text-xs ${getTemperatureColor(currentTemp)}`}>
                      {currentTemp > 0 ? currentTemp : "0"}°C
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Table 3 */}
        <div className="space-y-0">
          <div className="flex items-center px-2 py-0.5 bg-gray-800 rounded text-xs font-semibold text-gray-300">
            <div className="flex-1">Sensor Name</div>
            <div className="w-12 text-center">Status</div>
            <div className="w-16 text-center">H</div>
            <div className="w-16 text-center">V</div>
            <div className="w-16 text-center">A</div>
            <div className="w-20 text-center">Temp</div>
          </div>
          <div className="space-y-0">
            {sensors.slice(Math.ceil(sensors.length * 2 / 3)).map((sensor) => {
              const safeReadings = sensor?.readings || []
              const latestReading = safeReadings.length > 0 ? safeReadings[safeReadings.length - 1] : null
              const currentTemp = latestReading ? Math.round(latestReading.temperature) : 0

              return (
                <div
                  key={sensor.id}
                  className="flex items-center px-2 py-0.5 bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer rounded text-xs border-b border-gray-800"
                  onClick={() => handleSensorClick(sensor.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-1 h-1 rounded-full ${
                          sensor.connectivity === "online" ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                      <div>
                        <div className="font-medium text-white text-xs">
                          {sensor.name || "Unknown Sensor"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 flex justify-center">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(sensor.operationalStatus || "standby").replace('text-white', '')}`} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <div className={`w-1 h-2 ${getVibrationColor(sensor, 'h')} rounded-full border border-gray-600`} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <div className={`w-1 h-2 ${getVibrationColor(sensor, 'v')} rounded-full border border-gray-600`} />
                  </div>
                  <div className="w-16 flex justify-center">
                    <div className={`w-1 h-2 ${getVibrationColor(sensor, 'a')} rounded-full border border-gray-600`} />
                  </div>
                  <div className="w-20 flex justify-center">
                    <span className={`font-semibold text-xs ${getTemperatureColor(currentTemp)}`}>
                      {currentTemp > 0 ? currentTemp : "0"}°C
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-1">
        <ThemeProvider theme={paginationTheme}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
            showFirstButton
            showLastButton
          />
        </ThemeProvider>
      </div>
    </div>
  )
} 