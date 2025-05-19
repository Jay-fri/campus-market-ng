"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
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
import { useAdminEvents, startAdminEventListener } from "@/lib/admin-events"
import { useRouter } from "next/navigation"
import { env } from "@/lib/env"

export default function RealTimeIndicator() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const events = useAdminEvents((state) => state.events)
  const pendingProductCount = useAdminEvents((state) => state.pendingProductCount)
  const pendingReportCount = useAdminEvents((state) => state.pendingReportCount)
  const pendingWithdrawalCount = useAdminEvents((state) => state.pendingWithdrawalCount)
  const markAllSeen = useAdminEvents((state) => state.markAllSeen)
  const resetCounts = useAdminEvents((state) => state.resetCounts)

  // Total notifications count
  const totalCount = pendingProductCount + pendingReportCount + pendingWithdrawalCount

  // Initialize event listener
  useEffect(() => {
    setIsClient(true)

    // Start the event listener with the admin API secret
    const cleanup = startAdminEventListener(env.ADMIN_API_SECRET || "")

    // Fetch initial counts
    const fetchCounts = async () => {
      try {
        const response = await fetch("/api/admin/pending-counts")
        if (response.ok) {
          const data = await response.json()
          resetCounts(data)
        }
      } catch (error) {
        console.error("Error fetching pending counts:", error)
      }
    }

    fetchCounts()

    return cleanup
  }, [resetCounts])

  // Handle navigation to specific sections
  const handleNavigation = (tab: string) => {
    markAllSeen()
    router.push(`/admin?tab=${tab}`)
  }

  if (!isClient) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {totalCount > 99 ? "99+" : totalCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {pendingProductCount > 0 && (
          <DropdownMenuItem onClick={() => handleNavigation("products")}>
            <div className="flex w-full items-center justify-between">
              <span>New products pending approval</span>
              <Badge variant="outline">{pendingProductCount}</Badge>
            </div>
          </DropdownMenuItem>
        )}

        {pendingReportCount > 0 && (
          <DropdownMenuItem onClick={() => handleNavigation("reports")}>
            <div className="flex w-full items-center justify-between">
              <span>New reports pending review</span>
              <Badge variant="outline">{pendingReportCount}</Badge>
            </div>
          </DropdownMenuItem>
        )}

        {pendingWithdrawalCount > 0 && (
          <DropdownMenuItem onClick={() => handleNavigation("withdrawals")}>
            <div className="flex w-full items-center justify-between">
              <span>New withdrawal requests</span>
              <Badge variant="outline">{pendingWithdrawalCount}</Badge>
            </div>
          </DropdownMenuItem>
        )}

        {totalCount === 0 && <div className="py-4 text-center text-sm text-muted-foreground">No new notifications</div>}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={markAllSeen} className="justify-center text-center">
          Mark all as seen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
