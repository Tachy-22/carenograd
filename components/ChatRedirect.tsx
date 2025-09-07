"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import ChatSidebar from "@/components/Sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

export default function ChatRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Get URL params to preserve auth tokens
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get("token")
    const user = urlParams.get("user")
    
    if (token && user) {
      // Preserve auth params when redirecting to new chat
      router.replace(`/chat/n?token=${token}&user=${encodeURIComponent(user)}`)
    } else {
      // No auth params, just redirect to new chat
      router.replace(`/chat/n`)
    }
  }, [router])

  // Show loading state while redirecting with sidebar layout
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex flex-col w-full max-w-screen">
        <Navigation />
        <div className="flex flex-1 overflow-hidden">
          <ChatSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Creating new conversation...</div>
            </div>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}