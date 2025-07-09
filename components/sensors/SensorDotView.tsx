"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Pagination } from "@mui/material"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { getSensors } from "@/lib/data/sensors"
import type { Sensor } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

interface SensorDotViewProps {
  onRefresh?: () => void
}

export default function SensorDotView({ onRefresh }: SensorDotViewProps) {
  const [sensors, setSensors] = useState<Sensor[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const sensorsPerPage = 200 // More sensors per page for dot view
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

  const getConnectivityBorder = (status: string) => {
    return status === "online" ? "border-green-500" : "border-gray-500"
  }

  if (loading && !hasInitiallyLoaded.current) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
          {sensors.map((sensor) => {
            const currentTemp = sensor.last_data?.temperature || 0
                          const axisConfig = { hAxisEnabled: true, vAxisEnabled: true, aAxisEnabled: true }
            
            return (
              <Tooltip key={sensor.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`relative w-full h-32 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${getConnectivityBorder(sensor.connectivity)} bg-gray-900`}
                    onClick={() => handleSensorClick(sensor.id)}
                  >
                    {/* Sensor Status Indicator */}
                    <div className="absolute top-2 left-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          sensor.connectivity === "online" ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                    </div>

                    {/* Temperature Display */}
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs font-bold ${getTemperatureColor(currentTemp)}`}>
                        {currentTemp}°C
                      </span>
                    </div>

                    {/* Sensor Name */}
                    <div className="absolute bottom-8 left-2 right-2">
                      <div className="text-xs font-medium text-white truncate">
                        {sensor.name || "Unknown Sensor"}
                      </div>
                    </div>

                    {/* Vibration Indicators - Conditionally rendered based on axis configuration */}
                    <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-1">
                      {axisConfig.hAxisEnabled && (
                        <div className={`w-2 h-6 ${getVibrationColor(sensor, 'h')} rounded-full border border-gray-600`} />
                      )}
                      {axisConfig.vAxisEnabled && (
                        <div className={`w-2 h-6 ${getVibrationColor(sensor, 'v')} rounded-full border border-gray-600`} />
                      )}
                      {axisConfig.aAxisEnabled && (
                        <div className={`w-2 h-6 ${getVibrationColor(sensor, 'a')} rounded-full border border-gray-600`} />
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-800 border-gray-700 text-white">
                  <div className="space-y-1">
                    <div className="font-medium">{sensor.name || "Unknown Sensor"}</div>
                    <div className="text-sm">
                      <div>Status: {sensor.operationalStatus}</div>
                      <div>Temperature: {currentTemp}°C</div>
                      <div>Connectivity: {sensor.connectivity}</div>
                      {axisConfig.hAxisEnabled && (
                        <div>H-Axis: {sensor.vibrationH}</div>
                      )}
                      {axisConfig.vAxisEnabled && (
                        <div>V-Axis: {sensor.vibrationV}</div>
                      )}
                      {axisConfig.aAxisEnabled && (
                        <div>A-Axis: {sensor.vibrationA}</div>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
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
    </TooltipProvider>
  )
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    refreshSensorData?: () => void
  }
} 