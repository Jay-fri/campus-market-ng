"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Search, RefreshCw, Download, MoreHorizontal, CheckCircle, XCircle, Edit, Trash, Eye, Star } from "lucide-react"

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
  isFeatured?: boolean
  condition: string
  university?: {
    id: string
    name: string
  }
}

export default function ProductsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState("all")

  // Filters
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    search: "",
    university: "all",
    minPrice: "",
    maxPrice: "",
    condition: "all",
  })

  // Dialog states
  const [productActionDialog, setProductActionDialog] = useState({
    open: false,
    type: "",
    productId: "",
    reason: "",
    product: null as Product | null,
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

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          status: filters.status !== "all" ? filters.status : "",
          category: filters.category !== "all" ? filters.category : "",
          search: filters.search,
          university: filters.university !== "all" ? filters.university : "",
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          condition: filters.condition !== "all" ? filters.condition : "",
        })

        if (activeTab === "featured") {
          queryParams.append("featured", "true")
        } else if (activeTab === "pending") {
          queryParams.set("status", "PENDING")
        }

        const response = await fetch(`/api/admin/products?${queryParams}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products)
          setTotalProducts(data.total)
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch products",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [page, filters, activeTab, toast])

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

        // Update product in the list
        setProducts((prevProducts) =>
          prevProducts.map((product) => (product.id === productId ? { ...product, status: "APPROVED" } : product)),
        )
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
    if (!productActionDialog.reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productActionDialog.productId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: productActionDialog.reason }),
      })

      if (response.ok) {
        toast({
          title: "Product Rejected",
          description: "The product has been rejected.",
        })

        // Update product in the list
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === productActionDialog.productId ? { ...product, status: "REJECTED" } : product,
          ),
        )

        setProductActionDialog({ open: false, type: "", productId: "", reason: "", product: null })
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

  // Handle product deletion
  const handleProductDeletion = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Product Deleted",
          description: "The product has been deleted successfully.",
        })

        // Remove product from the list
        setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId))
        setProductActionDialog({ open: false, type: "", productId: "", reason: "", product: null })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product.",
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

  // Handle featuring/unfeaturing product
  const handleFeatureToggle = async (productId: string, feature: boolean) => {
    try {
      const endpoint = feature
        ? `/api/admin/products/${productId}/feature`
        : `/api/admin/products/${productId}/unfeature`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: feature ? "Product Featured" : "Product Unfeatured",
          description: feature
            ? "The product has been added to featured products."
            : "The product has been removed from featured products.",
        })

        // Update product in the list
        setProducts((prevProducts) =>
          prevProducts.map((product) => (product.id === productId ? { ...product, isFeatured: feature } : product)),
        )
      } else {
        toast({
          title: "Error",
          description: `Failed to ${feature ? "feature" : "unfeature"} product.`,
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
      status: "all",
      category: "all",
      search: "",
      university: "all",
      minPrice: "",
      maxPrice: "",
      condition: "all",
    })
    setPage(1)
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Management</h1>
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
          <CardTitle>Product Management</CardTitle>
          <CardDescription>View and manage all products on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Products</TabsTrigger>
              <TabsTrigger value="pending">Pending Approval</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="reported">Reported</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products by title or description..."
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
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="SOLD">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => {
                      setFilters({ ...filters, category: value })
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
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
                  <Button variant="outline" size="icon" onClick={resetFilters}>
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
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 overflow-hidden rounded-md">
                              <Image
                                src={product.images[0] || "/placeholder.svg?height=40&width=40"}
                                alt={product.title}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.svg?height=40&width=40"
                                }}
                              />
                            </div>
                            <div className="font-medium">{product.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/products/${product.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/products/${product.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Product
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {product.status === "PENDING" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleProductApproval(product.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      setProductActionDialog({
                                        open: true,
                                        type: "reject",
                                        productId: product.id,
                                        reason: "",
                                        product,
                                      })
                                    }
                                  >
                                    <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {product.isFeatured ? (
                                <DropdownMenuItem onClick={() => handleFeatureToggle(product.id, false)}>
                                  <Star className="mr-2 h-4 w-4 text-yellow-500" />
                                  Remove from Featured
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleFeatureToggle(product.id, true)}>
                                  <Star className="mr-2 h-4 w-4" />
                                  Add to Featured
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() =>
                                  setProductActionDialog({
                                    open: true,
                                    type: "delete",
                                    productId: product.id,
                                    reason: "",
                                    product,
                                  })
                                }
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Product
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
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{products.length > 0 ? (page - 1) * 10 + 1 : 0}</span> to{" "}
                  <span className="font-medium">{Math.min(page * 10, totalProducts)}</span> of{" "}
                  <span className="font-medium">{totalProducts}</span> products
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
                    disabled={page * 10 >= totalProducts}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              {/* Similar content as "all" tab but with status filter set to PENDING */}
              <div className="text-center py-8">
                <p>Pending approval products will be displayed here</p>
                <Button
                  className="mt-4"
                  onClick={() => setFilters({ ...filters, status: "PENDING" }) && setActiveTab("all")}
                >
                  View Pending Products
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="featured" className="mt-4">
              {/* Similar content as "all" tab but with featured filter */}
              <div className="text-center py-8">
                <p>Featured products will be displayed here</p>
                <Button className="mt-4" onClick={() => setActiveTab("all")}>
                  View All Products
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="reported" className="mt-4">
              {/* Reported products interface */}
              <div className="text-center py-8">
                <p>Reported products will be displayed here</p>
                <Button className="mt-4" onClick={() => setActiveTab("all")}>
                  View All Products
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Product Action Dialog */}
      <Dialog
        open={productActionDialog.open}
        onOpenChange={(open) => !open && setProductActionDialog({ ...productActionDialog, open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {productActionDialog.type === "delete"
                ? "Delete Product"
                : productActionDialog.type === "reject"
                  ? "Reject Product"
                  : "Product Action"}
            </DialogTitle>
            <DialogDescription>
              {productActionDialog.type === "delete"
                ? "Are you sure you want to delete this product? This action cannot be undone."
                : productActionDialog.type === "reject"
                  ? "Please provide a reason for rejecting this product. This will be sent to the seller."
                  : "Please confirm this action."}
            </DialogDescription>
          </DialogHeader>

          {productActionDialog.product && (
            <div className="py-4">
              <div className="mb-4 rounded-md bg-muted p-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md">
                    <Image
                      src={productActionDialog.product.images[0] || "/placeholder.svg?height=64&width=64"}
                      alt={productActionDialog.product.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=64&width=64"
                      }}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{productActionDialog.product.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(productActionDialog.product.price)}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline">{productActionDialog.product.category.name}</Badge>
                      <Badge
                        variant={
                          productActionDialog.product.status === "APPROVED"
                            ? "success"
                            : productActionDialog.product.status === "REJECTED"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {productActionDialog.product.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {productActionDialog.type === "reject" && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Enter the reason for rejecting this product..."
                    value={productActionDialog.reason}
                    onChange={(e) => setProductActionDialog({ ...productActionDialog, reason: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setProductActionDialog({ open: false, type: "", productId: "", reason: "", product: null })
              }
            >
              Cancel
            </Button>
            {productActionDialog.type === "delete" ? (
              <Button variant="destructive" onClick={() => handleProductDeletion(productActionDialog.productId)}>
                Delete Product
              </Button>
            ) : productActionDialog.type === "reject" ? (
              <Button onClick={handleProductRejection}>Reject Product</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
