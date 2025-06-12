"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileEdit, Trash2, Plus, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react"
import type { Sensor } from "@/lib/types"

interface SensorMaintenanceHistoryProps {
  sensor: Sensor
}

export default function SensorMaintenanceHistory({ sensor }: SensorMaintenanceHistoryProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const maintenanceHistory = sensor.maintenanceHistory || []

  // Calculate next recommended maintenance
  const lastMaintenance =
    maintenanceHistory.length > 0 ? Math.max(...maintenanceHistory.map((m) => m.date)) : sensor.installationDate

  const daysSinceLastMaintenance = Math.floor((Date.now() - lastMaintenance) / (1000 * 60 * 60 * 24))
  const maintenanceStatus =
    daysSinceLastMaintenance > 90 ? "overdue" : daysSinceLastMaintenance > 60 ? "due-soon" : "ok"

  const nextMaintenanceDate = new Date(lastMaintenance + 90 * 24 * 60 * 60 * 1000)

  // Calculate health score based on maintenance history and sensor readings
  const hasRecentMaintenance = daysSinceLastMaintenance < 60
  const hasGoodReadings = sensor.status === "ok"
  const healthScore =
    hasRecentMaintenance && hasGoodReadings ? "good" : !hasRecentMaintenance && !hasGoodReadings ? "poor" : "fair"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">
                  {maintenanceStatus === "overdue"
                    ? "Overdue"
                    : maintenanceStatus === "due-soon"
                      ? "Due Soon"
                      : "Up to Date"}
                </div>
                <div className="text-sm text-gray-500">
                  Last maintenance:{" "}
                  {maintenanceHistory.length > 0 ? new Date(lastMaintenance).toLocaleDateString() : "Never"}
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  maintenanceStatus === "overdue"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : maintenanceStatus === "due-soon"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                }
              >
                {maintenanceStatus === "overdue"
                  ? `${daysSinceLastMaintenance} days overdue`
                  : maintenanceStatus === "due-soon"
                    ? `Due in ${90 - daysSinceLastMaintenance} days`
                    : "Regular schedule"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{nextMaintenanceDate.toLocaleDateString()}</div>
                <div className="text-sm text-gray-500">Recommended interval: 90 days</div>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sensor Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold capitalize">{healthScore}</div>
                <div className="text-sm text-gray-500">Based on maintenance history and readings</div>
              </div>
              {healthScore === "good" ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : healthScore === "poor" ? (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Maintenance Records</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Maintenance Record</DialogTitle>
              <DialogDescription>Record a new maintenance activity for this sensor.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maintenance-date" className="text-right">
                  Date
                </Label>
                <Input
                  id="maintenance-date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maintenance-type" className="text-right">
                  Type
                </Label>
                <Select defaultValue="routine">
                  <SelectTrigger className="col-span-3" id="maintenance-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine Maintenance</SelectItem>
                    <SelectItem value="calibration">Calibration</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="replacement">Part Replacement</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="technician" className="text-right">
                  Technician
                </Label>
                <Input id="technician" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea id="description" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={() => setShowAddDialog(false)}>
                Save Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {maintenanceHistory.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No maintenance records found for this sensor.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Schedule maintenance to keep track of sensor upkeep.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Parts Replaced</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenanceHistory.map((record, index) => (
              <TableRow key={index}>
                <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  {record.type ? (
                    <Badge variant="outline" className="capitalize">
                      {record.type || "Routine"}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Routine</Badge>
                  )}
                </TableCell>
                <TableCell>{record.description}</TableCell>
                <TableCell>{record.technician || "N/A"}</TableCell>
                <TableCell>{record.partsReplaced || "None"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon">
                      <FileEdit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Maintenance Recommendations</h3>
        <Card>
          <CardContent className="p-4">
            {sensor.status === "critical" ? (
              <div className="space-y-2">
                <div className="flex items-center text-red-600 dark:text-red-400 font-medium">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Immediate maintenance required
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This sensor is reporting critical values and requires immediate attention. Schedule a maintenance
                  check as soon as possible.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-2">
                  <li>Check for physical damage or obstruction</li>
                  <li>Verify power supply and connections</li>
                  <li>Calibrate sensor if readings are inaccurate</li>
                  <li>Replace sensor if issues persist</li>
                </ul>
              </div>
            ) : sensor.status === "warning" ? (
              <div className="space-y-2">
                <div className="flex items-center text-yellow-600 dark:text-yellow-400 font-medium">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Maintenance recommended soon
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This sensor is showing warning signs and should be inspected within the next 7 days.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-2">
                  <li>Check sensor calibration</li>
                  <li>Clean sensor components</li>
                  <li>Inspect mounting and connections</li>
                </ul>
              </div>
            ) : daysSinceLastMaintenance > 90 ? (
              <div className="space-y-2">
                <div className="flex items-center text-yellow-600 dark:text-yellow-400 font-medium">
                  <Calendar className="h-5 w-5 mr-2" />
                  Routine maintenance overdue
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This sensor has not been maintained in over 90 days. Schedule routine maintenance.
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 mt-2">
                  <li>Perform standard calibration</li>
                  <li>Clean sensor components</li>
                  <li>Check connections and mounting</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  No immediate maintenance needed
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This sensor is operating normally and was recently maintained. Next scheduled maintenance:{" "}
                  {nextMaintenanceDate.toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
