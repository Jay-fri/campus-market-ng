import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const rejectSchema = z.object({
  reason: z.string().min(1),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Only admins can reject reports" }, { status: 403 })
    }

    const report = await db.report.findUnique({
      where: {
        id: params.id,
      },
      include: {
        author: true,
      },
    })

    if (!report) {
      return NextResponse.json({ message: "Report not found" }, { status: 404 })
    }

    const body = await req.json()
    const { reason } = rejectSchema.parse(body)

    // Update report status
    const updatedReport = await db.report.update({
      where: {
        id: params.id,
      },
      data: {
        status: "REJECTED",
      },
    })

    // Notify the report author
    await db.notification.create({
      data: {
        userId: report.authorId,
        title: "Report Rejected",
        message: `Your report has been reviewed but was not actioned. Reason: ${reason}`,
        type: "SYSTEM",
      },
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error("Report rejection error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
