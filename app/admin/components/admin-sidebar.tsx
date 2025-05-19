"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import RealTimeIndicator from "../real-time-indicator"
import {
  BarChart3,
  Users,
  ShoppingBag,
  CreditCard,
  Flag,
  Settings,
  Menu,
  Tags,
  MessageSquare,
  FileText,
  Bell,
  Shield,
  LogOut,
  Wallet,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarItem {
  title: string
  href: string
  icon: React.ReactNode
  submenu?: SidebarItem[]
  badge?: number
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    users: true,
    products: true,
    orders: true,
  })

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }))
  }

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "User Management",
      href: "#",
      icon: <Users className="h-5 w-5" />,
      submenu: [
        { title: "All Users", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
        { title: "Buyers", href: "/admin/users?role=BUYER", icon: <Users className="h-4 w-4" /> },
        { title: "Sellers", href: "/admin/users?role=SELLER", icon: <Users className="h-4 w-4" /> },
        { title: "Verification Requests", href: "/admin/users/verification", icon: <Shield className="h-4 w-4" /> },
      ],
    },
    {
      title: "Product Management",
      href: "#",
      icon: <ShoppingBag className="h-5 w-5" />,
      submenu: [
        { title: "All Products", href: "/admin/products", icon: <ShoppingBag className="h-4 w-4" /> },
        {
          title: "Pending Approval",
          href: "/admin/products?status=PENDING",
          icon: <ShoppingBag className="h-4 w-4" />,
        },
        { title: "Featured Products", href: "/admin/products/featured", icon: <ShoppingBag className="h-4 w-4" /> },
      ],
    },
    {
      title: "Order Management",
      href: "#",
      icon: <CreditCard className="h-5 w-5" />,
      submenu: [
        { title: "All Orders", href: "/admin/orders", icon: <CreditCard className="h-4 w-4" /> },
        { title: "Pending Orders", href: "/admin/orders?status=PENDING", icon: <CreditCard className="h-4 w-4" /> },
        { title: "Completed Orders", href: "/admin/orders?status=COMPLETED", icon: <CreditCard className="h-4 w-4" /> },
        { title: "Cancelled Orders", href: "/admin/orders?status=CANCELLED", icon: <CreditCard className="h-4 w-4" /> },
      ],
    },
    {
      title: "Categories & Inventory",
      href: "/admin/categories",
      icon: <Tags className="h-5 w-5" />,
    },
    {
      title: "Payments & Commissions",
      href: "#",
      icon: <Wallet className="h-5 w-5" />,
      submenu: [
        { title: "Withdrawals", href: "/admin/withdrawals", icon: <Wallet className="h-4 w-4" /> },
        { title: "Commission Settings", href: "/admin/payments/commission", icon: <Settings className="h-4 w-4" /> },
        { title: "Payment Methods", href: "/admin/payments/methods", icon: <CreditCard className="h-4 w-4" /> },
      ],
    },
    {
      title: "Reports & Analytics",
      href: "/admin/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "User Reports",
      href: "/admin/reports",
      icon: <Flag className="h-5 w-5" />,
    },
    {
      title: "Content Management",
      href: "#",
      icon: <FileText className="h-5 w-5" />,
      submenu: [
        { title: "Announcements", href: "/admin/content/announcements", icon: <Bell className="h-4 w-4" /> },
        { title: "FAQs", href: "/admin/content/faqs", icon: <FileText className="h-4 w-4" /> },
        { title: "Policies", href: "/admin/content/policies", icon: <Shield className="h-4 w-4" /> },
      ],
    },
    {
      title: "Messaging",
      href: "/admin/messages",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "System Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed left-4 top-4 z-40 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-16 items-center border-b px-6">
            <h2 className="text-lg font-semibold">Admin Dashboard</h2>
            <RealTimeIndicator className="ml-auto" />
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="px-3 py-2">
              <SidebarNav items={sidebarItems} pathname={pathname} openGroups={openGroups} toggleGroup={toggleGroup} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden w-72 flex-shrink-0 border-r bg-background md:block">
        <div className="flex h-16 items-center border-b px-6">
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>
          <RealTimeIndicator className="ml-auto" />
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="px-3 py-2">
            <SidebarNav items={sidebarItems} pathname={pathname} openGroups={openGroups} toggleGroup={toggleGroup} />
            <Separator className="my-4" />
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/api/auth/signout">
                <LogOut className="mr-2 h-5 w-5" />
                Log out
              </Link>
            </Button>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

interface SidebarNavProps {
  items: SidebarItem[]
  pathname: string
  openGroups: Record<string, boolean>
  toggleGroup: (group: string) => void
}

function SidebarNav({ items, pathname, openGroups, toggleGroup }: SidebarNavProps) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = item.href === pathname || pathname.startsWith(item.href)
        const hasSubmenu = item.submenu && item.submenu.length > 0
        const groupKey = item.title.toLowerCase().replace(/\s+/g, "-")
        const isGroupOpen = openGroups[groupKey]

        if (hasSubmenu) {
          return (
            <div key={item.title} className="space-y-1">
              <Button
                variant="ghost"
                className={cn("w-full justify-between", isActive && "bg-muted font-medium text-foreground")}
                onClick={() => toggleGroup(groupKey)}
              >
                <span className="flex items-center">
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </span>
                {isGroupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              {isGroupOpen && (
                <div className="ml-4 space-y-1 pl-2 pt-1">
                  {item.submenu?.map((subItem) => {
                    const isSubActive = subItem.href === pathname
                    return (
                      <Button
                        key={subItem.title}
                        variant="ghost"
                        className={cn("w-full justify-start", isSubActive && "bg-muted font-medium text-foreground")}
                        asChild
                      >
                        <Link href={subItem.href}>
                          {subItem.icon}
                          <span className="ml-3">{subItem.title}</span>
                          {subItem.badge && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        }

        return (
          <Button
            key={item.title}
            variant="ghost"
            className={cn("w-full justify-start", isActive && "bg-muted font-medium text-foreground")}
            asChild
          >
            <Link href={item.href}>
              {item.icon}
              <span className="ml-3">{item.title}</span>
              {item.badge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
