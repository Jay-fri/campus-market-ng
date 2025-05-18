import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  try {
    console.log("Admin creation started")

    // Create or update admin user
    const adminEmail = "admin@campusconnect.ng"
    const adminPassword = "admin"
    const hashedPassword = await hash(adminPassword, 10)

    // Check if any university exists
    let universityId: string
    const firstUniversity = await db.university.findFirst()

    if (!firstUniversity) {
      console.log("No university found, creating default university")
      // Create a default university
      const newUniversity = await db.university.create({
        data: {
          name: "University of Lagos",
          location: "Lagos",
          image: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000",
        },
      })
      universityId = newUniversity.id
      console.log("Created default university with ID:", universityId)
    } else {
      universityId = firstUniversity.id
      console.log("Using existing university with ID:", universityId)
    }

    // Check if any categories exist
    const categoryCount = await db.category.count()
    if (categoryCount === 0) {
      console.log("No categories found, creating default category")
      // Create a default category
      await db.category.create({
        data: {
          name: "General",
          description: "General items and services",
          image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1000",
        },
      })
      console.log("Created default category")
    }

    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      console.log("Updating existing admin user")
      // Update admin
      const updatedAdmin = await db.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          isActive: true,
          role: "ADMIN",
        },
      })
      console.log("Admin user updated:", updatedAdmin.id)
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
          universityId: universityId,
          isActive: true,
          emailVerified: new Date(),
          phoneVerified: true,
        },
      })
      console.log("Admin user created:", admin.id)

      // Create wallet for admin
      const wallet = await db.wallet.create({
        data: {
          userId: admin.id,
          balance: 0,
        },
      })
      console.log("Admin wallet created:", wallet.id)
    }

    return NextResponse.json({
      message: "Admin user created/updated successfully",
      credentials: {
        email: adminEmail,
        password: adminPassword,
      },
    })
  } catch (error) {
    console.error("Error creating admin user:", error)
    return NextResponse.json(
      {
        message: "Error creating admin user",
        error: String(error),
        stack: (error as Error).stack,
      },
      { status: 500 },
    )
  }
}
