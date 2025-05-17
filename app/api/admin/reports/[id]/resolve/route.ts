import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const resolveSchema = z.object({
  resolution: z.string().min(1),
  action: z.enum(["NO_ACTION", "WARNING", "REMOVE_CONTENT", "SUSPEND_USER"]),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Only admins can resolve reports" }, { status: 403 })
    }

    const report = await db.report.findUnique({
      where: {
        id: params.id,
      },
      include: {
        author: true,
        reportedUser: true,
        product: true,
      },
    })

    if (!report) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 })
    }

    const body = await req.json()
    const { resolution, action } = resolveSchema.parse(body)

    // Update report status
    const updatedReport = await db.report.update({
      where: {
        id: params.id,
      },
      data: {
        status: "RESOLVED",
      },
    })

    // Take action based on the admin's decision
    switch (action) {
      case "WARNING":
        if (report.reportedUser) {
          await db.notification.create({
            data: {
              userId: report.reportedUserId!,
              title: "Warning: Report Against You",
              message: `A report against you has been reviewed. Warning: ${resolution}`,
              type: "SYSTEM",
            },
          })
        }
        break
      case "REMOVE_CONTENT":
        if (report.product) {
          await db.product.update({
            where: {
              id: report.productId!,
            },
            data: {
              status: "REJECTED",
            },
          })

          if (report.product.sellerId) {
            await db.notification.create({
              data: {
                userId: report.product.sellerId,
                title: "Product Removed",
                message: `Your product "${report.product.title}" has been removed due to a report. Reason: ${resolution}`,
                type: "SYSTEM",
              },
            })
          }
        }
        break
      case "SUSPEND_USER":
        if (report.reportedUser) {
          await db.user.update({
            where: {
              id: report.reportedUserId!,
            },
            data: {
              isActive: false,
            },
          })

          await db.notification.create({
            data: {
              userId: report.reportedUserId!,
              title: "Account Suspended",
              message: `Your account has been suspended due to a report. Reason: ${resolution}`,
              type: "SYSTEM",
            },
          })
        }
        break
    }

    // Notify the report author
    await db.notification.create({
      data: {
        userId: report.authorId,
        title: "Report Resolved",
        message: `Your report has been reviewed and resolved. Thank you for helping keep our community safe.`,
        type: "SYSTEM",
      },
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error("Report resolution error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
