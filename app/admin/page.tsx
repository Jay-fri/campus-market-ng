"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  Users,
  ShoppingBag,
  CreditCard,
  Flag,
  BarChart3,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"

// Mock data for demonstration
const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "BUYER",
    isActive: true,
    createdAt: "2023-05-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "SELLER",
    isActive: true,
    createdAt: "2023-05-10T09:30:00Z",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "BUYER",
    isActive: false,
    createdAt: "2023-05-05T14:20:00Z",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
    role: "SELLER",
    isActive: true,
    createdAt: "2023-05-01T11:45:00Z",
  },
  {
    id: "5",
    name: "Charlie Wilson",
    email: "charlie@example.com",
    role: "BUYER",
    isActive: true,
    createdAt: "2023-04-28T16:15:00Z",
  },
]

const mockProducts = [
  {
    id: "1",
    title: "Textbook: Introduction to Economics",
    price: 2500,
    status: "PENDING",
    seller: "Jane Smith",
    category: "Books",
    createdAt: "2023-05-14T08:30:00Z",
  },
  {
    id: "2",
    title: "HP Laptop - 8GB RAM, 256GB SSD",
    price: 120000,
    status: "APPROVED",
    seller: "Alice Brown",
    category: "Electronics",
    createdAt: "2023-05-12T10:15:00Z",
  },
  {
    id: "3",
    title: "Scientific Calculator",
    price: 5000,
    status: "PENDING",
    seller: "Jane Smith",
    category: "Electronics",
    createdAt: "2023-05-10T14:45:00Z",
  },
  {
    id: "4",
    title: "Engineering Drawing Set",
    price: 3500,
    status: "REJECTED",
    seller: "Alice Brown",
    category: "Stationery",
    createdAt: "2023-05-08T09:20:00Z",
  },
  {
    id: "5",
    title: "Room Furniture Set",
    price: 45000,
    status: "APPROVED",
    seller: "Jane Smith",
    category: "Furniture",
    createdAt: "2023-05-05T11:30:00Z",
  },
]

const mockReports = [
  {
    id: "1",
    reason: "Fake product",
    status: "PENDING",
    author: "John Doe",
    reportedUser: "Jane Smith",
    product: "Textbook: Introduction to Economics",
    createdAt: "2023-05-15T09:45:00Z",
  },
  {
    id: "2",
    reason: "Inappropriate content",
    status: "RESOLVED",
    author: "Alice Brown",
    reportedUser: "Bob Johnson",
    product: null,
    createdAt: "2023-05-12T14:30:00Z",
  },
  {
    id: "3",
    reason: "Scam attempt",
    status: "PENDING",
    author: "Charlie Wilson",
    reportedUser: "Jane Smith",
    product: "HP Laptop - 8GB RAM, 256GB SSD",
    createdAt: "2023-05-10T11:15:00Z",
  },
  {
    id: "4",
    reason: "Misleading description",
    status: "REJECTED",
    author: "John Doe",
    reportedUser: "Alice Brown",
    product: "Scientific Calculator",
    createdAt: "2023-05-08T16:20:00Z",
  },
  {
    id: "5",
    reason: "Counterfeit item",
    status: "PENDING",
    author: "Bob Johnson",
    reportedUser: "Jane Smith",
    product: "Engineering Drawing Set",
    createdAt: "2023-05-05T10:30:00Z",
  },
]

const mockOrders = [
  {
    id: "1",
    buyer: "John Doe",
    seller: "Jane Smith",
    totalAmount: 2500,
    status: "COMPLETED",
    createdAt: "2023-05-15T10:30:00Z",
    items: [{ product: "Textbook: Introduction to Economics", quantity: 1, price: 2500 }],
  },
  {
    id: "2",
    buyer: "Charlie Wilson",
    seller: "Alice Brown",
    totalAmount: 120000,
    status: "PAID",
    createdAt: "2023-05-14T09:15:00Z",
    items: [{ product: "HP Laptop - 8GB RAM, 256GB SSD", quantity: 1, price: 120000 }],
  },
  {
    id: "3",
    buyer: "Bob Johnson",
    seller: "Jane Smith",
    totalAmount: 5000,
    status: "SHIPPED",
    createdAt: "2023-05-12T14:45:00Z",
    items: [{ product: "Scientific Calculator", quantity: 1, price: 5000 }],
  },
  {
    id: "4",
    buyer: "John Doe",
    seller: "Alice Brown",
    totalAmount: 3500,
    status: "DELIVERED",
    createdAt: "2023-05-10T11:30:00Z",
    items: [{ product: "Engineering Drawing Set", quantity: 1, price: 3500 }],
  },
  {
    id: "5",
    buyer: "Charlie Wilson",
    seller: "Jane Smith",
    totalAmount: 45000,
    status: "CANCELLED",
    createdAt: "2023-05-08T16:15:00Z",
    items: [{ product: "Room Furniture Set", quantity: 1, price: 45000 }],
  },
]

const mockWithdrawals = [
  {
    id: "1",
    user: "Jane Smith",
    amount: 2375,
    status: "PENDING",
    bankName: "GTBank",
    accountNumber: "0123456789",
    createdAt: "2023-05-15T11:30:00Z",
  },
  {
    id: "2",
    user: "Alice Brown",
    amount: 114000,
    status: "APPROVED",
    bankName: "First Bank",
    accountNumber: "9876543210",
    createdAt: "2023-05-13T10:15:00Z",
  },
  {
    id: "3",
    user: "Jane Smith",
    amount: 4750,
    status: "COMPLETED",
    bankName: "GTBank",
    accountNumber: "0123456789",
    createdAt: "2023-05-10T15:45:00Z",
  },
  {
    id: "4",
    user: "Alice Brown",
    amount: 3325,
    status: "REJECTED",
    bankName: "First Bank",
    accountNumber: "9876543210",
    createdAt: "2023-05-08T09:30:00Z",
  },
  {
    id: "5",
    user: "Jane Smith",
    amount: 42750,
    status: "PENDING",
    bankName: "GTBank",
    accountNumber: "0123456789",
    createdAt: "2023-05-05T14:20:00Z",
  },
]

// Sales data for charts
const salesData = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 5000 },
  { name: "Apr", sales: 2780 },
  { name: "May", sales: 1890 },
  { name: "Jun", sales: 2390 },
]

const categoryData = [
  { name: "Books", value: 35 },
  { name: "Electronics", value: 25 },
  { name: "Furniture", value: 15 },
  { name: "Clothing", value: 10 },
  { name: "Stationery", value: 15 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile menu button */}
      <button
        className="fixed left-4 top-4 z-50 rounded-md bg-primary p-2 text-white md:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-card shadow-lg transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-center border-b p-6">
            <h1 className="text-xl font-bold">Campus Connect NG</h1>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-2">
              <Button
                variant={activeTab === "dashboard" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("dashboard")}
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === "users" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("users")}
              >
                <Users className="mr-2 h-5 w-5" />
                Users
              </Button>
              <Button
                variant={activeTab === "products" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("products")}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Products
              </Button>
              <Button
                variant={activeTab === "orders" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("orders")}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Orders
              </Button>
              <Button
                variant={activeTab === "reports" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("reports")}
              >
                <Flag className="mr-2 h-5 w-5" />
                Reports
              </Button>
              <Button
                variant={activeTab === "withdrawals" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("withdrawals")}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Withdrawals
              </Button>
              <Button
                variant={activeTab === "settings" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </Button>
            </nav>
          </div>

          <div className="border-t p-4">
            <div className="mb-4 flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary text-center text-white flex items-center justify-center">
                {session?.user?.name?.charAt(0) || "A"}
              </div>
              <div className="ml-3">
                <p className="font-medium">{session?.user?.name || "Admin"}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email || "admin@example.com"}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/api/auth/signout">
                <LogOut className="mr-2 h-5 w-5" />
                Log out
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex flex-row items-center justify-between p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">Total Users</span>
                    <span className="text-2xl font-bold">{mockUsers.length}</span>
                    <span className="text-xs text-muted-foreground">
                      {mockUsers.filter((u) => u.role === "BUYER").length} buyers,{" "}
                      {mockUsers.filter((u) => u.role === "SELLER").length} sellers
                    </span>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-row items-center justify-between p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">Total Products</span>
                    <span className="text-2xl font-bold">{mockProducts.length}</span>
                    <span className="text-xs text-muted-foreground">
                      {mockProducts.filter((p) => p.status === "PENDING").length} pending approval
                    </span>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-row items-center justify-between p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">Total Orders</span>
                    <span className="text-2xl font-bold">{mockOrders.length}</span>
                    <span className="text-xs text-muted-foreground">
                      ₦{mockOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()} in sales
                    </span>
                  </div>
                  <CreditCard className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-row items-center justify-between p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">Reports</span>
                    <span className="text-2xl font-bold">{mockReports.length}</span>
                    <span className="text-xs text-muted-foreground">
                      {mockReports.filter((r) => r.status === "PENDING").length} pending review
                    </span>
                  </div>
                  <Flag className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>Monthly sales performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₦${value}`, "Sales"]} />
                        <Legend />
                        <Bar dataKey="sales" fill="#8884d8" name="Sales (₦)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Categories</CardTitle>
                  <CardDescription>Distribution by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest transactions on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Buyer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockOrders.slice(0, 5).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id}</TableCell>
                          <TableCell>{order.buyer}</TableCell>
                          <TableCell>₦{order.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                order.status === "COMPLETED"
                                  ? "success"
                                  : order.status === "CANCELLED"
                                    ? "destructive"
                                    : "outline"
                              }
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("orders")}>
                      View All Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>Items waiting for admin action</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="products">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="products">Products</TabsTrigger>
                      <TabsTrigger value="reports">Reports</TabsTrigger>
                    </TabsList>
                    <TabsContent value="products" className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Seller</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockProducts
                            .filter((p) => p.status === "PENDING")
                            .slice(0, 3)
                            .map((product) => (
                              <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.title}</TableCell>
                                <TableCell>{product.seller}</TableCell>
                                <TableCell>₦{product.price.toLocaleString()}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      <div className="mt-4 flex justify-center">
                        <Button variant="outline" size="sm" onClick={() => setActiveTab("products")}>
                          View All Products
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="reports" className="mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Reason</TableHead>
                            <TableHead>Reported By</TableHead>
                            <TableHead>Reported User</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockReports
                            .filter((r) => r.status === "PENDING")
                            .slice(0, 3)
                            .map((report) => (
                              <TableRow key={report.id}>
                                <TableCell className="font-medium">{report.reason}</TableCell>
                                <TableCell>{report.author}</TableCell>
                                <TableCell>{report.reportedUser}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      <div className="mt-4 flex justify-center">
                        <Button variant="outline" size="sm" onClick={() => setActiveTab("reports")}>
                          View All Reports
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">User Management</h1>
              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user accounts on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-10" />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="BUYER">Buyers</SelectItem>
                        <SelectItem value="SELLER">Sellers</SelectItem>
                        <SelectItem value="ADMIN">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="success" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            {user.isActive ? (
                              <Button variant="outline" size="sm" className="text-red-500">
                                Deactivate
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" className="text-green-500">
                                Activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{" "}
                    <span className="font-medium">20</span> users
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Product Management</h1>
              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Products</CardTitle>
                <CardDescription>Manage product listings on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search products..." className="pl-10" />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="SOLD">Sold</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Stationery">Stationery</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Listed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell>₦{product.price.toLocaleString()}</TableCell>
                        <TableCell>{product.seller}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === "APPROVED"
                                ? "success"
                                : product.status === "REJECTED"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(product.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            {product.status === "PENDING" && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-500">
                                  Approve
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-500">
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{" "}
                    <span className="font-medium">15</span> products
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Order Management</h1>
              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>Manage orders on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search orders..." className="pl-10" />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.id}</TableCell>
                        <TableCell>{order.buyer}</TableCell>
                        <TableCell>{order.seller}</TableCell>
                        <TableCell>₦{order.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "COMPLETED"
                                ? "success"
                                : order.status === "CANCELLED"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                              <Button variant="outline" size="sm">
                                Update Status
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{" "}
                    <span className="font-medium">12</span> orders
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Report Management</h1>
              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Reports</CardTitle>
                <CardDescription>Manage user and product reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search reports..." className="pl-10" />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Reported User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">#{report.id}</TableCell>
                        <TableCell>{report.reason}</TableCell>
                        <TableCell>{report.author}</TableCell>
                        <TableCell>{report.reportedUser}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              report.status === "RESOLVED"
                                ? "success"
                                : report.status === "REJECTED"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(report.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            {report.status === "PENDING" && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-500">
                                  Resolve
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-500">
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{" "}
                    <span className="font-medium">10</span> reports
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Withdrawals */}
        {activeTab === "withdrawals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Withdrawal Management</h1>
              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Withdrawal Requests</CardTitle>
                <CardDescription>Manage seller withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search withdrawals..." className="pl-10" />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Withdrawal ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockWithdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id}>
                        <TableCell className="font-medium">#{withdrawal.id}</TableCell>
                        <TableCell>{withdrawal.user}</TableCell>
                        <TableCell>₦{withdrawal.amount.toLocaleString()}</TableCell>
                        <TableCell>{withdrawal.bankName}</TableCell>
                        <TableCell>
                          {withdrawal.accountNumber.slice(0, 3)}
                          {"****"}
                          {withdrawal.accountNumber.slice(-3)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              withdrawal.status === "COMPLETED" || withdrawal.status === "APPROVED"
                                ? "success"
                                : withdrawal.status === "REJECTED"
                                  ? "destructive"
                                  : "outline"
                            }
                          >
                            {withdrawal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            {withdrawal.status === "PENDING" && (
                              <>
                                <Button variant="outline" size="sm" className="text-green-500">
                                  Approve
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-500">
                                  Reject
                                </Button>
                              </>
                            )}
                            {withdrawal.status === "APPROVED" && (
                              <Button variant="outline" size="sm">
                                Mark Completed
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{" "}
                    <span className="font-medium">8</span> withdrawals
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">System Settings</h1>
              <div className="flex items-center gap-4">
                <Button size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>Configure general platform settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name">Platform Name</Label>
                    <Input id="platform-name" defaultValue="Campus Connect NG" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-email">Support Email</Label>
                    <Input id="platform-email" defaultValue="support@campusconnect.ng" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-phone">Support Phone</Label>
                    <Input id="platform-phone" defaultValue="+234 800 123 4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-currency">Currency</Label>
                    <Select defaultValue="NGN">
                      <SelectTrigger id="platform-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                        <SelectItem value="USD">US Dollar ($)</SelectItem>
                        <SelectItem value="GBP">British Pound (£)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Save Platform Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fee Settings</CardTitle>
                  <CardDescription>Configure platform fees and charges</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-fee">Transaction Fee (%)</Label>
                    <Input id="transaction-fee" type="number" defaultValue="2.5" min="0" max="100" step="0.1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawal-fee">Withdrawal Fee (₦)</Label>
                    <Input id="withdrawal-fee" type="number" defaultValue="100" min="0" step="10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-withdrawal">Minimum Withdrawal Amount (₦)</Label>
                    <Input id="min-withdrawal" type="number" defaultValue="1000" min="0" step="100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="escrow-period">Escrow Period (days)</Label>
                    <Input id="escrow-period" type="number" defaultValue="3" min="1" max="30" step="1" />
                  </div>
                  <Button className="w-full">Save Fee Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>Configure system notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send email notifications to users</p>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        id="email-notifications"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        defaultChecked
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send SMS notifications for important updates</p>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        id="sms-notifications"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        defaultChecked
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show notifications within the application</p>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        id="in-app-notifications"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        defaultChecked
                      />
                    </div>
                  </div>
                  <Button className="w-full">Save Notification Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure platform security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        id="two-factor"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        defaultChecked
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="seller-verification">Seller Verification</Label>
                      <p className="text-sm text-muted-foreground">Require ID verification for sellers</p>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        id="seller-verification"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        defaultChecked
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input id="session-timeout" type="number" defaultValue="60" min="5" max="1440" step="5" />
                  </div>
                  <Button className="w-full">Save Security Settings</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
