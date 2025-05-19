import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { env } from "@/lib/env"
import { registerClient, unregisterClient } from "../notify/route"

export async function GET(req: Request) {
  try {
    // Check admin authorization
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${env.ADMIN_API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Set up SSE headers
    const responseStream = new TransformStream()
    const writer = responseStream.writable.getWriter()
    const encoder = new TextEncoder()

    // Generate a unique client ID
    const clientId = crypto.randomUUID()

    // Register this client
    registerClient(clientId, writer)

    // Send initial connection message
    const initialData = { type: "connection", message: "Connected to admin events stream" }
    writer.write(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`))

    // Keep the connection alive with a ping every 30 seconds
    const pingInterval = setInterval(async () => {
      try {
        writer.write(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`))
      } catch (error) {
        clearInterval(pingInterval)
        unregisterClient(clientId)
      }
    }, 30000)

    // Handle connection close
    req.signal.addEventListener("abort", () => {
      clearInterval(pingInterval)
      unregisterClient(clientId)
    })

    // Set up response
    return new Response(responseStream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Admin events stream error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
