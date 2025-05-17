import { PrismaClient, Role, Condition, ProductStatus, OrderStatus } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Clean up existing data
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.report.deleteMany()
  await prisma.review.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.withdrawal.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
  await prisma.category.deleteMany()
  await prisma.university.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verificationToken.deleteMany()

  // Create universities
  const universities = [
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
  ]

  for (const university of universities) {
    await prisma.university.create({
      data: university,
    })
  }

  console.log("Universities seeded")

  // Create categories
  const categories = [
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
    {
      name: "Food & Groceries",
      description: "Snacks, meals, and groceries",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000",
    },
    {
      name: "Sports & Fitness",
      description: "Sports equipment and fitness gear",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000",
    },
    {
      name: "Beauty & Health",
      description: "Cosmetics, skincare, and health products",
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1000",
    },
  ]

  for (const category of categories) {
    await prisma.category.create({
      data: category,
    })
  }

  console.log("Categories seeded")

  // Create admin user
  const adminEmail = "admin@campusconnect.ng"
  const adminPassword = "admin"

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    console.log("Creating admin user...")
    const hashedPassword = await hash(adminPassword, 10)

    const admin = await prisma.user.create({
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
    await prisma.wallet.create({
      data: {
        userId: admin.id,
        balance: 0,
      },
    })

    console.log(`Admin user created with ID: ${admin.id}`)
  } else {
    console.log("Admin user already exists, updating password...")
    const hashedPassword = await hash(adminPassword, 10)

    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    })

    console.log("Admin password updated")
  }

  console.log("Admin user seeded")

  // Create buyers and sellers
  const allUniversities = await prisma.university.findMany()
  const hashedPassword = await hash("Password@123", 10)

  // Create 20 buyers
  for (let i = 1; i <= 20; i++) {
    const university = allUniversities[Math.floor(Math.random() * allUniversities.length)]

    const buyer = await prisma.user.create({
      data: {
        name: `Buyer ${i}`,
        email: `buyer${i}@example.com`,
        password: hashedPassword,
        role: Role.BUYER,
        emailVerified: new Date(),
        phoneVerified: true,
        phone: `+234801234${i.toString().padStart(4, "0")}`,
        universityId: university.id,
        image: `https://randomuser.me/api/portraits/${i % 2 === 0 ? "men" : "women"}/${i}.jpg`,
      },
    })

    await prisma.wallet.create({
      data: {
        userId: buyer.id,
        balance: Math.floor(Math.random() * 50000) + 5000,
      },
    })
  }

  console.log("Buyers seeded")

  // Create 10 sellers
  for (let i = 1; i <= 10; i++) {
    const university = allUniversities[Math.floor(Math.random() * allUniversities.length)]

    const seller = await prisma.user.create({
      data: {
        name: `Seller ${i}`,
        email: `seller${i}@example.com`,
        password: hashedPassword,
        role: Role.SELLER,
        emailVerified: new Date(),
        phoneVerified: true,
        phone: `+234901234${i.toString().padStart(4, "0")}`,
        universityId: university.id,
        sellerVerified: true,
        sellerRating: Math.random() * 3 + 2, // Rating between 2 and 5
        selfieVerification: `https://randomuser.me/api/portraits/${i % 2 === 0 ? "men" : "women"}/${i + 20}.jpg`,
        image: `https://randomuser.me/api/portraits/${i % 2 === 0 ? "men" : "women"}/${i + 10}.jpg`,
      },
    })

    await prisma.wallet.create({
      data: {
        userId: seller.id,
        balance: Math.floor(Math.random() * 100000) + 10000,
      },
    })
  }

  console.log("Sellers seeded")

  // Create products
  const allCategories = await prisma.category.findMany()
  const allSellers = await prisma.user.findMany({
    where: { role: Role.SELLER },
  })

  const productConditions = [Condition.NEW, Condition.LIKE_NEW, Condition.GOOD, Condition.FAIR, Condition.POOR]
  const productStatuses = [ProductStatus.APPROVED, ProductStatus.PENDING]

  const productNames = {
    Textbooks: [
      "Introduction to Psychology Textbook",
      "Calculus: Early Transcendentals",
      "Principles of Economics",
      "Organic Chemistry",
      "Introduction to Algorithms",
      "Physics for Scientists and Engineers",
      "Human Anatomy and Physiology",
      "World History: Patterns of Interaction",
      "Financial Accounting",
      "Introduction to Sociology",
      "Fundamentals of Nursing",
      "Business Law: Text and Cases",
      "Linear Algebra and Its Applications",
    ],
    Electronics: [
      "HP Laptop - 1 year old",
      "Samsung Galaxy S21 - Mint condition",
      "Apple iPad 8th Generation",
      "JBL Bluetooth Speaker",
      "Sony Wireless Headphones",
      "Xiaomi Power Bank 20000mAh",
      "Dell Monitor 24-inch",
      "Logitech Wireless Mouse",
      "Mechanical Keyboard RGB",
      "External Hard Drive 1TB",
      "USB-C Hub Multiport Adapter",
      "Wireless Earbuds",
    ],
    Furniture: [
      "Student Desk with Drawer",
      "Comfortable Study Chair",
      "Single Bed Frame",
      "Bookshelf - 4 Tiers",
      "Bedside Table",
      "Floor Lamp",
      "Wardrobe Cabinet",
      "Foldable Study Table",
      "Bean Bag Chair",
      "Wall Shelf Set",
      "Shoe Rack",
      "Full-Length Mirror",
    ],
    Clothing: [
      "University Hoodie",
      "Casual Jeans",
      "Formal Shirt",
      "Sports Shoes",
      "Winter Jacket",
      "Backpack",
      "Graduation Gown",
      "Casual T-shirt Set",
      "Leather Wallet",
      "Wristwatch",
      "Sunglasses",
      "Umbrella",
    ],
    Services: [
      "Math Tutoring Services",
      "Essay Writing Help",
      "Programming Assignment Assistance",
      "Graphic Design Services",
      "CV/Resume Writing",
      "Language Translation Services",
      "Photography Services",
      "Web Development",
      "Data Analysis Help",
      "Presentation Design",
      "Research Assistance",
      "Proofreading Services",
    ],
    "Food & Groceries": [
      "Instant Noodles Pack",
      "Energy Drink Case",
      "Snack Box Assortment",
      "Coffee and Tea Set",
      "Breakfast Cereal",
      "Protein Bars Pack",
      "Cooking Oil and Spices",
      "Rice and Pasta Pack",
      "Canned Food Assortment",
      "Bottled Water Pack",
      "Fresh Fruits Basket",
      "Frozen Meals Pack",
    ],
    "Sports & Fitness": [
      "Yoga Mat",
      "Dumbbells Set",
      "Basketball",
      "Soccer Ball",
      "Tennis Racket",
      "Skipping Rope",
      "Resistance Bands Set",
      "Water Bottle",
      "Sports Bag",
      "Running Shoes",
      "Fitness Tracker",
      "Gym Gloves",
    ],
    "Beauty & Health": [
      "Skincare Set",
      "Hair Dryer",
      "Electric Toothbrush",
      "Makeup Kit",
      "First Aid Kit",
      "Vitamins and Supplements",
      "Perfume/Cologne",
      "Face Masks Pack",
      "Nail Care Kit",
      "Shaving Kit",
      "Hair Styling Products",
      "Body Lotion Set",
    ],
  }

  // Create 100+ products
  for (let i = 0; i < 120; i++) {
    const category = allCategories[Math.floor(Math.random() * allCategories.length)]
    const seller = allSellers[Math.floor(Math.random() * allSellers.length)]
    const university = allUniversities[Math.floor(Math.random() * allUniversities.length)]
    const condition = productConditions[Math.floor(Math.random() * productConditions.length)]
    const status = productStatuses[Math.floor(Math.random() * productStatuses.length)]

    // Get product name based on category
    const categoryProducts = productNames[category.name as keyof typeof productNames] || []
    const productName = categoryProducts[Math.floor(Math.random() * categoryProducts.length)]

    // Generate random price based on category and condition
    let basePrice = 0
    switch (category.name) {
      case "Textbooks":
        basePrice = Math.floor(Math.random() * 5000) + 2000
        break
      case "Electronics":
        basePrice = Math.floor(Math.random() * 100000) + 20000
        break
      case "Furniture":
        basePrice = Math.floor(Math.random() * 30000) + 5000
        break
      case "Clothing":
        basePrice = Math.floor(Math.random() * 5000) + 1000
        break
      case "Services":
        basePrice = Math.floor(Math.random() * 10000) + 2000
        break
      case "Food & Groceries":
        basePrice = Math.floor(Math.random() * 3000) + 500
        break
      case "Sports & Fitness":
        basePrice = Math.floor(Math.random() * 8000) + 1500
        break
      case "Beauty & Health":
        basePrice = Math.floor(Math.random() * 7000) + 1000
        break
      default:
        basePrice = Math.floor(Math.random() * 5000) + 1000
    }

    // Adjust price based on condition
    let priceMultiplier = 1.0
    switch (condition) {
      case Condition.NEW:
        priceMultiplier = 1.0
        break
      case Condition.LIKE_NEW:
        priceMultiplier = 0.9
        break
      case Condition.GOOD:
        priceMultiplier = 0.7
        break
      case Condition.FAIR:
        priceMultiplier = 0.5
        break
      case Condition.POOR:
        priceMultiplier = 0.3
        break
    }

    const price = Math.round(basePrice * priceMultiplier)

    // Generate random images based on category
    const imageCount = Math.floor(Math.random() * 3) + 1
    const images = []

    for (let j = 0; j < imageCount; j++) {
      let imageUrl = ""
      switch (category.name) {
        case "Textbooks":
          imageUrl = `https://source.unsplash.com/random/800x600/?textbook&sig=${i * 10 + j}`
          break
        case "Electronics":
          imageUrl = `https://source.unsplash.com/random/800x600/?electronics&sig=${i * 10 + j}`
          break
        case "Furniture":
          imageUrl = `https://source.unsplash.com/random/800x600/?furniture&sig=${i * 10 + j}`
          break
        case "Clothing":
          imageUrl = `https://source.unsplash.com/random/800x600/?clothing&sig=${i * 10 + j}`
          break
        case "Services":
          imageUrl = `https://source.unsplash.com/random/800x600/?service&sig=${i * 10 + j}`
          break
        case "Food & Groceries":
          imageUrl = `https://source.unsplash.com/random/800x600/?food&sig=${i * 10 + j}`
          break
        case "Sports & Fitness":
          imageUrl = `https://source.unsplash.com/random/800x600/?fitness&sig=${i * 10 + j}`
          break
        case "Beauty & Health":
          imageUrl = `https://source.unsplash.com/random/800x600/?beauty&sig=${i * 10 + j}`
          break
        default:
          imageUrl = `https://source.unsplash.com/random/800x600/?product&sig=${i * 10 + j}`
      }
      images.push(imageUrl)
    }

    // Create product
    await prisma.product.create({
      data: {
        title: productName || `Product ${i + 1}`,
        description: `This is a ${condition.toLowerCase()} condition ${category.name.toLowerCase()} item. ${Math.random() > 0.5 ? "Slightly used but still in great condition." : "Perfect for university students."} ${Math.random() > 0.7 ? "Price is negotiable." : "Fixed price."}`,
        price,
        images,
        categoryId: category.id,
        sellerId: seller.id,
        universityId: university.id,
        condition,
        status,
      },
    })
  }

  console.log("Products seeded")

  // Create orders and order items
  const allBuyers = await prisma.user.findMany({
    where: { role: Role.BUYER },
  })

  const allProducts = await prisma.product.findMany({
    where: { status: ProductStatus.APPROVED },
  })

  const orderStatuses = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.COMPLETED,
  ]

  // Create 30 orders
  for (let i = 0; i < 30; i++) {
    const buyer = allBuyers[Math.floor(Math.random() * allBuyers.length)]

    // Get 1-3 random products for this order
    const orderItemCount = Math.floor(Math.random() * 3) + 1
    const orderProducts = []
    let totalAmount = 0

    for (let j = 0; j < orderItemCount; j++) {
      const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)]

      // Skip if product is already in order or from a different seller
      if (
        orderProducts.some((p) => p.id === randomProduct.id) ||
        (orderProducts.length > 0 && orderProducts[0].sellerId !== randomProduct.sellerId)
      ) {
        continue
      }

      orderProducts.push(randomProduct)
      totalAmount += randomProduct.price
    }

    if (orderProducts.length === 0) continue

    const seller = await prisma.user.findUnique({
      where: { id: orderProducts[0].sellerId },
    })

    if (!seller) continue

    const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)]

    // Create order
    const order = await prisma.order.create({
      data: {
        buyerId: buyer.id,
        sellerId: seller.id,
        status,
        totalAmount,
      },
    })

    // Create order items
    for (const product of orderProducts) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          price: product.price,
        },
      })
    }

    // Create transaction for completed orders
    if (status === OrderStatus.COMPLETED || status === OrderStatus.PAID) {
      const sellerWallet = await prisma.wallet.findUnique({
        where: { userId: seller.id },
      })

      if (sellerWallet) {
        await prisma.transaction.create({
          data: {
            walletId: sellerWallet.id,
            amount: totalAmount,
            type: "CREDIT",
            status: "COMPLETED",
            orderId: order.id,
            description: `Payment for order #${order.id}`,
          },
        })
      }
    }
  }

  console.log("Orders and transactions seeded")

  // Create reviews
  const completedOrders = await prisma.order.findMany({
    where: { status: OrderStatus.COMPLETED },
    include: {
      buyer: true,
      seller: true,
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  })

  for (const order of completedOrders) {
    // Create product reviews
    for (const item of order.orderItems) {
      // 80% chance of having a review
      if (Math.random() < 0.8) {
        const rating = Math.floor(Math.random() * 3) + 3 // 3-5 stars
        await prisma.review.create({
          data: {
            rating,
            comment: getRandomReview(rating),
            authorId: order.buyerId,
            productId: item.productId,
          },
        })
      }
    }

    // Create seller review
    if (Math.random() < 0.7) {
      const rating = Math.floor(Math.random() * 3) + 3 // 3-5 stars
      await prisma.review.create({
        data: {
          rating,
          comment: getRandomSellerReview(rating),
          authorId: order.buyerId,
          receiverId: order.sellerId,
        },
      })
    }
  }

  console.log("Reviews seeded")

  // Create messages
  const users = await prisma.user.findMany()

  for (let i = 0; i < 50; i++) {
    const sender = users[Math.floor(Math.random() * users.length)]
    let receiver = users[Math.floor(Math.random() * users.length)]

    // Make sure sender and receiver are different
    while (sender.id === receiver.id) {
      receiver = users[Math.floor(Math.random() * users.length)]
    }

    await prisma.message.create({
      data: {
        senderId: sender.id,
        receiverId: receiver.id,
        content: getRandomMessage(),
        isRead: Math.random() > 0.5,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      },
    })
  }

  console.log("Messages seeded")

  // Create notifications
  const notificationTypes = ["ORDER", "PAYMENT", "MESSAGE", "SYSTEM", "REVIEW"]

  for (const user of users) {
    const notificationCount = Math.floor(Math.random() * 5) + 1

    for (let i = 0; i < notificationCount; i++) {
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)] as any

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: getNotificationTitle(type),
          message: getNotificationMessage(type),
          type,
          isRead: Math.random() > 0.6,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000),
        },
      })
    }
  }

  console.log("Notifications seeded")

  // Create reports
  const reportReasons = [
    "Fake product",
    "Misleading description",
    "Inappropriate content",
    "Scam attempt",
    "Harassment",
    "Other",
  ]

  for (let i = 0; i < 10; i++) {
    const reporter = users[Math.floor(Math.random() * users.length)]
    const reportedUser = users[Math.floor(Math.random() * users.length)]
    const reason = reportReasons[Math.floor(Math.random() * reportReasons.length)]

    await prisma.report.create({
      data: {
        reason,
        description: `This is a report for ${reason.toLowerCase()}. Please investigate.`,
        authorId: reporter.id,
        reportedUserId: reportedUser.id,
        status: Math.random() > 0.7 ? "RESOLVED" : "PENDING",
      },
    })
  }

  // Create product reports
  for (let i = 0; i < 10; i++) {
    const reporter = users[Math.floor(Math.random() * users.length)]
    const product = allProducts[Math.floor(Math.random() * allProducts.length)]
    const reason = reportReasons[Math.floor(Math.random() * reportReasons.length)]

    await prisma.report.create({
      data: {
        reason,
        description: `This product ${reason.toLowerCase()}. Please review.`,
        authorId: reporter.id,
        productId: product.id,
        status: Math.random() > 0.7 ? "RESOLVED" : "PENDING",
      },
    })
  }

  console.log("Reports seeded")

  // Create withdrawals
  const sellers = await prisma.user.findMany({
    where: { role: Role.SELLER },
    include: { wallet: true },
  })

  for (const seller of sellers) {
    if (!seller.wallet) continue

    const withdrawalCount = Math.floor(Math.random() * 3)

    for (let i = 0; i < withdrawalCount; i++) {
      const amount = Math.floor(Math.random() * 10000) + 5000

      // Skip if not enough balance
      if (seller.wallet.balance < amount) continue

      await prisma.withdrawal.create({
        data: {
          walletId: seller.wallet.id,
          amount,
          status: Math.random() > 0.7 ? "COMPLETED" : "PENDING",
          bankName: getRandomBank(),
          accountName: seller.name,
          accountNumber: `${Math.floor(Math.random() * 10000000000)}`.padStart(10, "0"),
        },
      })
    }
  }

  console.log("Withdrawals seeded")

  console.log("Database seeded successfully!")
  console.log("Database seeding completed")
}

// Helper functions for generating random content
function getRandomReview(rating: number): string {
  const positiveReviews = [
    "Great product! Exactly as described.",
    "Very satisfied with my purchase.",
    "Excellent quality for the price.",
    "Arrived quickly and in perfect condition.",
    "Would definitely buy from this seller again.",
    "Highly recommended!",
    "Perfect for my needs.",
    "Great value for money.",
  ]

  const neutralReviews = [
    "Product is okay, as expected.",
    "Decent quality for the price.",
    "Nothing special but does the job.",
    "Slightly different from the pictures but acceptable.",
    "Took a while to arrive but product is fine.",
    "Average quality but fair price.",
  ]

  const negativeReviews = [
    "Not as described, disappointed.",
    "Poor quality for the price.",
    "Arrived damaged.",
    "Would not recommend.",
    "Not worth the money.",
  ]

  if (rating >= 4) {
    return positiveReviews[Math.floor(Math.random() * positiveReviews.length)]
  } else if (rating === 3) {
    return neutralReviews[Math.floor(Math.random() * neutralReviews.length)]
  } else {
    return negativeReviews[Math.floor(Math.random() * negativeReviews.length)]
  }
}

function getRandomSellerReview(rating: number): string {
  const positiveReviews = [
    "Great seller! Very responsive and helpful.",
    "Excellent communication and fast delivery.",
    "Very professional and trustworthy.",
    "Smooth transaction, would buy from again.",
    "Seller was very accommodating.",
    "Highly recommended seller!",
  ]

  const neutralReviews = [
    "Okay seller, normal transaction.",
    "Decent communication.",
    "Transaction went as expected.",
    "Seller was responsive but delivery was slow.",
    "Average experience overall.",
  ]

  const negativeReviews = [
    "Poor communication from seller.",
    "Took too long to respond to messages.",
    "Not very helpful with my questions.",
    "Would not buy from this seller again.",
  ]

  if (rating >= 4) {
    return positiveReviews[Math.floor(Math.random() * positiveReviews.length)]
  } else if (rating === 3) {
    return neutralReviews[Math.floor(Math.random() * neutralReviews.length)]
  } else {
    return negativeReviews[Math.floor(Math.random() * negativeReviews.length)]
  }
}

function getRandomMessage(): string {
  const messages = [
    "Hi, is this item still available?",
    "Can you deliver to my hostel?",
    "Would you accept ₦5000 for this?",
    "When can we meet for the exchange?",
    "Do you have any other colors available?",
    "Can I see more pictures of the item?",
    "Is the price negotiable?",
    "How old is this item?",
    "Does it come with all accessories?",
    "I'm interested in buying this.",
    "Can you hold this for me until tomorrow?",
    "What's the lowest price you can accept?",
    "Is there any damage or defects?",
    "I'll take it! How do we proceed?",
    "Are you near the campus main gate?",
  ]

  return messages[Math.floor(Math.random() * messages.length)]
}

function getNotificationTitle(type: string): string {
  switch (type) {
    case "ORDER":
      return "Order Update"
    case "PAYMENT":
      return "Payment Received"
    case "MESSAGE":
      return "New Message"
    case "SYSTEM":
      return "System Notification"
    case "REVIEW":
      return "New Review"
    default:
      return "Notification"
  }
}

function getNotificationMessage(type: string): string {
  switch (type) {
    case "ORDER":
      return "Your order status has been updated."
    case "PAYMENT":
      return "You have received a payment for your order."
    case "MESSAGE":
      return "You have a new message from a user."
    case "SYSTEM":
      return "Important system update: maintenance scheduled."
    case "REVIEW":
      return "Someone left a review on your product."
    default:
      return "You have a new notification."
  }
}

function getRandomBank(): string {
  const banks = [
    "Access Bank",
    "Zenith Bank",
    "GTBank",
    "First Bank",
    "UBA",
    "Fidelity Bank",
    "Ecobank",
    "FCMB",
    "Sterling Bank",
    "Union Bank",
  ]

  return banks[Math.floor(Math.random() * banks.length)]
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
