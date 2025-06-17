import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RegisterSensorForm from "@/components/register/RegisterSensorForm"

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Register New Device</h1>
      <p className="text-gray-500 dark:text-gray-400">Add new sensors to the monitoring system.</p>
      <RegisterSensorForm />
    </div>
  )
}
