import { Suspense } from "react"
import DashboardSummary from "@/components/dashboard/DashboardSummary"
import SensorGrid from "@/components/sensors/SensorGrid"
import SensorFilters from "@/components/sensors/SensorFilters"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sensor Dashboard</h1>
        <Button asChild variant="outline">
          <Link href="/" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sensors
          </Link>
        </Button>
      </div>
      {/* Summary Section - Now below the sensor overview */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="daily">Daily Summary</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Suspense fallback={<LoadingSkeleton />}>
            <DashboardSummary period="daily" />
          </Suspense>
        </TabsContent>

        <TabsContent value="weekly">
          <Suspense fallback={<LoadingSkeleton />}>
            <DashboardSummary period="weekly" />
          </Suspense>
        </TabsContent>

        <TabsContent value="monthly">
          <Suspense fallback={<LoadingSkeleton />}>
            <DashboardSummary period="monthly" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
