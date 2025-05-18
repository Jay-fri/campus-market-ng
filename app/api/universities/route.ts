import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const universities = await db.university.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ universities })
  } catch (error) {
    console.error("Error fetching universities:", error)
    return NextResponse.json({ message: "Failed to fetch universities" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, location, image } = await req.json()

    if (!name) {
      return NextResponse.json({ message: "University name is required" }, { status: 400 })
    }

    // Check if university already exists
    const existingUniversity = await db.university.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    })

    if (existingUniversity) {
      return NextResponse.json({ university: existingUniversity })
    }

    // Create new university
    const university = await db.university.create({
      data: {
        name,
        location: location || "Nigeria",
        image: image || "https://source.unsplash.com/random/800x600/?university",
      },
    })

    return NextResponse.json({ university }, { status: 201 })
  } catch (error) {
    console.error("Error creating university:", error)
    return NextResponse.json({ message: "Failed to create university" }, { status: 500 })
  }
}
