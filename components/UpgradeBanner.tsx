"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  name: string
  picture?: string
  created_at: string
}

interface UpgradeBannerProps {
  onDismiss?: () => void
  className?: string
}

export default function UpgradeBanner({ onDismiss, className }: UpgradeBannerProps) {
  const { user, isLoading } = useAuth()
  const { quotaStatus } = useSubscription()
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [isTrialEnded, setIsTrialEnded] = useState<boolean>(false)
  const [hasTriedFetchingProfile, setHasTriedFetchingProfile] = useState<boolean>(false)

  // Helper function to calculate trial status immediately
  const calculateTrialStatus = (userCreatedAt: string) => {
    const createdAt = new Date(userCreatedAt)
    if (isNaN(createdAt.getTime())) return false
    const now = new Date()
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff >= 3
  }

  // Check if user is on free tier
  const isFreeTier = quotaStatus?.tier_name === 'free'

  // //console.log('UpgradeBanner render:', {
  //   isFreeTier,
  //   user: !!user,
  //   tierName: quotaStatus?.tier_name,
  //   userCreatedAt: user?.created_at,
  //   isTrialEnded,
  //   timeRemaining,
  //   isLoading,
  //   hasTriedFetchingProfile,
  //   fullUser: user, // Log the full user object to see available fields
  //   fullQuotaStatus: quotaStatus // Also log quota status to see all available fields
  // })

  // Manually fetch profile if user exists but created_at is missing
  useEffect(() => {
    if (user && !user.created_at && !isLoading && !hasTriedFetchingProfile) {
      //console.log('User exists but missing created_at, manually fetching profile...')
      setHasTriedFetchingProfile(true)

      // Use the Next.js API route instead of direct backend call
      const token = localStorage.getItem('jwt_token') || localStorage.getItem('access_token')
      if (token) {
        fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(response => {
            if (response.ok) {
              return response.json()
            }
            throw new Error('Profile fetch failed')
          })
          .then(profileData => {
            //console.log('Manual profile fetch result:', profileData)
            // Force a context update by calling the auth context's login method
            // This is a bit hacky but necessary since the context doesn't expose a way to update user data
            if (profileData.created_at && profileData.id === user.id) {
              // Update the user state by triggering a re-authentication
              localStorage.setItem('user_data', JSON.stringify(profileData))
              localStorage.setItem('user', JSON.stringify(profileData))
              // Trigger a gentle refresh of the auth context by updating a key piece of data
              window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: profileData }))
            }
          })
          .catch(error => {
            console.error('Manual profile fetch failed:', error)
          })
      }
    }
  }, [user, isLoading, hasTriedFetchingProfile])

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<User>
      const updatedUser = customEvent.detail
      if (updatedUser?.created_at) {
        //console.log('Profile updated via event:', updatedUser)
        const trialEnded = calculateTrialStatus(updatedUser.created_at)
        setIsTrialEnded(trialEnded)
        //console.log('Trial status calculated from updated profile:', trialEnded)
      }
    }

    window.addEventListener('user-profile-updated', handleProfileUpdate)
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate)
  }, [])

  // Calculate trial status when user data is fully loaded
  useEffect(() => {
    if (user?.created_at) {
      const trialEnded = calculateTrialStatus(user.created_at)
      setIsTrialEnded(trialEnded)
      //console.log('Trial status calculated:', trialEnded)
    }
  }, [user?.created_at])

  // Calculate days remaining until 3-day trial ends
  useEffect(() => {
    if (!user?.created_at) {
      setTimeRemaining("")
      return
    }

    const calculateTimeRemaining = () => {
      const createdAt = new Date(user.created_at)
      if (isNaN(createdAt.getTime())) {
        setTimeRemaining("Invalid date")
        return
      }

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
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m remaining`)
      } else {
        setTimeRemaining("Less than 1m remaining")
      }
    }

    // Calculate immediately on mount/dependency change
    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [user?.created_at])

  // Don't show banner if not on free tier or still loading user data
  if (!isFreeTier || !user) {
    //console.log('UpgradeBanners Not showing banner because', {
    //   isFreeTier,
    //   hasUser: !!user,
    //   isLoading,
    //   hasCreatedAt: !!user?.created_at
    // })
    return null
  }

  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('open-subscription-modal'))
  }

  //console.log('UpgradeBanner: About to render banner')

  return (
    <div className={cn(
      "sticky top-[0rem] left-0 w-full p-4 border rounded-lg mb-4 ",
      isTrialEnded
        ? "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 dark:from-orange-950/20 dark:to-red-950/20 dark:border-orange-800"
        : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 dark:from-blue-950/20 dark:to-purple-950/20 dark:border-blue-800",
      className
    )}>
      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <Crown className={cn(
            "h-8 w-8",
            isTrialEnded ? "text-orange-600" : "text-blue-600"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          {isTrialEnded ? (
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
          {!isTrialEnded && (
            <Badge variant="secondary" className="text-xs">
              {timeRemaining}
            </Badge>
          )}
          <Button
            onClick={handleUpgrade}
            size="sm"
            className={cn(
              "text-xs",
              isTrialEnded
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