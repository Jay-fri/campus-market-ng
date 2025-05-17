import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface CategoryPageProps {
  params: {
    id: string
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await db.category.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!category) {
    notFound()
  }

  const products = await db.product.findMany({
    where: {
      categoryId: params.id,
      status: "APPROVED",
    },
    include: {
      university: true,
      seller: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Link href="/categories" className="text-muted-foreground hover:text-foreground">
              Categories
            </Link>
            <span className="text-muted-foreground">/</span>
            <span>{category.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          {category.description && <p className="text-muted-foreground">{category.description}</p>}
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold">No products found</h3>
            <p className="text-muted-foreground mt-1">There are no products in this category yet</p>
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
                    <p className="text-sm text-muted-foreground mt-1">{product.university.name}</p>
                    <p className="font-bold text-lg mt-2">{formatCurrency(product.price)}</p>
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
  )
}
