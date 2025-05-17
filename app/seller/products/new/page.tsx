import { redirect } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import ProductForm from "@/components/product-form"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function NewProductPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/seller/products/new")
  }

  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch categories and universities for the form
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

  // Get user's university
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      universityId: true,
    },
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/seller">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to seller dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Add New Product</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Fill in the details of your product. All products are subject to approval before they are listed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm
              categories={categories}
              universities={universities}
              defaultUniversityId={user?.universityId || ""}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
