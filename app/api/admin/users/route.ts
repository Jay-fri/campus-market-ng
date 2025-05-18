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

    const url = new URL(req.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const role = url.searchParams.get("role") || ""
    const status = url.searchParams.get("status") || ""
    const search = url.searchParams.get("search") || ""

    const pageSize = 10
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: any = {}

    if (role && role !== "all") {
      where.role = role
    }

    if (status && status !== "all") {
      where.isActive = status === "active"
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // Get users
    const users = await db.user.findMany({
      where,
      include: {
        university: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    })

    // Get total count
    const total = await db.user.count({ where })

    return NextResponse.json({
      users,
      total,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
