import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const reportSchema = z.object({
  reason: z.string().min(1),
  description: z.string().min(10),
  reportedUserId: z.string().optional(),
  productId: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { reason, description, reportedUserId, productId } = reportSchema.parse(body)

    // Validate that at least one of reportedUserId or productId is provided
    if (!reportedUserId && !productId) {
      return NextResponse.json({ message: "Either reportedUserId or productId must be provided" }, { status: 400 })
    }

    // If reportedUserId is provided, check if the user exists
    if (reportedUserId) {
      const reportedUser = await db.user.findUnique({
        where: {
          id: reportedUserId,
        },
      })

      if (!reportedUser) {
        return NextResponse.json({ message: "Reported user not found" }, { status: 404 })
      }

      // Prevent reporting yourself
      if (reportedUserId === session.user.id) {
        return NextResponse.json({ message: "You cannot report yourself" }, { status: 400 })
      }
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

      // Prevent reporting your own product
      if (product.sellerId === session.user.id) {
        return NextResponse.json({ message: "You cannot report your own product" }, { status: 400 })
      }
    }

    // Create report
    const report = await db.report.create({
      data: {
        reason,
        description,
        authorId: session.user.id,
        reportedUserId,
        productId,
        status: "PENDING",
      },
    })

    // Notify admins about the new report
    const admins = await db.user.findMany({
      where: {
        role: "ADMIN",
      },
    })

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "New Report",
          message: `A new report has been submitted: ${reason}`,
          type: "SYSTEM",
          link: `/admin/reports/${report.id}`,
        },
      })
    }

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error("Report creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
