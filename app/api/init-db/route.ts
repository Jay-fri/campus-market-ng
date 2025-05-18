import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

export async function GET(req: Request) {
  try {
    console.log("Initializing database...")

    // Create default university if none exists
    const universityCount = await db.university.count()
    if (universityCount === 0) {
      console.log("Creating default universities...")

      const universities = [
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

      for (const university of universities) {
        await db.university.create({
          data: university,
        })
      }

      console.log(`Created ${universities.length} universities`)
    } else {
      console.log(`Found ${universityCount} existing universities`)
    }

    // Create default categories if none exist
    const categoryCount = await db.category.count()
    if (categoryCount === 0) {
      console.log("Creating default categories...")

      const categories = [
        {
          name: "Textbooks",
          description: "Academic textbooks and study materials",
          image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000",
        },
        {
          name: "Electronics",
          description: "Laptops, phones, and other electronic devices",
          image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000",
        },
        {
          name: "Furniture",
          description: "Beds, desks, chairs, and other furniture",
          image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000",
        },
      ]

      for (const category of categories) {
        await db.category.create({
          data: category,
        })
      }

      console.log(`Created ${categories.length} categories`)
    } else {
      console.log(`Found ${categoryCount} existing categories`)
    }

    // Create admin user if it doesn't exist
    const adminEmail = "admin@campusconnect.ng"
    const adminExists = await db.user.findUnique({
      where: { email: adminEmail },
    })

    if (!adminExists) {
      console.log("Creating admin user...")

      // Get first university
      const firstUniversity = await db.university.findFirst()
      if (!firstUniversity) {
        return NextResponse.json({ message: "Failed to create admin: No university found" }, { status: 500 })
      }

      const hashedPassword = await hash("admin", 10)

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

      console.log("Admin user created")
    } else {
      console.log("Admin user already exists")
    }

    return NextResponse.json({
      message: "Database initialized successfully",
      universities: await db.university.count(),
      categories: await db.category.count(),
      adminExists: (await db.user.findUnique({ where: { email: adminEmail } })) !== null,
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
