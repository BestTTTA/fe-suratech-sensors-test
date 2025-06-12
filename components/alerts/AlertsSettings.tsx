"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

export default function AlertsSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [temperatureThreshold, setTemperatureThreshold] = useState([30, 35])
  const [vibrationThreshold, setVibrationThreshold] = useState([0.8, 1.2])

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive alert notifications via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>

            {emailNotifications && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <Label htmlFor="email-recipients">Email Recipients</Label>
                  <Input id="email-recipients" placeholder="Enter email addresses" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-frequency">Frequency</Label>
                  <Select defaultValue="immediate">
                    <SelectTrigger id="email-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">SMS Notifications</h3>
                <p className="text-sm text-gray-500">Receive alert notifications via SMS</p>
              </div>
              <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
            </div>

            {smsNotifications && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <Label htmlFor="phone-numbers">Phone Numbers</Label>
                  <Input id="phone-numbers" placeholder="Enter phone numbers" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms-severity">Minimum Severity</Label>
                  <Select defaultValue="critical">
                    <SelectTrigger id="sms-severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Push Notifications</h3>
              <p className="text-sm text-gray-500">Receive in-app push notifications</p>
            </div>
            <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alert Thresholds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Temperature Thresholds</h3>
              <p className="text-sm text-gray-500">Set warning and critical temperature thresholds</p>
            </div>

            <div className="space-y-6 pt-2">
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Warning: {temperatureThreshold[0]}°C</span>
                  <span>Critical: {temperatureThreshold[1]}°C</span>
                </div>
                <Slider
                  value={temperatureThreshold}
                  min={0}
                  max={50}
                  step={0.5}
                  onValueChange={setTemperatureThreshold}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Vibration Thresholds</h3>
              <p className="text-sm text-gray-500">Set warning and critical vibration thresholds</p>
            </div>

            <div className="space-y-6 pt-2">
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span>Warning: {vibrationThreshold[0]}</span>
                  <span>Critical: {vibrationThreshold[1]}</span>
                </div>
                <Slider value={vibrationThreshold} min={0} max={2} step={0.1} onValueChange={setVibrationThreshold} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>Save Thresholds</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
