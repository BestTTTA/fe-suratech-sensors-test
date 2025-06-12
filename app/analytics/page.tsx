import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import AnalyticsOverview from "@/components/analytics/AnalyticsOverview"
import AnalyticsFilters from "@/components/analytics/AnalyticsFilters"
import TemperatureAnalytics from "@/components/analytics/TemperatureAnalytics"
import VibrationAnalytics from "@/components/analytics/VibrationAnalytics"
import MachineAnalytics from "@/components/analytics/MachineAnalytics"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>

      <AnalyticsFilters />

      <Suspense fallback={<LoadingSkeleton />}>
        <AnalyticsOverview />
      </Suspense>

      <Tabs defaultValue="temperature" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
          <TabsTrigger value="vibration">Vibration</TabsTrigger>
          <TabsTrigger value="machines">Machines</TabsTrigger>
        </TabsList>

        <TabsContent value="temperature">
          <Suspense fallback={<LoadingSkeleton />}>
            <TemperatureAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="vibration">
          <Suspense fallback={<LoadingSkeleton />}>
            <VibrationAnalytics />
          </Suspense>
        </TabsContent>

        <TabsContent value="machines">
          <Suspense fallback={<LoadingSkeleton />}>
            <MachineAnalytics />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
