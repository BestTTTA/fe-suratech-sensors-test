import { Badge } from "@/components/ui/badge"
import type { SensorStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: SensorStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "ok":
        return {
          label: "OK",
          variant: "outline" as const,
          className: "bg-green-900 text-green-200 border-green-700",
        }
      case "warning":
        return {
          label: "Warning",
          variant: "outline" as const,
          className: "bg-yellow-900 text-yellow-200 border-yellow-700",
        }
      case "critical":
        return {
          label: "Critical",
          variant: "outline" as const,
          className: "bg-red-900 text-red-200 border-red-700",
        }
      default:
        return {
          label: "Unknown",
          variant: "outline" as const,
          className: "bg-gray-800 text-gray-200 border-gray-700",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
