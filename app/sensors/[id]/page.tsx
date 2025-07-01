"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, MoreVertical, Calendar, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSensorById } from "@/lib/data/sensors"
import { formatDate, getSignalStrength, getSignalStrengthLabel } from "@/lib/utils"
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
// Import fft.js
import FFT from "fft.js"
import { log } from "console"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// ฟังก์ชันสำหรับแปลงค่า ADC เป็นค่า Acceleration (G)
// ADC คือค่าที่ได้จากเซ็นเซอร์แบบดิจิตอล (0-1023)
// range คือช่วงการวัดของเซ็นเซอร์ (±2G, ±4G, ±8G, ±16G)
function adcToAccelerationG(adcValue: number, range = 16): number {
  const offset = 0 // ค่า offset ของเซ็นเซอร์
  let sensitivity: number

  // กำหนดค่า sensitivity ตามช่วงการวัด
  switch (range) {
    case 2:
      sensitivity = 16384 // ±2G
      break
    case 4:
      sensitivity = 8192  // ±4G
      break
    case 8:
      sensitivity = 4096  // ±8G
      break
    case 16:
      sensitivity = 2048  // ±16G
      break
    default:
      sensitivity = 16384 // ค่าเริ่มต้น ±2G
  }

  return (adcValue - offset) / sensitivity
}

// แปลงค่า Acceleration (G) เป็น mm/s²
// 1G = 9806.65 mm/s²
function accelerationGToMmPerSecSquared(accelerationG: number): number {
  return accelerationG * 9806.65
}

// คำนวณความเร็วจากค่า acceleration
// ใช้สูตร: ความเร็ว = ½(ti+1-ti) * (acceleration1 + acceleration2)
function accelerationToVelocity(accelerations: number[], timeInterval: number): number[] {
  const velocities: number[] = [0] // ค่าเริ่มต้นความเร็วเป็น 0

  for (let i = 0; i < accelerations.length - 1; i++) {
    const velocity = 0.5 * timeInterval * (accelerations[i] + accelerations[i + 1])
    velocities.push(velocity)
  }

  return velocities
}

// อัตราการสุ่มตัวอย่างข้อมูล (Hz)
const SAMPLING_RATE = 25600
const MAX_FREQ = SAMPLING_RATE / 2.56

// คำนวณ FFT (Fast Fourier Transform) เพื่อวิเคราะห์ความถี่
// FFT คือการแปลงสัญญาณจากโดเมนเวลาเป็นโดเมนความถี่
function calculateFFT(timeData: number[]): { magnitude: number[]; frequency: number[] } {
  // ปรับความยาวข้อมูลให้เป็นกำลังของ 2 (จำเป็นสำหรับ FFT)
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(timeData.length)))

  try {
    // สร้าง instance ของ FFT
    const fft = new FFT(nextPow2)

    // เตรียมข้อมูล input (เติม 0 ถ้าจำเป็น)
    const input = new Float64Array(nextPow2)
    for (let i = 0; i < timeData.length; i++) {
      input[i] = timeData[i]
    }

    // เตรียมข้อมูล output (จำนวนจริงและจำนวนจินตภาพ)
    const output = new Float64Array(nextPow2 * 2)

    // ทำการแปลง FFT
    fft.realTransform(output, input)

    // คำนวณขนาดและความถี่
    const n = timeData.length / 2.56
    const magnitude: number[] = []
    const frequency: number[] = []

    // ประมวลผลครึ่งแรกของผลลัพธ์ FFT (ถึงความถี่ Nyquist)
    for (let i = 0; i < n; i++) {
      // ดึงส่วนจริงและส่วนจินตภาพ
      const real = output[i * 2]
      const imag = output[i * 2 + 1]

      // คำนวณขนาดโดยใช้สูตร: 2.56 / n * abs(fft_res)
      const abs = Math.sqrt(real * real + imag * imag)
      magnitude.push((2.56 / n) * abs)

      // คำนวณความถี่
      frequency.push((i * MAX_FREQ) / n)
    }

    return { magnitude, frequency: frequency.map(f => parseFloat(f.toFixed(2))) }
  } catch (error) {
    console.error("FFT calculation error:", error)
    // Return empty arrays or arrays of zeros as a safe fallback
    return { magnitude: [], frequency: [] }
  }
}

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

// ฟังก์ชันคำนวณสถิติการสั่นสะเทือน
function calculateVibrationStats(x: number[], y: number[], z: number[]) {
  // Check if we have valid data
  if (!x || !y || !z || x.length === 0 || y.length === 0 || z.length === 0) {
    return {
      rms: "0.000",
      peak: "0.000",
      status: "Normal",
    };
  }

  try {
    // แปลงค่า ADC เป็น G
    const xG = x.map((adc) => adcToAccelerationG(adc))
    const yG = y.map((adc) => adcToAccelerationG(adc))
    const zG = z.map((adc) => adcToAccelerationG(adc))

    // คำนวณค่า RMS (Root Mean Square)
    const rmsX = Math.sqrt(xG.reduce((sum, val) => sum + val * val, 0) / xG.length)
    const rmsY = Math.sqrt(yG.reduce((sum, val) => sum + val * val, 0) / yG.length)
    const rmsZ = Math.sqrt(zG.reduce((sum, val) => sum + val * val, 0) / zG.length)
    const rmsTotal = Math.sqrt((rmsX * rmsX + rmsY * rmsY + rmsZ * rmsZ) / 3)

    // คำนวณค่า Peak
    const peakX = Math.max(...xG.map(Math.abs))
    const peakY = Math.max(...yG.map(Math.abs))
    const peakZ = Math.max(...zG.map(Math.abs))
    const peakTotal = Math.max(peakX, peakY, peakZ)

    // กำหนดสถานะตามค่า RMS
    const status = rmsTotal > 0.8 ? "Critical" : rmsTotal > 0.5 ? "Warning" : "Normal"

    return {
      rms: rmsTotal.toFixed(3),
      peak: peakTotal.toFixed(3),
      status,
    };
  } catch (error) {
    console.error("Error in calculateVibrationStats:", error);
    return {
      rms: "0.000",
      peak: "0.000",
      status: "Normal",
    };
  }
}

// ฟังก์ชันเตรียมข้อมูลสำหรับกราฟ
function prepareChartData(
  rawAxisData: number[],
  selectedUnit: string,
  timeInterval: number
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
  const timeLabels = Array.from({ length: n }, (_, i) => (i * timeInterval).toFixed(2))

  // ประมวลผลข้อมูลตามหน่วยที่เลือก
  let processedData: number[]
  let yAxisLabel: string

  if (selectedUnit === "Acceleration (G)") {
    processedData = rawAxisData.map((adc) => adcToAccelerationG(adc))
    yAxisLabel = "G"
  } else if (selectedUnit === "Acceleration (mm/s²)") {
    processedData = rawAxisData.map((adc) => accelerationGToMmPerSecSquared(adcToAccelerationG(adc)))
    yAxisLabel = "mm/s²"
    console.log(processedData, "Acceleration (mm/s²)");
    
  } else {
    const accelerations = rawAxisData.map((adc) => accelerationGToMmPerSecSquared(adcToAccelerationG(adc)))
    processedData = accelerationToVelocity(accelerations, timeInterval)
    yAxisLabel = "mm/s"
    console.log(processedData, "Velocity (mm/s)");
  }

  // Calculate Overall Statistics in selected unit
  const rms = processedData.length > 0
    ? Math.sqrt(processedData.reduce((sum, val) => sum + val * val, 0) / processedData.length)
    : 0;
  // rms / 0.707
  const peak = rms / 0.707

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

  // คำนวณ FFT สำหรับโดเมนความถี่
  const { magnitude, frequency } = calculateFFT(processedData)

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

  // Remove zero frequency (DC component)
  const freqLabels = frequency.slice(1)
  const freqMagnitude = magnitude.slice(1)

  // Highlight top 5 peaks with red dots
  let pointBackgroundColor = new Array(freqMagnitude.length).fill('rgba(75, 192, 192, 0.5)')
  let topPeaks: { peak: number; rms: string; frequency: string }[] = []
  if (freqMagnitude.length > 0) {
    // Find indices of top 5 peaks
    const topIndices = [...freqMagnitude.keys()]
      .sort((a, b) => freqMagnitude[b] - freqMagnitude[a])
      .slice(0, 5)
    topIndices.forEach(idx => {
      pointBackgroundColor[idx] = 'red'
    })

    // Prepare topPeaks array for the table
    topPeaks = topIndices.map(idx => ({
      peak: freqMagnitude[idx],
      rms: (freqMagnitude[idx] * 0.707).toFixed(2),
      frequency: String(freqLabels[idx])
    }))
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

// Helper function to get stats for each axis
function getAxisStats(axisData: number[], timeInterval: number) {
  // Check if we have valid data
  if (!axisData || axisData.length === 0) {
    return {
      accelRMS: "0.00",
      velocityRMS: "0.00",
      dominantFreq: "0.00"
    };
  }

  try {
    const processedData = axisData.map(adc => adcToAccelerationG(adc));
    const accelG = processedData.map(adc => adcToAccelerationG(adc));
    const velocity = accelerationToVelocity(accelG, timeInterval)

    const { magnitude, frequency } = calculateFFT(processedData)
    const { magnitude: velocityMagnitude, frequency: velocityFrequency } = calculateFFT(velocity)

    // Check if we have valid magnitude data
    if (!magnitude || magnitude.length === 0 || !velocityMagnitude || velocityMagnitude.length === 0) {
      return {
        accelRMS: "0.00",
        velocityRMS: "0.00",
        dominantFreq: "0.00"
      };
    }

    //find max of magnitude and index
    const cutMagnitude = magnitude.slice(1)
    const maxMagnitude = Math.max(...cutMagnitude)
    const indexMagnitude = magnitude.indexOf(maxMagnitude)

    //find max of velocity and index
    const cutVelocityMagnitude = velocityMagnitude.slice(1)
    const maxVelocity = Math.max(...cutVelocityMagnitude)
    const velocityIndex = velocityMagnitude.indexOf(maxVelocity)

    // Check if velocityIndex is valid and velocityFrequency exists
    const dominantFreq = (velocityFrequency && velocityFrequency[velocityIndex] !== undefined) 
      ? velocityFrequency[velocityIndex] 
      : 0;

    return {
      accelRMS: maxMagnitude.toFixed(2),
      velocityRMS: maxVelocity.toFixed(2),
      dominantFreq: dominantFreq.toFixed(2)
    };
  } catch (error) {
    console.error("Error in getAxisStats:", error);
    return {
      accelRMS: "0.00",
      velocityRMS: "0.00",
      dominantFreq: "0.00"
    };
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
  const [configData, setConfigData] = useState({
    fmax: 10000,
    lor: 6400,
    g_scale: 16,
    alarm_ths: 5.0,
    time_interval: 3
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
      console.error("Error fetching sensor last data:", error)
      setError("Failed to fetch sensor data from API")
      return null
    }
  }

  // ฟังก์ชันดึงข้อมูลพื้นฐานของเซ็นเซอร์
  const fetchSensor = async () => {
    try {
      // ดึงข้อมูลพื้นฐานของเซ็นเซอร์
      const data = await getSensorById(params.id)
      // ดึงข้อมูลล่าสุดจากเซ็นเซอร์
      const lastData = await fetchSensorLastData(params.id)

      if (data) {
        setSensor(data)
      } else if (lastData) {
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
      console.error("Error fetching sensor:", error)
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
      console.error("Error fetching sensor datetimes:", error)
      setError("Failed to fetch sensor datetimes")
      return []
    }
  }

  // ฟังก์ชันดึงข้อมูลเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    fetchSensor()
    fetchSensorDatetimes(params.id)
  }, [params.id])

  // Update config data when sensorLastData changes
  useEffect(() => {
    if (sensorLastData) {
      setConfigData({
        fmax: sensorLastData.fmax || 10000,
        lor: sensorLastData.lor || 6400,
        g_scale: sensorLastData.g_scale || 16,
        alarm_ths: sensorLastData.alarm_ths || 5.0,
        time_interval: sensorLastData.time_interval || 3
      })
    }
  }, [sensorLastData])

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
      const response = await fetch('https://sc.promptlabai.com/suratech/sensors/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fmax: configData.fmax,
          lor: configData.lor,
          g_scale: configData.g_scale,
          alarm_ths: configData.alarm_ths,
          time_interval: configData.time_interval
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      setConfigSuccess('Sensor configuration updated successfully!')
      
      // Refresh sensor data to get updated configuration
      await fetchSensorLastData(params.id)
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setConfigModalOpen(false)
        setConfigError(null)
        setConfigSuccess(null)
        setConfigLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error updating sensor configuration:', error)
      setConfigError('Failed to update sensor configuration. Please try again.')
    } finally {
      setConfigLoading(false)
    }
  }

  const handleConfigChange = (field: string, value: string | number) => {
    setConfigData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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
  function prepareVibrationData(): {
    hasData: boolean;
    timeData: any | null;
    freqData: any | null;
    yAxisLabel?: string;
    rmsValue?: string;
    peakValue?: string;
    peakToPeakValue?: string;
    topPeaks?: { peak: number; rms: string; frequency: string }[];
  } {
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

    // คำนวณช่วงเวลาตามอัตราการสุ่มตัวอย่าง
    const timeInterval = 1 / SAMPLING_RATE;

    // เตรียมข้อมูลสำหรับกราฟ
    const chartData = prepareChartData(rawAxisData, selectedUnit, timeInterval)

    return {
      hasData: true,
      ...chartData,
    }
  }

  if (loading) {
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

  // Use real data if available, otherwise use sensor data or fallback
  const currentData = sensorLastData?.data || {
    temperature: sensor.temperature || 0,
    h: [sensor.vibrationX || 0],
    v: [sensor.vibrationY || 0],
    a: [sensor.vibrationZ || 0],
    battery: sensor.battery || 0,
    datetime: sensor.lastUpdated || new Date().toISOString(),
    rssi: 0,
    flag: "",
  }

  // Ensure all values are numbers
  const safeTemp = Number(currentData.temperature) || 0
  const safeBattery = Number(currentData.battery) || 0

  const vibrationData = prepareVibrationData()

  // Prepare stats for each axis
  const timeInterval = 1 / SAMPLING_RATE;
  const xStats = getAxisStats(sensorLastData?.data?.h || [], timeInterval);
  const yStats = getAxisStats(sensorLastData?.data?.v || [], timeInterval);
  const zStats = getAxisStats(sensorLastData?.data?.a || [], timeInterval);

  const timeChartOptions = {
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
      legend: {
        display: false,
      },
    },
  }

  const freqChartOptions = {
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
      legend: {
        display: false,
      },
    },
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
            <p className="text-sm text-gray-500">Last updated: {formatDate(currentData.datetime)}</p>
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
                  <div className="text-3xl text-gray-500">{(sensorLastData?.name || sensor.name).charAt(0)}</div>
                </div>
              </div>

              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Sensor Information</h2>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Serial Number</span>
                      <span>{sensor.serialNumber || "S-JBK7"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type</span>
                      <span>{sensorLastData?.sensor_type || "Vibration Sensor"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Unit</span>
                      <span>{sensorLastData?.unit || "G"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Machine</span>
                      <span>{sensor.machine || "Test Machine"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Location</span>
                      <span>{sensor.location || "Test Location"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Status</span>
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          sensor.status === "offline" ? "bg-red-900 text-red-300" : "bg-green-900 text-green-300"
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
                      <span>{formatDate(currentData.datetime, true)}</span>
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
            <Card className="bg-green-900 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-white mb-2">Horizontal (H)</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Acceleration RMS</span>
                    <span className="text-right text-white">{xStats.accelRMS}G</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Velocity RMS</span>
                    <span className="text-right text-white">{xStats.velocityRMS} mm/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dominant Frequency</span>
                    <span className="text-right text-white">{xStats.dominantFreq} Hz</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-900 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-white mb-2">Vertical (V)</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Acceleration RMS</span>
                    <span className="text-right text-white">{yStats.accelRMS}G</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Velocity RMS</span>
                    <span className="text-right text-white">{yStats.velocityRMS} mm/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dominant Frequency</span>
                    <span className="text-right text-white">{yStats.dominantFreq} Hz</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-green-900 border-gray-800">
              <CardContent className="p-4">
                <h3 className="text-white mb-2">Axial (A)</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Acceleration RMS</span>
                    <span className="text-right text-white">{zStats.accelRMS}G</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Velocity RMS</span>
                    <span className="text-right text-white">{zStats.velocityRMS} mm/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Dominant Frequency</span>
                    <span className="text-right text-white">{zStats.dominantFreq} Hz</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
                    <SelectItem value="H-axis">H-axis (Horizontal)</SelectItem>
                    <SelectItem value="V-axis">V-axis (Vertical)</SelectItem>
                    <SelectItem value="A-axis">A-axis (Axial)</SelectItem>
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
          <div className="relative bg-gray-900 border border-gray-800 text-white rounded-lg p-6 max-w-md w-full mx-4">
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
                <div>
                  <Label htmlFor="fmax" className="text-sm font-medium text-gray-300">
                    Max Frequency (Hz)
                  </Label>
                  <Input
                    id="fmax"
                    type="number"
                    value={configData.fmax}
                    onChange={(e) => handleConfigChange('fmax', Number(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                    min="1000"
                    max="50000"
                  />
                </div>

                <div>
                  <Label htmlFor="lor" className="text-sm font-medium text-gray-300">
                    LOR
                  </Label>
                  <Input
                    id="lor"
                    type="number"
                    value={configData.lor}
                    onChange={(e) => handleConfigChange('lor', Number(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                    min="1000"
                    max="20000"
                  />
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
                      <SelectItem value="2">±2G</SelectItem>
                      <SelectItem value="4">±4G</SelectItem>
                      <SelectItem value="8">±8G</SelectItem>
                      <SelectItem value="16">±16G</SelectItem>
                      <SelectItem value="32">±32G</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="alarm_ths" className="text-sm font-medium text-gray-300">
                    Alarm Threshold (°C)
                  </Label>
                  <Input
                    id="alarm_ths"
                    type="number"
                    step="0.1"
                    value={configData.alarm_ths}
                    onChange={(e) => handleConfigChange('alarm_ths', Number(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <Label htmlFor="time_interval" className="text-sm font-medium text-gray-300">
                    Time Interval (seconds)
                  </Label>
                  <Input
                    id="time_interval"
                    type="number"
                    value={configData.time_interval}
                    onChange={(e) => handleConfigChange('time_interval', Number(e.target.value))}
                    className="bg-gray-800 border-gray-700 text-white"
                    min="1"
                    max="3600"
                  />
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
