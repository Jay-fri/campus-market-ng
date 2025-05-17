import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Bell, CreditCard, Package, ShoppingBag, Star, MessageSquare, Clock, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/dashboard")
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      university: true,
    },
  })

  if (!user) {
    redirect("/login")
  }

  // Fetch recent orders for buyer
  const recentOrders = await db.order.findMany({
    where: {
      buyerId: user.id,
    },
    include: {
      seller: true,
      orderItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  })

  // Fetch wallet
  const wallet = await db.wallet.findUnique({
    where: {
      userId: user.id,
    },
  })

  // Fetch recent notifications
  const notifications = await db.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  })

  // Fetch unread messages count
  const unreadMessagesCount = await db.message.count({
    where: {
      receiverId: user.id,
      isRead: false,
    },
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Wallet Balance</span>
                <span className="text-2xl font-bold">{formatCurrency(wallet?.balance || 0)}</span>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Orders</span>
                <span className="text-2xl font-bold">{recentOrders.length}</span>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Messages</span>
                <span className="text-2xl font-bold">{unreadMessagesCount}</span>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Notifications</span>
                <span className="text-2xl font-bold">{notifications.length}</span>
              </div>
              <Bell className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your recent purchases on Campus Connect NG</CardDescription>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No orders yet</h3>
                    <p className="text-muted-foreground mt-1">Start shopping to see your orders here</p>
                    <Button className="mt-4" asChild>
                      <Link href="/products">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="rounded-lg border p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                              <Badge>{order.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Placed on {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/orders/${order.id}`}>
                                View Details
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="text-sm">
                          <p>
                            Seller: <span className="font-medium">{order.seller.name}</span>
                          </p>
                          <p className="mt-1">
                            Items: {order.orderItems.length} {order.orderItems.length === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center mt-4">
                      <Button variant="outline" asChild>
                        <Link href="/orders">View All Orders</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Your recent notifications</CardDescription>
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
                        {!notification.isRead && <Badge className="ml-auto">New</Badge>}
                      </div>
                    ))}
                    <div className="flex justify-center mt-4">
                      <Button variant="outline" asChild>
                        <Link href="/notifications">View All Notifications</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your personal information and settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                      <p className="mt-1">{user.name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                      <p className="mt-1">{user.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                      <p className="mt-1">{user.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">University</h3>
                      <p className="mt-1">{user.university?.name || "Not specified"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Account Type</h3>
                      <p className="mt-1">{user.role}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                      <p className="mt-1">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button asChild>
                      <Link href="/profile/edit">Edit Profile</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
      return <Clock className="h-5 w-5 text-primary" />
  }
}
