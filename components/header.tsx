"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Search,
  ShoppingCart,
  Menu,
  User,
  LogIn,
  LogOut,
  Bell,
  MessageSquare,
  Home,
  BookOpen,
  School,
  Package,
  ShoppingBag,
  Settings,
  PlusCircle,
  Wallet,
} from "lucide-react"
import { Badge } from "./ui/badge"

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [notificationCount, setNotificationCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Fetch cart count
  useEffect(() => {
    if (session && session.user.role === "BUYER") {
      const fetchCartCount = async () => {
        try {
          const response = await fetch("/api/cart/count")
          if (response.ok) {
            const data = await response.json()
            setCartItemCount(data.count)
          }
        } catch (error) {
          console.error("Failed to fetch cart count:", error)
        }
      }
      fetchCartCount()
    }
  }, [session])

  // Fetch notification count
  useEffect(() => {
    if (session) {
      const fetchNotificationCount = async () => {
        try {
          const response = await fetch("/api/notifications/unread-count")
          if (response.ok) {
            const data = await response.json()
            setNotificationCount(data.count)
          }
        } catch (error) {
          console.error("Failed to fetch notification count:", error)
        }
      }
      fetchNotificationCount()
    }
  }, [session])

  // Fetch message count
  useEffect(() => {
    if (session) {
      const fetchMessageCount = async () => {
        try {
          const response = await fetch("/api/messages/unread-count")
          if (response.ok) {
            const data = await response.json()
            setMessageCount(data.count)
          }
        } catch (error) {
          console.error("Failed to fetch message count:", error)
        }
      }
      fetchMessageCount()
    }
  }, [session])

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Handle logout with proper session termination
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()

    // Use NextAuth's signOut function which properly terminates the session
    await signOut({ redirect: false })

    // Then redirect to home page
    router.push("/")
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled ? "bg-background/95 backdrop-blur-sm shadow-sm" : "bg-background"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <ShoppingBag className="h-6 w-6" />
          <span className="hidden sm:inline-block">Campus Connect NG</span>
        </Link>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center md:px-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Search products, categories, universities..." className="w-full pl-10" />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-4">
          {session ? (
            <>
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                    >
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="h-5 w-5" />
                  {messageCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                    >
                      {messageCount > 99 ? "99+" : messageCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              {session.user.role === "BUYER" && (
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItemCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                      >
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                      <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {session.user.role === "BUYER" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="w-full cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/orders" className="w-full cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          My Orders
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {session.user.role === "SELLER" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/seller" className="w-full cursor-pointer">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Seller Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/products/new" className="w-full cursor-pointer">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Product
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/seller/wallet" className="w-full cursor-pointer">
                          <Wallet className="mr-2 h-4 w-4" />
                          My Wallet
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {session.user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="#" onClick={handleLogout} className="w-full cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
          <ThemeToggle />
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          {session && session.user.role === "BUYER" && (
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                  >
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="mb-6">
                <SheetTitle>Campus Connect NG</SheetTitle>
                <SheetDescription>University marketplace</SheetDescription>
              </SheetHeader>

              {/* Mobile Search */}
              <div className="relative mb-6 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Search products..." className="w-full pl-10" />
              </div>

              {/* Mobile Menu Items */}
              <div className="flex flex-col space-y-3">
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                    <Home className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/products" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                    <ShoppingBag className="h-5 w-5" />
                    <span>Products</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/categories" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                    <BookOpen className="h-5 w-5" />
                    <span>Categories</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/universities" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                    <School className="h-5 w-5" />
                    <span>Universities</span>
                  </Link>
                </SheetClose>

                {session ? (
                  <>
                    <div className="my-2 h-px bg-border" />
                    {session.user.role === "BUYER" && (
                      <>
                        <SheetClose asChild>
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted"
                          >
                            <User className="h-5 w-5" />
                            <span>Dashboard</span>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link href="/orders" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                            <Package className="h-5 w-5" />
                            <span>My Orders</span>
                          </Link>
                        </SheetClose>
                      </>
                    )}
                    {session.user.role === "SELLER" && (
                      <>
                        <SheetClose asChild>
                          <Link href="/seller" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                            <ShoppingBag className="h-5 w-5" />
                            <span>Seller Dashboard</span>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/seller/products/new"
                            className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted"
                          >
                            <PlusCircle className="h-5 w-5" />
                            <span>Add Product</span>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href="/seller/wallet"
                            className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted"
                          >
                            <Wallet className="h-5 w-5" />
                            <span>My Wallet</span>
                          </Link>
                        </SheetClose>
                      </>
                    )}
                    {session.user.role === "ADMIN" && (
                      <SheetClose asChild>
                        <Link href="/admin" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                          <Settings className="h-5 w-5" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </SheetClose>
                    )}
                    <SheetClose asChild>
                      <Link
                        href="/notifications"
                        className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted"
                      >
                        <Bell className="h-5 w-5" />
                        <span>Notifications</span>
                        {notificationCount > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {notificationCount > 99 ? "99+" : notificationCount}
                          </Badge>
                        )}
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/messages" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                        <MessageSquare className="h-5 w-5" />
                        <span>Messages</span>
                        {messageCount > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {messageCount > 99 ? "99+" : messageCount}
                          </Badge>
                        )}
                      </Link>
                    </SheetClose>
                    <div className="my-2 h-px bg-border" />
                    <SheetClose asChild>
                      <a
                        href="#"
                        onClick={handleLogout}
                        className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Log out</span>
                      </a>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <SheetClose asChild>
                      <Link href="/login" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                        <LogIn className="h-5 w-5" />
                        <span>Log in</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link href="/register" className="flex items-center gap-3 rounded-md px-4 py-2 hover:bg-muted">
                        <User className="h-5 w-5" />
                        <span>Register</span>
                      </Link>
                    </SheetClose>
                  </>
                )}
                <div className="my-2 h-px bg-border" />
                <div className="flex items-center justify-center">
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
