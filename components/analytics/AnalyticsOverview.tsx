import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Temperature</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">24.8°C</div>
          <p className="text-xs text-green-500 dark:text-green-400 mt-1">+2.3% from previous period</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Vibration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">0.67</div>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">+5.2% from previous period</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Anomalies Detected</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">12</div>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">+3 from previous period</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">99.7%</div>
          <p className="text-xs text-green-500 dark:text-green-400 mt-1">+0.2% from previous period</p>
        </CardContent>
      </Card>
    </div>
  )
}
