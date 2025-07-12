"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, MoreVertical, Calendar, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatThaiDate } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate, getSignalStrength, getSignalStrengthLabel, uploadSensorImage } from "@/lib/utils"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import zoomPlugin from 'chartjs-plugin-zoom';
// Import calculation functions from utility
import { 
  adcToAccelerationG, 
  accelerationGToMmPerSecSquared, 
  accelerationToVelocity, 
  calculateFFT, 
  getAxisTopPeakStats,
  getAxisStats,
  calculateVibrationStats,
  SENSOR_CONSTANTS,
  handlingWindowFunction,
  findTopPeaks
} from "@/lib/utils/sensorCalculations"
import { getCardBackgroundColor, type SensorConfig } from "@/lib/utils/vibrationUtils"

ChartJS.register(zoomPlugin, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)



// First, update the SensorLastData interface to properly handle the vibration data arrays
interface SensorLastData {
  id: string
  name: string
  sensor_type: string | null
  unit: string | null
  fmax: number
  lor: number
  g_scale: number
  alarm_ths: number
  time_interval: number
  data: {
    datetime: string
    h: number[]
    v: number[]
    a: number[]
    temperature: number
    battery: number
    rssi: number
    flag: string
  }
}



// ฟังก์ชันเตรียมข้อมูลสำหรับกราฟ
function prepareChartData(
  rawAxisData: number[],
  selectedUnit: string,
  timeInterval: number,
  configData: any
): {
  timeData: any;
  freqData: any;
  yAxisLabel: string;
  rmsValue?: string;
  peakValue?: string;
  peakToPeakValue?: string;
  topPeaks?: { peak: number; rms: string; frequency: string }[];
} {
  // Check if we have valid data
  if (!rawAxisData || rawAxisData.length === 0) {
    // Return empty chart data with fallback values
    const emptyTimeData = {
      labels: [],
      rmsValue: "0.000",
      peakValue: "0.000",
      peakToPeakValue: "0.000",
      datasets: [{
        label: "No Data",
        data: [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.1,
        pointRadius: 0,
      }],
    };

    const emptyFreqData = {
      labels: [],
      datasets: [{
        label: "No Data",
        data: [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.1,
        pointRadius: 3,
        pointBackgroundColor: [],
      }],
    };

    return {
      timeData: emptyTimeData,
      freqData: emptyFreqData,
      yAxisLabel: "No Data",
      rmsValue: "0.000",
      peakValue: "0.000",
      peakToPeakValue: "0.000",
      topPeaks: [],
    };
  }

  // สร้างป้ายเวลาสำหรับกราฟ
  const n = rawAxisData.length
  const totalTime = configData.lor / configData.fmax
  const timeLabels = Array.from({ length: n }, (_, i) => (i * totalTime / (n - 1)).toFixed(4))

  // ประมวลผลข้อมูลตามหน่วยที่เลือก
  let processedData: number[]
  let yAxisLabel: string
  const gData = rawAxisData.map((adc) => adcToAccelerationG(adc, configData.g_scale))
  const mmPerSecSquaredData = gData.map((g) => accelerationGToMmPerSecSquared(g))
  const actualTimeInterval = totalTime / (n - 1)
  const velocityData = accelerationToVelocity(mmPerSecSquaredData, actualTimeInterval)

  if (selectedUnit === "Acceleration (G)") {
    processedData = gData
    yAxisLabel = "G"
  } else if (selectedUnit === "Acceleration (mm/s²)") {
    processedData = mmPerSecSquaredData
    yAxisLabel = "mm/s²"
  } else {
    processedData = velocityData
    yAxisLabel = "mm/s"
  }

  // ===== OVERALL STATISTICS CALCULATION =====
  // Calculate RMS using the same method as getAxisTopPeakStats
  const rms = processedData.length > 0
    ? Math.sqrt(processedData.reduce((sum, val) => sum + val * val, 0) / processedData.length)
    : 0;
  const peak = rms

  // peak * 2
  const peakToPeak = peak * 2
  const rmsValue = rms.toFixed(3);
  const peakValue = peak.toFixed(3);
  const peakToPeakValue = peakToPeak.toFixed(3);

  // สร้างข้อมูลสำหรับกราฟโดเมนเวลา
  const timeChartData = {
    labels: timeLabels,
    rmsValue,
    peakValue,
    peakToPeakValue,
    datasets: [
      {
        label: yAxisLabel,
        data: processedData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.1,
        pointRadius: 0,
      },
    ],
  }

  // ===== FFT CALCULATIONS =====
  const deltaF = (configData.fmax * 2.56) / (configData.lor * 2.56)
  let magnitude: number[] = [], frequency: number[] = []
  let feqProcessedData: number[] = []
  if (selectedUnit === "Acceleration (G)") {
    // Use the same method as getAxisTopPeakStats for consistency
    // Don't apply windowing for Acceleration (G) to match Horizontal (H) card
    ({ magnitude, frequency } = calculateFFT(gData, configData.fmax))
  } else if (selectedUnit === "Acceleration (mm/s²)") {
    feqProcessedData = handlingWindowFunction(mmPerSecSquaredData) as number[]
    ({ magnitude, frequency } = calculateFFT(feqProcessedData, configData.fmax))
  } else {
    const mmWithHanding = handlingWindowFunction(mmPerSecSquaredData) as number[]
    ({ magnitude, frequency } = calculateFFT(mmWithHanding, configData.fmax))
     magnitude = magnitude.map((val, idx) => val / (2 * Math.PI * (idx * deltaF)))
  }

  // Check if FFT calculation was successful
  if (!magnitude || magnitude.length === 0 || !frequency || frequency.length === 0) {
    const emptyFreqData = {
      labels: [],
      datasets: [{
        label: `${yAxisLabel} Magnitude`,
        data: [],
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.1,
        pointRadius: 3,
        pointBackgroundColor: [],
      }],
    };

    return {
      timeData: timeChartData,
      freqData: emptyFreqData,
      yAxisLabel,
      rmsValue,
      peakValue,
      peakToPeakValue,
      topPeaks: [],
    };
  }

  // ===== PEAK FINDING USING STRUCTURED FUNCTION =====
  // Remove zero frequency (DC component)
  const freqMagnitude = magnitude.slice(3)
  // array of number start with 0 end with 4096
  const freqLabels = Array.from({ length: freqMagnitude.length }, (_, i) => i * deltaF).map(label => label.toFixed(2)).slice(3)

  // Use findTopPeaks function for consistent peak detection
  // For Acceleration (G), ensure we're using the same data as Horizontal (H) card
  let topPeaks: { peak: number; rms: string; frequency: string }[] = []
  let pointBackgroundColor: string[] = []
  
  if (selectedUnit === "Acceleration (G)") {
    // For Acceleration (G), use the same FFT magnitude data as getAxisTopPeakStats
    const { topPeaks: fftPeaks, pointBackgroundColor: fftColors } = findTopPeaks(freqMagnitude, freqLabels, 5)
    topPeaks = fftPeaks
    pointBackgroundColor = fftColors
  } else {
    // For other units, use the processed magnitude data
    const { topPeaks: processedPeaks, pointBackgroundColor: processedColors } = findTopPeaks(freqMagnitude, freqLabels, 5)
    topPeaks = processedPeaks
    pointBackgroundColor = processedColors
  }

  const freqChartData = {
    labels: freqLabels,
    datasets: [
      {
        label: `${yAxisLabel} Magnitude`,
        data: freqMagnitude,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        tension: 0.1,
        pointRadius: 3,
        pointBackgroundColor,
      },
    ],
  }

  return {
    timeData: timeChartData,
    freqData: freqChartData,
    yAxisLabel,
    rmsValue,
    peakValue,
    peakToPeakValue,
    topPeaks,
  }
}



// Add this helper function after the existing formatDate function
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  })
}



export default function SensorDetailPage() {
  const router = useRouter()
  const params = useParams() as { id: string }
  
  // Client-side only state to prevent SSR hydration issues
  const [mounted, setMounted] = useState(false)
  
  // สถานะของคอมโพเนนต์
  const [sensor, setSensor] = useState<any>(null)
  const [sensorLastData, setSensorLastData] = useState<SensorLastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAxis, setSelectedAxis] = useState("H-axis")
  const [selectedUnit, setSelectedUnit] = useState("Acceleration (G)")
  const [error, setError] = useState<string | null>(null)
  const [datetimes, setDatetimes] = useState<string[]>([])
  const [vibrationStats, setVibrationStats] = useState({
    rms: "0.000",
    peak: "0.000",
    status: "Normal",
  })
  const [selectedDatetime, setSelectedDatetime] = useState<string>("")

  // Configuration modal state
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [configSuccess, setConfigSuccess] = useState<string | null>(null)
  const [imageUploadLoading, setImageUploadLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [configData, setConfigData] = useState({
    serialNumber: "",
    sensorName: "",
    machineNumber: "",
    installationPoint: "",
    machineClass: "",
    fmax: 10000,
    lor: 6400,
    g_scale: 16,
    time_interval: 3,
    alarm_ths: 5.0,
    thresholdMin: "",
    thresholdMedium: "",
    thresholdMax: "",
    notes: "",
    image_url: "",
    // Add axis direction configuration
    hAxisEnabled: true,
    vAxisEnabled: true,
    aAxisEnabled: true
  })

  // ฟังก์ชันดึงข้อมูลล่าสุดจากเซ็นเซอร์
  const fetchSensorLastData = async (sensorId: string) => {
    try {
      const response = await fetch(`https://sc.promptlabai.com/suratech/sensors/${sensorId}/last-data`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setSensorLastData(data)
      return data
    } catch (error) {
      // Error fetching sensor last data
      setError("Failed to fetch sensor data from API")
      return null
    }
  }

  // ฟังก์ชันดึงข้อมูล configuration ของเซ็นเซอร์
  const fetchSensorConfig = async (sensorId: string) => {
    try {
      const response = await fetch(`https://sc.promptlabai.com/suratech/sensors/${sensorId}/config`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const configData = await response.json()
      
      // Update configData state with fetched configuration
      setConfigData(prev => ({
        ...prev,
        serialNumber: configData.serial_number || prev.serialNumber,
        sensorName: configData.sensor_name,
        machineNumber: configData.machine_no,
        installationPoint: configData.installed_point,
        machineClass: configData.machine_class || prev.machineClass,
        fmax: configData.fmax || prev.fmax,
        lor: configData.lor || prev.lor,
        // Use g_scale from config endpoint (API value)
        g_scale: configData.g_scale || prev.g_scale || 16,
        time_interval: configData.time_interval || prev.time_interval,
        alarm_ths: configData.alarm_ths || prev.alarm_ths,
        thresholdMin: configData.threshold_min?.toString() || prev.thresholdMin,
        thresholdMedium: configData.threshold_medium?.toString() || prev.thresholdMedium,
        thresholdMax: configData.threshold_max?.toString() || prev.thresholdMax,
        notes: configData.note || prev.notes,
        hAxisEnabled: configData.h_axis_enabled !== false, // Default to true if not specified
        vAxisEnabled: configData.v_axis_enabled !== false, // Default to true if not specified
        aAxisEnabled: configData.a_axis_enabled !== false, // Default to true if not specified
        image_url: configData.image_url || prev.image_url
      }))
      
      return configData
    } catch (error) {
      // Error fetching sensor config - this is not critical, so we don't set error state
      console.log("Failed to fetch sensor config from API, using defaults")
      return null
    }
  }

  // ฟังก์ชันดึงข้อมูลพื้นฐานของเซ็นเซอร์
  const fetchSensor = async () => {
    try {
      // ดึงข้อมูลล่าสุดจากเซ็นเซอร์
      const lastData = await fetchSensorLastData(params.id)
      if (lastData) {
        // สร้างข้อมูลเซ็นเซอร์จาก API ถ้าไม่พบในฐานข้อมูล
        const hData = lastData.data.h || []
        const vData = lastData.data.v || []
        const aData = lastData.data.a || []
        
        setSensor({
          id: params.id,
          name: lastData.name,
          serialNumber: `S-${params.id.substring(0, 4).toUpperCase()}`,
          machine: lastData.sensor_type || "API Machine",
          location: "API Location",
          temperature: lastData.data.temperature,
          vibrationX: hData.length > 0 ? hData[0] : 0,
          vibrationY: vData.length > 0 ? vData[0] : 0,
          vibrationZ: aData.length > 0 ? aData[0] : 0,
          status: "ok",
          battery: lastData.data.battery,
          lastUpdated: lastData.data.datetime,
          installationDate: "2025-04-26",
          // Add new API configuration fields
          fmax: lastData.fmax,
          lor: lastData.lor,
          g_scale: lastData.g_scale,
          alarm_ths: lastData.alarm_ths,
          time_interval: lastData.time_interval,
        })
      } else {
        // สร้างข้อมูลเซ็นเซอร์เริ่มต้นถ้าไม่พบข้อมูล
        setSensor({
          id: params.id,
          name: `Sensor ${params.id.substring(0, 8)}`,
          serialNumber: `S-${params.id.substring(0, 4).toUpperCase()}`,
          machine: "Test Machine",
          location: "Test Location",
          temperature: 27.0,
          vibrationX: 0.54,
          vibrationY: 0.97,
          vibrationZ: 0.6,
          status: "ok",
          battery: 80,
          lastUpdated: new Date().toISOString(),
          installationDate: "2025-04-26",
        })
      }
    } catch (error) {
      // Error fetching sensor
      setError("Failed to fetch sensor data")
      // สร้างข้อมูลเซ็นเซอร์เริ่มต้นเมื่อเกิดข้อผิดพลาด
      setSensor({
        id: params.id,
        name: `Sensor ${params.id.substring(0, 8)}`,
        serialNumber: `S-${params.id.substring(0, 4).toUpperCase()}`,
        machine: "Test Machine",
        location: "Test Location",
        temperature: 27.0,
        vibrationX: 0.54,
        vibrationY: 0.97,
        vibrationZ: 0.6,
        status: "ok",
        battery: 80,
        lastUpdated: new Date().toISOString(),
        installationDate: "2025-04-26",
      })
    } finally {
      setLoading(false)
    }
  }

  // ฟังก์ชันดึงข้อมูลวันที่ของเซ็นเซอร์
  const fetchSensorDatetimes = async (sensorId: string) => {
    try {
      const response = await fetch(`https://sc.promptlabai.com/suratech/sensors/${sensorId}/datetimes`, {
        cache: "no-store",
        headers: {
          "Accept": "application/json",
          "Cache-Control": "no-cache",
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setDatetimes(data.datetimes)
      return data.datetimes
    } catch (error) {
      // Error fetching sensor datetimes
      setError("Failed to fetch sensor datetimes")
      return []
    }
  }
  // Set mounted state to prevent SSR hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // ฟังก์ชันดึงข้อมูลเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    if (mounted) {
      // Fetch data in parallel instead of sequentially
      Promise.all([
        fetchSensor(),
        fetchSensorDatetimes(params.id),
        fetchSensorConfig(params.id)
      ]).catch(error => {
        console.error("Error fetching sensor data:", error)
      })
    }
  }, [params.id, mounted])

  // Update config data when sensorLastData changes
  useEffect(() => {
    if (sensorLastData) {
      setConfigData(prev => ({
        ...prev,
        sensorName: configData.sensorName || "",
        machineNumber: configData.machineNumber || "", // Keep existing value if available
        installationPoint: configData.installationPoint || "", // Keep existing value if available
        machineClass: configData.machineClass || "", // Keep existing value if available
        fmax: sensorLastData.fmax || 10000,
        lor: sensorLastData.lor || 6400,
        // Use g_scale from sensorLastData (should match API config)
        g_scale: sensorLastData.g_scale || prev.g_scale || 16,
        time_interval: sensorLastData.time_interval || 3,
        alarm_ths: sensorLastData.alarm_ths || 5.0,
        thresholdMin: prev.thresholdMin || "",
        thresholdMedium: prev.thresholdMedium || "",
        thresholdMax: prev.thresholdMax || "",
        notes: prev.notes || "" // Keep existing value if available
      }))
    }
  }, [sensorLastData, sensor])

  // Cleanup modal state on component unmount
  useEffect(() => {
    return () => {
      setConfigModalOpen(false)
      setConfigError(null)
      setConfigSuccess(null)
      setConfigLoading(false)
    }
  }, [])

  // Force cleanup when modal closes
  useEffect(() => {
    if (!configModalOpen) {
      // Small delay to ensure modal is fully closed
      const timer = setTimeout(() => {
        setConfigError(null)
        setConfigSuccess(null)
        setConfigLoading(false)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [configModalOpen])

  // Configuration functions
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setConfigLoading(true)
    setConfigError(null)
    setConfigSuccess(null)

    try {
      const response = await fetch(`https://sc.promptlabai.com/suratech/sensors/${params.id}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sensor_name: configData.sensorName,
          machine_number: configData.machineNumber,
          installation_point: configData.installationPoint,
          machine_class: configData.machineClass,
          fmax: configData.fmax,
          lor: configData.lor,
          g_scale: configData.g_scale,
          time_interval: configData.time_interval,
          alarm_ths: Number(configData.alarm_ths) || 5.0,
          threshold_min: Number(configData.thresholdMin) || 0,
          threshold_medium: Number(configData.thresholdMedium) || 0,
          threshold_max: Number(configData.thresholdMax) || 0,
          note: configData.notes || "",
          image_url: configData.image_url || "",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setConfigSuccess('Sensor configuration updated successfully!')
      
      // Refresh sensor data to get updated configuration
      await fetchSensorLastData(params.id)
      
      // Update the config data immediately with the submitted values
      setConfigData(prev => ({
        ...prev,
        sensorName: configData.sensorName,
        machineNumber: configData.machineNumber,
        installationPoint: configData.installationPoint,
        machineClass: configData.machineClass,
        fmax: configData.fmax,
        lor: configData.lor,
        g_scale: configData.g_scale,
        time_interval: configData.time_interval,
        alarm_ths: configData.alarm_ths,
        thresholdMin: configData.thresholdMin,
        thresholdMedium: configData.thresholdMedium,
        thresholdMax: configData.thresholdMax,
        notes: configData.notes,
        image_url: configData.image_url,
        hAxisEnabled: configData.hAxisEnabled,
        vAxisEnabled: configData.vAxisEnabled,
        aAxisEnabled: configData.aAxisEnabled
      }))
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setConfigModalOpen(false)
        setConfigError(null)
        setConfigSuccess(null)
        setConfigLoading(false)
      }, 1000)
    } catch (error) {
      // Error updating sensor configuration
      setConfigError('Error updating sensor configuration')
    } finally {
      setConfigLoading(false)
    }
  }

  const handleConfigChange = useCallback((field: string, value: string | number | boolean) => {
    setConfigData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // Use utility function for card background color - use configData for threveold values
  const getCardBackgroundColorCallback = useCallback((velocityValue: number) => {
    // Use configData for threshold values since we fetch complete config from API
    // Use the same fallback logic as the main page for consistency
    
    const sensorConfig: SensorConfig = {
      thresholdMin: configData.thresholdMin ? Number(configData.thresholdMin) : 0.1,
      thresholdMedium: configData.thresholdMedium ? Number(configData.thresholdMedium) : 0.125,
      thresholdMax: configData.thresholdMax ? Number(configData.thresholdMax) : 0.15,
      machineClass: configData.machineClass || undefined
    }

    
    return getCardBackgroundColor(velocityValue, sensorConfig)
  }, [configData])

  // คำนวณสถิติการสั่นสะเทือนเมื่อข้อมูลเซ็นเซอร์เปลี่ยนแปลง
  useEffect(() => {
    if (sensorLastData?.data) {
      const { h, v, a } = sensorLastData.data

      // ตรวจสอบว่ามีข้อมูลอาร์เรย์หรือไม่
      if (Array.isArray(h) && Array.isArray(v) && Array.isArray(a) && h.length > 0) {
        const stats = calculateVibrationStats(h, v, a)
        setVibrationStats(stats)
      } else {
        // ใช้ค่าเดี่ยวถ้าไม่มีข้อมูลอาร์เรย์
        const hG = typeof h === "number" ? h : 0
        const vG = typeof v === "number" ? v : 0
        const aG = typeof a === "number" ? a : 0

        const rmsTotal = Math.sqrt((hG * hG + vG * vG + aG * aG) / 3)
        const peakTotal = Math.max(Math.abs(hG), Math.abs(vG), Math.abs(aG))
        const status = rmsTotal > 0.8 ? "Critical" : rmsTotal > 0.5 ? "Warning" : "Normal"

        setVibrationStats({
          rms: rmsTotal.toFixed(3),
          peak: peakTotal.toFixed(3),
          status,
        })
      }
    }
  }, [sensorLastData])

  // ฟังก์ชันเตรียมข้อมูลสำหรับกราฟ
  const prepareVibrationData = useCallback((): {
    hasData: boolean;
    timeData: any | null;
    freqData: any | null;
    yAxisLabel?: string;
    rmsValue?: string;
    peakValue?: string;
    peakToPeakValue?: string;
    topPeaks?: { peak: number; rms: string; frequency: string }[];
  } => {
    // ตรวจสอบว่ามีข้อมูลการสั่นสะเทือนจริงหรือไม่
    if (
      !sensorLastData?.data ||
      !Array.isArray(sensorLastData.data.h) ||
      !Array.isArray(sensorLastData.data.v) ||
      !Array.isArray(sensorLastData.data.a) ||
      sensorLastData.data.h.length === 0
    ) {
      return {
        hasData: false,
        timeData: null,
        freqData: null,
      }
    }

    // เลือกข้อมูลตามแกนที่เลือก
    const rawAxisData =
      selectedAxis === "H-axis"
        ? sensorLastData.data.h
        : selectedAxis === "V-axis"
          ? sensorLastData.data.v
          : sensorLastData.data.a

    // คำนวณช่วงเวลาตาม LOR และ fmax
    const totalTime = configData.lor / configData.fmax;
    const timeInterval = totalTime / (rawAxisData.length - 1);

    // เตรียมข้อมูลสำหรับกราฟ
    const chartData = prepareChartData(rawAxisData, selectedUnit, timeInterval, configData)

    return {
      hasData: true,
      ...chartData,
    }
  }, [sensorLastData?.data, selectedAxis, selectedUnit, configData])

  // Use real data if available, otherwise use sensor data or fallback
  const currentData = sensorLastData?.data || {
    temperature: sensor?.temperature || 0,
    h: [sensor?.vibrationX || 0],
    v: [sensor?.vibrationY || 0],
    a: [sensor?.vibrationZ || 0],
    battery: sensor?.battery || 0,
    datetime: sensor?.lastUpdated || new Date().toISOString(),
    rssi: 0,
    flag: "",
  }

  // Ensure all values are numbers
  const safeTemp = Number(currentData.temperature) || 0
  const safeBattery = Number(currentData.battery) || 0

  const vibrationData = useMemo(() => {
    if (loading || !sensorLastData) return { hasData: false, timeData: null, freqData: null };
    return prepareVibrationData();
  }, [prepareVibrationData, loading, sensorLastData])

  // Prepare stats for each axis
  const totalTime = configData.lor / configData.fmax;
  const timeInterval = totalTime / (sensorLastData?.data?.h?.length ? sensorLastData.data.h.length - 1 : 1);
  const xStats = useMemo(() => {
    if (loading || !sensorLastData?.data?.h) return { accelTopPeak: "0.000", velocityTopPeak: "0.000", dominantFreq: "0.000" };
    return getAxisTopPeakStats(sensorLastData.data.h, timeInterval, configData.g_scale, configData.fmax);
  }, [sensorLastData?.data?.h, timeInterval, loading, configData.g_scale, configData.lor, configData.fmax]);
  
  const yStats = useMemo(() => {
    if (loading || !sensorLastData?.data?.v) return { accelTopPeak: "0.000", velocityTopPeak: "0.000", dominantFreq: "0.000" };
    
    return getAxisTopPeakStats(sensorLastData.data.v, timeInterval, configData.g_scale, configData.fmax);
  }, [sensorLastData?.data?.v, timeInterval, loading, configData.g_scale, configData.lor, configData.fmax]);
  
  const zStats = useMemo(() => {
    if (loading || !sensorLastData?.data?.a) return { accelTopPeak: "0.000", velocityTopPeak: "0.000", dominantFreq: "0.000" };
    return getAxisTopPeakStats(sensorLastData.data.a, timeInterval, configData.g_scale, configData.fmax);
  }, [sensorLastData?.data?.a, timeInterval, loading, configData.g_scale, configData.lor, configData.fmax]);

  // Summary log for all axes when data changes
  useEffect(() => {
    if (sensorLastData?.name && !loading) {
      // console.log(`[SENSOR DETAIL ${sensorLastData.name}] PEAK VELOCITIES - H: ${xStats.velocityTopPeak} mm/s | V: ${yStats.velocityTopPeak} mm/s | A: ${zStats.velocityTopPeak} mm/s`);
    }
  }, [xStats.velocityTopPeak, yStats.velocityTopPeak, zStats.velocityTopPeak, sensorLastData?.name, loading]);

  const timeChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Time (s)",
          color: "#888",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#888",
        },
      },
      y: {
        title: {
          display: true,
          text: vibrationData?.yAxisLabel || "Acceleration (G)",
          color: "#888",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#888",
        },
      },
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          drag: {
            enabled: true,
            mode: 'x' as const,
          },
          mode: 'x' as const,
        }},
        legend: {
        display: false,
      },
    },
  }), [vibrationData?.yAxisLabel])

  const freqChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Frequency (Hz)",
          color: "#888",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#888",
        },
      },
      y: {
        title: {
          display: true,
          text: vibrationData?.yAxisLabel ? `${vibrationData.yAxisLabel} Magnitude` : "Magnitude",
          color: "#888",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "#888",
        },
      },
    },
    plugins: {
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          drag: {
            enabled: true,
            mode: 'x' as const,
          },
          mode: 'x' as const,
        }},
      legend: {
        display: false,
      },
    },
  }), [vibrationData?.yAxisLabel])

  // Early returns after all hooks
  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!sensor) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white">
        <h2 className="text-2xl font-bold">Sensor not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          Back to Sensors
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="mr-4 bg-transparent border-gray-700 hover:bg-gray-800"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sensor
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sensor: {sensorLastData?.name || sensor.name}</h1>
            <p className="text-gray-400">
              {sensor.machine || "Monitoring Test Machine"} • {sensor.location || "Test Location"}
              {sensorLastData && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-900 text-blue-300">Live Data</span>
              )}
            </p>
            <p className="text-sm text-gray-500">Last updated: {formatThaiDate(currentData.datetime)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-transparent border-gray-700 hover:bg-gray-800">
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDatetime ? formatDateTime(selectedDatetime) : 'Select Date'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 max-h-[300px] overflow-y-auto">
              {datetimes.length > 0 ? (
                datetimes.map((datetime) => (
                  <DropdownMenuItem
                    key={datetime}
                    className="text-white hover:bg-gray-800"
                    onClick={async () => {
                      setSelectedDatetime(datetime)
                      try {
                        const response = await fetch(`https://sc.promptlabai.com/suratech/sensors/${params.id}/last-data?datetime=${encodeURIComponent(datetime)}`, {
                          headers: { 'Accept': 'application/json' }
                        })
                        if (response.ok) {
                          const data = await response.json()
                          setSensorLastData(data)
                        } else {
                          setError('Failed to fetch sensor data for selected datetime')
                        }
                      } catch (e) {
                        setError('Failed to fetch sensor data for selected datetime')
                      }
                    }}
                  >
                    {formatDateTime(datetime)}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="text-gray-500">No dates available</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="bg-transparent border-gray-700 hover:bg-gray-800" onClick={() => router.push(`/sensors/${sensor.id}/history`)}>
            View History
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="bg-transparent border-gray-700 hover:bg-gray-800">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
              <DropdownMenuItem onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setConfigModalOpen(true)
              }}>
                <Settings className="mr-2 h-4 w-4" />
                Configure Sensor
              </DropdownMenuItem>
              <DropdownMenuItem>Export Data</DropdownMenuItem>
              <DropdownMenuItem>Print Report</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded-md mb-4">
            {error}. Using fallback data.
          </div>
        )}

        {/* Horizontal Sensor Information */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0 flex justify-center">
                <div className="w-24 h-24 bg-gray-700 rounded-md flex items-center justify-center">
                {configData.image_url && (
                        <img 
                          src={configData.image_url} 
                          alt="Sensor" 
                        />
                    )}
                </div>
              </div>

              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">Sensor Information</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent border-gray-700 hover:bg-gray-800"
                      onClick={() => setConfigModalOpen(true)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Serial Number</span>
                      <span>{configData.serialNumber || "S-JBK7"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Sensor Name</span>
                      <span>{configData.sensorName || "Unnamed Sensor"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Machine Number</span>
                      <span className={configData.machineNumber ? "text-white" : "text-gray-500"}>
                        {configData.machineNumber || "Not Set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Installation Point</span>
                      <span className={configData.installationPoint ? "text-white" : "text-gray-500"}>
                        {configData.installationPoint || "Not Set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Machine Class</span>
                      <span className={configData.machineClass ? "text-white" : "text-gray-500"}>
                        {configData.machineClass ? configData.machineClass.charAt(0).toUpperCase() + configData.machineClass.slice(1) : "Not Set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Note</span>
                      <span 
                        className={`max-w-[200px] truncate ${configData.notes ? "text-white" : "text-gray-500"}`}
                        title={configData.notes || "No notes"}
                      >
                        {configData.notes || "No notes"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Status</span>
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          sensor.status === "offline" ? "bg-gray-900 text-gray-300" : "bg-green-900 text-green-300"
                        }`}
                      >
                        {sensor.status === "offline" ? "Offline" : "OK"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Temperature</span>
                      <span>{safeTemp.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Battery</span>
                      <span>{safeBattery.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Signal Strength</span>
                      <span className="flex items-center gap-1">
                        <span>{getSignalStrength(currentData.rssi)}</span>
                        <span className="text-xs text-gray-500">({getSignalStrengthLabel(currentData.rssi)})</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Updated</span>
                      <span>{formatThaiDate(currentData.datetime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Installation Date</span>
                      <span>{formatDate(sensor.installationDate || "2025-04-26")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics and Analysis */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-gray-400 mb-2">Temperature Statistics</h3>
                <div className="text-2xl font-bold">{safeTemp.toFixed(1)}°C</div>
                <div className="text-sm text-gray-500">
                  Status: {safeTemp > (sensorLastData?.alarm_ths || 35) ? "Critical" : safeTemp > (sensorLastData?.alarm_ths || 35) * 0.7 ? "Warning" : "Normal"}
                </div>
                {sensorLastData?.alarm_ths && (
                  <div className="text-xs text-gray-600 mt-1">
                    Threshold: {sensorLastData.alarm_ths}°C
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Conditionally show H-axis card */}
            {configData.hAxisEnabled && (
              <Card className={`border-gray-800 ${getCardBackgroundColorCallback(parseFloat(xStats.velocityTopPeak))}`}>
                <CardContent className="p-4">
                  <h3 className="text-white mb-2">Horizontal (H)</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="">Acceleration</span>
                      <span className="text-right text-white">{xStats.accelTopPeak}G</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">Velocity</span>
                      <span className="text-right text-white">{xStats.velocityTopPeak} mm/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">Dominant Frequency</span>
                      <span className="text-right text-white">{xStats.dominantFreq} Hz</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Conditionally show V-axis card */}
            {configData.vAxisEnabled && (
              <Card className={`border-gray-800 ${getCardBackgroundColorCallback(parseFloat(yStats.velocityTopPeak))}`}>
                <CardContent className="p-4">
                  <h3 className="text-white mb-2">Vertical (V)</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="">Acceleration</span>
                      <span className="text-right text-white">{yStats.accelTopPeak}G</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">Velocity</span>
                      <span className="text-right text-white">{yStats.velocityTopPeak} mm/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">Dominant Frequency</span>
                      <span className="text-right text-white">{yStats.dominantFreq} Hz</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Conditionally show A-axis card */}
            {configData.aAxisEnabled && (
              <Card className={`border-gray-800 ${getCardBackgroundColorCallback(parseFloat(zStats.velocityTopPeak))}`}>
                <CardContent className="p-4">
                  <h3 className="text-white mb-2">Axial (A)</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="">Acceleration</span>
                      <span className="text-right text-white">{zStats.accelTopPeak}G</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">Velocity</span>
                      <span className="text-right text-white">{zStats.velocityTopPeak} mm/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="">Dominant Frequency</span>
                      <span className="text-right text-white">{zStats.dominantFreq} Hz</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Vibration Analysis Section */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Vibration Frequency Analysis</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Select value={selectedAxis} onValueChange={setSelectedAxis}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select axis" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {configData.hAxisEnabled && (
                      <SelectItem value="H-axis">H-axis (Horizontal)</SelectItem>
                    )}
                    {configData.vAxisEnabled && (
                      <SelectItem value="V-axis">V-axis (Vertical)</SelectItem>
                    )}
                    {configData.aAxisEnabled && (
                      <SelectItem value="A-axis">A-axis (Axial)</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="Acceleration (G)">Acceleration (G)</SelectItem>
                    <SelectItem value="Acceleration (mm/s²)">Acceleration (mm/s²)</SelectItem>
                    <SelectItem value="Velocity (mm/s)">Velocity (mm/s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(() => {
                if (!vibrationData.hasData) {
                  return (
                    <div className="flex flex-col items-center justify-center h-64 bg-gray-800 border border-gray-700 rounded-md">
                      <p className="text-gray-400">No vibration data available for this sensor</p>
                    </div>
                  )
                }

                // Calculate statistics from real data
                const axisData =
                  selectedAxis === "H-axis"
                    ? sensorLastData?.data?.h || []
                    : selectedAxis === "V-axis"
                      ? sensorLastData?.data?.v || []
                      : sensorLastData?.data?.a || []

                const absValues = axisData.map(Math.abs)
                const max = Math.max(...absValues)
                const min = Math.min(...absValues)

                // Scale values for better display
                const scaleFactor = 1000

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-md p-4">
                        <h4 className="text-xl font-medium mb-6">Overall Statistics</h4>
                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-lg">RMS :</span>
                            <span className="text-lg">{vibrationData.rmsValue} {vibrationData.yAxisLabel}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-lg">Peak :</span>
                            <span className="text-lg">{vibrationData.peakValue} {vibrationData.yAxisLabel}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-lg">Peak to Peak :</span>
                            <span className="text-lg">{vibrationData.peakToPeakValue} {vibrationData.yAxisLabel}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-900 border border-gray-800 rounded-md p-4">
                        <h4 className="text-xl font-medium mb-6">Top 5 Peaks</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-center table-fixed">
                            <thead>
                              <tr>
                                <th className="w-1/2 px-4 py-2">RMS</th>
                                <th className="w-1/2 px-4 py-2">Frequency</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vibrationData.topPeaks && vibrationData.topPeaks.map((row, i) => (
                                <tr key={i}>
                                  <td className="w-1/2 px-4 py-2">{row.rms}</td>
                                  <td className="w-1/2 px-4 py-2">{row.frequency} Hz</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {!configModalOpen && (
                      <>
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-4">Time domain</h3>
                          <div className="h-64 bg-gray-800 border border-gray-700 rounded-md p-2">
                            {vibrationData.timeData && (
                              <Line
                                data={vibrationData.timeData}
                                options={{
                                  ...timeChartOptions,
                                  scales: {
                                    ...timeChartOptions.scales,
                                    y: {
                                      ...timeChartOptions.scales.y,
                                      title: {
                                        ...timeChartOptions.scales.y.title,
                                        text: vibrationData.yAxisLabel || "Acceleration (G)",
                                      },
                                    },
                                  },
                                }}
                              />
                            )}
                          </div>
                        </div>

                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-4">Frequency domain</h3>
                          <div className="h-64 bg-gray-800 border border-gray-700 rounded-md p-2">
                            {vibrationData.freqData && (
                              <Line
                                data={vibrationData.freqData}
                                options={{
                                  ...freqChartOptions,
                                  scales: {
                                    ...freqChartOptions.scales,
                                    y: {
                                      ...freqChartOptions.scales.y,
                                      title: {
                                        ...freqChartOptions.scales.y.title,
                                        text: vibrationData.yAxisLabel
                                          ? `${vibrationData.yAxisLabel} Magnitude`
                                          : "Magnitude",
                                      },
                                    },
                                  },
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Configuration Modal */}
      {configModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80"
            onClick={() => {
              setConfigModalOpen(false)
              setConfigError(null)
              setConfigSuccess(null)
              setConfigLoading(false)
            }}
          />
          
          {/* Modal Content */}
          <div className="relative bg-gray-900 border border-gray-800 text-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Configure Sensor</h2>
              <button
                onClick={() => {
                  setConfigModalOpen(false)
                  setConfigError(null)
                  setConfigSuccess(null)
                  setConfigLoading(false)
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleConfigSubmit} className="space-y-4">
              {configError && (
                <div className="bg-red-900 border border-red-700 text-red-100 px-3 py-2 rounded-md text-sm">
                  {configError}
                </div>
              )}
              
              {configSuccess && (
                <div className="bg-green-900 border border-green-700 text-green-100 px-3 py-2 rounded-md text-sm">
                  {configSuccess}
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="sensorName" className="text-sm font-medium text-gray-300">
                      Sensor Name
                    </Label>
                    <Input
                      id="sensorName"
                      value={configData.sensorName}
                      onChange={(e) => handleConfigChange('sensorName', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g. Accelerometer 1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="machineNumber" className="text-sm font-medium text-gray-300">
                      Machine Number
                    </Label>
                    <Input
                      id="machineNumber"
                      value={configData.machineNumber}
                      onChange={(e) => handleConfigChange('machineNumber', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g. M-001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="installationPoint" className="text-sm font-medium text-gray-300">
                    Installation Point
                  </Label>
                  <Input
                    id="installationPoint"
                    value={configData.installationPoint}
                    onChange={(e) => handleConfigChange('installationPoint', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="e.g. Bearing 1"
                  />
                </div>

                <div>
                  <Label htmlFor="machineClass" className="text-sm font-medium text-gray-300">
                    Machine Class
                  </Label>
                  <Select
                    value={configData.machineClass}
                    onValueChange={(value) => handleConfigChange('machineClass', value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="small">Small Machines</SelectItem>
                      <SelectItem value="medium">Medium Machines</SelectItem>
                      <SelectItem value="largeRigid">Large rigid Machines</SelectItem>
                      <SelectItem value="largeSoft">Large soft Machines</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fmax" className="text-sm font-medium text-gray-300">
                      Max Frequency (Hz)
                    </Label>
                    <Select
                      value={configData.fmax.toString()}
                      onValueChange={(value) => handleConfigChange('fmax', Number(value))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="1000">1000 Hz</SelectItem>
                        <SelectItem value="2500">2500 Hz</SelectItem>
                        <SelectItem value="5000">5000 Hz</SelectItem>
                        <SelectItem value="10000">10000 Hz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="g_scale" className="text-sm font-medium text-gray-300">
                      G-Scale
                    </Label>
                    <Select
                      value={configData.g_scale.toString()}
                      onValueChange={(value) => handleConfigChange('g_scale', Number(value))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select G-Scale" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="2">2 G</SelectItem>
                        <SelectItem value="4">4 G</SelectItem>
                        <SelectItem value="8">8 G</SelectItem>
                        <SelectItem value="16">16 G</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="lor" className="text-sm font-medium text-gray-300">
                      LOR
                    </Label>
                    <Select
                      value={configData.lor.toString()}
                      onValueChange={(value) => handleConfigChange('lor', Number(value))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Select LOR" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                        <SelectItem value="800">800</SelectItem>
                        <SelectItem value="1600">1600</SelectItem>
                        <SelectItem value="3200">3200</SelectItem>
                        <SelectItem value="6400">6400</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="time_interval" className="text-sm font-medium text-gray-300">
                      Time Interval (Minutes)
                    </Label>
                    <Input
                      id="time_interval"
                      type="number"
                      value={configData.time_interval}
                      onChange={(e) => handleConfigChange('time_interval', Number(e.target.value))}
                      className="bg-gray-800 border-gray-700 text-white"
                      min="1"
                      max="3600"
                      placeholder="e.g. 24"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="thresholdMin" className="text-sm font-medium text-gray-300">
                      Warning Threshold
                    </Label>
                    <Input
                      id="thresholdMin"
                      type="number"
                      step="0.1"
                      value={configData.thresholdMin}
                      onChange={(e) => handleConfigChange('thresholdMin', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g. 1.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="thresholdMedium" className="text-sm font-medium text-gray-300">
                      Concern Threshold
                    </Label>
                    <Input
                      id="thresholdMedium"
                      type="number"
                      step="0.1"
                      value={configData.thresholdMedium}
                      onChange={(e) => handleConfigChange('thresholdMedium', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g. 2.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="thresholdMax" className="text-sm font-medium text-gray-300">
                      Damage Threshold
                    </Label>
                    <Input
                      id="thresholdMax"
                      type="number"
                      step="0.1"
                      value={configData.thresholdMax}
                      onChange={(e) => handleConfigChange('thresholdMax', e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g. 3.0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="alarm_ths" className="text-sm font-medium text-gray-300">
                    Alarm Threshold (G)
                  </Label>
                  <Input
                    id="alarm_ths"
                    type="number"
                    step="0.1"
                    value={configData.alarm_ths}
                    onChange={(e) => handleConfigChange('alarm_ths', Number(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="e.g. 5.0"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-300">
                    Notes
                  </Label>
                  <Input
                    id="notes"
                    value={configData.notes}
                    onChange={(e) => handleConfigChange('notes', e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Additional information"
                  />
                </div>

                {/* Image Upload Section */}
                <div>
                  <Label className="text-sm font-medium text-gray-300">
                    Sensor Image
                  </Label>
                  <div className="mt-2 space-y-3">
                    {/* Current Image Display */}
                    {configData.image_url && (
                      <div className="flex items-center space-x-3">
                        <img 
                          src={configData.image_url} 
                          alt="Sensor" 
                          className="w-16 h-16 object-cover rounded border border-gray-600"
                        />
                        <span className="text-sm text-gray-400">Current image</span>
                      </div>
                    )}
                    
                    {/* Image Upload */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            setSelectedImage(file)
                            // Create preview
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              setImagePreview(e.target?.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                      >
                        Choose Image
                      </label>
                      {selectedImage && (
                        <Button
                          type="button"
                          onClick={async () => {
                            if (selectedImage) {
                              setImageUploadLoading(true)
                              try {
                                const result = await uploadSensorImage(params.id, selectedImage)
                                handleConfigChange('image_url', result.image_url)
                                setSelectedImage(null)
                                setImagePreview(null)
                                setConfigSuccess('Image uploaded successfully!')
                              } catch (error) {
                                setConfigError('Failed to upload image')
                              } finally {
                                setImageUploadLoading(false)
                              }
                            }
                          }}
                          disabled={imageUploadLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-sm"
                        >
                          {imageUploadLoading ? "Uploading..." : "Upload"}
                        </Button>
                      )}
                    </div>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="flex items-center space-x-3">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-16 h-16 object-cover rounded border border-gray-600"
                        />
                        <span className="text-sm text-gray-400">Preview</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setConfigModalOpen(false)
                    setConfigError(null)
                    setConfigSuccess(null)
                    setConfigLoading(false)
                  }}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  disabled={configLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={configLoading}
                >
                  {configLoading ? "Updating..." : "Update Configuration"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
