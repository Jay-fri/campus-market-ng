import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (session) {
      // Clear the session cookie
      const response = NextResponse.redirect(new URL("/", req.url))
      response.cookies.set({
        name: "next-auth.session-token",
        value: "",
        expires: new Date(0),
        path: "/",
      })

      // Also clear the CSRF token cookie
      response.cookies.set({
        name: "next-auth.csrf-token",
        value: "",
        expires: new Date(0),
        path: "/",
      })

      // Clear any other auth-related cookies
      response.cookies.set({
        name: "next-auth.callback-url",
        value: "",
        expires: new Date(0),
        path: "/",
      })

      return response
    }

    return NextResponse.redirect(new URL("/", req.url))
  } catch (error) {
    console.error("Error during sign out:", error)
    return NextResponse.redirect(new URL("/", req.url))
  }
}
