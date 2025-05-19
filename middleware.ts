import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Check if the request is for an admin API route
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    const adminSecret = process.env.ADMIN_API_SECRET

    // Get the Authorization header
    const authHeader = request.headers.get("authorization")

    // Check if the Authorization header is valid
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  // Role-based access control for dashboard routes
  if (
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/seller") ||
    request.nextUrl.pathname.startsWith("/dashboard")
  ) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Check role-specific access
    if (request.nextUrl.pathname.startsWith("/admin") && token.role !== "ADMIN") {
      // Non-admins cannot access admin routes
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (request.nextUrl.pathname.startsWith("/seller") && token.role !== "SELLER") {
      // Non-sellers cannot access seller routes
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (request.nextUrl.pathname.startsWith("/dashboard") && token.role === "ADMIN") {
      // Admins should use the admin dashboard instead
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/admin/:path*", "/admin/:path*", "/seller/:path*", "/dashboard/:path*"],
}
