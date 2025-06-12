"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function AlertsFilters() {
  const [severity, setSeverity] = useState("all")
  const [status, setStatus] = useState("all")
  const [machine, setMachine] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2 w-full md:w-[150px]">
            <label className="text-sm font-medium">Severity</label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full md:w-[150px]">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full md:w-[150px]">
            <label className="text-sm font-medium">Machine</label>
            <Select value={machine} onValueChange={setMachine}>
              <SelectTrigger>
                <SelectValue placeholder="Machine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Machines</SelectItem>
                <SelectItem value="pump-01">Pump-01</SelectItem>
                <SelectItem value="pump-02">Pump-02</SelectItem>
                <SelectItem value="motor-01">Motor-01</SelectItem>
                <SelectItem value="motor-02">Motor-02</SelectItem>
                <SelectItem value="compressor-01">Compressor-01</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button>Apply Filters</Button>
        </div>
      </CardContent>
    </Card>
  )
}
