import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Only admins can activate users" }, { status: 403 })
    }

    const user = await db.user.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Update user status
    const updatedUser = await db.user.update({
      where: {
        id: params.id,
      },
      data: {
        isActive: true,
      },
    })

    // Create notification for user
    await db.notification.create({
      data: {
        userId: user.id,
        title: "Account Activated",
        message: "Your account has been activated by an administrator",
        type: "SYSTEM",
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("User activation error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
