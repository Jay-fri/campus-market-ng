import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const statusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"]),
  reason: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    const { status, reason } = statusSchema.parse(await req.json())

    if (!params.id) {
      return new NextResponse("Missing withdraw id", { status: 400 })
    }

    const withdraw = await db.withdraw.update({
      where: {
        id: params.id,
      },
      data: {
        status,
        reason,
      },
    })

    return NextResponse.json(withdraw)
  } catch (error) {
    console.log("[WITHDRAW_ID_STATUS]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
