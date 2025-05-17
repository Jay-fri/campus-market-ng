import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Laptop, Shirt, Utensils, ShoppingBag } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Browse products by category</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.id}`}>
              <Card className="h-full overflow-hidden transition-all hover:shadow-md">
                <div className="aspect-video relative">
                  <Image
                    src={category.image || "/placeholder.svg?height=200&width=400"}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">{getCategoryIcon(category.name)}</div>
                  <h3 className="font-semibold text-lg">{category.name}</h3>
                  {category.description && <p className="text-sm text-muted-foreground mt-2">{category.description}</p>}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function getCategoryIcon(categoryName: string) {
  switch (categoryName) {
    case "Textbooks":
      return <BookOpen className="h-8 w-8 text-primary" />
    case "Electronics":
      return <Laptop className="h-8 w-8 text-primary" />
    case "Clothing":
      return <Shirt className="h-8 w-8 text-primary" />
    case "Food & Groceries":
      return <Utensils className="h-8 w-8 text-primary" />
    default:
      return <ShoppingBag className="h-8 w-8 text-primary" />
  }
}
