import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, image } = await req.json()

    if (!name) {
      return NextResponse.json({ message: "Category name is required" }, { status: 400 })
    }

    // Check if category already exists
    const existingCategory = await db.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    })

    if (existingCategory) {
      return NextResponse.json({ category: existingCategory })
    }

    // Create new category
    const category = await db.category.create({
      data: {
        name,
        description: description || `Products in the ${name} category`,
        image: image || "https://source.unsplash.com/random/800x600/?product",
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ message: "Failed to create category" }, { status: 500 })
  }
}
