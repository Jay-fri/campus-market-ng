import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface UniversityPageProps {
  params: {
    id: string
  }
}

export default async function UniversityPage({ params }: UniversityPageProps) {
  const university = await db.university.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!university) {
    notFound()
  }

  const products = await db.product.findMany({
    where: {
      universityId: params.id,
      status: "APPROVED",
    },
    include: {
      category: true,
      seller: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Get top sellers from this university
  const topSellers = await db.user.findMany({
    where: {
      universityId: params.id,
      role: "SELLER",
      sellerVerified: true,
    },
    orderBy: {
      sellerRating: "desc",
    },
    take: 5,
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link href="/universities" className="text-muted-foreground hover:text-foreground">
              Universities
            </Link>
            <span className="text-muted-foreground">/</span>
            <span>{university.name}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h1 className="text-3xl font-bold">{university.name}</h1>
              <div className="flex items-center gap-1 text-muted-foreground mt-2">
                <MapPin className="h-4 w-4" />
                <span>{university.location}</span>
              </div>
              <p className="mt-4">
                Browse products and services from students at {university.name}. Connect with sellers on campus for easy
                meetups and transactions.
              </p>
            </div>
            <div className="aspect-video relative rounded-lg overflow-hidden">
              <Image
                src={university.image || "/placeholder.svg?height=300&width=600"}
                alt={university.name}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {topSellers.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold">Top Sellers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topSellers.map((seller) => (
                <Link key={seller.id} href={`/sellers/${seller.id}`}>
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="relative h-20 w-20 rounded-full overflow-hidden mb-4">
                        <Image
                          src={seller.image || "/placeholder.svg?height=80&width=80"}
                          alt={seller.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h3 className="font-semibold">{seller.name}</h3>
                      <div className="flex items-center gap-1 text-yellow-500 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className={`w-4 h-4 ${
                              i < Math.floor(seller.sellerRating || 0) ? "opacity-100" : "opacity-30"
                            }`}
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">
                          {seller.sellerRating?.toFixed(1) || "No ratings"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Products</h2>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-semibold">No products found</h3>
              <p className="text-muted-foreground mt-1">There are no products from this university yet</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}
