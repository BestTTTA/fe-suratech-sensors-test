"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { SensorStatus } from "@/lib/types"

export default function SensorFilters() {
  const [statusFilter, setStatusFilter] = useState<SensorStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const handleReset = () => {
    setStatusFilter("all")
    setSearchQuery("")
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder="Search by serial number or machine name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SensorStatus | "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ok">OK</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  )
}
