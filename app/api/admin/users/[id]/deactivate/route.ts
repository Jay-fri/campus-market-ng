import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const deactivateSchema = z.object({
  reason: z.string().min(1),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Only admins can deactivate users" }, { status: 403 })
    }

    // Prevent deactivating yourself
    if (params.id === session.user.id) {
      return NextResponse.json({ message: "You cannot deactivate your own account" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Prevent deactivating other admins
    if (user.role === "ADMIN") {
      return NextResponse.json({ message: "You cannot deactivate another admin account" }, { status: 400 })
    }

    const body = await req.json()
    const { reason } = deactivateSchema.parse(body)

    // Update user status
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
        message: `Your account has been deactivated by an administrator. Reason: ${reason}`,
        type: "SYSTEM",
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("User deactivation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
