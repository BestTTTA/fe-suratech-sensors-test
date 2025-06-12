import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSensorSummary } from "@/lib/data/sensors"
import { SensorSummaryChart } from "@/components/charts/SensorSummaryChart"
import { SensorVibrationChart } from "@/components/charts/SensorVibrationChart"

type Period = "daily" | "weekly" | "monthly"

export default async function DashboardSummary({ period }: { period: Period }) {
  const summary = await getSensorSummary(period)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sensors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{summary.totalSensors}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{summary.activeSensors} active</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-500">{summary.criticalAlerts}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {summary.criticalAlertsChange > 0 ? "+" : ""}
            {summary.criticalAlertsChange}% from previous {period}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Warning Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-500">{summary.warningAlerts}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {summary.warningAlertsChange > 0 ? "+" : ""}
            {summary.warningAlertsChange}% from previous {period}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Temperature</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{summary.avgTemperature}°C</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Min: {summary.minTemperature}°C, Max: {summary.maxTemperature}°C
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Temperature Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <SensorSummaryChart data={summary.temperatureData} dataKey="temperature" period={period} />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Vibration Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <SensorVibrationChart data={summary.vibrationData} period={period} />
        </CardContent>
      </Card>
    </div>
  )
}
