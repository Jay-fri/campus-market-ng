import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  try {
    console.log("Database initialization started")

    // Verify database connection
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not defined")
      return NextResponse.json(
        {
          message: "Database configuration error",
          error: "DATABASE_URL environment variable is not defined",
        },
        { status: 500 },
      )
    }

    const results = {
      universities: { created: 0, existing: 0 },
      categories: { created: 0, existing: 0 },
      admin: { created: false, updated: false, error: null },
    }

    // Create default universities if none exist
    try {
      const universityCount = await db.university.count()

      if (universityCount === 0) {
        console.log("No universities found, creating defaults")

        const defaultUniversities = [
          {
            name: "University of Lagos",
            location: "Lagos",
            image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000",
          },
          {
            name: "University of Ibadan",
            location: "Ibadan",
            image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000",
          },
          {
            name: "Obafemi Awolowo University",
            location: "Ile-Ife",
            image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000",
          },
        ]

        for (const uni of defaultUniversities) {
          await db.university.create({ data: uni })
          results.universities.created++
        }

        console.log(`Created ${results.universities.created} default universities`)
      } else {
        results.universities.existing = universityCount
        console.log(`Found ${universityCount} existing universities`)
      }
    } catch (error) {
      console.error("Error creating universities:", error)
      return NextResponse.json(
        {
          message: "Error creating universities",
          error: String(error),
          results,
        },
        { status: 500 },
      )
    }

    // Create default categories if none exist
    try {
      const categoryCount = await db.category.count()

      if (categoryCount === 0) {
        console.log("No categories found, creating defaults")

        const defaultCategories = [
          {
            name: "Electronics",
            description: "Phones, laptops, and other electronic devices",
            image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000",
          },
          {
            name: "Books",
            description: "Textbooks, novels, and study materials",
            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000",
          },
          {
            name: "Clothing",
            description: "Fashion items and accessories",
            image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=1000",
          },
          {
            name: "Furniture",
            description: "Beds, chairs, tables, and other furniture",
            image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000",
          },
          {
            name: "Services",
            description: "Tutoring, repairs, and other services",
            image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1000",
          },
        ]

        for (const cat of defaultCategories) {
          await db.category.create({ data: cat })
          results.categories.created++
        }

        console.log(`Created ${results.categories.created} default categories`)
      } else {
        results.categories.existing = categoryCount
        console.log(`Found ${categoryCount} existing categories`)
      }
    } catch (error) {
      console.error("Error creating categories:", error)
      return NextResponse.json(
        {
          message: "Error creating categories",
          error: String(error),
          results,
        },
        { status: 500 },
      )
    }

    // Create or update admin user
    try {
      const adminEmail = "admin@campusconnect.ng"
      const adminPassword = "admin"
      const hashedPassword = await hash(adminPassword, 10)

      // Get first university for admin user
      const firstUniversity = await db.university.findFirst()

      if (!firstUniversity) {
        throw new Error("No university found after initialization")
      }

      const existingAdmin = await db.user.findUnique({
        where: { email: adminEmail },
      })

      if (existingAdmin) {
        console.log("Updating existing admin user")
        // Update admin
        await db.user.update({
          where: { email: adminEmail },
          data: {
            password: hashedPassword,
            isActive: true,
            role: "ADMIN",
          },
        })
        results.admin.updated = true
        console.log("Admin user updated")
      } else {
        console.log("Creating new admin user")
        // Create admin
        const admin = await db.user.create({
          data: {
            name: "Admin User",
            email: adminEmail,
            password: hashedPassword,
            role: "ADMIN",
            phone: "+2348012345678",
            universityId: firstUniversity.id,
            isActive: true,
            emailVerified: new Date(),
            phoneVerified: true,
          },
        })

        // Create wallet for admin
        await db.wallet.create({
          data: {
            userId: admin.id,
            balance: 0,
          },
        })

        results.admin.created = true
        console.log("Admin user and wallet created")
      }
    } catch (error) {
      console.error("Error creating/updating admin:", error)
      results.admin.error = String(error)
    }

    return NextResponse.json({
      message: "Database initialized successfully",
      results,
      adminCredentials: {
        email: "admin@campusconnect.ng",
        password: "admin",
      },
    })
  } catch (error) {
    console.error("Error initializing database:", error)
    return NextResponse.json(
      {
        message: "Error initializing database",
        error: String(error),
        stack: (error as Error).stack,
      },
      { status: 500 },
    )
  }
}
