"use client"

import { useState } from "react"
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
import { useSubscription } from "@/contexts/SubscriptionContext"
import SubscriptionModal from "@/components/SubscriptionModal"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import SubscriptionDisplay from "@/components/SubscriptionDisplay"
import ManageSubscriptionModal from "@/components/ManageSubscriptionModal"
import { ChevronDown, Zap, Crown, Settings, LogOut, FlaskRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import Image from "next/image"

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth()
  const { currentSubscription } = useSubscription()
  const router = useRouter()
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)

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

  // Listen for global events to open subscription modal
  useEffect(() => {
    const handleOpenSubscription = () => {
      setIsSubscriptionModalOpen(true)
    }

    window.addEventListener('open-subscription-modal', handleOpenSubscription)
    return () => {
      window.removeEventListener('open-subscription-modal', handleOpenSubscription)
    }
  }, [])

  const getCurrentTier = () => {
    return currentSubscription?.tier_name || 'free'
  }

  const handleUpgrade = () => {
    setIsSubscriptionModalOpen(true)
  }

  const handleManageSubscription = () => {
    setIsManageModalOpen(true)
  }

  return (
    <header className=" sticky-0 w-full top-0 right-0  bg-bakground shadow-xs">
      <div className="flex justify-between items-center h-[3.5rem] pr-2 pl-2">
        <div className="flex items-center space-x-4">
          {isAuthenticated && <SidebarTrigger className="md:hidden" />}
          {isAuthenticated ? (
            getCurrentTier() === 'pro' ? (
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">Carenograd Pro</span>
                <Badge variant="outline" className=" bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                  <FlaskRound className="h-3 w-3 mr-1" />
                  Beta
                </Badge>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-lg font-semibold p-2">
                    Carenograd
                    <Badge variant="outline" className=" bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none">
                      <FlaskRound className="h-3 w-3 mr-1" />
                      Beta
                    </Badge>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuItem
                    className="flex items-center justify-between p-3 bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-gray-600" />
                      <span>Carenograd</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={handleUpgrade}
                    className="flex items-center justify-between p-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Crown className="h-4 w-4" />
                      <span>Carenograd Pro</span>
                    </div>
                    <Badge className="text-xs bg-blue-600 text-white">
                      Upgrade
                    </Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
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
              {/* <Button
                onClick={handleNewChat}
                variant="ghost"
                className="justify-start w-4 gap-2 p-0 [display:inline-flex] [@media(min-width:768px)]:hidden"
                size="sm"
              >
                <PenBox className="h-4 w-4" />
              </Button>
               */}
              <SubscriptionDisplay />
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

                    {/* Only show manage subscription for Pro users */}
                    {getCurrentTier() === 'pro' && (
                      <DropdownMenuItem onClick={handleManageSubscription}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Subscription
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <ManageSubscriptionModal
                isOpen={isManageModalOpen}
                onOpenChange={setIsManageModalOpen}
              />
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

      {/* Global Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onOpenChange={setIsSubscriptionModalOpen}
      />
    </header>
  )
}