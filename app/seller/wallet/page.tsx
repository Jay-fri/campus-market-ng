import { redirect } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SellerWalletPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/seller/wallet")
  }

  if (session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Fetch wallet
  const wallet = await db.wallet.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  if (!wallet) {
    // Create wallet if it doesn't exist
    await db.wallet.create({
      data: {
        userId: session.user.id,
        balance: 0,
      },
    })
    redirect("/seller/wallet")
  }

  // Fetch transactions
  const transactions = await db.transaction.findMany({
    where: {
      walletId: wallet.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  })

  // Fetch withdrawals
  const withdrawals = await db.withdrawal.findMany({
    where: {
      walletId: wallet.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  })

  // Calculate statistics
  const pendingAmount = transactions
    .filter((transaction) => transaction.status === "PENDING" && transaction.type === "CREDIT")
    .reduce((acc, transaction) => acc + transaction.amount, 0)

  const totalWithdrawn = withdrawals
    .filter((withdrawal) => withdrawal.status === "COMPLETED")
    .reduce((acc, withdrawal) => acc + withdrawal.amount, 0)

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Seller Wallet</h1>
            <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
          </div>
          <Button asChild>
            <Link href="/seller/wallet/withdraw">Withdraw Funds</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Available Balance</span>
                <span className="text-2xl font-bold">{formatCurrency(wallet.balance)}</span>
              </div>
              <CreditCard className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Pending Payments</span>
                <span className="text-2xl font-bold">{formatCurrency(pendingAmount)}</span>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-row items-center justify-between p-6">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-sm">Total Withdrawn</span>
                <span className="text-2xl font-bold">{formatCurrency(totalWithdrawn)}</span>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>
          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No transactions yet</h3>
                    <p className="text-muted-foreground mt-1">
                      Your transaction history will appear here once you make sales
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {transaction.type === "CREDIT" ? (
                            <ArrowDownCircle
                              className={`h-8 w-8 ${
                                transaction.status === "COMPLETED"
                                  ? "text-green-500"
                                  : transaction.status === "PENDING"
                                    ? "text-yellow-500"
                                    : "text-red-500"
                              }`}
                            />
                          ) : (
                            <ArrowUpCircle
                              className={`h-8 w-8 ${
                                transaction.status === "COMPLETED"
                                  ? "text-blue-500"
                                  : transaction.status === "PENDING"
                                    ? "text-yellow-500"
                                    : "text-red-500"
                              }`}
                            />
                          )}
                          <div>
                            <p className="font-medium">
                              {transaction.type === "CREDIT" ? "Payment Received" : "Withdrawal"}
                            </p>
                            <p className="text-sm text-muted-foreground">{transaction.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              transaction.type === "CREDIT" ? "text-green-600" : "text-blue-600"
                            }`}
                          >
                            {transaction.type === "CREDIT" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                          </p>
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <Badge
                              variant={
                                transaction.status === "COMPLETED"
                                  ? "outline"
                                  : transaction.status === "PENDING"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {transaction.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="withdrawals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal History</CardTitle>
                <CardDescription>Your recent withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ArrowUpCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No withdrawals yet</h3>
                    <p className="text-muted-foreground mt-1">
                      Your withdrawal history will appear here once you request a withdrawal
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/seller/wallet/withdraw">Withdraw Funds</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="border rounded-lg overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {withdrawal.status === "COMPLETED" ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : withdrawal.status === "REJECTED" ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-500" />
                              )}
                              <div>
                                <p className="font-medium">Withdrawal Request</p>
                                <p className="text-sm text-muted-foreground">{formatDate(withdrawal.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(withdrawal.amount)}</p>
                              <Badge
                                variant={
                                  withdrawal.status === "COMPLETED"
                                    ? "outline"
                                    : withdrawal.status === "REJECTED"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="mt-1"
                              >
                                {withdrawal.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="p-4 bg-muted/50">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Bank Name</p>
                              <p className="font-medium">{withdrawal.bankName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Account Name</p>
                              <p className="font-medium">{withdrawal.accountName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Account Number</p>
                              <p className="font-medium">{withdrawal.accountNumber}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p className="font-medium">{formatDate(withdrawal.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/seller/wallet/withdraw">Request New Withdrawal</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
