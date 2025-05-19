"use client"

import { Textarea } from "@/components/ui/textarea"

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
import { useToast } from "@/components/ui/use-toast"
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
  RefreshCw,
  Download,
  Settings,
  LogOut,
  Menu,
  X,
  AlertTriangle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Add this import at the top
import RealTimeIndicator from "./real-time-indicator"
import { useAdminEvents } from "@/lib/admin-events"
import { startAdminEventListener } from "@/lib/admin-events"

// Types for our data
interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  image?: string
  university?: {
    name: string
  }
}

interface Product {
  id: string
  title: string
  price: number
  status: string
  seller: {
    id: string
    name: string
  }
  category: {
    id: string
    name: string
  }
  createdAt: string
  images: string[]
  description: string
}

interface Report {
  id: string
  reason: string
  status: string
  author: {
    id: string
    name: string
  }
  reportedUser: {
    id: string
    name: string
  }
  product?: {
    id: string
    title: string
  } | null
  createdAt: string
  description: string
}

interface Order {
  id: string
  buyer: {
    id: string
    name: string
  }
  seller: {
    id: string
    name: string
  }
  totalAmount: number
  status: string
  createdAt: string
  orderItems: {
    id: string
    product: {
      id: string
      title: string
    }
    quantity: number
    price: number
  }[]
}

interface Withdrawal {
  id: string
  user: {
    id: string
    name: string
  }
  amount: number
  status: string
  bankName: string
  accountNumber: string
  createdAt: string
}

interface DashboardStats {
  userCount: number
  buyerCount: number
  sellerCount: number
  productCount: number
  pendingProductCount: number
  orderCount: number
  totalSales: number
  reportCount: number
  pendingReportCount: number
}

interface SalesData {
  name: string
  sales: number
}

interface CategoryData {
  name: string
  value: number
}

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
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // State for data
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])

  // State for filters
  const [userFilter, setUserFilter] = useState({ role: "all", status: "all", search: "" })
  const [productFilter, setProductFilter] = useState({ status: "all", category: "all", search: "" })
  const [reportFilter, setReportFilter] = useState({ status: "all", search: "" })
  const [orderFilter, setOrderFilter] = useState({ status: "all", search: "" })
  const [withdrawalFilter, setWithdrawalFilter] = useState({ status: "all", search: "" })

  // State for pagination
  const [userPage, setUserPage] = useState(1)
  const [productPage, setProductPage] = useState(1)
  const [reportPage, setReportPage] = useState(1)
  const [orderPage, setOrderPage] = useState(1)
  const [withdrawalPage, setWithdrawalPage] = useState(1)

  // State for total counts
  const [userTotal, setUserTotal] = useState(0)
  const [productTotal, setProductTotal] = useState(0)
  const [reportTotal, setReportTotal] = useState(0)
  const [orderTotal, setOrderTotal] = useState(0)
  const [withdrawalTotal, setWithdrawalTotal] = useState(0)

  // State for dialogs
  const [rejectDialog, setRejectDialog] = useState({ open: false, type: "", id: "", reason: "" })

  // Refresh function
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Initialize admin events listener
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      const initializeAdminEvents = async () => {
        try {
          // Fetch the admin token securely from the server
          const response = await fetch("/api/admin/get-token")
          if (response.ok) {
            const { token } = await response.json()
            if (token) {
              const cleanup = startAdminEventListener(token)

              // Fetch initial pending counts
              const pendingResponse = await fetch("/api/admin/pending-counts", {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })

              if (pendingResponse.ok) {
                const data = await pendingResponse.json()
                useAdminEvents.getState().resetCounts(data)
              }

              return () => cleanup()
            }
          }
        } catch (error) {
          console.error("Error initializing admin events:", error)
        }
      }

      initializeAdminEvents()
    }
  }, [session])

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-stats")
        if (response.ok) {
          const data = await response.json()
          setDashboardStats(data)
        } else {
          console.error("Failed to fetch dashboard stats")
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      }
    }

    const fetchSalesData = async () => {
      try {
        const response = await fetch("/api/admin/sales-data")
        if (response.ok) {
          const data = await response.json()
          setSalesData(data.salesData)
          setCategoryData(data.categoryData)
        } else {
          console.error("Failed to fetch sales data")
        }
      } catch (error) {
        console.error("Error fetching sales data:", error)
      }
    }

    if (activeTab === "dashboard") {
      fetchDashboardStats()
      fetchSalesData()
    }
  }, [activeTab, refreshTrigger])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: userPage.toString(),
          role: userFilter.role !== "all" ? userFilter.role : "",
          status: userFilter.status !== "all" ? userFilter.status : "",
          search: userFilter.search,
        })

        const response = await fetch(`/api/admin/users?${queryParams}`)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
          setUserTotal(data.total)
        } else {
          console.error("Failed to fetch users")
        }
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab === "users") {
      fetchUsers()
    }
  }, [activeTab, userFilter, userPage, refreshTrigger])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: productPage.toString(),
          status: productFilter.status !== "all" ? productFilter.status : "",
          category: productFilter.category !== "all" ? productFilter.category : "",
          search: productFilter.search,
        })

        const response = await fetch(`/api/admin/products?${queryParams}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products)
          setProductTotal(data.total)
        } else {
          console.error("Failed to fetch products")
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab === "products") {
      fetchProducts()
    }
  }, [activeTab, productFilter, productPage, refreshTrigger])

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: reportPage.toString(),
          status: reportFilter.status !== "all" ? reportFilter.status : "",
          search: reportFilter.search,
        })

        const response = await fetch(`/api/admin/reports?${queryParams}`)
        if (response.ok) {
          const data = await response.json()
          setReports(data.reports)
          setReportTotal(data.total)
        } else {
          console.error("Failed to fetch reports")
        }
      } catch (error) {
        console.error("Error fetching reports:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab === "reports") {
      fetchReports()
    }
  }, [activeTab, reportFilter, reportPage, refreshTrigger])

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: orderPage.toString(),
          status: orderFilter.status !== "all" ? orderFilter.status : "",
          search: orderFilter.search,
        })

        const response = await fetch(`/api/admin/orders?${queryParams}`)
        if (response.ok) {
          const data = await response.json()
          setOrders(data.orders)
          setOrderTotal(data.total)
        } else {
          console.error("Failed to fetch orders")
        }
      } catch (error) {
        console.error("Error fetching orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab === "orders") {
      fetchOrders()
    }
  }, [activeTab, orderFilter, orderPage, refreshTrigger])

  // Fetch withdrawals
  useEffect(() => {
    const fetchWithdrawals = async () => {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: withdrawalPage.toString(),
          status: withdrawalFilter.status !== "all" ? withdrawalFilter.status : "",
          search: withdrawalFilter.search,
        })

        const response = await fetch(`/api/admin/withdrawals?${queryParams}`)
        if (response.ok) {
          const data = await response.json()
          setWithdrawals(data.withdrawals)
          setWithdrawalTotal(data.total)
        } else {
          console.error("Failed to fetch withdrawals")
        }
      } catch (error) {
        console.error("Error fetching withdrawals:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (activeTab === "withdrawals") {
      fetchWithdrawals()
    }
  }, [activeTab, withdrawalFilter, withdrawalPage, refreshTrigger])

  // Handle user activation/deactivation
  const handleUserStatusChange = async (userId: string, activate: boolean) => {
    try {
      const endpoint = activate ? `/api/admin/users/${userId}/activate` : `/api/admin/users/${userId}/deactivate`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: activate ? "User Activated" : "User Deactivated",
          description: activate
            ? "The user has been activated successfully."
            : "The user has been deactivated successfully.",
        })
        refreshData()
      } else {
        toast({
          title: "Error",
          description: "Failed to update user status.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle product approval
  const handleProductApproval = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Product Approved",
          description: "The product has been approved and is now live.",
        })
        // Update the real-time count
        useAdminEvents.getState().decrementPendingProduct()
        refreshData()
      } else {
        toast({
          title: "Error",
          description: "Failed to approve product.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle product rejection
  const handleProductRejection = async () => {
    if (!rejectDialog.reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${rejectDialog.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectDialog.reason }),
      })

      if (response.ok) {
        toast({
          title: "Product Rejected",
          description: "The product has been rejected.",
        })
        setRejectDialog({ open: false, type: "", id: "", reason: "" })
        // Update the real-time count
        useAdminEvents.getState().decrementPendingProduct()
        refreshData()
      } else {
        toast({
          title: "Error",
          description: "Failed to reject product.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle report resolution
  const handleReportResolution = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Report Resolved",
          description: "The report has been marked as resolved.",
        })
        refreshData()
      } else {
        toast({
          title: "Error",
          description: "Failed to resolve report.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle report rejection
  const handleReportRejection = async () => {
    if (!rejectDialog.reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/reports/${rejectDialog.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectDialog.reason }),
      })

      if (response.ok) {
        toast({
          title: "Report Rejected",
          description: "The report has been rejected.",
        })
        setRejectDialog({ open: false, type: "", id: "", reason: "" })
        refreshData()
      } else {
        toast({
          title: "Error",
          description: "Failed to reject report.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle withdrawal approval
  const handleWithdrawalApproval = async (withdrawalId: string) => {
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Withdrawal Approved",
          description: "The withdrawal request has been approved.",
        })
        refreshData()
      } else {
        toast({
          title: "Error",
          description: "Failed to approve withdrawal.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle withdrawal rejection
  const handleWithdrawalRejection = async () => {
    if (!rejectDialog.reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/withdrawals/${rejectDialog.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: rejectDialog.reason }),
      })

      if (response.ok) {
        toast({
          title: "Withdrawal Rejected",
          description: "The withdrawal request has been rejected.",
        })
        setRejectDialog({ open: false, type: "", id: "", reason: "" })
        refreshData()
      } else {
        toast({
          title: "Error",
          description: "Failed to reject withdrawal.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle withdrawal completion
  const handleWithdrawalCompletion = async (withdrawalId: string) => {
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Withdrawal Completed",
          description: "The withdrawal has been marked as completed.",
        })
        refreshData()
      } else {
        toast({
          title: "Error",
          description: "Failed to complete withdrawal.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Handle order status update
  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Order Updated",
          description: `The order status has been updated to ${status}.`,
        })
        refreshData()
      } else {
        toast({
          title: "Error",
          description: "Failed to update order status.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  // Loading state
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
        className="fixed left-4 top-20 z-50 rounded-md bg-primary p-2 text-white md:hidden"
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
                {/* Add the RealTimeIndicator here */}
                <RealTimeIndicator />
                <Button size="sm" variant="outline" onClick={refreshData} disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
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
                    <span className="text-2xl font-bold">{dashboardStats?.userCount || 0}</span>
                    <span className="text-xs text-muted-foreground">
                      {dashboardStats?.buyerCount || 0} buyers, {dashboardStats?.sellerCount || 0} sellers
                    </span>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-row items-center justify-between p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">Total Products</span>
                    <span className="text-2xl font-bold">{dashboardStats?.productCount || 0}</span>
                    <span className="text-xs text-muted-foreground">
                      {dashboardStats?.pendingProductCount || 0} pending approval
                    </span>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-row items-center justify-between p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">Total Orders</span>
                    <span className="text-2xl font-bold">{dashboardStats?.orderCount || 0}</span>
                    <span className="text-xs text-muted-foreground">
                      ₦{(dashboardStats?.totalSales || 0).toLocaleString()} in sales
                    </span>
                  </div>
                  <CreditCard className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-row items-center justify-between p-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">Reports</span>
                    <span className="text-2xl font-bold">{dashboardStats?.reportCount || 0}</span>
                    <span className="text-xs text-muted-foreground">
                      {dashboardStats?.pendingReportCount || 0} pending review
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
                    {salesData.length > 0 ? (
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
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No sales data available</p>
                      </div>
                    )}
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
                    {categoryData.length > 0 ? (
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
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No category data available</p>
                      </div>
                    )}
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
                  {isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                    </div>
                  ) : orders.length > 0 ? (
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
                        {orders.slice(0, 5).map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id.slice(-8)}</TableCell>
                            <TableCell>{order.buyer.name}</TableCell>
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
                  ) : (
                    <div className="flex h-40 items-center justify-center">
                      <p className="text-muted-foreground">No orders found</p>
                    </div>
                  )}
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
                      {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                        </div>
                      ) : products.filter((p) => p.status === "PENDING").length > 0 ? (
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
                            {products
                              .filter((p) => p.status === "PENDING")
                              .slice(0, 3)
                              .map((product) => (
                                <TableRow key={product.id}>
                                  <TableCell className="font-medium">{product.title}</TableCell>
                                  <TableCell>{product.seller.name}</TableCell>
                                  <TableCell>₦{product.price.toLocaleString()}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleProductApproval(product.id)}
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() =>
                                          setRejectDialog({
                                            open: true,
                                            type: "product",
                                            id: product.id,
                                            reason: "",
                                          })
                                        }
                                      >
                                        <XCircle className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex h-40 items-center justify-center">
                          <p className="text-muted-foreground">No pending products</p>
                        </div>
                      )}
                      <div className="mt-4 flex justify-center">
                        <Button variant="outline" size="sm" onClick={() => setActiveTab("products")}>
                          View All Products
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="reports" className="mt-4">
                      {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                        </div>
                      ) : reports.filter((r) => r.status === "PENDING").length > 0 ? (
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
                            {reports
                              .filter((r) => r.status === "PENDING")
                              .slice(0, 3)
                              .map((report) => (
                                <TableRow key={report.id}>
                                  <TableCell className="font-medium">{report.reason}</TableCell>
                                  <TableCell>{report.author.name}</TableCell>
                                  <TableCell>{report.reportedUser.name}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleReportResolution(report.id)}
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() =>
                                          setRejectDialog({
                                            open: true,
                                            type: "report",
                                            id: report.id,
                                            reason: "",
                                          })
                                        }
                                      >
                                        <XCircle className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="flex h-40 items-center justify-center">
                          <p className="text-muted-foreground">No pending reports</p>
                        </div>
                      )}
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
                <Button size="sm" variant="outline" onClick={refreshData} disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
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
                    <Input
                      placeholder="Search users..."
                      className="pl-10"
                      value={userFilter.search}
                      onChange={(e) => setUserFilter({ ...userFilter, search: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setUserPage(1)
                          refreshData()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={userFilter.role}
                      onValueChange={(value) => {
                        setUserFilter({ ...userFilter, role: value })
                        setUserPage(1)
                      }}
                    >
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
                    <Select
                      value={userFilter.status}
                      onValueChange={(value) => {
                        setUserFilter({ ...userFilter, status: value })
                        setUserPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setUserFilter({ role: "all", status: "all", search: "" })
                        setUserPage(1)
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  </div>
                ) : users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>University</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
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
                          <TableCell>{user.university?.name || "N/A"}</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/users/${user.id}`}>View</Link>
                              </Button>
                              {user.isActive ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500"
                                  onClick={() => handleUserStatusChange(user.id, false)}
                                >
                                  Deactivate
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-500"
                                  onClick={() => handleUserStatusChange(user.id, true)}
                                >
                                  Activate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{users.length > 0 ? (userPage - 1) * 10 + 1 : 0}</span> to{" "}
                    <span className="font-medium">{Math.min(userPage * 10, userTotal)}</span> of{" "}
                    <span className="font-medium">{userTotal}</span> users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage((prev) => Math.max(prev - 1, 1))}
                      disabled={userPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserPage((prev) => prev + 1)}
                      disabled={userPage * 10 >= userTotal}
                    >
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
                <Button size="sm" variant="outline" onClick={refreshData} disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
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
                    <Input
                      placeholder="Search products..."
                      className="pl-10"
                      value={productFilter.search}
                      onChange={(e) => setProductFilter({ ...productFilter, search: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setProductPage(1)
                          refreshData()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={productFilter.status}
                      onValueChange={(value) => {
                        setProductFilter({ ...productFilter, status: value })
                        setProductPage(1)
                      }}
                    >
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
                    <Select
                      value={productFilter.category}
                      onValueChange={(value) => {
                        setProductFilter({ ...productFilter, category: value })
                        setProductPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {/* We would fetch categories dynamically here */}
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Stationery">Stationery</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setProductFilter({ status: "all", category: "all", search: "" })
                        setProductPage(1)
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  </div>
                ) : products.length > 0 ? (
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
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.title}</TableCell>
                          <TableCell>₦{product.price.toLocaleString()}</TableCell>
                          <TableCell>{product.seller.name}</TableCell>
                          <TableCell>{product.category.name}</TableCell>
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
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/products/${product.id}`}>View</Link>
                              </Button>
                              {product.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-500"
                                    onClick={() => handleProductApproval(product.id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500"
                                    onClick={() =>
                                      setRejectDialog({
                                        open: true,
                                        type: "product",
                                        id: product.id,
                                        reason: "",
                                      })
                                    }
                                  >
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
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">No products found</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{products.length > 0 ? (productPage - 1) * 10 + 1 : 0}</span>{" "}
                    to <span className="font-medium">{Math.min(productPage * 10, productTotal)}</span> of{" "}
                    <span className="font-medium">{productTotal}</span> products
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage((prev) => Math.max(prev - 1, 1))}
                      disabled={productPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage((prev) => prev + 1)}
                      disabled={productPage * 10 >= productTotal}
                    >
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
                <Button size="sm" variant="outline" onClick={refreshData} disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
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
                    <Input
                      placeholder="Search orders..."
                      className="pl-10"
                      value={orderFilter.search}
                      onChange={(e) => setOrderFilter({ ...orderFilter, search: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setOrderPage(1)
                          refreshData()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={orderFilter.status}
                      onValueChange={(value) => {
                        setOrderFilter({ ...orderFilter, status: value })
                        setOrderPage(1)
                      }}
                    >
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setOrderFilter({ status: "all", search: "" })
                        setOrderPage(1)
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  </div>
                ) : orders.length > 0 ? (
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
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">#{order.id.slice(-8)}</TableCell>
                          <TableCell>{order.buyer.name}</TableCell>
                          <TableCell>{order.seller.name}</TableCell>
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
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/orders/${order.id}`}>View</Link>
                              </Button>
                              {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                                <Select
                                  onValueChange={(value) => handleOrderStatusUpdate(order.id, value)}
                                  defaultValue={order.status}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Update Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="PAID">Paid</SelectItem>
                                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{orders.length > 0 ? (orderPage - 1) * 10 + 1 : 0}</span> to{" "}
                    <span className="font-medium">{Math.min(orderPage * 10, orderTotal)}</span> of{" "}
                    <span className="font-medium">{orderTotal}</span> orders
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderPage((prev) => Math.max(prev - 1, 1))}
                      disabled={orderPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOrderPage((prev) => prev + 1)}
                      disabled={orderPage * 10 >= orderTotal}
                    >
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
                <Button size="sm" variant="outline" onClick={refreshData} disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
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
                    <Input
                      placeholder="Search reports..."
                      className="pl-10"
                      value={reportFilter.search}
                      onChange={(e) => setReportFilter({ ...reportFilter, search: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setReportPage(1)
                          refreshData()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={reportFilter.status}
                      onValueChange={(value) => {
                        setReportFilter({ ...reportFilter, status: value })
                        setReportPage(1)
                      }}
                    >
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setReportFilter({ status: "all", search: "" })
                        setReportPage(1)
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  </div>
                ) : reports.length > 0 ? (
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
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">#{report.id.slice(-8)}</TableCell>
                          <TableCell>{report.reason}</TableCell>
                          <TableCell>{report.author.name}</TableCell>
                          <TableCell>{report.reportedUser.name}</TableCell>
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
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/reports/${report.id}`}>View</Link>
                              </Button>
                              {report.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-500"
                                    onClick={() => handleReportResolution(report.id)}
                                  >
                                    Resolve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500"
                                    onClick={() =>
                                      setRejectDialog({
                                        open: true,
                                        type: "report",
                                        id: report.id,
                                        reason: "",
                                      })
                                    }
                                  >
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
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">No reports found</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{reports.length > 0 ? (reportPage - 1) * 10 + 1 : 0}</span> to{" "}
                    <span className="font-medium">{Math.min(reportPage * 10, reportTotal)}</span> of{" "}
                    <span className="font-medium">{reportTotal}</span> reports
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportPage((prev) => Math.max(prev - 1, 1))}
                      disabled={reportPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportPage((prev) => prev + 1)}
                      disabled={reportPage * 10 >= reportTotal}
                    >
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
                <Button size="sm" variant="outline" onClick={refreshData} disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
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
                    <Input
                      placeholder="Search withdrawals..."
                      className="pl-10"
                      value={withdrawalFilter.search}
                      onChange={(e) => setWithdrawalFilter({ ...withdrawalFilter, search: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setWithdrawalPage(1)
                          refreshData()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={withdrawalFilter.status}
                      onValueChange={(value) => {
                        setWithdrawalFilter({ ...withdrawalFilter, status: value })
                        setWithdrawalPage(1)
                      }}
                    >
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setWithdrawalFilter({ status: "all", search: "" })
                        setWithdrawalPage(1)
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                  </div>
                ) : withdrawals.length > 0 ? (
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
                      {withdrawals.map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="font-medium">#{withdrawal.id.slice(-8)}</TableCell>
                          <TableCell>{withdrawal.user.name}</TableCell>
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
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/withdrawals/${withdrawal.id}`}>View</Link>
                              </Button>
                              {withdrawal.status === "PENDING" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-500"
                                    onClick={() => handleWithdrawalApproval(withdrawal.id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500"
                                    onClick={() =>
                                      setRejectDialog({
                                        open: true,
                                        type: "withdrawal",
                                        id: withdrawal.id,
                                        reason: "",
                                      })
                                    }
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {withdrawal.status === "APPROVED" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWithdrawalCompletion(withdrawal.id)}
                                >
                                  Mark Completed
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex h-40 items-center justify-center">
                    <p className="text-muted-foreground">No withdrawals found</p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium">{withdrawals.length > 0 ? (withdrawalPage - 1) * 10 + 1 : 0}</span> to{" "}
                    <span className="font-medium">{Math.min(withdrawalPage * 10, withdrawalTotal)}</span> of{" "}
                    <span className="font-medium">{withdrawalTotal}</span> withdrawals
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawalPage((prev) => Math.max(prev - 1, 1))}
                      disabled={withdrawalPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWithdrawalPage((prev) => prev + 1)}
                      disabled={withdrawalPage * 10 >= withdrawalTotal}
                    >
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

      {/* Rejection Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ ...rejectDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {rejectDialog.type === "product"
                ? "Reject Product"
                : rejectDialog.type === "report"
                  ? "Reject Report"
                  : "Reject Withdrawal"}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be sent to the{" "}
              {rejectDialog.type === "product" ? "seller" : rejectDialog.type === "report" ? "reporter" : "user"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, type: "", id: "", reason: "" })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectDialog.type === "product") {
                  handleProductRejection()
                } else if (rejectDialog.type === "report") {
                  handleReportRejection()
                } else if (rejectDialog.type === "withdrawal") {
                  handleWithdrawalRejection()
                }
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
