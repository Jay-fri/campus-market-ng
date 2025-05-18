import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = await db.user.update({
      where: {
        id: params.id,
      },
      data: {
        isActive: false,
      },
    })

    // Create notification for user
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Account Deactivated",
        message: "Your account has been deactivated by an administrator.",
        type: "SYSTEM",
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Error deactivating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
