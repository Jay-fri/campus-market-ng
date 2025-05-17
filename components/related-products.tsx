import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RelatedProductsProps {
  categoryId: string
  universityId: string
  currentProductId: string
}

export default async function RelatedProducts({ categoryId, universityId, currentProductId }: RelatedProductsProps) {
  // Fetch related products from the same category and university
  const relatedProducts = await db.product.findMany({
    where: {
      OR: [
        { categoryId, universityId },
        { categoryId, universityId: { not: universityId } },
      ],
      id: { not: currentProductId },
      status: "APPROVED",
    },
    include: {
      category: true,
      university: true,
      seller: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 4,
  })

  if (relatedProducts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold">No related products found</h3>
        <p className="text-muted-foreground mt-1">Try browsing other categories</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {relatedProducts.map((product) => (
        <Link key={product.id} href={`/products/${product.id}`}>
          <Card className="h-full overflow-hidden transition-all hover:shadow-md">
            <div className="aspect-square relative">
              <Image src={product.images[0] || "/placeholder.svg"} alt={product.title} fill className="object-cover" />
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
                <p className="font-bold">{formatCurrency(product.price)}</p>
                <Badge variant="outline">{product.category.name}</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
