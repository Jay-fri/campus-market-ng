import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
})

const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { items } = orderSchema.parse(body)

    // Get all products
    const productIds = items.map((item) => item.productId)
    const products = await db.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        status: "APPROVED",
      },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ message: "One or more products not found or not available" }, { status: 404 })
    }

    // Group items by seller
    const itemsBySeller = new Map<string, { product: any; quantity: number }[]>()

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) continue

      if (!itemsBySeller.has(product.sellerId)) {
        itemsBySeller.set(product.sellerId, [])
      }

      itemsBySeller.get(product.sellerId)!.push({
        product,
        quantity: item.quantity,
      })
    }

    // Create an order for each seller
    const orders = []

    for (const [sellerId, sellerItems] of itemsBySeller.entries()) {
      // Calculate total amount
      const totalAmount = sellerItems.reduce((total, item) => {
        return total + item.product.price * item.quantity
      }, 0)

      // Create order
      const order = await db.order.create({
        data: {
          buyerId: session.user.id,
          sellerId,
          totalAmount,
          status: "PENDING",
          orderItems: {
            create: sellerItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          orderItems: true,
        },
      })

      orders.push(order)

      // Create notification for seller
      await db.notification.create({
        data: {
          userId: sellerId,
          title: "New Order",
          message: `You have received a new order worth ${totalAmount.toLocaleString("en-NG", {
            style: "currency",
            currency: "NGN",
          })}`,
          type: "ORDER",
          link: `/seller/orders/${order.id}`,
        },
      })
    }

    // Create notification for buyer
    await db.notification.create({
      data: {
        userId: session.user.id,
        title: "Order Placed",
        message: `Your order has been placed successfully`,
        type: "ORDER",
        link: `/orders`,
      },
    })

    return NextResponse.json({ orders }, { status: 201 })
  } catch (error) {
    console.error("Create order error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
