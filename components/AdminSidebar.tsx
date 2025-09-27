"use client"

import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  BarChart3,
  Zap,
  Mail,
  Send
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Subscribers',
    href: '/admin/subscribers',
    icon: Mail,
  },
  {
    name: 'Campaigns',
    href: '/admin/campaigns',
    icon: Send,
  },
  {
    name: 'Conversations',
    href: '/admin/conversations',
    icon: MessageSquare,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Token Quota',
    href: '/admin/quota',
    icon: Zap,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Admin"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="font-semibold group-data-[collapsible=icon]:hidden">Admin Panel</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  onClick={() => router.push(item.href)}
                  isActive={isActive}
                  tooltip={item.name}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-foreground">A</span>
          </div>
          <div className="flex-1 group-data-[collapsible=icon]:hidden">
            <div className="text-sm font-medium">Admin User</div>
            <div className="text-xs text-muted-foreground">Administrator</div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}