"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Pagination } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { getSensors } from "@/lib/data/sensors"
import type { Sensor } from "@/lib/types"
import { getSensorAxisVibrationColor } from "@/lib/utils/vibrationUtils"

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
  const sensorsPerPage = 51
  const hasInitiallyLoaded = useRef(false)

  // Always show all axes for main page (no config API call needed)
  const axisConfigs: Record<string, { hAxisEnabled: boolean; vAxisEnabled: boolean; aAxisEnabled: boolean }> = {}

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

  // Set up global refresh function for external triggers
  useEffect(() => {
    window.refreshSensorData = () => fetchSensors(true)
    return () => {
      delete window.refreshSensorData
    }
  }, [fetchSensors])

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
    return getSensorAxisVibrationColor(sensor, axis, 'light')
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
              const currentTemp = sensor.last_data?.temperature || 0
              
              return (
                <div
                  key={sensor.id}
                  className="flex items-center px-2 py-1 hover:bg-gray-800 cursor-pointer border-b border-gray-700"
                  onClick={() => handleSensorClick(sensor.id)}
                >
                  <div className="flex-1 text-sm">{sensor.name.length > 11 ? sensor.name.slice(0, 11) + "..." : sensor.name}</div>
                  <div className="w-12 flex justify-center">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(sensor.operationalStatus)}`}>
                      {sensor.operationalStatus}
                    </span>
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
                      {currentTemp > 0 ? currentTemp.toFixed(1) : "0"}°C
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
              const currentTemp = sensor.last_data?.temperature || 0
              
              return (
                <div
                  key={sensor.id}
                  className="flex items-center px-2 py-1 hover:bg-gray-800 cursor-pointer border-b border-gray-700"
                  onClick={() => handleSensorClick(sensor.id)}
                >
                  <div className="flex-1 text-sm">{sensor.name}</div>
                  <div className="w-12 flex justify-center">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(sensor.operationalStatus)}`}>
                      {sensor.operationalStatus}
                    </span>
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
              const currentTemp = sensor.last_data?.temperature || 0
              
              return (
                <div
                  key={sensor.id}
                  className="flex items-center px-2 py-1 hover:bg-gray-800 cursor-pointer border-b border-gray-700"
                  onClick={() => handleSensorClick(sensor.id)}
                >
                  <div className="flex-1 text-sm">{sensor.name}</div>
                  <div className="w-12 flex justify-center">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(sensor.operationalStatus)}`}>
                      {sensor.operationalStatus}
                    </span>
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

      <div className="flex justify-center mt-6">
        <ThemeProvider theme={paginationTheme}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </ThemeProvider>
      </div>
    </div>
  )
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    refreshSensorData?: () => void
  }
} 