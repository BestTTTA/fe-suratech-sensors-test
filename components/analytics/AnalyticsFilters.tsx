"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DateRange } from "react-day-picker"
import DateRangePicker from "@/components/ui/DateRangePicker"

export default function AnalyticsFilters() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  })
  const [interval, setInterval] = useState("daily")
  const [machineFilter, setMachineFilter] = useState("all")

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Date Range</label>
            <DateRangePicker />
          </div>

          <div className="space-y-2 w-full md:w-[200px]">
            <label className="text-sm font-medium">Interval</label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger>
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 w-full md:w-[200px]">
            <label className="text-sm font-medium">Machine</label>
            <Select value={machineFilter} onValueChange={setMachineFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select machine" />
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
