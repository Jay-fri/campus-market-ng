import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const withdrawalSchema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(1),
  accountName: z.string().min(1),
  accountNumber: z.string().min(10).max(10),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { amount, bankName, accountName, accountNumber } = withdrawalSchema.parse(body)

    // Get user's wallet
    const wallet = await db.wallet.findUnique({
      where: {
        userId: session.user.id,
      },
    })

    if (!wallet) {
      return NextResponse.json({ message: "Wallet not found" }, { status: 404 })
    }

    // Check if user has enough balance
    if (wallet.balance < amount) {
      return NextResponse.json({ message: "Insufficient balance" }, { status: 400 })
    }

    // Create withdrawal request
    const withdrawal = await db.withdrawal.create({
      data: {
        walletId: wallet.id,
        amount,
        bankName,
        accountName,
        accountNumber,
        status: "PENDING",
      },
    })

    // Update wallet balance
    await db.wallet.update({
      where: {
        id: wallet.id,
      },
      data: {
        balance: {
          decrement: amount,
        },
      },
    })

    // Create transaction record
    await db.transaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: "DEBIT",
        status: "PENDING",
        description: `Withdrawal to ${bankName} - ${accountName}`,
      },
    })

    // Notify user
    await db.notification.create({
      data: {
        userId: session.user.id,
        title: "Withdrawal Request",
        message: `Your withdrawal request for ${amount.toLocaleString("en-NG", {
          style: "currency",
          currency: "NGN",
        })} has been submitted and is pending approval`,
        type: "PAYMENT",
        link: `/seller/wallet`,
      },
    })

    // Notify admins
    const admins = await db.user.findMany({
      where: {
        role: "ADMIN",
      },
    })

    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          title: "New Withdrawal Request",
          message: `A new withdrawal request for ${amount.toLocaleString("en-NG", {
            style: "currency",
            currency: "NGN",
          })} has been submitted`,
          type: "PAYMENT",
          link: `/admin/withdrawals/${withdrawal.id}`,
        },
      })
    }

    return NextResponse.json(withdrawal, { status: 201 })
  } catch (error) {
    console.error("Withdrawal request error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid data", errors: error.errors }, { status: 400 })
    }

    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
