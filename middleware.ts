import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if the request is for an admin API route
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    const adminSecret = process.env.ADMIN_API_SECRET;

    // Get the Authorization header
    const authHeader = request.headers.get("authorization");

    // Check if the Authorization header is valid
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
