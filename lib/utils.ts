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

// Generate a random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
