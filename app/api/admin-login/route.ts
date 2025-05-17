import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { Role } from "@prisma/client"

export async function POST(req: Request) {
  try {
    // Create or update admin user
    const adminEmail = "admin@campusconnect.ng"
    const adminPassword = "admin"
    const hashedPassword = await hash(adminPassword, 10)

    const existingAdmin = await db.user.findUnique({
      where: { email: adminEmail },
    })

    if (existingAdmin) {
      // Update admin
      await db.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          isActive: true,
          role: Role.ADMIN,
        },
      })
    } else {
      // Create admin
      const admin = await db.user.create({
        data: {
          name: "Admin User",
          email: adminEmail,
          password: hashedPassword,
          role: Role.ADMIN,
          phone: "+2348012345678",
          universityId: "1", // Default university ID
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
    return NextResponse.json({ message: "Error creating admin user", error }, { status: 500 })
  }
}
