"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface UpgradeBannerProps {
  onDismiss?: () => void
  className?: string
}

export default function UpgradeBanner({ onDismiss, className }: UpgradeBannerProps) {
  const { user } = useAuth()
  const { quotaStatus } = useSubscription()
  const [timeRemaining, setTimeRemaining] = useState<string>("")

  // Check if user is on free tier
  const isFreeTier = quotaStatus?.tier_name === 'free'
  
  console.log('UpgradeBanner render:', { 
    isFreeTier, 
    user: !!user, 
    tierName: quotaStatus?.tier_name,
    userCreatedAt: user?.created_at 
  })
  
  // Don't show banner if not on free tier
  if (!isFreeTier || !user) {
    console.log('UpgradeBanner: Not showing banner because', { isFreeTier, hasUser: !!user })
    return null
  }

  // Calculate days remaining until 3-day trial ends
  useEffect(() => {
    if (!user.created_at) return

    const calculateTimeRemaining = () => {
      const createdAt = new Date(user.created_at)
      const threeDaysLater = new Date(createdAt.getTime() + (3 * 24 * 60 * 60 * 1000)) // 3 days in milliseconds
      const now = new Date()
      const timeDiff = threeDaysLater.getTime() - now.getTime()

      if (timeDiff <= 0) {
        setTimeRemaining("Trial ended")
        return
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`)
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`)
      } else {
        setTimeRemaining(`${minutes}m remaining`)
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [user.created_at])

  // Check if account is older than 3 days
  const isTrialEnded = () => {
    if (!user.created_at) return false
    const createdAt = new Date(user.created_at)
    const now = new Date()
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff >= 3
  }

  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('open-subscription-modal'))
  }

  console.log('UpgradeBanner: About to render banner')

  return (
    <div className={cn(
      "relative w-full p-4 border rounded-lg mb-4",
      isTrialEnded() 
        ? "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800"
        : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-blue-950/20 dark:to-purple-950/20 dark:border-blue-800",
      className
    )}>
      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <Crown className={cn(
            "h-8 w-8",
            isTrialEnded() ? "text-orange-600" : "text-blue-600"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          {isTrialEnded() ? (
            <>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Free Trial Ended
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Your 3-day trial has ended. Upgrade to Pro to continue using advanced features.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Free Trial Active
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                <span className="font-medium">{timeRemaining}</span> in your trial. Upgrade now to keep all features.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isTrialEnded() && (
            <Badge variant="secondary" className="text-xs">
              {timeRemaining}
            </Badge>
          )}
          <Button
            onClick={handleUpgrade}
            size="sm"
            className={cn(
              "text-xs",
              isTrialEnded()
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            )}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  )
}