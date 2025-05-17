import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Laptop, ShoppingBag, Shirt, Utensils } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Home() {
  // Fetch featured products
  const featuredProducts = await db.product.findMany({
    where: {
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
    take: 8,
  })

  // Fetch categories
  const categories = await db.category.findMany({
    take: 6,
  })

  // Fetch universities
  const universities = await db.university.findMany({
    take: 5,
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Your Campus Marketplace
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Buy and sell products and services with other students at your university. Safe, easy, and convenient.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/products">
                  <Button size="lg" className="w-full min-[400px]:w-auto">
                    Browse Products
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                    Become a Seller
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[500px] aspect-video relative rounded-xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2000"
                alt="Students at university campus"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Popular Categories</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Explore our most popular categories and find what you need
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.id}`}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    {getCategoryIcon(category.name)}
                    <h3 className="font-medium mt-2">{category.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Link href="/categories">
              <Button variant="outline">
                View All Categories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="w-full py-12 md:py-24 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Featured Products</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Check out the latest products from students across Nigeria
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {featuredProducts.map((product) => (
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
          <div className="flex justify-center mt-8">
            <Link href="/products">
              <Button>
                View All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Universities Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Browse by University</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Find products and services specific to your campus
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
            {universities.map((university) => (
              <Link key={university.id} href={`/universities/${university.id}`}>
                <Card className="h-full overflow-hidden transition-all hover:shadow-md">
                  <div className="aspect-video relative">
                    <Image
                      src={university.image || "/placeholder.svg"}
                      alt={university.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold">{university.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{university.location}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Link href="/universities">
              <Button variant="outline">
                View All Universities
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-12 md:py-24 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">How It Works</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Simple steps to start buying and selling on Campus Connect NG
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <Card className="bg-background">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Create an Account</h3>
                <p className="text-muted-foreground">
                  Sign up with your email and verify your university status to join the community.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Browse or List Products</h3>
                <p className="text-muted-foreground">
                  Find what you need or list items you want to sell to other students.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-background">
              <CardContent className="p-6 text-center">
                <div className="flex justify-center items-center w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Connect and Trade</h3>
                <p className="text-muted-foreground">
                  Message sellers, make secure payments, and complete your transactions safely.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Ready to Get Started?</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Join thousands of students buying and selling on Campus Connect NG
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full min-[400px]:w-auto">
                  Register Now
                </Button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                  Explore Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
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
