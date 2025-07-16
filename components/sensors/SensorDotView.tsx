"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { getSensors } from "@/lib/data/sensors";
import type { Sensor } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getAxisTopPeakStats,
  SENSOR_CONSTANTS,
} from "@/lib/utils/sensorCalculations";
import { getSensorAxisVibrationColor } from "@/lib/utils/vibrationUtils";

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
});

interface SensorDotViewProps {
  onRefresh?: () => void;
}

export default function SensorDotView({ onRefresh }: SensorDotViewProps) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const sensorsPerPage = 600; // Maximum sensors per page for dot view
  const hasInitiallyLoaded = useRef(false);

  const fetchSensors = useCallback(
    async (isManualRefresh = false) => {
      if (!isManualRefresh && !hasInitiallyLoaded.current) {
        setLoading(true);
      }

      try {
        const { sensors: fetchedSensors, total } = await getSensors({
          page,
          limit: sensorsPerPage,
        });

        setSensors(fetchedSensors);
        setTotalPages(Math.ceil(total / sensorsPerPage));
        hasInitiallyLoaded.current = true;

        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error("Error fetching sensors:", error);
      } finally {
        setLoading(false);
      }
    },
    [page, sensorsPerPage, onRefresh]
  );

  // Initial fetch only
  useEffect(() => {
    if (!hasInitiallyLoaded.current) {
      fetchSensors(false);
    }
  }, []); // Empty dependency array - only run once

  // Page change effect
  useEffect(() => {
    if (hasInitiallyLoaded.current) {
      fetchSensors(false);
    }
  }, [page]); // Only when page changes

  // Set up global refresh function for external triggers
  useEffect(() => {
    window.refreshSensorData = () => fetchSensors(true);
    return () => {
      delete window.refreshSensorData;
    };
  }, [fetchSensors]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSensorClick = (sensorId: string) => {
    router.push(`/sensors/${sensorId}`);
  };

  const getVibrationColor = (sensor: Sensor, axis: "h" | "v" | "a") => {
    return getSensorAxisVibrationColor(sensor, axis, "light");
  };

  const getTemperatureColor = (temp: number) => {
    if (temp > 60) {
      return "text-red-500";
    } else {
      return "text-green-500";
    }
  };

  /**
   * Get the highest priority vibration color for sensor border
   * Priority: Critical (red) > Concern (orange) > Warning (yellow) > Normal (green)
   */
  const getConnectivityBorder = (sensor: Sensor) => {
    // Check connectivity status
    const battery = sensor.last_data?.battery || 0;
    const lastUpdate = sensor.last_data?.datetime;
    const isOnline =
      battery > 0 &&
      lastUpdate &&
      new Date().getTime() - new Date(lastUpdate).getTime() < 300000; // 5 minutes

    // Get vibration colors for all axes
    const axisColors = {
      h: getSensorAxisVibrationColor(sensor, "h", "light"),
      v: getSensorAxisVibrationColor(sensor, "v", "light"),
      a: getSensorAxisVibrationColor(sensor, "a", "light"),
    };

    const red = "ff0000";
    const orange = "ff6600";
    const yellow = "ffff00";

    if (
      axisColors.h.includes(red) ||
      axisColors.v.includes(red) ||
      axisColors.a.includes(red)
    ) {
      return "border-red-500";
    } else if (
      axisColors.h.includes(orange) ||
      axisColors.v.includes(orange) ||
      axisColors.a.includes(orange)
    ) {
      return "border-orange-500";
    } else if (
      axisColors.h.includes(yellow) ||
      axisColors.v.includes(yellow) ||
      axisColors.a.includes(yellow)
    ) {
      return "border-yellow-500";
    } else {
      return isOnline ? "border-green-500" : "border-gray-500";
    }
  };

  if (loading && !hasInitiallyLoaded.current) {
    return (
      <div className="grid grid-cols-50 gap-2">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-gray-800 animate-pulse border border-gray-700"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <TooltipProvider>
        <div className="w-full">
          <div className="grid [grid-template-columns:repeat(40,minmax(0,1fr))] gap-1 w-full">
            {sensors.map((sensor) => {
              const currentTemp = sensor.last_data?.temperature || 0;
              const battery = sensor.last_data?.battery || 0;
              const lastUpdate = sensor.last_data?.datetime;
              const isOnline =
                battery > 0 &&
                lastUpdate &&
                new Date().getTime() - new Date(lastUpdate).getTime() < 300000; // 5 minutes

              return (
                <Tooltip key={sensor.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-8 h-8 rounded-full flex flex-col items-center justify-center cursor-pointer border-[1.5px] ${getConnectivityBorder(
                        sensor
                      )} bg-gray-900 hover:bg-gray-800 transition-colors`}
                      onClick={() => handleSensorClick(sensor.id)}
                    >
                      <span
                        className={`font-bold text-[10px] ${getTemperatureColor(
                          currentTemp
                        )}`}
                      >
                        {currentTemp > 0 ? Math.round(currentTemp) : "-"}
                      </span>
                      <div className="flex space-x-0.5 mt-0.5">
                        <div
                          className={`w-1 h-1 rounded-full ${getVibrationColor(
                            sensor,
                            "h"
                          )}`}
                        />
                        <div
                          className={`w-1 h-1 rounded-full ${getVibrationColor(
                            sensor,
                            "v"
                          )}`}
                        />
                        <div
                          className={`w-1 h-1 rounded-full ${getVibrationColor(
                            sensor,
                            "a"
                          )}`}
                        />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-gray-900 border-gray-700 text-white"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold">
                        {sensor.name || "Unknown Sensor"}
                      </div>
                      <div className="text-gray-400">
                        {sensor.model || "Unknown Model"}
                      </div>
                      <div className="text-gray-400">
                        {sensor.machineName || "Unknown Machine"}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span>Temp: {currentTemp.toFixed(1)}°C</span>
                        <span>Battery: {battery.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>Status:</span>
                        <div
                          className={`w-2 h-2 ${
                            isOnline ? "bg-green-500" : "bg-gray-500"
                          } rounded-full`}
                        />
                        <span className="text-xs">
                          {isOnline ? "online" : "offline"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>Vibration:</span>
                        <div className="flex space-x-0.5">
                          <div
                            className={`w-1 h-1 ${getVibrationColor(
                              sensor,
                              "h"
                            )} rounded-full`}
                          />
                          <div
                            className={`w-1 h-1 ${getVibrationColor(
                              sensor,
                              "v"
                            )} rounded-full`}
                          />
                          <div
                            className={`w-1 h-1 ${getVibrationColor(
                              sensor,
                              "a"
                            )} rounded-full`}
                          />
                        </div>
                      </div>
                      {sensor.h_stats && (
                        <div className="text-gray-400">
                          H: {sensor.h_stats.velocityTopPeak} mm/s
                        </div>
                      )}
                      {sensor.v_stats && (
                        <div className="text-gray-400">
                          V: {sensor.v_stats.velocityTopPeak} mm/s
                        </div>
                      )}
                      {sensor.a_stats && (
                        <div className="text-gray-400">
                          A: {sensor.a_stats.velocityTopPeak} mm/s
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
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
  );
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    refreshSensorData?: () => void;
  }
}
