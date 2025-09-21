"use client"

import React, { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
//import { useRouter } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import ChatSidebar from "@/components/Sidebar"
import Navigation from "@/components/Navigation"
import TokenStatusIndicator from "@/components/TokenStatusIndicator"
import { revalidateData } from "@/lib/revalidate"
import { Conversation } from "@/app/layout"

interface AppLayoutProps {
  children: React.ReactNode
  initialConversations: Conversation[] | null | undefined
}

export default function AppLayout({ children, initialConversations = null }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()

  // Revalidate conversations when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      revalidateData('/chat')
    }
  }, [isAuthenticated])

  console.log({ initialConversations })
  
  // Handle hydration mismatch: undefined from Next.js serialization should be treated as null
  const conversations = initialConversations === undefined ? null : initialConversations
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    // Authenticated layout with sidebar
    return (
        <div className="flex h-screen w-full">
          <ChatSidebar conversations={conversations} />
          <SidebarInset className="flex flex-col flex-1">
            <Navigation />
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </SidebarInset>
          <TokenStatusIndicator />
        </div>
    )
  }

  // Unauthenticated layout without sidebar
  return (
    <div className="flex flex-col h-screen w-full">
      <Navigation />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}