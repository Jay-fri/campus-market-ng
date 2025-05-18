import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Check if the request is for an admin API route
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    // Check if the authorization header is valid
    // This is a simple implementation - in a real app, you'd use a more secure approach
    if (authHeader !== `Bearer ${process.env.ADMIN_API_SECRET}`) {
      return new NextResponse(JSON.stringify({ success: false, message: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/api/admin/:path*",
}
