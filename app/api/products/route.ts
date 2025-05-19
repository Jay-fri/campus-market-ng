import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const productSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10),
  price: z.number().positive(),
  categoryId: z.string(),
  condition: z.enum(["NEW", "LIKE_NEW", "GOOD", "FAIR", "POOR"]),
  images: z.array(z.string()).min(1),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    console.log("Product creation API called")
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log("Unauthorized: No session")
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "SELLER") {
      console.log(`Unauthorized: User role is ${session.user.role}, not SELLER`)
      return NextResponse.json({ message: "Only sellers can create products" }, { status: 403 })
    }

    const body = await req.json()
    console.log("Request body:", JSON.stringify(body))

    const validatedData = productSchema.parse(body)
    console.log("Validated data:", JSON.stringify(validatedData))

    // Get seller's university
    const seller = await db.user.findUnique({
      where: { id: session.user.id },
      include: { university: true },
    })

    if (!seller) {
      console.log("Seller not found in database")
      return NextResponse.json({ message: "Seller not found" }, { status: 404 })
    }

    if (!seller.university) {
      console.log("Seller has no university associated")
      return NextResponse.json({ message: "Seller must be associated with a university" }, { status: 400 })
    }

    // Create product
    const product = await db.product.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        price: validatedData.price,
        condition: validatedData.condition,
        images: validatedData.images,
        tags: validatedData.tags || [],
        location: validatedData.location || "",
        status: "PENDING", // All products start as pending
        sellerId: session.user.id,
        categoryId: validatedData.categoryId,
        universityId: seller.universityId,
      },
    })

    console.log("Product created:", product.id)

    // Notify all admins about the new product
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
    })

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "New Product Listing",
          message: `A new product "${product.title}" has been listed and requires approval`,
          type: "PRODUCT",
          link: `/admin/products/${product.id}`,
        },
      })
    }

    // Send real-time notification to admin dashboard
    try {
      // Fetch admin token securely
      const tokenResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/admin/get-token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.get("cookie") || "",
        },
      })

      if (tokenResponse.ok) {
        const { token } = await tokenResponse.json()

        if (token) {
          // Send notification to admin event stream
          await fetch(`${process.env.NEXTAUTH_URL}/api/admin/notify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: "product_created",
              data: {
                id: product.id,
                title: product.title,
                seller: seller.name,
                timestamp: new Date().toISOString(),
              },
            }),
          })
          console.log("Real-time admin notification sent")
        }
      }
    } catch (error) {
      console.error("Failed to send real-time admin notification:", error)
      // Continue execution even if notification fails
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error("Product creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const categoryId = url.searchParams.get("category")
    const universityId = url.searchParams.get("university")
    const search = url.searchParams.get("search")
    const minPrice = url.searchParams.get("minPrice") ? Number(url.searchParams.get("minPrice")) : undefined
    const maxPrice = url.searchParams.get("maxPrice") ? Number(url.searchParams.get("maxPrice")) : undefined
    const condition = url.searchParams.get("condition")
    const sort = url.searchParams.get("sort") || "newest"

    // Build where clause
    const where: any = {
      status: "APPROVED", // Only return approved products
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (universityId) {
      where.universityId = universityId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ]
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}

      if (minPrice !== undefined) {
        where.price.gte = minPrice
      }

      if (maxPrice !== undefined) {
        where.price.lte = maxPrice
      }
    }

    if (condition) {
      where.condition = condition
    }

    // Determine sort order
    let orderBy: any = {}

    switch (sort) {
      case "newest":
        orderBy = { createdAt: "desc" }
        break
      case "oldest":
        orderBy = { createdAt: "asc" }
        break
      case "price_low":
        orderBy = { price: "asc" }
        break
      case "price_high":
        orderBy = { price: "desc" }
        break
      default:
        orderBy = { createdAt: "desc" }
    }

    // Get products
    const products = await db.product.findMany({
      where,
      orderBy,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        category: true,
        university: true,
      },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
