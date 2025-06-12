"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Info, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data for alerts
const mockAlerts = [
  {
    id: "alert-001",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    severity: "critical",
    message: "Temperature exceeding critical threshold",
    sensor: "S-1234",
    machine: "Pump-01",
    status: "active",
    value: "38.5°C",
  },
  {
    id: "alert-002",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    severity: "warning",
    message: "Vibration above normal levels",
    sensor: "S-5678",
    machine: "Motor-02",
    status: "acknowledged",
    value: "1.2",
  },
  {
    id: "alert-003",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    severity: "critical",
    message: "Connection lost with sensor",
    sensor: "S-2468",
    machine: "Compressor-01",
    status: "active",
    value: "N/A",
  },
  {
    id: "alert-004",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    severity: "warning",
    message: "Temperature approaching warning threshold",
    sensor: "S-3691",
    machine: "Turbine-01",
    status: "active",
    value: "29.8°C",
  },
  {
    id: "alert-005",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    severity: "info",
    message: "Maintenance scheduled",
    sensor: "S-1357",
    machine: "Pump-02",
    status: "acknowledged",
    value: "N/A",
  },
]

export default function AlertsList() {
  const [alerts, setAlerts] = useState(mockAlerts)

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-900 text-red-200 border-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-900 text-yellow-200 border-yellow-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Warning
          </Badge>
        )
      case "info":
        return (
          <Badge variant="outline" className="bg-blue-900 text-blue-200 border-blue-700">
            <Info className="h-3 w-3 mr-1" />
            Info
          </Badge>
        )
      default:
        return <Badge>{severity}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="destructive">Active</Badge>
      case "acknowledged":
        return (
          <Badge variant="outline" className="bg-blue-900 text-blue-200 border-blue-700">
            Acknowledged
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-900 text-green-200 border-green-700">
            Resolved
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const handleAcknowledge = (id: string) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, status: "acknowledged" } : alert)))
  }

  const handleResolve = (id: string) => {
    setAlerts(alerts.map((alert) => (alert.id === id ? { ...alert, status: "resolved" } : alert)))
  }

  return (
    <div className="rounded-md border border-gray-700 mt-6">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700">
            <TableHead className="text-gray-300">Time</TableHead>
            <TableHead className="text-gray-300">Severity</TableHead>
            <TableHead className="text-gray-300">Message</TableHead>
            <TableHead className="text-gray-300">Sensor</TableHead>
            <TableHead className="text-gray-300">Machine</TableHead>
            <TableHead className="text-gray-300">Value</TableHead>
            <TableHead className="text-gray-300">Status</TableHead>
            <TableHead className="text-gray-300">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id} className="border-gray-700">
              <TableCell className="text-sm text-gray-200">{formatTimestamp(alert.timestamp)}</TableCell>
              <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
              <TableCell className="text-gray-200">{alert.message}</TableCell>
              <TableCell className="text-gray-200">{alert.sensor}</TableCell>
              <TableCell className="text-gray-200">{alert.machine}</TableCell>
              <TableCell className="text-gray-200">{alert.value}</TableCell>
              <TableCell>{getStatusBadge(alert.status)}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-gray-700">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuLabel className="text-gray-200">Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem
                      onClick={() => handleAcknowledge(alert.id)}
                      className="text-gray-200 hover:bg-gray-700"
                    >
                      Acknowledge
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleResolve(alert.id)}
                      className="text-gray-200 hover:bg-gray-700"
                    >
                      Resolve
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-200 hover:bg-gray-700">View Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-gray-200 hover:bg-gray-700">View Sensor</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
