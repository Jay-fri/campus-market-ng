import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { ShoppingBag, CreditCard, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/checkout")
  }

  // In a real implementation, we would fetch the cart items from the database
  const cartItems = mockCart
  const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const serviceFee = subtotal * 0.05 // 5% service fee
  const total = subtotal + serviceFee

  if (cartItems.length === 0) {
    redirect("/cart")
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
                <CardDescription>Enter your contact and delivery details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" placeholder="Your full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Your phone number" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Textarea id="address" placeholder="Enter your delivery address" className="min-h-[100px]" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea id="notes" placeholder="Any special instructions for delivery" />
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup defaultValue="escrow" className="space-y-4">
                  <div className="flex items-center space-x-2 border rounded-md p-4">
                    <RadioGroupItem value="escrow" id="escrow" />
                    <Label htmlFor="escrow" className="flex-1 cursor-pointer">
                      <div className="font-medium">Campus Connect Escrow (Recommended)</div>
                      <div className="text-sm text-muted-foreground">
                        Payment is held securely until you confirm receipt of your item
                      </div>
                    </Label>
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-4 opacity-50">
                    <RadioGroupItem value="card" id="card" disabled />
                    <Label htmlFor="card" className="flex-1 cursor-not-allowed">
                      <div className="font-medium">Pay with Card</div>
                      <div className="text-sm text-muted-foreground">Coming soon</div>
                    </Label>
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                  </div>
                </RadioGroup>

                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    For your security, we use an escrow system. Your payment will be held securely until you confirm
                    receipt of your item.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden">
                      <Image src={item.image || "/placeholder.svg"} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="font-medium">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
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
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" size="lg">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Place Order
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/cart">Return to Cart</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
