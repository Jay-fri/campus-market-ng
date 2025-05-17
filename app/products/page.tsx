import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Filter, Search } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface ProductsPageProps {
  searchParams: {
    category?: string
    university?: string
    minPrice?: string
    maxPrice?: string
    condition?: string
    search?: string
    page?: string
  }
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">All Products</h1>
          <p className="text-muted-foreground">Browse all products available on Campus Connect NG</p>
        </div>

        <Suspense fallback={<ProductsLoading />}>
          <ProductsList searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}

async function ProductsList({ searchParams }: ProductsPageProps) {
  const page = Number(searchParams.page) || 1
  const pageSize = 12
  const skip = (page - 1) * pageSize

  // Build filter conditions
  const where: any = {
    status: "APPROVED",
  }

  if (searchParams.category) {
    where.categoryId = searchParams.category
  }

  if (searchParams.university) {
    where.universityId = searchParams.university
  }

  if (searchParams.condition) {
    where.condition = searchParams.condition
  }

  if (searchParams.minPrice || searchParams.maxPrice) {
    where.price = {}

    if (searchParams.minPrice) {
      where.price.gte = Number.parseFloat(searchParams.minPrice)
    }

    if (searchParams.maxPrice) {
      where.price.lte = Number.parseFloat(searchParams.maxPrice)
    }
  }

  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search, mode: "insensitive" } },
      { description: { contains: searchParams.search, mode: "insensitive" } },
    ]
  }

  // Fetch products with filters
  const products = await db.product.findMany({
    where,
    include: {
      category: true,
      university: true,
      seller: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: pageSize,
  })

  // Count total products for pagination
  const totalProducts = await db.product.count({ where })
  const totalPages = Math.ceil(totalProducts / pageSize)

  // Fetch categories and universities for filters
  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  })

  const universities = await db.university.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full sm:w-[300px] pl-8"
              defaultValue={searchParams.search || ""}
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select defaultValue={searchParams.category || ""}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue={searchParams.university || ""}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="University" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue={searchParams.condition || ""}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Condition</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="LIKE_NEW">Like New</SelectItem>
              <SelectItem value="GOOD">Good</SelectItem>
              <SelectItem value="FAIR">Fair</SelectItem>
              <SelectItem value="POOR">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-semibold">No products found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-md">
                  <div className="aspect-square relative">
                    <Image
                      src={product.images[0] || "/placeholder.svg"}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        {product.condition}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{product.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{product.university.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-bold text-lg">{formatCurrency(product.price)}</p>
                      <Badge variant="outline">{product.category.name}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex items-center text-sm text-muted-foreground">
                    <p>Seller: {product.seller.name}</p>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={{
                        pathname: "/products",
                        query: {
                          ...searchParams,
                          page: page - 1,
                        },
                      }}
                    >
                      Previous
                    </Link>
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button key={pageNum} variant={pageNum === page ? "default" : "outline"} size="sm" asChild>
                      <Link
                        href={{
                          pathname: "/products",
                          query: {
                            ...searchParams,
                            page: pageNum,
                          },
                        }}
                      >
                        {pageNum}
                      </Link>
                    </Button>
                  ))}
                </div>
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={{
                        pathname: "/products",
                        query: {
                          ...searchParams,
                          page: page + 1,
                        },
                      }}
                    >
                      Next
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ProductsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="h-full overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Skeleton className="h-4 w-1/2" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
