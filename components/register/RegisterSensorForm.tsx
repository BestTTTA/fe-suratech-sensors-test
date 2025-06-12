"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { registerSensor } from "@/lib/data/register"
import { getMachines } from "@/lib/data/machines"
import type { Machine } from "@/lib/types"

// Form schema with validation
const formSchema = z.object({
  serialNumber: z
    .string()
    .min(4, { message: "Serial number must be at least 4 characters" })
    .max(20, { message: "Serial number must be less than 20 characters" }),
  machineId: z.string({ required_error: "Please select a machine" }),
  location: z.string().optional(),
  notes: z.string().optional(),
})

export default function RegisterSensorForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])
  const router = useRouter()
  const { toast } = useToast()

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      machineId: "",
      location: "",
      notes: "",
    },
  })

  // Fetch machines for the dropdown
  useState(() => {
    const fetchMachines = async () => {
      try {
        const fetchedMachines = await getMachines()
        setMachines(fetchedMachines)
      } catch (error) {
        console.error("Error fetching machines:", error)
        toast({
          title: "Error",
          description: "Failed to load machines. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchMachines()
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      const result = await registerSensor(values)

      toast({
        title: "Sensor Registered",
        description: `Sensor ${result.serialNumber} has been successfully registered.`,
      })

      // Reset form
      form.reset()

      // Redirect to the sensors page after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Error registering sensor:", error)
      toast({
        title: "Registration Failed",
        description: "There was an error registering the sensor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Sensor</CardTitle>
        <CardDescription>Add a new sensor to the monitoring system</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. S-1234" {...field} />
                  </FormControl>
                  <FormDescription>Enter the sensor's unique serial number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="machineId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Machine</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a machine" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the machine this sensor will monitor</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. North side of machine" {...field} />
                  </FormControl>
                  <FormDescription>Specific location on the machine (optional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional information" {...field} />
                  </FormControl>
                  <FormDescription>Any additional information about this sensor (optional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Sensor"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.push("/")}>
          Cancel
        </Button>
        <Button variant="outline" onClick={() => form.reset()}>
          Reset Form
        </Button>
      </CardFooter>
    </Card>
  )
}
