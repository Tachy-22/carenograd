"use client"

import { ReactNode } from "react"

interface SubscriptionLayoutProps {
  children: ReactNode
}

export default function SubscriptionLayout({ children }: SubscriptionLayoutProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white backdrop-blur-sm">
      <div className="fixed inset-0 flex items-center justify-center p-4 ">
        {children}
      </div>
    </div>
  )
}