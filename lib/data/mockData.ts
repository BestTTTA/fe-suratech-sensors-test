import type { Sensor, SensorReading, SensorStatus } from "@/lib/types"

// Generate a random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Generate a random serial number
function generateSerialNumber(): string {
  const prefix = "S"
  // Start from higher numbers to avoid conflicts with API data
  const number = (1000 + Math.floor(Math.random() * 9000))
    .toString()
    .padStart(4, "0")
  return `${prefix}-${number}`
}

// Generate a random machine name
function generateMachineName(): string {
  const prefixes = ["Pump", "Motor", "Compressor", "Generator", "Turbine", "Conveyor", "Mixer", "Boiler"]
  const numbers = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0")
  return `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${numbers}`
}

// Generate a random location
function generateLocation(): string {
  const buildings = ["Building A", "Building B", "Building C", "Warehouse", "Production Line"]
  const floors = ["Floor 1", "Floor 2", "Floor 3", "Basement"]
  const sections = ["Section 1", "Section 2", "Section 3", "Section 4"]

  return `${buildings[Math.floor(Math.random() * buildings.length)]}, ${
    floors[Math.floor(Math.random() * floors.length)]
  }, ${sections[Math.floor(Math.random() * sections.length)]}`
}

// Generate random sensor readings
export function generateMockReadings(count = 10): SensorReading[] {
  const now = Date.now()
  const readings: SensorReading[] = []

  // Base values for readings
  const baseTemp = 20 + Math.random() * 10 // 20-30°C
  const baseVibX = 0.5 + Math.random() * 0.5 // 0.5-1.0
  const baseVibY = 0.5 + Math.random() * 0.5 // 0.5-1.0
  const baseVibZ = 0.5 + Math.random() * 0.5 // 0.5-1.0

  for (let i = 0; i < count; i++) {
    // Generate timestamp with decreasing time (newest first)
    const timestamp = now - (count - i) * 5 * 60 * 1000 // 5 minutes apart

    // Add some random variation to the base values
    const reading: SensorReading = {
      timestamp,
      temperature: baseTemp + (Math.random() * 2 - 1),
      vibrationX: baseVibX + (Math.random() * 0.2 - 0.1),
      vibrationY: baseVibY + (Math.random() * 0.2 - 0.1),
      vibrationZ: baseVibZ + (Math.random() * 0.2 - 0.1),
    }

    readings.push(reading)
  }

  return readings
}

// Determine sensor status based on readings
function determineSensorStatus(readings: SensorReading[]): SensorStatus {
  if (readings.length === 0) return "ok"

  const latestReading = readings[readings.length - 1]

  // Check temperature thresholds
  if (latestReading.temperature > 35) {
    return "critical"
  } else if (latestReading.temperature > 30) {
    return "warning"
  }

  // Check vibration thresholds
  const highVibration =
    latestReading.vibrationX > 1.2 || latestReading.vibrationY > 1.2 || latestReading.vibrationZ > 1.2

  const mediumVibration =
    latestReading.vibrationX > 0.8 || latestReading.vibrationY > 0.8 || latestReading.vibrationZ > 0.8

  if (highVibration) {
    return "critical"
  } else if (mediumVibration) {
    return "warning"
  }

  return "ok"
}

// Generate mock maintenance history
function generateMaintenanceHistory(): { date: number; description: string }[] {
  const now = Date.now()
  const count = Math.floor(Math.random() * 3) // 0-2 maintenance records
  const history = []

  for (let i = 0; i < count; i++) {
    const date = now - (i + 1) * 30 * 24 * 60 * 60 * 1000 // Each 30 days in the past
    const descriptions = [
      "Routine maintenance check",
      "Calibration performed",
      "Firmware update",
      "Battery replacement",
      "Sensor cleaning",
    ]

    history.push({
      date,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
    })
  }

  return history
}

// Generate mock sensors with enhanced data
export function generateMockSensors(count: number): Sensor[] {
  const sensors: Sensor[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    // Generate readings
    const readings = generateMockReadings()

    // Generate sensor number with leading zeros (start from higher numbers)
    const sensorNumber = (100 + i + 1).toString().padStart(3, "0")

    // Generate model name
    const modelNumber = 99999
    const modelName = `Model-2025-${modelNumber}`
    const selectedStatus = "standby"

    // Create sensor
    const sensor: Sensor = {
      id: generateId(),
      serialNumber: generateSerialNumber(),
      machineName: generateMachineName(),
      location: generateLocation(),
      installationDate: now , // Up to 1 year ago
      lastUpdated: now , // Up to 24 hours ago
      readings,
      status: determineSensorStatus(readings),
      maintenanceHistory: generateMaintenanceHistory(),
      // New fields for card display
      name: `Sensor-${sensorNumber}`,
      model: modelName,
      operationalStatus: selectedStatus,
      batteryLevel: 100, // 1-100%
      connectivity: "offline", // 90% online
      signalStrength: 100, // 1-100%
      vibrationH: "normal",
      vibrationV:  "normal",
      vibrationA: "normal",
      last_data: {
        temperature: 30,
        vibrationX: 10,
        vibrationY: 10,
        vibrationZ: 10,
        battery: 10,
        rssi: 10,
      },
      fmax: 400,
    }

    sensors.push(sensor)
  }

  return sensors
}
