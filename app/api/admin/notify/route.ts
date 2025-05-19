import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { env } from "@/lib/env"

// Global variable to store connected clients
const connectedClients: { [key: string]: WritableStreamDefaultWriter<Uint8Array> } = {}

export async function POST(req: Request) {
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
    const encoder = new TextEncoder()
    Object.values(connectedClients).forEach((writer) => {
      try {
        writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      } catch (error) {
        console.error("Error sending event to client:", error)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Register a new client connection
export function registerClient(clientId: string, writer: WritableStreamDefaultWriter<Uint8Array>) {
  connectedClients[clientId] = writer
}

// Unregister a client connection
export function unregisterClient(clientId: string) {
  delete connectedClients[clientId]
}
