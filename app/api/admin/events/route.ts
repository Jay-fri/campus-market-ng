import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { env } from "@/lib/env"

// Global variable to store connected clients
const clients = new Map<string, ReadableStreamController<Uint8Array>>()

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

    // Create a new client ID
    const clientId = crypto.randomUUID()

    // Set up Server-Sent Events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        // Store the controller for this client
        clients.set(clientId, controller)

        // Send initial connection message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", id: clientId })}\n\n`))

        // Set up ping interval to keep connection alive
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "ping", time: new Date().toISOString() })}\n\n`),
            )
          } catch (error) {
            clearInterval(pingInterval)
            clients.delete(clientId)
          }
        }, 30000)
      },
      cancel() {
        // Remove client when connection is closed
        clients.delete(clientId)
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Admin events error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Function to send an event to all connected clients
export function sendEventToClients(event: any) {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify(event)}\n\n`
  const encoded = encoder.encode(message)

  clients.forEach((controller) => {
    try {
      controller.enqueue(encoded)
    } catch (error) {
      console.error("Error sending event to client:", error)
    }
  })
}

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
