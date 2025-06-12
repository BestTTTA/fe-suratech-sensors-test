"use client"

import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import SensorGrid from "@/components/sensors/SensorGrid"
import SensorFilters from "@/components/sensors/SensorFilters"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LayoutDashboardIcon, PlusCircle, RefreshCw } from "lucide-react"
import { getSensors } from "@/lib/data/sensors"

export default function SensorsPage() {
  const [totalSensors, setTotalSensors] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitiallyLoaded = useRef(false)

  const fetchTotalSensors = useCallback(async () => {
    try {
      const { total } = await getSensors({ limit: 1000 })
      setTotalSensors(total)
    } catch (error) {
      console.error("Error fetching total sensors:", error)
    }
  }, [])

  const updateSensorData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Update total count
      await fetchTotalSensors()

      // Trigger sensor grid refresh without reloading
      if (window.refreshSensorData) {
        await window.refreshSensorData()
      }

      setLastUpdated(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchTotalSensors])

  const handleManualRefresh = useCallback(async () => {
    await updateSensorData()
  }, [updateSensorData])

  // Initial fetch - only once
  useEffect(() => {
    if (!hasInitiallyLoaded.current) {
      fetchTotalSensors()
      setLastUpdated(new Date())
      hasInitiallyLoaded.current = true
    }
  }, [fetchTotalSensors])

  // Auto-refresh effect - always enabled
  useEffect(() => {
    // Clear any existing intervals
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current)
    }

    if (hasInitiallyLoaded.current) {
      // Set up auto-refresh interval
      autoRefreshIntervalRef.current = setInterval(() => {
        updateSensorData()
      }, 10000) // 10 seconds
    }

    // Cleanup on unmount
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current)
      }
    }
  }, [updateSensorData])

  const currentDateTime = new Date()
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(",", "")

  const lastUpdatedTime = lastUpdated.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Location of Sensor</h1>
        <div className="text-lg font-medium text-white">{currentDateTime}</div>
        <div className="text-lg font-bold text-white">Total Sensor: {totalSensors}</div>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-gray-600 text-white hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Updating..." : "Refresh Now"}
          </Button>

          <div className="text-sm text-gray-400">Last updated: {lastUpdatedTime}</div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
            <Link href="/register" className="flex items-center">
              <PlusCircle className="mr-2 h-4 w-4" />
              Register Device
            </Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard" className="flex items-center">
              <LayoutDashboardIcon className="mr-2 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <SensorFilters />
      <Suspense fallback={<LoadingSkeleton />}>
        <SensorGrid onRefresh={() => setLastUpdated(new Date())} />
      </Suspense>
    </div>
  )
}
