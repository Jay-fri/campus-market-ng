import { redirect } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, Package, CreditCard, MessageSquare, Star, Info } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/notifications")
  }

  const notifications = await db.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Mark all notifications as read
  await db.notification.updateMany({
    where: {
      userId: session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your activity on Campus Connect NG</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>Your recent notifications and updates</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No notifications</h3>
                <p className="text-muted-foreground mt-1">You don't have any notifications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatDate(notification.createdAt)}</p>
                    </div>
                    {notification.link && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={notification.link}>View</Link>
                      </Button>
                    )}
                    {!notification.isRead && <Badge className="ml-auto">New</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "ORDER":
      return <Package className="h-5 w-5 text-primary" />
    case "PAYMENT":
      return <CreditCard className="h-5 w-5 text-primary" />
    case "MESSAGE":
      return <MessageSquare className="h-5 w-5 text-primary" />
    case "REVIEW":
      return <Star className="h-5 w-5 text-primary" />
    case "SYSTEM":
      return <Bell className="h-5 w-5 text-primary" />
    default:
      return <Info className="h-5 w-5 text-primary" />
  }
}
