import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MessageCircle, Share2, Flag, CreditCard } from "lucide-react"
import AddToCartButton from "@/components/add-to-cart-button"
import ProductImageGallery from "@/components/product-image-gallery"
import ProductReviews from "@/components/product-reviews"
import RelatedProducts from "@/components/related-products"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <div className="container py-8">
      <Suspense fallback={<ProductLoading />}>
        <ProductDetails id={params.id} />
      </Suspense>
    </div>
  )
}

async function ProductDetails({ id }: { id: string }) {
  const product = await db.product.findUnique({
    where: {
      id,
      status: "APPROVED",
    },
    include: {
      category: true,
      university: true,
      seller: true,
      reviews: {
        include: {
          author: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!product) {
    notFound()
  }

  // Calculate average rating
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, review) => acc + review.rating, 0) / product.reviews.length
      : 0

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductImageGallery images={product.images} title={product.title} />

        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{product.category.name}</Badge>
              <Badge variant="secondary">{product.condition}</Badge>
            </div>
            <h1 className="text-3xl font-bold">{product.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.reviews.length} {product.reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>
            <p className="text-3xl font-bold mt-4">{formatCurrency(product.price)}</p>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">Seller Information</h3>
            <Link
              href={`/sellers/${product.seller.id}`}
              className="flex items-center gap-3 hover:bg-muted p-2 rounded-md transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={product.seller.image || ""} alt={product.seller.name} />
                <AvatarFallback>{product.seller.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{product.seller.name}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= Math.round(product.seller.sellerRating || 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span>{product.seller.sellerRating?.toFixed(1) || "No ratings"}</span>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">University: {product.university.name}</p>
            <p className="text-sm text-muted-foreground">Posted on: {formatDate(product.createdAt)}</p>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <AddToCartButton productId={product.id} />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/checkout">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Buy Now
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/messages/${product.seller.id}`}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message Seller
                </Link>
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/report?productId=${product.id}`}>
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="reviews" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews">Reviews ({product.reviews.length})</TabsTrigger>
          <TabsTrigger value="related">Related Products</TabsTrigger>
        </TabsList>
        <TabsContent value="reviews" className="mt-4">
          <ProductReviews reviews={product.reviews} />
        </TabsContent>
        <TabsContent value="related" className="mt-4">
          <RelatedProducts
            categoryId={product.categoryId}
            universityId={product.universityId}
            currentProductId={product.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square w-full rounded-lg" />

        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="flex items-center gap-2 mt-2">
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-32 mt-4" />
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <div className="flex items-center gap-3 p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24 mt-1" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  )
}
