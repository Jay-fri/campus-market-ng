import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ShoppingCart, Trash2, CreditCard } from "lucide-react"
import RemoveFromCartButton from "@/components/remove-from-cart-button"

export const dynamic = "force-dynamic"
export const revalidate = 0

// This is a mock cart since we don't have a real cart implementation yet
const mockCart = [
  {
    id: "1",
    productId: "product1",
    title: "Introduction to Psychology Textbook",
    price: 5000,
    quantity: 1,
    image: "https://source.unsplash.com/random/800x600/?textbook&sig=1",
    seller: {
      id: "seller1",
      name: "Seller 1",
    },
    university: {
      id: "uni1",
      name: "University of Lagos",
    },
  },
  {
    id: "2",
    productId: "product2",
    title: "HP Laptop - 1 year old",
    price: 120000,
    quantity: 1,
    image: "https://source.unsplash.com/random/800x600/?laptop&sig=2",
    seller: {
      id: "seller2",
      name: "Seller 2",
    },
    university: {
      id: "uni1",
      name: "University of Lagos",
    },
  },
]

export default async function CartPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/cart")
  }

  // In a real implementation, we would fetch the cart items from the database
  const cartItems = mockCart
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const serviceFee = subtotal * 0.05 // 5% service fee
  const total = subtotal + serviceFee

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground">Review your items and proceed to checkout</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Your cart is empty</h3>
            <p className="text-muted-foreground mt-1">Add items to your cart to see them here</p>
            <Button className="mt-4" asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cart Items ({cartItems.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row gap-4">
                      <div className="relative aspect-square sm:aspect-video h-24 sm:h-auto sm:w-40 flex-shrink-0 rounded-md overflow-hidden">
                        <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div>
                            <Link href={`/products/${item.productId}`} className="font-semibold hover:text-primary">
                              {item.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              Seller: {item.seller.name} | {item.university.name}
                            </p>
                          </div>
                          <p className="font-bold">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Quantity: {item.quantity}</span>
                          </div>
                          <RemoveFromCartButton itemId={item.id} />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" asChild>
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear Cart
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Fee (5%)</span>
                    <span>{formatCurrency(serviceFee)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/checkout">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Checkout
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
