export type SensorStatus = "ok" | "warning" | "critical"

export interface SensorReading {
  timestamp: number
  temperature: number
  vibrationX: number
  vibrationY: number
  vibrationZ: number
}

// Authentication types
export interface User {
  id: string
  name: string
  email: string
  org_code: string
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  token: string
  message?: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  org_code: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthError {
  message: string
  field?: string
}

// New interface for the updated API structure
export interface SensorApiData {
  id: string
  name: string
  sensor_type: string | null
  unit: string | null
  fmax?: number
  lor?: number
  g_scale?: number
  alarm_ths?: number
  time_interval?: number
  created_at: string
  updated_at: string
  machine_id: string | null
  machine_class?: string | null
  threshold_min?: number
  threshold_medium?: number
  threshold_max?: number
  last_data: {
    datetime: string
    temperature: number
    battery: number
    rssi: number
    last_32_h?: number[][]
    last_32_v?: number[][]
    last_32_a?: number[][]
  }
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
  maintenanceHistory: { 
    date: number
    description: string
    technician?: string
    type?: string
    partsReplaced?: string
  }[]
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
  // Store raw API data
  last_data?: any
  // Store calculated H, V, A statistics
  h_stats?: { accelTopPeak: string; velocityTopPeak: string; dominantFreq: string }
  v_stats?: { accelTopPeak: string; velocityTopPeak: string; dominantFreq: string }
  a_stats?: { accelTopPeak: string; velocityTopPeak: string; dominantFreq: string }
  // New API configuration fields
  fmax?: number
  lor?: number
  g_scale?: number
  alarm_ths?: number
  time_interval?: number
  // Threshold configuration fields
  threshold_min?: number
  threshold_medium?: number
  threshold_max?: number
  machine_class?: string | null
  machine_number?: string | null
  installation_point?: string | null
}

export interface Machine {
  id: string
  name: string
  type: string
  location: string
  installationDate: number
  sensors: string[]
  status: "operational" | "maintenance" | "offline" | "warning"
  lastMaintenance?: number
  nextMaintenance?: number
  model?: string
  manufacturer?: string
  
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

export interface SensorFilters {
  status?: "all" | "ok" | "warning" | "critical"
  search?: string
  page?: number
  limit?: number
}

export interface SensorSummary {
  totalSensors: number
  activeSensors: number
  criticalAlerts: number
  criticalAlertsChange: number
  warningAlerts: number
  warningAlertsChange: number
  avgTemperature: number
  minTemperature: number
  maxTemperature: number
  avgVibration: {
    x: number
    y: number
    z: number
  }
  temperatureData: Array<{
    name: string
    min: number
    avg: number
    max: number
  }>
  vibrationData: Array<{
    name: string
    x: number
    y: number
    z: number
  }>
}
