"use client"

import { useState } from "react"
import { Bell, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Header() {
  const [alertCount, setAlertCount] = useState(3)

  return (
    <header className="bg-gray-800 border-b border-gray-700 py-3 px-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-medium text-white">TBKK-Surazense</h2>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-white hover:bg-gray-700">
                <Bell size={20} />
                {alertCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
                  >
                    {alertCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuLabel className="text-white">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-gray-200 hover:bg-gray-700">
                <span className="text-red-400 font-medium">Critical:</span> Sensor S-1234 temperature exceeding
                threshold
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-200 hover:bg-gray-700">
                <span className="text-yellow-400 font-medium">Warning:</span> Sensor S-5678 vibration anomaly detected
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-200 hover:bg-gray-700">
                <span className="text-blue-400 font-medium">Info:</span> System maintenance scheduled for tomorrow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
                <User size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuLabel className="text-white">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-gray-200 hover:bg-gray-700">Profile</DropdownMenuItem>
              <DropdownMenuItem className="text-gray-200 hover:bg-gray-700">Settings</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="text-gray-200 hover:bg-gray-700">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
