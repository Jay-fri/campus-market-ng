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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Only sellers can create products" }, { status: 403 })
    }

    const body = await req.json()
    const validatedData = productSchema.parse(body)

    // Create product
    const product = await db.product.create({
      data: {
        ...validatedData,
        sellerId: session.user.id,
        status: "PENDING", // All products start as pending and need admin approval
      },
    })

    // Create notification for admin
    const admins = await db.user.findMany({
      where: {
        role: "ADMIN",
      },
    })

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "New Product Pending Approval",
          message: `A new product "${product.title}" needs your approval`,
          type: "SYSTEM",
          link: `/admin/products/${product.id}`,
        },
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Product creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
