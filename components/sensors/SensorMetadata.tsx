import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import type { Machine, Sensor } from "@/lib/types"
import StatusBadge from "./StatusBadge"

interface SensorMetadataProps {
  sensor: Sensor
  machine?: Machine | null
}

export default function SensorMetadata({ sensor, machine }: SensorMetadataProps) {
  const latestReading =
    sensor.readings && sensor.readings.length > 0 ? sensor.readings[sensor.readings.length - 1] : null

  // Calculate operational time
  const operationalDays = Math.floor((Date.now() - sensor.installationDate) / (1000 * 60 * 60 * 24))

  // Calculate health percentage based on readings and status
  const getHealthPercentage = () => {
    if (!latestReading) return 100

    let healthScore = 100

    // Reduce health based on temperature
    if (latestReading.temperature > 35) {
      healthScore -= 40
    } else if (latestReading.temperature > 30) {
      healthScore -= 20
    }

    // Reduce health based on vibration
    const maxVibration = Math.max(latestReading.vibrationX, latestReading.vibrationY, latestReading.vibrationZ)

    if (maxVibration > 1.2) {
      healthScore -= 40
    } else if (maxVibration > 0.8) {
      healthScore -= 20
    }

    // Ensure health is between 0 and 100
    return Math.max(0, Math.min(100, healthScore))
  }

  const healthPercentage = getHealthPercentage()

  // Get health status text and color
  const getHealthStatus = () => {
    if (healthPercentage >= 80) {
      return { text: "Good", color: "text-green-400" }
    } else if (healthPercentage >= 50) {
      return { text: "Fair", color: "text-yellow-400" }
    } else {
      return { text: "Poor", color: "text-red-400" }
    }
  }

  const healthStatus = getHealthStatus()

  // Determine if readings are within normal range
  const isTemperatureNormal = latestReading ? latestReading.temperature <= 30 : true
  const isVibrationNormal = latestReading
    ? latestReading.vibrationX <= 0.8 && latestReading.vibrationY <= 0.8 && latestReading.vibrationZ <= 0.8
    : true

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Status</h3>
        <StatusBadge status={sensor.status} />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Sensor Health</span>
            <span className={healthStatus.color}>
              {healthStatus.text} ({healthPercentage}%)
            </span>
          </div>
          <Progress
            value={healthPercentage}
            className={`h-2 ${
              healthPercentage >= 80 ? "bg-green-900" : healthPercentage >= 50 ? "bg-yellow-900" : "bg-red-900"
            }`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium text-gray-400">Serial Number</div>
          <div className="text-sm text-gray-200">{sensor.serialNumber}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium text-gray-400">Machine</div>
          <div className="text-sm text-gray-200">
            {sensor.machineName}
            {machine?.status && (
              <Badge
                variant="outline"
                className={`ml-2 ${
                  machine.status === "operational"
                    ? "bg-green-900 text-green-200 border-green-700"
                    : machine.status === "warning"
                      ? "bg-yellow-900 text-yellow-200 border-yellow-700"
                      : machine.status === "maintenance"
                        ? "bg-blue-900 text-blue-200 border-blue-700"
                        : "bg-red-900 text-red-200 border-red-700"
                }`}
              >
                {machine.status}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium text-gray-400">Location</div>
          <div className="text-sm text-gray-200">{sensor.location || "Unknown"}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium text-gray-400">Last Updated</div>
          <div className="text-sm text-gray-200">{new Date(sensor.lastUpdated).toLocaleString()}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium text-gray-400">Installation Date</div>
          <div className="text-sm text-gray-200">{new Date(sensor.installationDate).toLocaleDateString()}</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium text-gray-400">Operational Time</div>
          <div className="text-sm text-gray-200">{operationalDays} days</div>
        </div>
      </div>

      {latestReading && (
        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-lg font-medium mb-4 text-white">Latest Readings</h3>

          <div className="grid grid-cols-1 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-400">Temperature</div>
                    <div className="text-2xl font-bold text-white">{latestReading.temperature.toFixed(1)}°C</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isTemperatureNormal
                        ? "bg-green-900 text-green-200 border-green-700"
                        : "bg-red-900 text-red-200 border-red-700"
                    }
                  >
                    {isTemperatureNormal ? "Normal" : "High"}
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Normal range: 15°C - 30°C</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        latestReading.temperature > 35
                          ? "bg-red-500"
                          : latestReading.temperature > 30
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(100, (latestReading.temperature / 40) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-400">Vibration</div>
                    <div className="text-lg text-gray-200">
                      X: <span className="font-bold">{latestReading.vibrationX.toFixed(2)}</span> • Y:{" "}
                      <span className="font-bold">{latestReading.vibrationY.toFixed(2)}</span> • Z:{" "}
                      <span className="font-bold">{latestReading.vibrationZ.toFixed(2)}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isVibrationNormal
                        ? "bg-green-900 text-green-200 border-green-700"
                        : "bg-red-900 text-red-200 border-red-700"
                    }
                  >
                    {isVibrationNormal ? "Normal" : "High"}
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500">Normal range: 0.0 - 0.8</div>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">X-axis</div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            latestReading.vibrationX > 1.2
                              ? "bg-red-500"
                              : latestReading.vibrationX > 0.8
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(100, (latestReading.vibrationX / 2) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">Y-axis</div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            latestReading.vibrationY > 1.2
                              ? "bg-red-500"
                              : latestReading.vibrationY > 0.8
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(100, (latestReading.vibrationY / 2) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">Z-axis</div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            latestReading.vibrationZ > 1.2
                              ? "bg-red-500"
                              : latestReading.vibrationZ > 0.8
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(100, (latestReading.vibrationZ / 2) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {machine && (
        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-lg font-medium mb-2 text-white">Machine Details</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium text-gray-400">Type</div>
              <div className="text-sm capitalize text-gray-200">{machine.type}</div>
            </div>
            {machine.manufacturer && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-400">Manufacturer</div>
                <div className="text-sm text-gray-200">{machine.manufacturer}</div>
              </div>
            )}
            {machine.model && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-400">Model</div>
                <div className="text-sm text-gray-200">{machine.model}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium text-gray-400">Next Maintenance</div>
              <div className="text-sm text-gray-200">{new Date(machine.nextMaintenance).toLocaleDateString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium text-gray-400">Sensors Attached</div>
              <div className="text-sm text-gray-200">{machine.sensors.length}</div>
            </div>
          </div>
        </div>
      )}

      {sensor.maintenanceHistory && sensor.maintenanceHistory.length > 0 && (
        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-lg font-medium mb-2 text-white">Last Maintenance</h3>
          <div className="space-y-2">
            <div className="text-sm">
              <div className="font-medium text-gray-200">
                {new Date(sensor.maintenanceHistory[0].date).toLocaleDateString()}
              </div>
              <div className="text-gray-400">{sensor.maintenanceHistory[0].description}</div>
              {sensor.maintenanceHistory[0].technician && (
                <div className="text-gray-400">Technician: {sensor.maintenanceHistory[0].technician}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
