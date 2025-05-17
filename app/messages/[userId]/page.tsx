import { redirect } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { formatDateTime } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft } from "lucide-react"
import MessageInput from "@/components/message-input"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface MessagePageProps {
  params: {
    userId: string
  }
}

export default async function MessagePage({ params }: MessagePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/messages")
  }

  const otherUser = await db.user.findUnique({
    where: {
      id: params.userId,
    },
  })

  if (!otherUser) {
    redirect("/messages")
  }

  // Get all messages between the current user and the other user
  const messages = await db.message.findMany({
    where: {
      OR: [
        {
          senderId: session.user.id,
          receiverId: params.userId,
        },
        {
          senderId: params.userId,
          receiverId: session.user.id,
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  // Mark unread messages as read
  await db.message.updateMany({
    where: {
      senderId: params.userId,
      receiverId: session.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/messages">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to messages</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Chat with {otherUser.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={otherUser.image || ""} alt={otherUser.name} />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{otherUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{otherUser.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col h-[calc(100%-8rem)]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => {
                        const isCurrentUser = message.senderId === session.user.id
                        const showDateSeparator =
                          index === 0 ||
                          new Date(message.createdAt).toDateString() !==
                            new Date(messages[index - 1].createdAt).toDateString()

                        return (
                          <div key={message.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-4">
                                <Separator className="flex-grow" />
                                <span className="mx-2 text-xs text-muted-foreground">
                                  {new Date(message.createdAt).toLocaleDateString()}
                                </span>
                                <Separator className="flex-grow" />
                              </div>
                            )}
                            <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} mb-4`}>
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                }`}
                              >
                                <p>{message.content}</p>
                                <p
                                  className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                                >
                                  {formatDateTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
                <div className="p-4 border-t">
                  <MessageInput receiverId={params.userId} />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="hidden lg:block">
            <Card>
              <CardHeader className="p-4 border-b">
                <h3 className="font-semibold">User Information</h3>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Name</h4>
                  <p>{otherUser.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                  <p>{otherUser.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Role</h4>
                  <p>{otherUser.role}</p>
                </div>
                {otherUser.role === "SELLER" && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Seller Rating</h4>
                    <p>{otherUser.sellerRating?.toFixed(1) || "No ratings"}</p>
                  </div>
                )}
                <div className="pt-4">
                  <Button className="w-full" asChild>
                    <Link href={`/sellers/${otherUser.id}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
