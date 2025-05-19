"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  RefreshCw,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Edit,
  Trash,
  Mail,
  AlertTriangle,
  Eye,
} from "lucide-react"

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
  isVerified?: boolean
  phone?: string
  lastLogin?: string
}

export default function UsersPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState("all")

  // Filters
  const [filters, setFilters] = useState({
    role: searchParams.get("role") || "all",
    status: "all",
    search: "",
    university: "all",
    verified: "all",
  })

  // Dialog states
  const [userActionDialog, setUserActionDialog] = useState({
    open: false,
    type: "",
    userId: "",
    reason: "",
    user: null as User | null,
  })

  // Format date
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

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          role: filters.role !== "all" ? filters.role : "",
          status: filters.status !== "all" ? filters.status : "",
          search: filters.search,
          university: filters.university !== "all" ? filters.university : "",
          verified: filters.verified !== "all" ? filters.verified : "",
        })

        const response = await fetch(`/api/admin/users?${queryParams}`)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
          setTotalUsers(data.total)
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch users",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [page, filters, toast])

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

        // Update user in the list
        setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, isActive: activate } : user)))
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

  // Handle user verification
  const handleUserVerification = async (userId: string, verify: boolean) => {
    try {
      const endpoint = verify ? `/api/admin/users/${userId}/verify` : `/api/admin/users/${userId}/unverify`
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: verify ? "User Verified" : "User Verification Removed",
          description: verify
            ? "The user has been verified successfully."
            : "The user's verification has been removed.",
        })

        // Update user in the list
        setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, isVerified: verify } : user)))
      } else {
        toast({
          title: "Error",
          description: "Failed to update user verification status.",
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

  // Handle user deletion
  const handleUserDeletion = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "User Deleted",
          description: "The user has been deleted successfully.",
        })

        // Remove user from the list
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId))
        setUserActionDialog({ open: false, type: "", userId: "", reason: "", user: null })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user.",
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

  // Handle user warning
  const handleUserWarning = async () => {
    if (!userActionDialog.reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the warning.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userActionDialog.userId}/warn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: userActionDialog.reason }),
      })

      if (response.ok) {
        toast({
          title: "Warning Sent",
          description: "The warning has been sent to the user.",
        })
        setUserActionDialog({ open: false, type: "", userId: "", reason: "", user: null })
      } else {
        toast({
          title: "Error",
          description: "Failed to send warning.",
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

  // Reset filters
  const resetFilters = () => {
    setFilters({
      role: "all",
      status: "all",
      search: "",
      university: "all",
      verified: "all",
    })
    setPage(1)
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={() => window.location.reload()} disabled={isLoading}>
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
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all users on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="buyers">Buyers</TabsTrigger>
              <TabsTrigger value="sellers">Sellers</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setPage(1)
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filters.role}
                    onValueChange={(value) => {
                      setFilters({ ...filters, role: value })
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
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
                    value={filters.status}
                    onValueChange={(value) => {
                      setFilters({ ...filters, status: value })
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={resetFilters}>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/users/${user.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit User
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.isActive ? (
                                <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, false)}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUserStatusChange(user.id, true)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  setUserActionDialog({
                                    open: true,
                                    type: "warn",
                                    userId: user.id,
                                    reason: "",
                                    user,
                                  })
                                }
                              >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Send Warning
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/messages/new?userId=${user.id}`}>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Message User
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  setUserActionDialog({
                                    open: true,
                                    type: "delete",
                                    userId: user.id,
                                    reason: "",
                                    user,
                                  })
                                }
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                  Showing <span className="font-medium">{users.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to{" "}
                  <span className="font-medium">{Math.min(page * 10, totalUsers)}</span> of{" "}
                  <span className="font-medium">{totalUsers}</span> users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={page * 10 >= totalUsers}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="buyers" className="mt-4">
              {/* Similar content as "all" tab but with role filter set to BUYER */}
              <div className="text-center py-8">
                <p>Buyer management interface will be displayed here</p>
                <Button
                  className="mt-4"
                  onClick={() => setFilters({ ...filters, role: "BUYER" }) && setActiveTab("all")}
                >
                  View Buyers
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="sellers" className="mt-4">
              {/* Similar content as "all" tab but with role filter set to SELLER */}
              <div className="text-center py-8">
                <p>Seller management interface will be displayed here</p>
                <Button
                  className="mt-4"
                  onClick={() => setFilters({ ...filters, role: "SELLER" }) && setActiveTab("all")}
                >
                  View Sellers
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="verification" className="mt-4">
              {/* Verification requests interface */}
              <div className="text-center py-8">
                <p>Verification requests interface will be displayed here</p>
                <Button
                  className="mt-4"
                  onClick={() => setFilters({ ...filters, role: "SELLER", verified: "pending" }) && setActiveTab("all")}
                >
                  View Pending Verifications
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Action Dialog */}
      <Dialog
        open={userActionDialog.open}
        onOpenChange={(open) => !open && setUserActionDialog({ ...userActionDialog, open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userActionDialog.type === "delete"
                ? "Delete User"
                : userActionDialog.type === "warn"
                  ? "Send Warning"
                  : "User Action"}
            </DialogTitle>
            <DialogDescription>
              {userActionDialog.type === "delete"
                ? "Are you sure you want to delete this user? This action cannot be undone."
                : userActionDialog.type === "warn"
                  ? "Send a warning notification to this user. Please provide a reason."
                  : "Please confirm this action."}
            </DialogDescription>
          </DialogHeader>

          {userActionDialog.user && (
            <div className="py-4">
              <div className="mb-4 rounded-md bg-muted p-4">
                <div className="font-medium">{userActionDialog.user.name}</div>
                <div className="text-sm text-muted-foreground">{userActionDialog.user.email}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline">{userActionDialog.user.role}</Badge>
                  {userActionDialog.user.isActive ? (
                    <Badge variant="success" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>

              {userActionDialog.type === "warn" && (
                <div className="space-y-2">
                  <Label htmlFor="warning-reason">Warning Reason</Label>
                  <Textarea
                    id="warning-reason"
                    placeholder="Enter the reason for this warning..."
                    value={userActionDialog.reason}
                    onChange={(e) => setUserActionDialog({ ...userActionDialog, reason: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserActionDialog({ open: false, type: "", userId: "", reason: "", user: null })}
            >
              Cancel
            </Button>
            {userActionDialog.type === "delete" ? (
              <Button variant="destructive" onClick={() => handleUserDeletion(userActionDialog.userId)}>
                Delete User
              </Button>
            ) : userActionDialog.type === "warn" ? (
              <Button onClick={handleUserWarning}>Send Warning</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
