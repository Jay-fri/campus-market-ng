import type React from "react"
import PasswordProtection from "./password-protection"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PasswordProtection>{children}</PasswordProtection>
}
