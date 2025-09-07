'use client'

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import ChatSidebar from "@/components/Sidebar"
import Navigation from "@/components/Navigation"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <ChatSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <Navigation />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}