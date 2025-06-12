"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { Sensor } from "@/lib/types"
import { Edit, MoreVertical, Trash2, Download, Wrench, Power, PowerOff } from "lucide-react"

interface SensorActionsProps {
  sensor: Sensor
}

export default function SensorActions({ sensor }: SensorActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // In a real app, you would call an API to delete the sensor
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Sensor Deleted",
        description: `Sensor ${sensor.serialNumber} has been deleted.`,
      })

      // Redirect to sensors list
      router.push("/")
    } catch (error) {
      console.error("Error deleting sensor:", error)
      toast({
        title: "Error",
        description: "Failed to delete sensor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleEdit = () => {
    // In a real app, you would navigate to an edit page
    toast({
      title: "Edit Sensor",
      description: "This functionality is not implemented yet.",
    })
  }

  const handleExportData = () => {
    // In a real app, you would export sensor data
    toast({
      title: "Export Data",
      description: "Exporting sensor data...",
    })
  }

  const handleScheduleMaintenance = () => {
    // In a real app, you would open a maintenance scheduling dialog
    toast({
      title: "Schedule Maintenance",
      description: "This functionality is not implemented yet.",
    })
  }

  const handleTogglePower = () => {
    // In a real app, you would toggle the sensor power
    toast({
      title: sensor.status === "ok" ? "Sensor Deactivated" : "Sensor Activated",
      description: `Sensor ${sensor.serialNumber} has been ${sensor.status === "ok" ? "deactivated" : "activated"}.`,
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <MoreVertical className="h-4 w-4 mr-2" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Sensor Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Sensor
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleScheduleMaintenance}>
            <Wrench className="h-4 w-4 mr-2" />
            Schedule Maintenance
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleTogglePower}>
            {sensor.status === "ok" ? (
              <>
                <PowerOff className="h-4 w-4 mr-2" />
                Deactivate Sensor
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Activate Sensor
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 dark:text-red-400">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Sensor
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this sensor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the sensor {sensor.serialNumber} and all its data. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
