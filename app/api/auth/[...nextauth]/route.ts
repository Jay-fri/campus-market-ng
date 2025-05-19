import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

// Re-export authOptions to satisfy the deployment requirements
export { authOptions }
export { handler as GET, handler as POST }
