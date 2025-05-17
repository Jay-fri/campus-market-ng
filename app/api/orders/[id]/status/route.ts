import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const statusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"]),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const order = await db.order.findUnique({
      where: {
        id: params.id,
      },
      include: {
        buyer: true,
        seller: true,
      },
    })

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 })
    }

    // Check if user is the buyer, seller, or admin
    const isBuyer = order.buyerId === session.user.id
    const isSeller = order.sellerId === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ message: "You don't have permission to update this order" }, { status: 403 })
    }

    const body = await req.json()
    const { status } = statusSchema.parse(body)

    // Validate status transitions
    if (isBuyer) {
      // Buyers can only mark as delivered or completed
      if (status !== "DELIVERED" && status !== "COMPLETED") {
        return NextResponse.json({ message: "Invalid status transition for buyer" }, { status: 400 })
      }

      // Can only mark as delivered if current status is shipped
      if (status === "DELIVERED" && order.status !== "SHIPPED") {
        return NextResponse.json({ message: "Order must be shipped before it can be delivered" }, { status: 400 })
      }

      // Can only mark as completed if current status is delivered
      if (status === "COMPLETED" && order.status !== "DELIVERED") {
        return NextResponse.json({ message: "Order must be delivered before it can be completed" }, { status: 400 })
      }
    }

    if (isSeller) {
      // Sellers can only mark as paid, shipped, or cancelled
      if (status !== "PAID" && status !== "SHIPPED" && status !== "CANCELLED") {
        return NextResponse.json({ message: "Invalid status transition for seller" }, { status: 400 })
      }

      // Can only mark as shipped if current status is paid
      if (status === "SHIPPED" && order.status !== "PAID") {
        return NextResponse.json({ message: "Order must be paid before it can be shipped" }, { status: 400 })
      }
    }

    // Update order status
    const updatedOrder = await db.order.update({
      where: {
        id: params.id,
      },
      data: {
        status,
      },
    })

    // Create notifications based on status change
    if (status === "PAID") {
      // Notify buyer
      await db.notification.create({
        data: {
          userId: order.buyerId,
          title: "Payment Confirmed",
          message: `Your payment for order #${order.id.slice(-8)} has been confirmed`,
          type: "PAYMENT",
          link: `/orders/${order.id}`,
        },
      })
    } else if (status === "SHIPPED") {
      // Notify buyer
      await db.notification.create({
        data: {
          userId: order.buyerId,
          title: "Order Shipped",
          message: `Your order #${order.id.slice(-8)} has been shipped`,
          type: "ORDER",
          link: `/orders/${order.id}`,
        },
      })
    } else if (status === "DELIVERED") {
      // Notify seller
      await db.notification.create({
        data: {
          userId: order.sellerId,
          title: "Order Delivered",
          message: `Order #${order.id.slice(-8)} has been marked as delivered by the buyer`,
          type: "ORDER",
          link: `/seller/orders/${order.id}`,
        },
      })
    } else if (status === "COMPLETED") {
      // Notify seller
      await db.notification.create({
        data: {
          userId: order.sellerId,
          title: "Order Completed",
          message: `Order #${order.id.slice(-8)} has been completed`,
          type: "ORDER",
          link: `/seller/orders/${order.id}`,
        },
      })

      // Process payment to seller's wallet
      const sellerWallet = await db.wallet.findUnique({
        where: {
          userId: order.sellerId,
        },
      })

      if (sellerWallet) {
        // Update seller wallet balance
        await db.wallet.update({
          where: {
            id: sellerWallet.id,
          },
          data: {
            balance: {
              increment: order.totalAmount,
            },
          },
        })

        // Create transaction record
        await db.transaction.create({
          data: {
            walletId: sellerWallet.id,
            amount: order.totalAmount,
            type: "CREDIT",
            status: "COMPLETED",
            orderId: order.id,
            description: `Payment for order #${order.id.slice(-8)}`,
          },
        })

        // Notify seller about payment
        await db.notification.create({
          data: {
            userId: order.sellerId,
            title: "Payment Received",
            message: `You have received payment of ${order.totalAmount.toLocaleString("en-NG", {
              style: "currency",
              currency: "NGN",
            })} for order #${order.id.slice(-8)}`,
            type: "PAYMENT",
            link: `/seller/wallet`,
          },
        })
      }
    } else if (status === "CANCELLED") {
      // Notify buyer
      await db.notification.create({
        data: {
          userId: order.buyerId,
          title: "Order Cancelled",
          message: `Your order #${order.id.slice(-8)} has been cancelled`,
          type: "ORDER",
          link: `/orders/${order.id}`,
        },
      })
    } else if (status === "REFUNDED") {
      // Notify buyer
      await db.notification.create({
        data: {
          userId: order.buyerId,
          title: "Order Refunded",
          message: `Your order #${order.id.slice(-8)} has been refunded`,
          type: "PAYMENT",
          link: `/orders/${order.id}`,
        },
      })

      // Notify seller
      await db.notification.create({
        data: {
          userId: order.sellerId,
          title: "Order Refunded",
          message: `Order #${order.id.slice(-8)} has been refunded`,
          type: "PAYMENT",
          link: `/seller/orders/${order.id}`,
        },
      })
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("Update order status error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
