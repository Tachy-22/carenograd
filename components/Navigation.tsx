"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import TokenUsageDisplay from "@/components/TokenUsageDisplay"
import { PenBox } from "lucide-react"
import Image from "next/image"

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await logout()
      // logout() now handles the redirect automatically with window.location.href
    } catch (error) {
      console.error('Sign out failed:', error)
      // Fallback redirect
      router.push("/")
    }
  }
  const handleNewChat = () => {
    router.push(`/`)
  }

  return (
    <header className=" sticky-0 w-full top-0 right-0  bg-bakground shadow-xs">
      <div className="flex justify-between items-center h-[3.5rem] px-4 ">
        <div className="flex items-center space-x-4">
          {isAuthenticated && <SidebarTrigger className="md:hidden" />}
          {isAuthenticated ? (
            <h1 className="text-xl font-semibold">Carenograd</h1>
          ) : (
            <Image
              src="/logo.png"
              alt="Carenograd Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Button
                onClick={handleNewChat}
                variant="ghost"
                className="justify-start w-4 gap-2 p-0 sm:flex md:hidden"
                size="sm"
              >
                <PenBox className="h-4 w-4" />
              </Button>
              <TokenUsageDisplay />
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.picture} alt={user.name} />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="px-2 py-1.5 text-sm">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-muted-foreground">{user.email}</div>
                    </div>
                    {/* <DropdownMenuSeparator /> */}
                    {/* <DropdownMenuItem>
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Connected Accounts
                    </DropdownMenuItem> */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Button
                variant="default"
                className="text-sm rounded-full"
                onClick={() => window.location.href = "/auth"}
              >
                Log In
              </Button>
              <Button
                variant="outline"
                className="text-sm rounded-full"
                onClick={() => window.location.href = "/auth"}
              >
                Sign Up For Free
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}