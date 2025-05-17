import { PrismaClient, Role } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Adding admin user...")

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: "admin@campusconnect.ng",
    },
  })

  if (existingAdmin) {
    console.log("Admin user already exists, updating password...")

    // Update admin password to "admin"
    const hashedPassword = await hash("admin", 10)

    await prisma.user.update({
      where: {
        email: "admin@campusconnect.ng",
      },
      data: {
        name: "admin",
        password: hashedPassword,
        isActive: true,
      },
    })

    console.log("Admin user updated successfully!")
    return
  }

  // Create admin user with password "admin"
  const hashedPassword = await hash("admin", 10)

  const admin = await prisma.user.create({
    data: {
      name: "admin",
      email: "admin@campusconnect.ng",
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      phoneVerified: true,
      phone: "+2348012345678",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000",
      isActive: true,
    },
  })

  await prisma.wallet.create({
    data: {
      userId: admin.id,
      balance: 0,
    },
  })

  console.log("Admin user created successfully!")
}

main()
  .catch((e) => {
    console.error("Error adding admin user:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
