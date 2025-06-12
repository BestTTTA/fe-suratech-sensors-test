"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const placeholders = ["event", "sensor", "value", "timestamp", "location", "machine"]

export default function NotificationSettings() {
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [webhookEnabled, setWebhookEnabled] = useState(false)
  const [sensor, setSensor] = useState("")
  const [value, setValue] = useState("")
  const [timestamp, setTimestamp] = useState("")
  const [machine, setMachine] = useState("")

  return (
    <div className="space-y-6 mt-6">
      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Notification Settings</CardTitle>
              <CardDescription>Configure email notifications for alerts and reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Enable Email Notifications</h3>
                    <p className="text-sm text-gray-500">Send notifications via email</p>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>

                {emailEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email-recipients">Email Recipients</Label>
                      <Input id="email-recipients" placeholder="Enter email addresses (comma separated)" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-sender">Sender Email</Label>
                      <Input
                        id="email-sender"
                        placeholder="Enter sender email"
                        defaultValue="notifications@example.com"
                      />
                    </div>
                  </div>
                )}

                {emailEnabled && (
                  <div className="space-y-2">
                    <Label>Notification Types</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="critical-alerts" defaultChecked />
                        <Label htmlFor="critical-alerts">Critical Alerts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="warning-alerts" defaultChecked />
                        <Label htmlFor="warning-alerts">Warning Alerts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="info-alerts" />
                        <Label htmlFor="info-alerts">Info Alerts</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="daily-reports" defaultChecked />
                        <Label htmlFor="daily-reports">Daily Reports</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button>Save Email Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>SMS Notification Settings</CardTitle>
              <CardDescription>Configure SMS notifications for critical alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Enable SMS Notifications</h3>
                    <p className="text-sm text-gray-500">Send critical alerts via SMS</p>
                  </div>
                  <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>

                {smsEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone-numbers">Phone Numbers</Label>
                      <Input id="phone-numbers" placeholder="Enter phone numbers (comma separated)" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sms-provider">SMS Provider</Label>
                      <Select defaultValue="twilio">
                        <SelectTrigger id="sms-provider">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="twilio">Twilio</SelectItem>
                          <SelectItem value="aws-sns">AWS SNS</SelectItem>
                          <SelectItem value="custom">Custom Provider</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {smsEnabled && (
                  <div className="space-y-2">
                    <Label>Alert Types</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="sms-critical-alerts" defaultChecked />
                        <Label htmlFor="sms-critical-alerts">Critical Alerts Only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="sms-warning-alerts" />
                        <Label htmlFor="sms-warning-alerts">Warning Alerts</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button>Save SMS Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Notification Settings</CardTitle>
              <CardDescription>Configure webhooks for system integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Enable Webhook Notifications</h3>
                    <p className="text-sm text-gray-500">Send notifications to external systems</p>
                  </div>
                  <Switch checked={webhookEnabled} onCheckedChange={setWebhookEnabled} />
                </div>

                {webhookEnabled && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input id="webhook-url" placeholder="https://your-webhook-endpoint.com/notify" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
                      <Input id="webhook-secret" type="password" placeholder="Enter secret key" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook-format">Payload Format</Label>
                      <Select defaultValue="json">
                        <SelectTrigger id="webhook-format">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                          <SelectItem value="form">Form Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="webhook-template">Custom Payload Template (Optional)</Label>
                      <Textarea
                        id="webhook-template"
                        placeholder='{"event": "{{event}}", "sensor": "{{sensor}}", "value": "{{value}}", "timestamp": "{{timestamp}}"}'
                        className="font-mono text-sm h-32"
                      />
                      <p className="text-xs text-gray-500">
                        Use {placeholders.map((placeholder) => `{${placeholder}}`).join(", ")} for dynamic values.
                        Available: {placeholders.map((placeholder) => `{${placeholder}}`).join(", ")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button>Save Webhook Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
