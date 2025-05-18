import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user counts
    const userCount = await db.user.count()
    const buyerCount = await db.user.count({
      where: {
        role: "BUYER",
      },
    })
    const sellerCount = await db.user.count({
      where: {
        role: "SELLER",
      },
    })

    // Get product counts
    const productCount = await db.product.count()
    const pendingProductCount = await db.product.count({
      where: {
        status: "PENDING",
      },
    })

    // Get order counts and total sales
    const orderCount = await db.order.count()
    const totalSalesResult = await db.order.aggregate({
      _sum: {
        totalAmount: true,
      },
    })
    const totalSales = totalSalesResult._sum.totalAmount || 0

    // Get report counts
    const reportCount = await db.report.count()
    const pendingReportCount = await db.report.count({
      where: {
        status: "PENDING",
      },
    })

    return NextResponse.json({
      userCount,
      buyerCount,
      sellerCount,
      productCount,
      pendingProductCount,
      orderCount,
      totalSales,
      reportCount,
      pendingReportCount,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
