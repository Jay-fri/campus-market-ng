import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/prisma/client"
import { env } from "@/lib/env"

export async function GET(req: Request) {
  try {
    // Check admin authorization
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${env.ADMIN_API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get pending counts
    const [pendingProductCount, pendingReportCount, pendingWithdrawalCount] = await Promise.all([
      prisma.product.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.report.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.withdrawal.count({
        where: {
          status: "PENDING",
        },
      }),
    ])

    return NextResponse.json({
      pendingProductCount,
      pendingReportCount,
      pendingWithdrawalCount,
    })
  } catch (error) {
    console.error("Error fetching pending counts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
