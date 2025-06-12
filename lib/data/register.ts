import { generateId } from "@/lib/utils"
import type { Machine, Sensor } from "@/lib/types"
import { getMachines } from "./machines"

// Mock database for storing registered machines and sensors
const registeredMachines: Machine[] = []
const registeredSensors: Sensor[] = []

// Register a new machine
export async function registerMachine(machineData: {
  name: string
  type: string
  location: string
  manufacturer?: string
  model?: string
  installationDate?: string
  description?: string
}): Promise<Machine> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Create a new machine object
  const newMachine: Machine = {
    id: generateId(),
    name: machineData.name,
    type: machineData.type,
    location: machineData.location,
    manufacturer: machineData.manufacturer || "",
    model: machineData.model || "",
    installationDate: machineData.installationDate ? new Date(machineData.installationDate).getTime() : Date.now(),
    description: machineData.description || "",
    status: "operational",
    lastMaintenance: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    nextMaintenance: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days from now
    sensors: [],
  }

  // Add to the registered machines
  registeredMachines.push(newMachine)

  return newMachine
}

// Register a new sensor
export async function registerSensor(sensorData: {
  serialNumber: string
  machineId: string
  location?: string
  notes?: string
}): Promise<Sensor> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Get the machine
  const machines = await getMachines()
  const machine = machines.find((m) => m.id === sensorData.machineId)

  if (!machine) {
    throw new Error("Machine not found")
  }

  // Create a new sensor object
  const newSensor: Sensor = {
    id: generateId(),
    serialNumber: sensorData.serialNumber,
    machineName: machine.name,
    location: sensorData.location || machine.location,
    installationDate: Date.now(),
    lastUpdated: Date.now(),
    status: "ok",
    readings: [],
    maintenanceHistory: [],
  }

  // Generate initial readings
  const baseTemp = 20 + Math.random() * 10 // 20-30°C
  const baseVibX = 0.5 + Math.random() * 0.5 // 0.5-1.0
  const baseVibY = 0.5 + Math.random() * 0.5 // 0.5-1.0
  const baseVibZ = 0.5 + Math.random() * 0.5 // 0.5-1.0

  // Create 10 initial readings
  for (let i = 0; i < 10; i++) {
    const timestamp = Date.now() - (10 - i) * 5 * 60 * 1000 // 5 minutes apart
    newSensor.readings.push({
      timestamp,
      temperature: baseTemp + (Math.random() * 2 - 1),
      vibrationX: baseVibX + (Math.random() * 0.2 - 0.1),
      vibrationY: baseVibY + (Math.random() * 0.2 - 0.1),
      vibrationZ: baseVibZ + (Math.random() * 0.2 - 0.1),
    })
  }

  // Add to the registered sensors
  registeredSensors.push(newSensor)

  // Update the machine's sensors list
  machine.sensors.push(newSensor.id)

  return newSensor
}

// Get all registered machines and sensors
export async function getRegisteredDevices() {
  // Simulate API delay for consistency
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    machines: registeredMachines,
    sensors: registeredSensors,
  }
}
