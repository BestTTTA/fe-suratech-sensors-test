import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import RegisterSensorForm from "@/components/register/RegisterSensorForm"
import RegisterMachineForm from "@/components/register/RegisterMachineForm"

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Register New Device</h1>
      <p className="text-gray-500 dark:text-gray-400">Add new sensors or machines to the monitoring system.</p>

      <Tabs defaultValue="sensor" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="sensor">Register Sensor</TabsTrigger>
          <TabsTrigger value="machine">Register Machine</TabsTrigger>
        </TabsList>

        <TabsContent value="sensor">
          <RegisterSensorForm />
        </TabsContent>

        <TabsContent value="machine">
          <RegisterMachineForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
