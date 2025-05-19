import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only provide the token to authenticated admin users
    return NextResponse.json({ token: process.env.ADMIN_API_SECRET })
  } catch (error) {
    console.error("Error fetching admin token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
