"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Pagination } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { getSensors } from "@/lib/data/sensors"
import type { Sensor } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

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

  const getVibrationColor = (level: string, connectivity: string) => {
    if (connectivity === "offline") {
      return "bg-gray-400"
    }
    
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center px-4 py-2 bg-gray-800 rounded-lg text-sm font-semibold text-gray-300">
        <div className="flex-1">Sensor Name</div>
        <div className="w-20 text-center">Status</div>
        <div className="w-16 text-center">H</div>
        <div className="w-16 text-center">V</div>
        <div className="w-16 text-center">A</div>
        <div className="w-20 text-center">Temp</div>
      </div>

      {/* Sensor list */}
      <div className="space-y-1">
        {sensors.map((sensor) => {
          const safeReadings = sensor?.readings || []
          const latestReading = safeReadings.length > 0 ? safeReadings[safeReadings.length - 1] : null
          const currentTemp = latestReading ? Math.round(latestReading.temperature) : 0

          return (
            <div
              key={sensor.id}
              className="flex items-center px-4 py-3 bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer rounded-lg"
              onClick={() => handleSensorClick(sensor.id)}
            >
              {/* Sensor Name */}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      sensor.connectivity === "online" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <div>
                    <div className="font-medium text-white">
                      {sensor.name || "Unknown Sensor"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {sensor.model || "Unknown Model"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="w-20 flex justify-center">
                <Badge className={`${getStatusColor(sensor.operationalStatus || "standby")} text-xs`}>
                  {sensor.operationalStatus?.charAt(0).toUpperCase() + sensor.operationalStatus?.slice(1) || "Standby"}
                </Badge>
              </div>

              {/* H-axis Vibration */}
              <div className="w-16 flex justify-center">
                <div className={`w-3 h-6 ${getVibrationColor(sensor.vibrationH || "normal", sensor.connectivity || "offline")} rounded-full border border-gray-600`} />
              </div>

              {/* V-axis Vibration */}
              <div className="w-16 flex justify-center">
                <div className={`w-3 h-6 ${getVibrationColor(sensor.vibrationV || "normal", sensor.connectivity || "offline")} rounded-full border border-gray-600`} />
              </div>

              {/* A-axis Vibration */}
              <div className="w-16 flex justify-center">
                <div className={`w-3 h-6 ${getVibrationColor(sensor.vibrationA || "normal", sensor.connectivity || "offline")} rounded-full border border-gray-600`} />
              </div>

              {/* Temperature */}
              <div className="w-20 flex justify-center">
                <span className={`font-semibold ${getTemperatureColor(currentTemp)}`}>
                  {currentTemp > 0 ? currentTemp : "0"}°C
                </span>
              </div>
            </div>
          )
        })}
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