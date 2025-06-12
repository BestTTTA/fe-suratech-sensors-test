import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AlertsOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Critical Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-500">7</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Requires immediate attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Warning Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-500">12</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Requires monitoring</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-500">9</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Successfully addressed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">14m</div>
          <p className="text-xs text-green-500 dark:text-green-400 mt-1">-2m from last week</p>
        </CardContent>
      </Card>
    </div>
  )
}
