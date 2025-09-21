"use client"

import { usePathname } from "next/navigation"
import AppLayout from "./AppLayout"
import { Conversation } from "@/app/layout"

interface ConditionalLayoutProps {
  children: React.ReactNode
  initialConversations: Conversation[] | null | undefined
}

export default function ConditionalLayout({ children, initialConversations }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Don't apply AppLayout to admin routes
  if (pathname.startsWith('/admin')) {
    return <>{children}</>
  }
  
  // Apply AppLayout to all other routes
  return (
    <AppLayout initialConversations={initialConversations}>
      {children}
    </AppLayout>
  )
}