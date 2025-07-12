import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string, includeTime = false): string {
  if (!dateString) return "N/A"

  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return "Invalid date"
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }

    if (includeTime) {
      return `${date.toLocaleDateString("en-US", options)}, ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`
    }

    return date.toLocaleDateString("en-US", options)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Error"
  }
}

export function formatThaiDate(dateString: string): string {
  return `${dateString.split('T')[0].split('-').reverse().join('/')} ${dateString.split('T')[1].split('Z')[0]}`
}

export function formatRawTime(dateString: string): string {
  if (!dateString) return "N/A";
  try {
    // Always parse as UTC, then add 7 hours for Thailand time
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    const thailandTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const day = thailandTime.getUTCDate().toString().padStart(2, '0');
    const month = (thailandTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = thailandTime.getUTCFullYear();
    const hours = thailandTime.getUTCHours().toString().padStart(2, '0');
    const minutes = thailandTime.getUTCMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error("Error formatting raw time:", error);
    return "Error";
  }
}

// Generate a random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Convert RSSI to signal strength level (0-4)
export function getSignalStrength(rssi: number): number {
  if (rssi === 0) return 0
  if (rssi <= 1) return 1
  if (rssi <= 2) return 2
  if (rssi <= 3) return 3
  return 4
}

// Get signal strength label
export function getSignalStrengthLabel(rssi: number): string {
  const level = getSignalStrength(rssi)
  switch (level) {
    case 0: return "No Signal"
    case 1: return "Weak"
    case 2: return "Fair"
    case 3: return "Good"
    case 4: return "Excellent"
    default: return "Unknown"
  }
}

// Upload sensor image to API
export async function uploadSensorImage(sensorId: string, imageFile: File): Promise<{ image_url: string; message: string; status: string }> {
  const formData = new FormData()
  formData.append('image', imageFile)

  const response = await fetch(`https://sc.promptlabai.com/suratech/sensors/${sensorId}/image`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
}
