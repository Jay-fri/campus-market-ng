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

    // Get first university for reference
    const firstUniversity = await db.university.findFirst()
    if (!firstUniversity) {
      console.error("No university found in database")
      return NextResponse.json({ message: "No university found in database" }, { status: 500 })
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
          universityId: firstUniversity.id,
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
    return NextResponse.json({ message: "Error creating admin user", error: String(error) }, { status: 500 })
  }
}
