import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // Check database connection
    const universities = await db.university.findMany({
      take: 1,
    })

    const categories = await db.category.findMany({
      take: 1,
    })

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      data: {
        universities: universities.length,
        categories: categories.length,
        databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
      },
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Database connection failed",
        error: String(error),
      },
      { status: 500 },
    )
  }
}
