import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/prisma/client"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Only admins can approve products" }, { status: 403 })
    }

    const product = await prisma.product.findUnique({
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

    // Update product status
    const updatedProduct = await prisma.product.update({
      where: {
        id: params.id,
      },
      data: {
        status: "APPROVED",
      },
    })

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: product.sellerId,
        title: "Product Approved",
        message: `Your product "${product.title}" has been approved and is now live`,
        type: "SYSTEM",
        link: `/products/${product.id}`,
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Product approval error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
