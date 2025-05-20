import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Only provide the token if the user is an admin
    if (session?.user?.role === "ADMIN") {
      return NextResponse.json({
        token: process.env.ADMIN_API_SECRET,
      })
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  } catch (error) {
    console.error("Error in get-token route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
