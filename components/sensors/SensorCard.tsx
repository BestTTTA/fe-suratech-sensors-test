"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Battery, Wifi, MoreHorizontal } from "lucide-react"
import type { Sensor } from "@/lib/types"

interface SensorCardProps {
  sensor: Sensor
  onClick: () => void
}

export default function SensorCard({ sensor, onClick }: SensorCardProps) {
  // Safely access sensor properties with fallbacks
  const safeModel = sensor?.model || "Unknown Model"
  const safeName = sensor?.name || "Unknown Sensor"
  const safeStatus = sensor?.operationalStatus || "standby"
  const safeVibrationH = sensor?.vibrationH || "normal"
  const safeVibrationV = sensor?.vibrationV || "normal"
  const safeVibrationA = sensor?.vibrationA || "normal"
  const safeBatteryLevel = sensor?.batteryLevel || 0
  const safeConnectivity = sensor?.connectivity || "offline"
  const safeLastUpdated = sensor?.lastUpdated || Date.now()

  // Safely get the latest reading with fallback
  const safeReadings = sensor?.readings || []
  const latestReading = safeReadings.length > 0 ? safeReadings[safeReadings.length - 1] : null
  const currentTemp = latestReading ? Math.round(latestReading.temperature) : 0

  // Check if this is a real API sensor (has specific characteristics)
  const isApiSensor = sensor?.model?.includes("Model-API-") || false

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-600 text-white"
      case "standby":
        return "bg-black text-white"
      case "alarm":
        return "bg-red-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const getVibrationColor = (level: string) => {
    // If sensor is offline, return gray color
    if (safeConnectivity === "offline") {
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

  const getBatteryColor = () => {
    if (safeBatteryLevel > 50) {
      return "bg-green-500"
    } else if (safeBatteryLevel > 20) {
      return "bg-yellow-500"
    } else if (safeBatteryLevel > 0) {
      return "bg-red-500"
    } else {
      return "bg-gray-500" // No battery data
    }
  }

  const getWifiColor = () => {
    switch (safeConnectivity) {
      case "online":
        return "bg-green-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDateTime = (timestamp: number) => {
    try {
      return new Date(timestamp)
        .toLocaleString("en-GB", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(",", "")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  return (
    <Card
      className={`w-full border border-gray-700 shadow-md hover:shadow-lg transition-shadow cursor-pointer rounded-lg overflow-hidden bg-white ${
        isApiSensor ? "border-blue-600" : ""
      }`}
      onClick={onClick}
    >
      {/* Header with model name */}
      <div className={`text-white px-2 py-1 ${isApiSensor ? "bg-blue-600" : "bg-gray-700"}`}>
        <div className="text-xs font-medium truncate">{safeModel}</div>
      </div>

      <CardContent className="p-2">
        {/* Sensor Name and Menu */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${safeConnectivity === "online" ? "bg-green-500" : "bg-red-500"}`}
            ></div>
            <span className="text-sm font-bold text-black truncate">{safeName}</span>
          </div>
          <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-white hover:bg-gray-700">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {/* Status Badge */}
        <div className="mb-2">
          <Badge className={`${getStatusColor(safeStatus)} text-xs px-2 py-1 rounded-full font-medium`}>
            {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
          </Badge>
        </div>

        {/* Vibration Indicators with Labels */}
        <div className="flex justify-end gap-2 mb-2">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-black mb-1">H</span>
            <div className={`w-4 h-8 ${getVibrationColor(safeVibrationH)} rounded-full border border-gray-600`}></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-black mb-1">V</span>
            <div className={`w-4 h-8 ${getVibrationColor(safeVibrationV)} rounded-full border border-gray-600`}></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-black mb-1">A</span>
            <div className={`w-4 h-8 ${getVibrationColor(safeVibrationA)} rounded-full border border-gray-600`}></div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-black mb-2">{formatDateTime(safeLastUpdated)}</div>

        {/* Bottom Row - Icons and Temperature */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {/* Battery Icon */}
            <div className={`flex items-center justify-center w-6 h-4 ${getBatteryColor()} rounded`}>
              <Battery className="h-3 w-3 text-white fill-current" />
            </div>

            {/* WiFi Icon with WPS */}
            <div className={`flex flex-col items-center justify-center w-6 h-4 ${getWifiColor()} rounded`}>
              <Wifi className="h-2 w-2 text-white" />
              <span className="text-xs text-white font-bold leading-none">WPS</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="text-lg font-bold text-black">{currentTemp > 0 ? `${currentTemp}°C` : "0°C"}</div>
        </div>
      </CardContent>
    </Card>
  )
}
