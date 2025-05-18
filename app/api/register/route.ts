import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(11),
  university: z.string(),
  customUniversity: z.string().optional(),
  newUniversity: z.string().optional(),
  category: z.string().optional(),
  customCategory: z.string().optional(),
  newCategory: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(["BUYER", "SELLER"]),
  profileImage: z.string().optional(),
  faceImage: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Registration request body:", body)

    const validatedData = registerSchema.parse(body)
    const { name, email, phone, university, newUniversity, password, role, profileImage, faceImage } = validatedData

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

    // Handle university selection or creation
    let universityId: string

    if (university === "other" && newUniversity) {
      // Create a new university
      try {
        const newUniversityRecord = await db.university.create({
          data: {
            name: newUniversity,
            location: "Nigeria", // Default location
            image: "https://source.unsplash.com/random/800x600/?university",
          },
        })
        universityId = newUniversityRecord.id
        console.log("Created new university:", newUniversityRecord.name, "with ID:", universityId)
      } catch (error) {
        console.error("Error creating new university:", error)
        return NextResponse.json({ message: "Failed to create new university" }, { status: 500 })
      }
    } else {
      // Use existing university
      try {
        const universityRecord = await db.university.findUnique({
          where: { id: university },
        })

        if (!universityRecord) {
          // If university doesn't exist, create a default one
          const defaultUniversity = await db.university.create({
            data: {
              name: "University of Lagos",
              location: "Lagos, Nigeria",
              image: "https://source.unsplash.com/random/800x600/?university",
            },
          })
          universityId = defaultUniversity.id
          console.log("Created default university with ID:", universityId)
        } else {
          universityId = universityRecord.id
        }
      } catch (error) {
        console.error("Error finding/creating university:", error)
        return NextResponse.json({ message: "Failed to process university" }, { status: 500 })
      }
    }

    // Handle category creation if provided (for sellers)
    if (role === "SELLER" && validatedData.category === "other" && validatedData.newCategory) {
      try {
        await db.category.create({
          data: {
            name: validatedData.newCategory,
            description: `Products in the ${validatedData.newCategory} category`,
            image: "https://source.unsplash.com/random/800x600/?product",
          },
        })
        console.log("Created new category:", validatedData.newCategory)
      } catch (error) {
        console.error("Error creating new category:", error)
        // Don't fail registration if category creation fails
      }
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const userData = {
      name,
      email,
      phone,
      universityId,
      password: hashedPassword,
      role,
      isActive: true,
      emailVerified: new Date(), // Auto-verify for demo purposes
      profileImage: profileImage || null,
      faceImage: role === "SELLER" ? faceImage : null,
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
