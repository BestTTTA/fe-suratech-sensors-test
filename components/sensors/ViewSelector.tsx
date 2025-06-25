"use client"

import { Grid3X3, List, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type ViewMode = "grid" | "list" | "dot"

interface ViewSelectorProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export default function ViewSelector({ currentView, onViewChange }: ViewSelectorProps) {
  const views = [
    {
      mode: "grid" as ViewMode,
      icon: Grid3X3,
      label: "Grid View",
      description: "Card-based layout showing detailed sensor information"
    },
    {
      mode: "list" as ViewMode,
      icon: List,
      label: "List View", 
      description: "Compact list showing more sensors per page"
    },
    {
      mode: "dot" as ViewMode,
      icon: Circle,
      label: "Dot View",
      description: "Minimal dots showing temperature and vibration status"
    }
  ]

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
        {views.map((view) => {
          const Icon = view.icon
          const isActive = currentView === view.mode
          
          return (
            <Tooltip key={view.mode}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 p-0 ${
                    isActive 
                      ? "bg-blue-600 text-white hover:bg-blue-700" 
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                  onClick={() => onViewChange(view.mode)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-900 border-gray-700 text-white">
                <div className="text-center">
                  <div className="font-semibold">{view.label}</div>
                  <div className="text-xs text-gray-400">{view.description}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
} 