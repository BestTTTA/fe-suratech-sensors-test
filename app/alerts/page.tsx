import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import AlertsOverview from "@/components/alerts/AlertsOverview"
import AlertsFilters from "@/components/alerts/AlertsFilters"
import AlertsList from "@/components/alerts/AlertsList"
import AlertsHistory from "@/components/alerts/AlertsHistory"
import AlertsSettings from "@/components/alerts/AlertsSettings"

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Alerts</h1>

      <Suspense fallback={<LoadingSkeleton />}>
        <AlertsOverview />
      </Suspense>

      <AlertsFilters />

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="history">Alert History</TabsTrigger>
          <TabsTrigger value="settings">Alert Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Suspense fallback={<LoadingSkeleton />}>
            <AlertsList />
          </Suspense>
        </TabsContent>

        <TabsContent value="history">
          <Suspense fallback={<LoadingSkeleton />}>
            <AlertsHistory />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings">
          <Suspense fallback={<LoadingSkeleton />}>
            <AlertsSettings />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
