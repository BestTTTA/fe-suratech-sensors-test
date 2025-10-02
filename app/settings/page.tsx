import { Suspense } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoadingSkeleton from "@/components/ui/LoadingSkeleton"
import GeneralSettings from "@/components/settings/GeneralSettings"
import NotificationSettings from "@/components/settings/NotificationSettings"
import ThresholdSettings from "@/components/settings/ThresholdSettings"
import UserSettings from "@/components/settings/UserSettings"
import SystemSettings from "@/components/settings/SystemSettings"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Suspense fallback={<LoadingSkeleton />}>
            <GeneralSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications">
          <Suspense fallback={<LoadingSkeleton />}>
            <NotificationSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="thresholds">
          <Suspense fallback={<LoadingSkeleton />}>
            <ThresholdSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="users">
          <Suspense fallback={<LoadingSkeleton />}>
            <UserSettings />
          </Suspense>
        </TabsContent>

        <TabsContent value="system">
          <Suspense fallback={<LoadingSkeleton />}>
            <SystemSettings />
          </Suspense>
        </TabsContent>

      </Tabs>
    </div>
  )
}
