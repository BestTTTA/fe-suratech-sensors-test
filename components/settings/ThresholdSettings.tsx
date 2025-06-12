"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ThresholdSettings() {
  const [temperatureWarning, setTemperatureWarning] = useState(30)
  const [temperatureCritical, setTemperatureCritical] = useState(35)
  const [vibrationWarning, setVibrationWarning] = useState(0.8)
  const [vibrationCritical, setVibrationCritical] = useState(1.2)

  return (
    <div className="space-y-6 mt-6">
      <Tabs defaultValue="temperature" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="temperature">Temperature</TabsTrigger>
          <TabsTrigger value="vibration">Vibration</TabsTrigger>
        </TabsList>

        <TabsContent value="temperature">
          <Card>
            <CardHeader>
              <CardTitle>Temperature Thresholds</CardTitle>
              <CardDescription>Configure temperature alert thresholds for all sensors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Warning Threshold</h3>
                  <p className="text-sm text-gray-500">Alerts will be triggered when temperature exceeds this value</p>
                </div>

                <div className="space-y-6 pt-2">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>Current value: {temperatureWarning}°C</span>
                    </div>
                    <Slider
                      value={[temperatureWarning]}
                      min={0}
                      max={50}
                      step={0.5}
                      onValueChange={(value) => setTemperatureWarning(value[0])}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Critical Threshold</h3>
                  <p className="text-sm text-gray-500">
                    Critical alerts will be triggered when temperature exceeds this value
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>Current value: {temperatureCritical}°C</span>
                    </div>
                    <Slider
                      value={[temperatureCritical]}
                      min={0}
                      max={50}
                      step={0.5}
                      onValueChange={(value) => setTemperatureCritical(value[0])}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Machine-Specific Overrides</h3>
                  <p className="text-sm text-gray-500">
                    Set different thresholds for specific machines or sensor groups
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select defaultValue="pump-01">
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pump-01">Pump-01</SelectItem>
                      <SelectItem value="pump-02">Pump-02</SelectItem>
                      <SelectItem value="motor-01">Motor-01</SelectItem>
                      <SelectItem value="motor-02">Motor-02</SelectItem>
                      <SelectItem value="compressor-01">Compressor-01</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="space-y-2">
                    <Label htmlFor="warning-override">Warning (°C)</Label>
                    <Input id="warning-override" type="number" defaultValue="28" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="critical-override">Critical (°C)</Label>
                    <Input id="critical-override" type="number" defaultValue="33" />
                  </div>
                </div>

                <Button variant="outline" className="mt-2">
                  Add Override
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vibration">
          <Card>
            <CardHeader>
              <CardTitle>Vibration Thresholds</CardTitle>
              <CardDescription>Configure vibration alert thresholds for all sensors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Warning Threshold</h3>
                  <p className="text-sm text-gray-500">Alerts will be triggered when vibration exceeds this value</p>
                </div>

                <div className="space-y-6 pt-2">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>Current value: {vibrationWarning}</span>
                    </div>
                    <Slider
                      value={[vibrationWarning]}
                      min={0}
                      max={2}
                      step={0.1}
                      onValueChange={(value) => setVibrationWarning(value[0])}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Critical Threshold</h3>
                  <p className="text-sm text-gray-500">
                    Critical alerts will be triggered when vibration exceeds this value
                  </p>
                </div>

                <div className="space-y-6 pt-2">
                  <div>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>Current value: {vibrationCritical}</span>
                    </div>
                    <Slider
                      value={[vibrationCritical]}
                      min={0}
                      max={2}
                      step={0.1}
                      onValueChange={(value) => setVibrationCritical(value[0])}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Axis Configuration</h3>
                  <p className="text-sm text-gray-500">Configure thresholds for individual vibration axes</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="x-axis">X-Axis Warning</Label>
                    <Input id="x-axis" type="number" step="0.1" defaultValue="0.8" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="y-axis">Y-Axis Warning</Label>
                    <Input id="y-axis" type="number" step="0.1" defaultValue="0.8" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="z-axis">Z-Axis Warning</Label>
                    <Input id="z-axis" type="number" step="0.1" defaultValue="0.8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button>Save Thresholds</Button>
      </div>
    </div>
  )
}
