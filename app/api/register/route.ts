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

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        phone,
        universityId: university,
        password: hashedPassword,
        role,
        isActive: true,
        emailVerified: new Date(), // Auto-verify for demo purposes
      },
    })

    // Create wallet for user
    await db.wallet.create({
      data: {
        userId: user.id,
        balance: 0,
      },
    })

    console.log("User registered successfully:", user.id)
    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 })
  }
}
