import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(11),
  university: z.string(),
  password: z.string().min(6),
  role: z.enum(["BUYER", "SELLER"]),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Registration request body:", body)

    const { name, email, phone, university, password, role } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Check if phone is already in use
    const existingPhone = await db.user.findUnique({
      where: {
        phone,
      },
    })

    if (existingPhone) {
      return NextResponse.json({ message: "Phone number is already in use" }, { status: 409 })
    }

    // Check if university exists
    let universityRecord = null

    try {
      // First try to find by ID
      universityRecord = await db.university.findUnique({
        where: { id: university },
      })
    } catch (error) {
      console.error("Error finding university by ID:", error)
    }

    // If not found by ID, try to find the first university
    if (!universityRecord) {
      try {
        universityRecord = await db.university.findFirst()
      } catch (error) {
        console.error("Error finding first university:", error)
      }
    }

    // If still no university, create a default one
    if (!universityRecord) {
      try {
        console.log("Creating default university")
        universityRecord = await db.university.create({
          data: {
            name: "University of Lagos",
            location: "Lagos, Nigeria",
            image: "https://example.com/unilag.jpg",
          },
        })
        console.log("Created default university:", universityRecord.id)
      } catch (error) {
        console.error("Error creating default university:", error)
        return NextResponse.json({ message: "Failed to create university" }, { status: 500 })
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const userData = {
      name,
      email,
      phone,
      universityId: universityRecord.id,
      password: hashedPassword,
      role,
      isActive: true,
      emailVerified: new Date(), // Auto-verify for demo purposes
    }

    console.log("Creating user with data:", { ...userData, password: "[REDACTED]" })

    const user = await db.user.create({
      data: userData,
    })

    console.log("User created successfully:", user.id)

    // Create wallet for user
    try {
      await db.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      })
      console.log("Wallet created for user:", user.id)
    } catch (error) {
      console.error("Error creating wallet:", error)
      // Don't fail the registration if wallet creation fails
    }

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json(
      {
        message: "Internal server error",
        error: String(error),
        stack: (error as Error).stack,
      },
      { status: 500 },
    )
  }
}
