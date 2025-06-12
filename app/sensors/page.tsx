import { Suspense } from "react"
import SensorsTable from "@/components/sensors/SensorsTable"
import SensorFilters from "@/components/sensors/SensorFilters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"

export default function SensorsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sensors</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex justify-between items-center">
            <span>Sensors Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SensorFilters />
          <Suspense fallback={<LoadingSkeleton />}>
            <SensorsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
