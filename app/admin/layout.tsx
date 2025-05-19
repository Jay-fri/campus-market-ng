import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import PasswordProtection from "./password-protection"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  return (
    <PasswordProtection>
      <div className="flex min-h-screen">
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </PasswordProtection>
  )
}
