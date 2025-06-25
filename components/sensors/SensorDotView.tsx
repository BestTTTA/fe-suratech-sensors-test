"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Pagination } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { getSensors } from "@/lib/data/sensors"
import type { Sensor } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

interface SensorDotViewProps {
  onRefresh?: () => void
}

export default function SensorDotView({ onRefresh }: SensorDotViewProps) {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const sensorsPerPage = 200 // Maximum sensors per page for dot view
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

  const getConnectivityBorder = (status: string) => {
    return status === "online" ? "border-green-500" : "border-red-500"
  }

  if (loading && !hasInitiallyLoaded.current) {
    return (
      <div className="grid grid-cols-50 gap-2">
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-full bg-gray-800 animate-pulse border border-gray-700" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TooltipProvider>
        <div className="grid grid-cols-50 gap-10">
          {sensors.map((sensor) => {
            const safeReadings = sensor?.readings || []
            const latestReading = safeReadings.length > 0 ? safeReadings[safeReadings.length - 1] : null
            const currentTemp = latestReading ? Math.round(latestReading.temperature) : 0

            return (
              <Tooltip key={sensor.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`w-8 h-8 rounded-full flex flex-col items-center justify-center cursor-pointer border border-[1.5px] ${getConnectivityBorder(sensor.connectivity || "offline")} bg-gray-900 hover:bg-gray-800 transition-colors`}
                    onClick={() => handleSensorClick(sensor.id)}
                  >
                    <span className={`font-bold text-[10px] ${getTemperatureColor(currentTemp)}`}>
                      {currentTemp > 0 ? currentTemp : "0"}
                    </span>
                    <div className="flex space-x-0.5 mt-0.5">
                      <div className={`w-1 h-1 rounded-full ${getVibrationColor(sensor.vibrationH || "normal", sensor.connectivity || "offline")}`} />
                      <div className={`w-1 h-1 rounded-full ${getVibrationColor(sensor.vibrationV || "normal", sensor.connectivity || "offline")}`} />
                      <div className={`w-1 h-1 rounded-full ${getVibrationColor(sensor.vibrationA || "normal", sensor.connectivity || "offline")}`} />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 border-gray-700 text-white">
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold">{sensor.name || "Unknown Sensor"}</div>
                    <div className="text-gray-400">{sensor.model || "Unknown Model"}</div>
                    <div className="text-gray-400">{sensor.machineName || "Unknown Machine"}</div>
                    <div className="flex items-center space-x-2">
                      <span>Temp: {currentTemp}°C</span>
                      <span>Battery: {sensor.batteryLevel || 0}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Status:</span>
                      <div className={`w-2 h-2 ${sensor.connectivity === "online" ? "bg-green-500" : "bg-red-500"} rounded-full`} />
                      <span className="text-xs">{sensor.connectivity || "offline"}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>Vibration:</span>
                      <div className="flex space-x-0.5">
                        <div className={`w-1 h-1 ${getVibrationColor(sensor.vibrationH || "normal", sensor.connectivity || "offline")} rounded-full`} />
                        <div className={`w-1 h-1 ${getVibrationColor(sensor.vibrationV || "normal", sensor.connectivity || "offline")} rounded-full`} />
                        <div className={`w-1 h-1 ${getVibrationColor(sensor.vibrationA || "normal", sensor.connectivity || "offline")} rounded-full`} />
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

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