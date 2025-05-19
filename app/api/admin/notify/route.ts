import { NextResponse } from "next/server"
import { env } from "@/lib/env"
import { sendEventToClients } from "../events/route"

export async function POST(req: Request) {
  try {
    // Check admin authorization
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${env.ADMIN_API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type, data } = body

    // Validate event data
    if (!type || !data) {
      return NextResponse.json({ error: "Invalid event data" }, { status: 400 })
    }

    // Create event object
    const event = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: new Date().toISOString(),
    }

    // Send event to all connected clients
    sendEventToClients(event)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
