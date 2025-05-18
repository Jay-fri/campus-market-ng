import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  secret: process.env.NEXTAUTH_SECRET || "supersecretkey",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          console.log(`Attempting login for: ${credentials.email}`)

          // Special case for admin
          if (credentials.email === "admin@campusconnect.ng" && credentials.password === "admin") {
            console.log("Admin login attempt with hardcoded credentials")

            const adminUser = await db.user.findUnique({
              where: { email: "admin@campusconnect.ng" },
            })

            if (adminUser) {
              console.log("Admin user found, login successful")
              return {
                id: adminUser.id,
                email: adminUser.email,
                name: adminUser.name,
                role: "ADMIN",
              }
            } else {
              console.log("Admin user not found in database")
            }
          }

          // Regular user authentication
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            console.log(`User not found: ${credentials.email}`)
            return null
          }

          // For admin user, accept "admin" as password
          if (user.role === "ADMIN" && credentials.password === "admin") {
            console.log("Admin login successful with 'admin' password")
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            }
          }

          const isPasswordValid = await compare(credentials.password, user.password)

          if (!isPasswordValid) {
            console.log(`Invalid password for user: ${credentials.email}`)
            return null
          }

          if (!user.isActive) {
            console.log(`User account is deactivated: ${credentials.email}`)
            throw new Error("Your account has been deactivated. Please contact support.")
          }

          console.log(`Login successful for: ${credentials.email}`)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          }
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
}
