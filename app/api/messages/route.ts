import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const messageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { receiverId, content } = messageSchema.parse(body)

    // Check if receiver exists
    const receiver = await db.user.findUnique({
      where: {
        id: receiverId,
      },
    })

    if (!receiver) {
      return NextResponse.json({ message: "Receiver not found" }, { status: 404 })
    }

    // Create message
    const message = await db.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
      },
    })

    // Create notification for receiver
    await db.notification.create({
      data: {
        userId: receiverId,
        title: "New Message",
        message: `You have a new message from ${session.user.name}`,
        type: "MESSAGE",
        link: `/messages/${session.user.id}`,
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Message error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
