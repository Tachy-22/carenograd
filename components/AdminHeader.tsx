"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Search, User, LogOut, Shield } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function AdminHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-lg font-semibold hidden sm:block">Admin Dashboard</h1>
          <h1 className="text-base font-semibold sm:hidden">Admin</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Search - hidden on mobile */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications - hidden on mobile */}
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.picture} alt={user?.name || "Admin"} />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || "admin@example.com"}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="h-3 w-3 text-red-600" />
                    <span className="text-xs text-red-600 font-medium">Administrator</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/")}>
                <User className="mr-2 h-4 w-4" />
                <span>View Main Site</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}