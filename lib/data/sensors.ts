import type { Sensor, SensorFilters, SensorReading, SensorSummary } from "@/lib/types"
import { generateMockSensors, generateMockReadings } from "./mockData"
// Add the import for getRegisteredDevices at the top of the file
import { getRegisteredDevices } from "./register"

// Cache the generated sensors to avoid regenerating on each request
let mockSensors: Sensor[] | null = null

// Function to fetch real sensors from API
async function fetchRealSensors(): Promise<Sensor[]> {
  try {
    const response = await fetch("https://sc.promptlabai.com/suratech/sensors/with-last-data", {
      cache: "no-store", // Disable caching for real-time data
      headers: {
        "Cache-Control": "no-cache",
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const apiData = await response.json()

    // Transform API data to match our Sensor interface
    return apiData.map((apiSensor: any) => {
      const now = Date.now()

      // Create readings from last_data if available
      const readings: SensorReading[] = []
      if (apiSensor.last_data) {
        readings.push({
          timestamp: new Date(apiSensor.last_data.datetime).getTime(),
          temperature: apiSensor.last_data.temperature || 0,
          vibrationX: 0.5 + Math.random() * 0.3, // Generate random vibration since not in API
          vibrationY: 0.5 + Math.random() * 0.3,
          vibrationZ: 0.5 + Math.random() * 0.3,
        })
      }

      // Determine status based on available data
      let status: "ok" | "warning" | "critical" = "ok"
      if (apiSensor.last_data) {
        if (apiSensor.last_data.temperature > 35) {
          status = "critical"
        } else if (apiSensor.last_data.temperature > 30) {
          status = "warning"
        }

        // Check battery level
        if (apiSensor.last_data.battery < 20) {
          status = "critical"
        } else if (apiSensor.last_data.battery < 50) {
          status = status === "ok" ? "warning" : status
        }
      }

      // Generate sensor number from name or use index
      const sensorNumber = apiSensor.name.replace(/[^0-9]/g, "") || "001"

      const sensor: Sensor = {
        id: apiSensor.id,
        serialNumber: `S-${sensorNumber.padStart(4, "0")}`,
        machineName: apiSensor.machine_id || "Unknown Machine",
        location: "API Location", // Default since not provided in API
        installationDate: new Date(apiSensor.created_at).getTime(),
        lastUpdated: new Date(apiSensor.updated_at).getTime(),
        readings,
        status,
        maintenanceHistory: [],
        // New fields for card display
        name: apiSensor.name,
        model: `Model-${apiSensor.id.substring(0, 8)}`,
        operationalStatus: apiSensor.last_data ? "running" : "standby",
        batteryLevel: apiSensor.last_data?.battery || 0,
        connectivity: apiSensor.last_data ? "online" : "offline",
        signalStrength: apiSensor.last_data ? Math.floor(Math.random() * 100) + 1 : 0,
        vibrationH: Math.random() > 0.8 ? "critical" : Math.random() > 0.6 ? "warning" : "normal",
        vibrationV: Math.random() > 0.8 ? "critical" : Math.random() > 0.6 ? "warning" : "normal",
        vibrationA: Math.random() > 0.8 ? "critical" : Math.random() > 0.6 ? "warning" : "normal",
      }

      return sensor
    })
  } catch (error) {
    console.error("Error fetching real sensors:", error)
    return []
  }
}

// Get all sensors with pagination and filtering
export async function getSensors(filters: SensorFilters = {}): Promise<{ sensors: Sensor[]; total: number }> {
  // Fetch real sensors from API
  const realSensors = await fetchRealSensors()

  // Use only real sensors (no mock sensors)
  let allSensors = [...realSensors]

  // Apply filters
  if (filters.status && filters.status !== "all") {
    allSensors = allSensors.filter((sensor) => sensor.status === filters.status)
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    allSensors = allSensors.filter(
      (sensor) =>
        sensor.serialNumber.toLowerCase().includes(searchLower) ||
        sensor.machineName.toLowerCase().includes(searchLower) ||
        sensor.name.toLowerCase().includes(searchLower),
    )
  }

  // Get total count before pagination
  const total = allSensors.length

  // Apply pagination
  const page = filters.page || 1
  const limit = filters.limit || 50 // Default to 50 per page
  const start = (page - 1) * limit
  const end = start + limit

  allSensors = allSensors.slice(start, end)

  return { sensors: allSensors, total }
}

// Get a single sensor by ID
export async function getSensorById(id: string): Promise<Sensor | null> {
  // First try to fetch from real API
  try {
    const realSensors = await fetchRealSensors()
    const realSensor = realSensors.find((s) => s.id === id)
    if (realSensor) return realSensor
  } catch (error) {
    console.error("Error fetching real sensor by ID:", error)
  }

  if (!mockSensors) {
    mockSensors = generateMockSensors(250)
  }

  // Check in mock sensors
  let sensor = mockSensors.find((s) => s.id === id)

  // If not found in mock sensors, check in registered sensors
  if (!sensor) {
    try {
      const { sensors: registeredSensors } = await getRegisteredDevices()
      sensor = registeredSensors.find((s) => s.id === id)
    } catch (error) {
      console.error("Error fetching registered sensors:", error)
    }
  }

  // If still not found, try to generate a fallback sensor for testing
  if (!sensor && id) {
    console.log(`Creating fallback sensor for ID: ${id}`)
    // Create a fallback sensor for testing purposes
    sensor = {
      id: id,
      serialNumber: `S-${id.substring(0, 4).toUpperCase()}`,
      machineName: "Test Machine",
      location: "Test Location",
      installationDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastUpdated: Date.now(),
      status: "ok",
      readings: generateMockReadings(10),
      maintenanceHistory: [],
      name: `Test Sensor ${id.substring(0, 3)}`,
      model: `Model-Test-${id.substring(0, 8)}`,
      operationalStatus: "standby",
      batteryLevel: 75,
      connectivity: "online",
      signalStrength: 85,
      vibrationH: "normal",
      vibrationV: "normal",
      vibrationA: "normal",
    }
  }

  return sensor || null
}

// Get sensor readings for a specific sensor
export async function getSensorReadings(sensorId: string, historical = false): Promise<SensorReading[]> {
  // First try to get from real API
  try {
    const realSensors = await fetchRealSensors()
    const realSensor = realSensors.find((s) => s.id === sensorId)
    if (realSensor && realSensor.readings.length > 0) {
      if (historical) {
        // Generate more historical data points for real sensors
        const baseReading = realSensor.readings[0]
        return generateMockReadings(100).map((reading) => ({
          ...reading,
          temperature: baseReading.temperature + (Math.random() * 4 - 2), // Vary around real temperature
        }))
      }
      return realSensor.readings
    }
  } catch (error) {
    console.error("Error fetching real sensor readings:", error)
  }

  if (!mockSensors) {
    mockSensors = generateMockSensors(250)
  }

  // Check in mock sensors
  let sensor = mockSensors.find((s) => s.id === sensorId)

  // If not found in mock sensors, check in registered sensors
  if (!sensor) {
    try {
      const { sensors: registeredSensors } = await getRegisteredDevices()
      sensor = registeredSensors.find((s) => s.id === sensorId)
    } catch (error) {
      console.error("Error fetching registered sensors:", error)
    }
  }

  if (!sensor) {
    // If sensor not found, return empty array or generate mock data
    return historical ? generateMockReadings(100) : generateMockReadings(10)
  }

  if (historical) {
    // Generate more historical data points
    return generateMockReadings(100)
  }

  return sensor.readings
}

// Get summary data for dashboard
export async function getSensorSummary(period: "daily" | "weekly" | "monthly"): Promise<SensorSummary> {
  // Fetch real sensors
  const realSensors = await fetchRealSensors()

  if (!mockSensors) {
    mockSensors = generateMockSensors(250)
  }

  // Combine real and mock sensors for summary
  const allSensors = [...realSensors, ...mockSensors]

  // Count sensors by status
  const criticalCount = allSensors.filter((s) => s.status === "critical").length
  const warningCount = allSensors.filter((s) => s.status === "warning").length

  // Calculate temperature stats from all sensors
  const allTemps: number[] = []
  const allVibX: number[] = []
  const allVibY: number[] = []
  const allVibZ: number[] = []

  allSensors.forEach((sensor) => {
    sensor.readings.forEach((reading) => {
      allTemps.push(reading.temperature)
      allVibX.push(reading.vibrationX)
      allVibY.push(reading.vibrationY)
      allVibZ.push(reading.vibrationZ)
    })
  })

  const avgTemp = allTemps.length > 0 ? allTemps.reduce((sum, temp) => sum + temp, 0) / allTemps.length : 0
  const minTemp = allTemps.length > 0 ? Math.min(...allTemps) : 0
  const maxTemp = allTemps.length > 0 ? Math.max(...allTemps) : 0

  const avgVibX = allVibX.length > 0 ? allVibX.reduce((sum, vib) => sum + vib, 0) / allVibX.length : 0
  const avgVibY = allVibY.length > 0 ? allVibY.reduce((sum, vib) => sum + vib, 0) / allVibY.length : 0
  const avgVibZ = allVibZ.length > 0 ? allVibZ.reduce((sum, vib) => sum + vib, 0) / allVibZ.length : 0

  // Generate mock chart data based on the period
  const dataPoints = period === "daily" ? 24 : period === "weekly" ? 7 : 30

  const temperatureData = Array.from({ length: dataPoints }).map((_, i) => {
    const pointName =
      period === "daily"
        ? `${i}:00`
        : period === "weekly"
          ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i % 7]
          : `Day ${i + 1}`

    const avg = avgTemp + (Math.random() * 4 - 2)
    const min = avg - (Math.random() * 3 + 1)
    const max = avg + (Math.random() * 3 + 1)

    return {
      name: pointName,
      min: Number.parseFloat(min.toFixed(1)),
      avg: Number.parseFloat(avg.toFixed(1)),
      max: Number.parseFloat(max.toFixed(1)),
    }
  })

  const vibrationData = Array.from({ length: dataPoints }).map((_, i) => {
    const pointName =
      period === "daily"
        ? `${i}:00`
        : period === "weekly"
          ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i % 7]
          : `Day ${i + 1}`

    return {
      name: pointName,
      x: Number.parseFloat((avgVibX + Math.random() * 0.3 - 0.15).toFixed(2)),
      y: Number.parseFloat((avgVibY + Math.random() * 0.3 - 0.15).toFixed(2)),
      z: Number.parseFloat((avgVibZ + Math.random() * 0.3 - 0.15).toFixed(2)),
    }
  })

  return {
    totalSensors: allSensors.length,
    activeSensors: allSensors.filter((s) => s.status !== "critical").length,
    criticalAlerts: criticalCount,
    criticalAlertsChange: Math.floor(Math.random() * 20) - 10,
    warningAlerts: warningCount,
    warningAlertsChange: Math.floor(Math.random() * 20) - 5,
    avgTemperature: Number.parseFloat(avgTemp.toFixed(1)),
    minTemperature: Number.parseFloat(minTemp.toFixed(1)),
    maxTemperature: Number.parseFloat(maxTemp.toFixed(1)),
    avgVibration: {
      x: Number.parseFloat(avgVibX.toFixed(2)),
      y: Number.parseFloat(avgVibY.toFixed(2)),
      z: Number.parseFloat(avgVibZ.toFixed(2)),
    },
    temperatureData,
    vibrationData,
  }
}
