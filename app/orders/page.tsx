import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingBag, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function OrdersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/orders")
  }

  // Fetch orders for the current user
  const orders = await db.order.findMany({
    where: {
      buyerId: session.user.id,
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
  })

  // Group orders by status
  const pendingOrders = orders.filter((order) => ["PENDING", "PAID", "SHIPPED"].includes(order.status))
  const completedOrders = orders.filter((order) => ["DELIVERED", "COMPLETED"].includes(order.status))
  const cancelledOrders = orders.filter((order) => ["CANCELLED", "REFUNDED"].includes(order.status))

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your purchases</p>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            <OrdersList orders={orders} />
          </TabsContent>
          <TabsContent value="pending" className="mt-6">
            <OrdersList orders={pendingOrders} />
          </TabsContent>
          <TabsContent value="completed" className="mt-6">
            <OrdersList orders={completedOrders} />
          </TabsContent>
          <TabsContent value="cancelled" className="mt-6">
            <OrdersList orders={cancelledOrders} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function OrdersList({ orders }: { orders: any[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No orders found</h3>
        <p className="text-muted-foreground mt-1">You don't have any orders in this category</p>
        <Button className="mt-4" asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg">Order #{order.id.slice(-8)}</CardTitle>
                <CardDescription>Placed on {formatDate(order.createdAt)}</CardDescription>
              </div>
              <Badge className={getOrderStatusColor(order.status)}>{order.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Seller: <span className="font-medium">{order.seller.name}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Items: {order.orderItems.length} {order.orderItems.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <p className="font-bold">{formatCurrency(order.totalAmount)}</p>
              </div>

              <Separator />

              <div className="space-y-4">
                {order.orderItems.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                      <Image
                        src={item.product.images[0] || "/placeholder.svg"}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <Link href={`/products/${item.product.id}`} className="font-medium hover:text-primary">
                        {item.product.title}
                      </Link>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-medium">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                {["DELIVERED"].includes(order.status) && (
                  <Button variant="outline" className="text-green-600">
                    Mark as Received
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link href={`/orders/${order.id}`}>
                    View Details
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getOrderStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "PAID":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case "SHIPPED":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100"
    case "DELIVERED":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100"
    case "COMPLETED":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    case "CANCELLED":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    case "REFUNDED":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    default:
      return ""
  }
}
