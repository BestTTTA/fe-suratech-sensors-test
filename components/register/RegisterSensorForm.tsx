"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMachines } from "@/lib/data/machines";
import type { Machine } from "@/lib/types";

// Extend the form schema to include new fields
const formSchema = z.object({
  serialNumber: z
    .string()
    .min(4, { message: "Serial number must be at least 4 characters" })
    .max(20, { message: "Serial number must be less than 20 characters" }),
  machineClass: z.string().min(1, { message: "Please select a machine class" }),
  maxFrequency: z
    .string()
    .min(1, { message: "Please enter maximum frequency" }),
  lor: z.string().min(1, { message: "Please select LOR" }),
  gScale: z.string().min(1, { message: "Please select G-scale" }),
  timeInterval: z.string().min(1, { message: "Please enter time interval" }),
  alarmThreshold: z
    .string()
    .min(1, { message: "Please enter alarm threshold" }),
  thresholdMin: z.string().optional(),
  thresholdMedium: z.string().optional(),
  thresholdMax: z.string().optional(),
  notes: z.string().optional(),
});

export default function RegisterSensorForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      machineClass: "",
      maxFrequency: "",
      lor: "",
      gScale: "",
      timeInterval: "",
      alarmThreshold: "",
      thresholdMin: "",
      thresholdMedium: "",
      thresholdMax: "",
      notes: "",
    },
  });

  // Fetch machines for the dropdown
  useState(() => {
    const fetchMachines = async () => {
      try {
        const fetchedMachines = await getMachines();
        setMachines(fetchedMachines);
      } catch (error) {
        console.error("Error fetching machines:", error);
        toast({
          title: "Error",
          description: "Failed to load machines. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchMachines();
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      // Map form values to API payload
      const payload = {
        serial_number: values.serialNumber,
        machine_class: values.machineClass,
        max_frequency: Number(values.maxFrequency),
        g_scale: Number(values.gScale),
        lor: Number(values.lor),
        time_interval: Number(values.timeInterval),
        alarm_ths: Number(values.alarmThreshold),
        threshold_min: values.machineClass === "other" ? Number(values.thresholdMin) || 0 : 0,
        threshold_medium: values.machineClass === "other" ? Number(values.thresholdMedium) || 0 : 0,
        threshold_max: values.machineClass === "other" ? Number(values.thresholdMax) || 0 : 0,
        note: values.notes || "",
      };

      const response = await fetch("https://sc.promptlabai.com/suratech/sensors/web-register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast({
        title: "Sensor Registered",
        description: `Sensor ${values.serialNumber} has been successfully registered.`,
      });

      // Reset form
      form.reset();

      // Redirect to the sensors page after a short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Error registering sensor:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error registering the sensor. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Register New Sensor</CardTitle>
          <CardDescription>
            Add a new sensor to the monitoring system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. S-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="machineClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine class</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="small">Small Machines</SelectItem>
                          <SelectItem value="medium">
                            Medium Machines
                          </SelectItem>
                          <SelectItem value="largeRigid">
                            Large rigid Machines
                          </SelectItem>
                          <SelectItem value="largeSoft">
                            Large soft Machines
                          </SelectItem>
                          <SelectItem value="other">
                            Other
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum frequency (Hz)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1000">1000 Hz</SelectItem>
                          <SelectItem value="2500">2500 Hz</SelectItem>
                          <SelectItem value="5000">5000 Hz</SelectItem>
                          <SelectItem value="10000">10000 Hz</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LOR</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select LOR" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="400">400</SelectItem>
                          <SelectItem value="800">800</SelectItem>
                          <SelectItem value="1600">1600</SelectItem>
                          <SelectItem value="3200">3200</SelectItem>
                          <SelectItem value="6400">6400</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gScale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>G-scale</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select G-scale" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="2">2 G</SelectItem>
                          <SelectItem value="4">4 G</SelectItem>
                          <SelectItem value="8">8 G</SelectItem>
                          <SelectItem value="16">16 G</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Interval (Minutes)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alarmThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alarm Threshold (G)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="e.g. 5.0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Set the acceleration threshold in G units for alarm triggering
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch("machineClass") === "other" && (
                  <>
                    <FormField
                      control={form.control}
                      name="thresholdMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warning Threshold (mm/s)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 2.5" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="thresholdMedium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Concern Threshold (mm/s)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 5.0" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="thresholdMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Damage Threshold (mm/s)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 10.0" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Additional information"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
    </div>
  );
}
