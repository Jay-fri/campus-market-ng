import { redirect } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getRelativeTime } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, Search, Users } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login?callbackUrl=/messages")
  }

  // Get all unique conversations (both sent and received)
  const sentMessages = await db.message.findMany({
    where: {
      senderId: session.user.id,
    },
    include: {
      receiver: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const receivedMessages = await db.message.findMany({
    where: {
      receiverId: session.user.id,
    },
    include: {
      sender: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Create a map of conversations by user
  const conversationsMap = new Map()

  // Add sent messages to conversations
  sentMessages.forEach((message) => {
    const userId = message.receiverId
    if (!conversationsMap.has(userId)) {
      conversationsMap.set(userId, {
        user: message.receiver,
        lastMessage: message,
        unreadCount: 0,
      })
    } else {
      const conversation = conversationsMap.get(userId)
      if (message.createdAt > conversation.lastMessage.createdAt) {
        conversation.lastMessage = message
      }
    }
  })

  // Add received messages to conversations and count unread
  receivedMessages.forEach((message) => {
    const userId = message.senderId
    if (!conversationsMap.has(userId)) {
      conversationsMap.set(userId, {
        user: message.sender,
        lastMessage: message,
        unreadCount: message.isRead ? 0 : 1,
      })
    } else {
      const conversation = conversationsMap.get(userId)
      if (message.createdAt > conversation.lastMessage.createdAt) {
        conversation.lastMessage = message
      }
      if (!message.isRead) {
        conversation.unreadCount += 1
      }
    }
  })

  // Convert map to array and sort by last message date
  const conversations = Array.from(conversationsMap.values()).sort((a, b) => {
    return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime()
  })

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Chat with buyers and sellers</p>
        </div>

        <Tabs defaultValue="conversations">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="conversations" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contacts
              </TabsTrigger>
            </TabsList>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search messages..." className="pl-8 w-full sm:w-[300px]" />
            </div>
          </div>

          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Recent Conversations</CardTitle>
                <CardDescription>Your recent message exchanges with other users</CardDescription>
              </CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No conversations yet</h3>
                    <p className="text-muted-foreground mt-1">
                      Start messaging buyers or sellers to see your conversations here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <Link
                        key={conversation.user.id}
                        href={`/messages/${conversation.user.id}`}
                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.user.image || ""} alt={conversation.user.name} />
                          <AvatarFallback>{conversation.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold truncate">{conversation.user.name}</h3>
                            <span className="text-xs text-muted-foreground">
                              {getRelativeTime(conversation.lastMessage.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.senderId === session.user.id ? "You: " : ""}
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                        {conversation.unreadCount > 0 && <Badge className="ml-2">{conversation.unreadCount}</Badge>}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Your Contacts</CardTitle>
                <CardDescription>People you've interacted with on Campus Connect NG</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Contact list coming soon</h3>
                  <p className="text-muted-foreground mt-1">
                    We're working on a contacts feature to help you find people easier
                  </p>
                  <Button className="mt-4" asChild>
                    <Link href="/messages">View Conversations</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
