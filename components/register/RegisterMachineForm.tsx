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
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { registerMachine } from "@/lib/data/register"

// Form schema with validation
const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Machine name must be at least 3 characters" })
    .max(50, { message: "Machine name must be less than 50 characters" }),
  type: z.string({ required_error: "Please select a machine type" }),
  location: z.string().min(3, { message: "Location must be at least 3 characters" }),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  installationDate: z.string().optional(),
  description: z.string().optional(),
})

export default function RegisterMachineForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "",
      location: "",
      manufacturer: "",
      model: "",
      installationDate: new Date().toISOString().split("T")[0],
      description: "",
    },
  })

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    try {
      const result = await registerMachine(values)

      toast({
        title: "Machine Registered",
        description: `Machine ${result.name} has been successfully registered.`,
      })

      // Reset form
      form.reset()

      // Redirect to the machines page after a short delay
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Error registering machine:", error)
      toast({
        title: "Registration Failed",
        description: "There was an error registering the machine. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Machine</CardTitle>
        <CardDescription>Add a new machine to the monitoring system</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Machine Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Pump-01" {...field} />
                    </FormControl>
                    <FormDescription>Enter a unique name for this machine</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Machine Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select machine type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pump">Pump</SelectItem>
                        <SelectItem value="motor">Motor</SelectItem>
                        <SelectItem value="compressor">Compressor</SelectItem>
                        <SelectItem value="generator">Generator</SelectItem>
                        <SelectItem value="turbine">Turbine</SelectItem>
                        <SelectItem value="conveyor">Conveyor</SelectItem>
                        <SelectItem value="mixer">Mixer</SelectItem>
                        <SelectItem value="boiler">Boiler</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the type of machine</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Building A, Floor 2, Section 3" {...field} />
                  </FormControl>
                  <FormDescription>Where is this machine located?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Siemens" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. XYZ-1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="installationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional details about this machine"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Provide any additional information about this machine</FormDescription>
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
                "Register Machine"
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
