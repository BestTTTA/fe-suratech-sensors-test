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

export function formatRawTime(dateString: string): string {
  if (!dateString) return "N/A"
  try {
    // For ISO strings with 'Z' (UTC), extract the date and time directly without timezone conversion
    if (dateString.includes('T') && dateString.includes('Z')) {
      // Extract date and time parts from ISO string (e.g., "2025-07-01T09:59:15Z" -> "07/01/2025 09:59")
      const dateTimeMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):/)
      if (dateTimeMatch) {
        const year = dateTimeMatch[1]
        const month = dateTimeMatch[2]
        const day = dateTimeMatch[3]
        const hours = dateTimeMatch[4]
        const minutes = dateTimeMatch[5]
        return `${month}/${day}/${year} ${hours}:${minutes}`
      }
    }
    
    // Fallback to UTC parsing if the above doesn't work
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }
    
    // Format as MM/DD/YYYY HH:MM (24-hour format) using UTC to avoid timezone conversion
    const day = date.getUTCDate().toString().padStart(2, '0')
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
    const year = date.getUTCFullYear()
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    
    return `${month}/${day}/${year} ${hours}:${minutes}`
  } catch (error) {
    console.error("Error formatting raw time:", error)
    return "Error"
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
