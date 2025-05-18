import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

export async function GET() {
  try {
    console.log("Starting database seeding...")

    // Check if universities exist
    const universityCount = await db.university.count()

    if (universityCount === 0) {
      console.log("Creating universities...")

      // Create universities
      await db.university.createMany({
        data: [
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
          {
            name: "University of Nigeria",
            location: "Nsukka",
            image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000",
          },
          {
            name: "Ahmadu Bello University",
            location: "Zaria",
            image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000",
          },
        ],
      })

      console.log("Universities created")
    } else {
      console.log(`Universities already exist: ${universityCount}`)
    }

    // Check if categories exist
    const categoryCount = await db.category.count()

    if (categoryCount === 0) {
      console.log("Creating categories...")

      // Create categories
      await db.category.createMany({
        data: [
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
          {
            name: "Clothing",
            description: "Clothes, shoes, and accessories",
            image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000",
          },
          {
            name: "Services",
            description: "Tutoring, printing, and other services",
            image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1000",
          },
        ],
      })

      console.log("Categories created")
    } else {
      console.log(`Categories already exist: ${categoryCount}`)
    }

    // Create admin user
    const adminEmail = "admin@campusconnect.ng"
    const adminPassword = "admin"
    const hashedPassword = await hash(adminPassword, 10)

    const firstUniversity = await db.university.findFirst()
    if (!firstUniversity) {
      return NextResponse.json({ message: "No university found" }, { status: 500 })
    }

    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    })

    if (!existingAdmin) {
      console.log("Creating admin user...")

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
      status: "success",
      message: "Database seeded successfully",
      data: {
        universities: await db.university.count(),
        categories: await db.category.count(),
        adminExists: Boolean(existingAdmin),
      },
    })
  } catch (error) {
    console.error("Database seeding error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Database seeding failed",
        error: String(error),
      },
      { status: 500 },
    )
  }
}
