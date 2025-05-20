import { PrismaClient } from "@prisma/client"

// Use a single instance of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Make sure we have a DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined. Please set this environment variable.")
}

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "",
      },
    },
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

export default db
