import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const productSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  price: z.number().positive(),
  categoryId: z.string(),
  universityId: z.string(),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"]),
  images: z.array(z.string()).min(1),
})

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const product = await db.product.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Check if user is the seller or an admin
    if (product.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "You don't have permission to update this product" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = productSchema.parse(body)

    // Update product
    const updatedProduct = await db.product.update({
      where: {
        id: params.id,
      },
      data: {
        ...validatedData,
        status: "PENDING", // Reset to pending for re-approval
        updatedAt: new Date(),
      },
    })

    // Create notification for admin if seller updated the product
    if (session.user.role === "SELLER") {
      const admins = await db.user.findMany({
        where: {
          role: "ADMIN",
        },
      })

      for (const admin of admins) {
        await db.notification.create({
          data: {
            userId: admin.id,
            title: "Product Updated - Needs Approval",
            message: `The product "${updatedProduct.title}" has been updated and needs your approval`,
            type: "SYSTEM",
            link: `/admin/products/${updatedProduct.id}`,
          },
        })
      }
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error("Product update error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const product = await db.product.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    // Check if user is the seller or an admin
    if (product.sellerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "You don't have permission to delete this product" }, { status: 403 })
    }

    // Delete product
    await db.product.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Product deletion error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const product = await db.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        category: true,
        university: true,
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
            sellerRating: true,
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Product fetch error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
