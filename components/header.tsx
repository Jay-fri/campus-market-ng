"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/utils"
import { Bell, Menu, MessageSquare, Search, ShoppingCart } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)

  // Fetch cart count
  useEffect(() => {
    const fetchCartCount = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/cart/count")
          if (response.ok) {
            const data = await response.json()
            setCartCount(data.count)
          }
        } catch (error) {
          console.error("Error fetching cart count:", error)
        }
      }
    }

    fetchCartCount()
  }, [session])

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/notifications/count")
          if (response.ok) {
            const data = await response.json()
            setNotificationCount(data.count)
          }
        } catch (error) {
          console.error("Error fetching notification count:", error)
        }
      }
    }

    fetchNotificationCount()
  }, [session])

  // Fetch message count
  useEffect(() => {
    const fetchMessageCount = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/messages/count")
          if (response.ok) {
            const data = await response.json()
            setMessageCount(data.count)
          }
        } catch (error) {
          console.error("Error fetching message count:", error)
        }
      }
    }

    fetchMessageCount()
  }, [session])

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Check if user is a buyer
  const isBuyer = session?.user?.role === "BUYER"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] pt-16">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link href="/categories" className="text-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                  Categories
                </Link>
                <Link href="/universities" className="text-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                  Universities
                </Link>
                {session ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="text-lg font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {session.user.role === "SELLER" && (
                      <Link href="/seller" className="text-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                        Seller Dashboard
                      </Link>
                    )}
                    {session.user.role === "ADMIN" && (
                      <Link href="/admin" className="text-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                        Admin Dashboard
                      </Link>
                    )}
                    <Link href="/profile" className="text-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                      Profile
                    </Link>
                    <Link href="/orders" className="text-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                      Orders
                    </Link>
                    <Link href="/messages" className="text-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                      Messages
                    </Link>
                    <Link
                      href="/notifications"
                      className="text-lg font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Notifications
                    </Link>
                    {isBuyer && (
                      <Link href="/cart" className="text-lg font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
                        Cart
                      </Link>
                    )}
                    <Link href="/api/auth/signout" className="mt-4">
                      <Button variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign Out
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-4">
                    <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full">Register</Button>
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl md:text-2xl text-primary">
              CampusConnect<span className="text-foreground">NG</span>
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/" ? "text-primary" : "text-foreground/60"
            }`}
          >
            Home
          </Link>
          <Link
            href="/categories"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/categories" || pathname.startsWith("/categories/") ? "text-primary" : "text-foreground/60"
            }`}
          >
            Categories
          </Link>
          <Link
            href="/universities"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              pathname === "/universities" || pathname.startsWith("/universities/")
                ? "text-primary"
                : "text-foreground/60"
            }`}
          >
            Universities
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <div className="flex items-center">
              <Input
                type="search"
                placeholder="Search products..."
                className="w-[200px] md:w-[300px]"
                autoFocus
                onBlur={() => setIsSearchOpen(false)}
              />
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>
          )}

          <ThemeToggle />

          {session?.user ? (
            <>
              {/* Only show cart for buyers */}
              {isBuyer && (
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                        {cartCount}
                      </Badge>
                    )}
                    <span className="sr-only">Cart</span>
                  </Button>
                </Link>
              )}

              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                      {notificationCount}
                    </Badge>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="h-5 w-5" />
                  {messageCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                      {messageCount}
                    </Badge>
                  )}
                  <span className="sr-only">Messages</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                      <AvatarFallback>{getInitials(session.user.name || "User")}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  {session.user.role === "SELLER" && (
                    <DropdownMenuItem asChild>
                      <Link href="/seller">Seller Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  {session.user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/orders">Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/api/auth/signout">Sign Out</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
