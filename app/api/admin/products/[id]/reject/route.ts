import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const rejectSchema = z.object({
  reason: z.string().min(1),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Only admins can reject products" }, { status: 403 })
    }

    const product = await db.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        seller: true,
      },
    })

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    const body = await req.json()
    const { reason } = rejectSchema.parse(body)

    // Update product status
    const updatedProduct = await db.product.update({
      where: {
        id: params.id,
      },
      data: {
        status: "REJECTED",
      },
    })

    // Create notification for seller
    await db.notification.create({
      data: {
        userId: product.sellerId,
        title: "Product Rejected",
        message: `Your product "${product.title}" has been rejected. Reason: ${reason}`,
        type: "SYSTEM",
        link: `/seller/products/${product.id}`,
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Product rejection error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
