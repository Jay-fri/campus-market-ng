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

    // Get monthly sales data for the last 6 months
    const currentDate = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(currentDate.getMonth() - 5)

    const months = []
    for (let i = 0; i < 6; i++) {
      const month = new Date(sixMonthsAgo)
      month.setMonth(sixMonthsAgo.getMonth() + i)
      months.push(month)
    }

    const salesData = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0)

        const result = await db.order.aggregate({
          _sum: {
            totalAmount: true,
          },
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        })

        return {
          name: month.toLocaleString("default", { month: "short" }),
          sales: result._sum.totalAmount || 0,
        }
      }),
    )

    // Get category distribution data
    const categories = await db.category.findMany()

    const categoryData = await Promise.all(
      categories.map(async (category) => {
        const count = await db.product.count({
          where: {
            categoryId: category.id,
            status: "APPROVED",
          },
        })

        return {
          name: category.name,
          value: count,
        }
      }),
    )

    return NextResponse.json({
      salesData,
      categoryData,
    })
  } catch (error) {
    console.error("Error fetching sales data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
