"use client"

import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import SensorGrid from "@/components/sensors/SensorGrid"
import SensorListView from "@/components/sensors/SensorListView"
import SensorDotView from "@/components/sensors/SensorDotView"
import ViewSelector, { ViewMode } from "@/components/sensors/ViewSelector"
import SensorFilters from "@/components/sensors/SensorFilters"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LayoutDashboardIcon, PlusCircle, RefreshCw } from "lucide-react"
import { getSensors } from "@/lib/data/sensors"
import { formatDate, formatThaiDate } from "@/lib/utils"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function SensorsPage() {
  const [totalSensors, setTotalSensors] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [currentView, setCurrentView] = useState<ViewMode>("grid")
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasInitiallyLoaded = useRef(false)

  // ✅ helper
  const getBangkokTime = () => new Date(new Date().getTime() + 7 * 60 * 60 * 1000)

  // ✅ ดึงจำนวนทั้งหมด
  const fetchTotalSensors = useCallback(async () => {
    try {
      const { total } = await getSensors({ limit: 1000 })
      setTotalSensors(total)
    } catch (error) {
      console.error("Error fetching total sensors:", error)
    }
  }, [])

  // ✅ อัปเดตข้อมูล + ออกสัญญาณให้ puppeteer รับรู้
  const updateSensorData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchTotalSensors()
      if (window.refreshSensorData) {
        await window.refreshSensorData()
      }
      setLastUpdated(getBangkokTime())
      // ทำสัญญาณหน้า ready ให้บ็อตรอจบงานได้
      document.body.setAttribute("data-dashboard-ready", "true")
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchTotalSensors])

  const handleManualRefresh = useCallback(async () => {
    await updateSensorData()
  }, [updateSensorData])

  // ✅ เปลี่ยนมุมมอง + เก็บลง localStorage + data-attr
  const handleViewChange = useCallback((view: ViewMode) => {
    setCurrentView(view)
    try {
      localStorage.setItem("displayMode", view) // ให้ cron ใช้
    } catch {}
    document.body.setAttribute("data-view", view) // ให้ cron เช็คได้
    // เผื่ออยากให้ puppeteer เรียกได้ตรงๆ:
    ;(window as any).setViewMode = (v: ViewMode) => {
      setCurrentView(v)
      try { localStorage.setItem("displayMode", v) } catch {}
      document.body.setAttribute("data-view", v)
    }
  }, [])

  // ✅ โหลดครั้งแรก: อ่านค่าโหมดจาก ?view=..., ถ้าไม่มีค่อยดู localStorage
  useEffect(() => {
    if (!hasInitiallyLoaded.current) {
      fetchTotalSensors()
      setLastUpdated(getBangkokTime())

      const params = new URLSearchParams(window.location.search)
      const viewParam = params.get("view") as ViewMode | null
      const stored = (typeof window !== "undefined" && localStorage.getItem("displayMode")) as ViewMode | null

      const initialView: ViewMode =
        (viewParam && (["grid","list","dot"] as const).includes(viewParam)) ? viewParam :
        (stored && (["grid","list","dot"] as const).includes(stored)) ? stored :
        "grid"

      // ตั้งค่ามุมมองเริ่มต้น + data-attr
      setCurrentView(initialView)
      try { localStorage.setItem("displayMode", initialView) } catch {}
      document.body.setAttribute("data-view", initialView)

      // โยนตัวช่วยให้ puppeteer เรียกได้
      ;(window as any).setViewMode = (v: ViewMode) => {
        setCurrentView(v)
        try { localStorage.setItem("displayMode", v) } catch {}
        document.body.setAttribute("data-view", v)
      }

      hasInitiallyLoaded.current = true
    }
  }, [fetchTotalSensors])

  // ✅ ตั้ง interval auto-refresh
  useEffect(() => {
    if (autoRefreshIntervalRef.current) clearInterval(autoRefreshIntervalRef.current)
    if (hasInitiallyLoaded.current) {
      autoRefreshIntervalRef.current = setInterval(() => {
        updateSensorData()
      }, 60_000)
    }
    return () => {
      if (autoRefreshIntervalRef.current) clearInterval(autoRefreshIntervalRef.current)
    }
  }, [updateSensorData])

  // ✅ ให้ puppeteer ใช้สั่ง refresh ได้ด้วย
  useEffect(() => {
    ;(window as any).refreshSensorData = updateSensorData
    return () => { try { delete (window as any).refreshSensorData } catch {} }
  }, [updateSensorData])

  // ✅ เวลา
  const currentDateTime = formatDate(new Date().toISOString(), true)
  const lastUpdatedTime = lastUpdated.toISOString()

  const renderCurrentView = () => {
    const commonProps = { onRefresh: () => setLastUpdated(getBangkokTime()) }
    switch (currentView) {
      case "grid":
        return <SensorGrid {...commonProps} />
      case "list":
        return <SensorListView {...commonProps} />
      case "dot":
        return <SensorDotView {...commonProps} />
      default:
        return <SensorGrid {...commonProps} />
    }
  }

  return (
    <ProtectedRoute>
      {/* ให้ cron เช็คสถานะพร้อมด้วย id/data-attr */}
      <div id="dashboard-ready" data-dashboard-ready="true" className="space-y-6">
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

            <div className="text-sm text-gray-400">Last updated: {formatThaiDate(lastUpdatedTime)}</div>
          </div>
          <div className="flex gap-2">
            <ViewSelector currentView={currentView} onViewChange={handleViewChange} />
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
          {renderCurrentView()}
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}
