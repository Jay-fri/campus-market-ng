// Environment variables helper
export const env = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "your-secret-key",
  ADMIN_API_SECRET: process.env.ADMIN_API_SECRET || "", // Same as the admin password for simplicity
}
