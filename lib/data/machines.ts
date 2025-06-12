import type { Machine } from "@/lib/types"
import { getRegisteredDevices } from "./register"

// Mock data for machines
const mockMachines: Machine[] = [
  {
    id: "machine-001",
    name: "Pump-01",
    type: "pump",
    location: "Building A, Floor 1, Section 1",
    manufacturer: "Grundfos",
    model: "CR 32-2",
    installationDate: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
    description: "Primary water circulation pump",
    status: "operational",
    lastMaintenance: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    nextMaintenance: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days from now
    sensors: ["sensor-001", "sensor-002", "sensor-003"],
  },
  {
    id: "machine-002",
    name: "Motor-01",
    type: "motor",
    location: "Building A, Floor 1, Section 2",
    manufacturer: "Siemens",
    model: "1LE1501-2BB23-4AA4",
    installationDate: Date.now() - 300 * 24 * 60 * 60 * 1000, // 300 days ago
    description: "Main drive motor for conveyor system",
    status: "operational",
    lastMaintenance: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
    nextMaintenance: Date.now() + 45 * 24 * 60 * 60 * 1000, // 45 days from now
    sensors: ["sensor-004", "sensor-005"],
  },
  {
    id: "machine-003",
    name: "Compressor-01",
    type: "compressor",
    location: "Building B, Floor 1, Section 1",
    manufacturer: "Atlas Copco",
    model: "GA 30+",
    installationDate: Date.now() - 180 * 24 * 60 * 60 * 1000, // 180 days ago
    description: "Main air compressor",
    status: "maintenance",
    lastMaintenance: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    nextMaintenance: Date.now() + 0 * 24 * 60 * 60 * 1000, // Today
    sensors: ["sensor-006", "sensor-007", "sensor-008"],
  },
  {
    id: "machine-004",
    name: "Turbine-01",
    type: "turbine",
    location: "Building C, Floor 2, Section 3",
    manufacturer: "General Electric",
    model: "LM2500",
    installationDate: Date.now() - 400 * 24 * 60 * 60 * 1000, // 400 days ago
    description: "Power generation turbine",
    status: "operational",
    lastMaintenance: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
    nextMaintenance: Date.now() + 120 * 24 * 60 * 60 * 1000, // 120 days from now
    sensors: ["sensor-009", "sensor-010", "sensor-011", "sensor-012"],
  },
  {
    id: "machine-005",
    name: "Mixer-01",
    type: "mixer",
    location: "Building A, Floor 3, Section 2",
    manufacturer: "Silverson",
    model: "Flashmix FMX50",
    installationDate: Date.now() - 150 * 24 * 60 * 60 * 1000, // 150 days ago
    description: "Chemical mixing unit",
    status: "warning",
    lastMaintenance: Date.now() - 75 * 24 * 60 * 60 * 1000, // 75 days ago
    nextMaintenance: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days from now
    sensors: ["sensor-013", "sensor-014"],
  },
]

// Get all machines
export async function getMachines(): Promise<Machine[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  try {
    // Combine mock machines with registered machines
    const { machines: registeredMachines } = await getRegisteredDevices()
    return [...mockMachines, ...(registeredMachines || [])]
  } catch (error) {
    console.error("Error fetching registered machines:", error)
    return [...mockMachines]
  }
}

// Get a single machine by ID
export async function getMachineById(id: string): Promise<Machine | null> {
  if (!id) {
    console.warn("getMachineById called with empty id")
    return null
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  try {
    // Check mock machines
    const mockMachine = mockMachines.find((machine) => machine.id === id)
    if (mockMachine) return mockMachine

    // Check registered machines
    const { machines: registeredMachines } = await getRegisteredDevices()
    if (registeredMachines && Array.isArray(registeredMachines)) {
      const registeredMachine = registeredMachines.find((machine) => machine.id === id)
      if (registeredMachine) return registeredMachine

      // Check by name (for backward compatibility)
      const registeredMachineByName = registeredMachines.find((machine) => machine.name === id)
      if (registeredMachineByName) return registeredMachineByName
    }

    // Check by name in mock machines (for backward compatibility)
    const machineByName = mockMachines.find((machine) => machine.name === id)
    if (machineByName) return machineByName

    // If no machine is found, return null
    return null
  } catch (error) {
    console.error(`Error finding machine with ID ${id}:`, error)
    return null
  }
}

// Get sensors for a specific machine
export async function getMachineSensors(machineId: string): Promise<string[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  try {
    const machine = await getMachineById(machineId)
    return machine ? machine.sensors : []
  } catch (error) {
    console.error(`Error getting sensors for machine ${machineId}:`, error)
    return []
  }
}
