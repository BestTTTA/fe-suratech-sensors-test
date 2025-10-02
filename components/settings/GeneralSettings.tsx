"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle } from "lucide-react"

export default function GeneralSettings() {
  const [systemName, setSystemName] = useState("TBKK-Surazense")
  const [timezone, setTimezone] = useState("UTC")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState("30")
  const [lineToken, setLineToken] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const BASE_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      console.log("Settings saved", {
        systemName,
        timezone,
        dateFormat,
        autoRefresh,
        refreshInterval,
        lineToken,
      })

      if (lineToken.trim() !== "") {
        const res = await fetch(`${BASE_API_URL}/line/update-token`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(lineToken),
        })

        if (!res.ok) {
          throw new Error(`Failed to update line token: ${res.status}`)
        }

        const data = await res.json()
        console.log("Line token updated:", data)
      }

      // แสดง toast เมื่อบันทึกสำเร็จ
      toast({
        description: (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">บันทึกสำเร็จ</p>
              <p className="text-sm text-muted-foreground">
                การตั้งค่าของคุณได้รับการบันทึกเรียบร้อยแล้ว
              </p>
            </div>
          </div>
        ),
        className: "border-green-500",
      })
    } catch (err) {
      console.error(err)
      
      // แสดง toast เมื่อเกิดข้อผิดพลาด
      toast({
        description: (
          <div className="flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold">เกิดข้อผิดพลาด</p>
              <p className="text-sm text-muted-foreground">
                ไม่สามารถบันทึกการตั้งค่าได้ กรุณาลองใหม่อีกครั้ง
              </p>
            </div>
          </div>
        ),
        className: "border-red-500",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 mt-6">
      {/* ... rest of the code remains the same ... */}
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>Configure general system settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="system-name">System Name</Label>
              <Input
                id="system-name"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="Enter system name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                  <SelectItem value="Asia/Bangkok">Thailand (ICT)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select value={dateFormat} onValueChange={setDateFormat}>
                <SelectTrigger id="date-format">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="YYYY/MM/DD">YYYY/MM/DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature-unit">Temperature Unit</Label>
              <Select defaultValue="celsius">
                <SelectTrigger id="temperature-unit">
                  <SelectValue placeholder="Select temperature unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celsius">Celsius (°C)</SelectItem>
                  <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>Configure how data is displayed and refreshed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Auto-refresh Data</h3>
              <p className="text-sm text-gray-500">Automatically refresh data at regular intervals</p>
            </div>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>

          {autoRefresh && (
            <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
              <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
              <div className="flex gap-4">
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger id="refresh-interval" className="w-[180px]">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Show Grid Lines</h3>
              <p className="text-sm text-gray-500">Display grid lines on charts</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Show Tooltips</h3>
              <p className="text-sm text-gray-500">Display tooltips on hover</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Bot Settings</CardTitle>
          <CardDescription>Configure Line Bot integration settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="line-token">Line Token</Label>
            <Input
              id="line-token"
              value={lineToken}
              onChange={(e) => setLineToken(e.target.value)}
              placeholder="XZmEYQX8xxx/xxx="
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}