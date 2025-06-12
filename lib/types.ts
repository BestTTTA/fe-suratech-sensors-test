export type SensorStatus = "ok" | "warning" | "critical"

export interface SensorReading {
  timestamp: number
  temperature: number
  vibrationX: number
  vibrationY: number
  vibrationZ: number
}

export interface Sensor {
  id: string
  serialNumber: string
  machineName: string
  location: string
  installationDate: number
  lastUpdated: number
  readings: SensorReading[]
  status: SensorStatus
  maintenanceHistory: { date: number; description: string }[]
  // New fields for card display
  name: string
  model: string
  operationalStatus: "running" | "standby" | "alarm"
  batteryLevel: number
  connectivity: "online" | "offline"
  signalStrength: number
  vibrationH: "normal" | "warning" | "critical"
  vibrationV: "normal" | "warning" | "critical"
  vibrationA: "normal" | "warning" | "critical"
}

export interface Machine {
  id: string
  name: string
  type: string
  location: string
  installationDate: number
  sensors: string[]
  status: "operational" | "maintenance" | "offline"
  lastMaintenance?: number
  nextMaintenance?: number
}

export interface Alert {
  id: string
  sensorId: string
  type: "temperature" | "vibration" | "connectivity" | "battery"
  severity: "low" | "medium" | "high" | "critical"
  message: string
  timestamp: number
  acknowledged: boolean
  resolvedAt?: number
}
