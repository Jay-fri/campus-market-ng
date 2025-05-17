import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  productId: z.string().optional(),
  receiverId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { rating, comment, productId, receiverId } = reviewSchema.parse(body)

    // Validate that at least one of productId or receiverId is provided
    if (!productId && !receiverId) {
      return NextResponse.json({ message: "Either productId or receiverId must be provided" }, { status: 400 })
    }

    // If productId is provided, check if the product exists
    if (productId) {
      const product = await db.product.findUnique({
        where: {
          id: productId,
        },
      })

      if (!product) {
        return NextResponse.json({ message: "Product not found" }, { status: 404 })
      }

      // Check if the user has already reviewed this product
      const existingReview = await db.review.findFirst({
        where: {
          authorId: session.user.id,
          productId,
        },
      })

      if (existingReview) {
        return NextResponse.json({ message: "You have already reviewed this product" }, { status: 400 })
      }
    }

    // If receiverId is provided, check if the user exists
    if (receiverId) {
      const receiver = await db.user.findUnique({
        where: {
          id: receiverId,
        },
      })

      if (!receiver) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }

      // Check if the user has already reviewed this receiver
      const existingReview = await db.review.findFirst({
        where: {
          authorId: session.user.id,
          receiverId,
        },
      })

      if (existingReview) {
        return NextResponse.json({ message: "You have already reviewed this user" }, { status: 400 })
      }
    }

    // Create review
    const review = await db.review.create({
      data: {
        rating,
        comment,
        authorId: session.user.id,
        productId,
        receiverId,
      },
    })

    // If it's a seller review, update the seller's rating
    if (receiverId) {
      const sellerReviews = await db.review.findMany({
        where: {
          receiverId,
        },
        select: {
          rating: true,
        },
      })

      const averageRating = sellerReviews.reduce((sum, review) => sum + review.rating, 0) / sellerReviews.length

      await db.user.update({
        where: {
          id: receiverId,
        },
        data: {
          sellerRating: averageRating,
        },
      })

      // Create notification for seller
      await db.notification.create({
        data: {
          userId: receiverId,
          title: "New Review",
          message: `You have received a ${rating}-star review`,
          type: "REVIEW",
        },
      })
    }

    // If it's a product review, create notification for the seller
    if (productId) {
      const product = await db.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          sellerId: true,
          title: true,
        },
      })

      if (product) {
        await db.notification.create({
          data: {
            userId: product.sellerId,
            title: "New Product Review",
            message: `Your product "${product.title}" has received a ${rating}-star review`,
            type: "REVIEW",
            link: `/products/${productId}`,
          },
        })
      }
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error("Review creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
