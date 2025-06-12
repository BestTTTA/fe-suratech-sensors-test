"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"

export default function SystemSettings() {
  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>View and manage system information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">System Name</h3>
              <p className="text-sm">TBKK-Surazense</p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">System Version</h3>
              <p className="text-sm">v1.0.0</p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Last Updated</h3>
              <p className="text-sm">May 22, 2025 12:35:01 PM</p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Organization</h3>
              <p className="text-sm">TBKK</p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Database Status</h3>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <p className="text-sm">Connected</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">API Status</h3>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <p className="text-sm">Operational</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">System Resources</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPU Usage</span>
                  <span>32%</span>
                </div>
                <Progress value={32} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memory Usage</span>
                  <span>45%</span>
                </div>
                <Progress value={45} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Disk Usage</span>
                  <span>28%</span>
                </div>
                <Progress value={28} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Configure data retention and backup settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Data Retention</h3>
              <p className="text-sm text-gray-500">Configure how long to keep historical data</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="sensor-data">Sensor Data Retention</Label>
                <Select defaultValue="90">
                  <SelectTrigger id="sensor-data">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-data">Alert History Retention</Label>
                <Select defaultValue="180">
                  <SelectTrigger id="alert-data">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="180">180 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="forever">Forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Automated Backups</h3>
              <p className="text-sm text-gray-500">Configure system backup schedule</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-medium">Enable Automated Backups</h4>
                <p className="text-sm text-gray-500">Regularly backup system data</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger id="backup-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-retention">Backup Retention</Label>
                <Select defaultValue="7">
                  <SelectTrigger id="backup-retention">
                    <SelectValue placeholder="Select retention" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 backups</SelectItem>
                    <SelectItem value="7">7 backups</SelectItem>
                    <SelectItem value="14">14 backups</SelectItem>
                    <SelectItem value="30">30 backups</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button variant="outline">Run Backup Now</Button>
        <Button>Save Settings</Button>
      </div>
    </div>
  )
}
