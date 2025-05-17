import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BarChart3, CreditCard, Package, Plus, ShoppingBag, Star, Store, Truck, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SellerDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/seller")
  }

  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    redirect("/dashboard")
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

  // Fetch seller products
  const products = await db.product.findMany({
    where: {
      sellerId: user.id,
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Fetch recent sales
  const recentSales = await db.order.findMany({
    where: {
      sellerId: user.id,
    },
    include: {
      buyer: true,
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

  // Calculate statistics
  const totalProducts = products.length
  const pendingProducts = products.filter((product) => product.status === "PENDING").length
  const approvedProducts = products.filter((product) => product.status === "APPROVED").length
  const totalSales = recentSales.reduce((acc, order) => acc + order.totalAmount, 0)

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-muted-foreground">Manage your products and sales</p>
          </div>
          <Button asChild>
            <Link href="/seller/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Product
            </Link>
          </Button>
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
                <span className="text-muted-foreground text-sm">Total Products</span>
                <span className="text-2xl font-bold">{totalProducts}</span>
              </div>
              <Store className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Total Sales</span>
                <span className="text-2xl font-bold">{formatCurrency(totalSales)}</span>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Seller Rating</span>
                <span className="text-2xl font-bold">{user.sellerRating?.toFixed(1) || "N/A"}</span>
              </div>
              <Star className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="products">My Products</TabsTrigger>
            <TabsTrigger value="sales">Recent Sales</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Products</CardTitle>
                <CardDescription>Manage your product listings</CardDescription>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No products yet</h3>
                    <p className="text-muted-foreground mt-1">Start adding products to your store</p>
                    <Button className="mt-4" asChild>
                      <Link href="/seller/products/new">Add New Product</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{totalProducts} Total</Badge>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {pendingProducts} Pending
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {approvedProducts} Approved
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/seller/products">View All Products</Link>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.slice(0, 6).map((product) => (
                        <Card key={product.id} className="overflow-hidden">
                          <div className="aspect-video relative">
                            <Image
                              src={product.images[0] || "/placeholder.svg"}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge
                                variant="secondary"
                                className={`bg-background/80 backdrop-blur-sm ${
                                  product.status === "PENDING"
                                    ? "text-yellow-600"
                                    : product.status === "APPROVED"
                                      ? "text-green-600"
                                      : "text-red-600"
                                }`}
                              >
                                {product.status}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                            <div className="flex items-center justify-between mt-2">
                              <p className="font-bold">{formatCurrency(product.price)}</p>
                              <Badge variant="outline">{product.category.name}</Badge>
                            </div>
                            <div className="flex justify-end mt-4">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/seller/products/${product.id}`}>
                                  Manage
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="sales" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>Track your recent orders and shipments</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No sales yet</h3>
                    <p className="text-muted-foreground mt-1">
                      Your sales will appear here once customers place orders
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSales.map((order) => (
                      <div key={order.id} className="rounded-lg border p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                              <Badge>{order.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Ordered on {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/seller/orders/${order.id}`}>
                                View Details
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="text-sm">
                          <p>
                            Buyer: <span className="font-medium">{order.buyer.name}</span>
                          </p>
                          <p className="mt-1">
                            Items: {order.orderItems.length} {order.orderItems.length === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center mt-4">
                      <Button variant="outline" asChild>
                        <Link href="/seller/orders">View All Orders</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="earnings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings & Withdrawals</CardTitle>
                <CardDescription>Manage your earnings and withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-sm font-medium text-muted-foreground">Available Balance</h3>
                        <p className="text-2xl font-bold mt-2">{formatCurrency(wallet?.balance || 0)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-sm font-medium text-muted-foreground">Pending Payments</h3>
                        <p className="text-2xl font-bold mt-2">{formatCurrency(0)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Withdrawn</h3>
                        <p className="text-2xl font-bold mt-2">{formatCurrency(0)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end">
                    <Button asChild>
                      <Link href="/seller/wallet/withdraw">Withdraw Funds</Link>
                    </Button>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                    <div className="rounded-lg border">
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No transactions yet</h3>
                        <p className="text-muted-foreground mt-1">
                          Your transaction history will appear here once you make sales
                        </p>
                      </div>
                    </div>
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
