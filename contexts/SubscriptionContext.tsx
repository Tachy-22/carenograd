"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "./AuthContext"
import Cookies from "js-cookie"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL 

interface SubscriptionTier {
  id: string
  name: string
  display_name: string
  price_ngn: number
  daily_message_limit: number
  description: string
  is_active: boolean
}

interface CurrentSubscription {
  id: string
  user_id: string
  tier_name: string
  tier_display_name: string
  price_ngn: number
  daily_message_limit: number
  status: string
  current_period_start: string
  current_period_end: string
  paystack_subscription_code?: string
}

interface QuotaStatus {
  can_send_message: boolean
  messages_used: number
  daily_limit: number
  messages_remaining: number
  tier_name: string
  tier_display_name: string
}

interface SubscriptionContextType {
  // Subscription tiers
  tiers: SubscriptionTier[]
  
  // Current subscription
  currentSubscription: CurrentSubscription | null
  
  // Quota status
  quotaStatus: QuotaStatus | null
  
  // Loading states
  isLoading: boolean
  isSubscriptionLoading: boolean
  isQuotaLoading: boolean
  
  // Actions
  fetchTiers: () => Promise<void>
  fetchCurrentSubscription: () => Promise<void>
  fetchQuotaStatus: () => Promise<void>
  refreshAllData: () => Promise<void>
  
  // Subscription actions
  subscribeTo: (tierName: string, callbackUrl?: string) => Promise<{ authorization_url?: string; subscription?: CurrentSubscription }>
  verifyPayment: (reference: string) => Promise<{ success: boolean; subscription?: CurrentSubscription }>
  cancelSubscription: () => Promise<void>
  
  // Quota checking
  checkCanSendMessage: () => Promise<boolean>
  updateQuotaAfterMessage: () => void
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

interface SubscriptionProviderProps {
  children: ReactNode
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false)
  const [isQuotaLoading, setIsQuotaLoading] = useState(false)
  
  const { isAuthenticated } = useAuth()

  const getAuthHeaders = () => {
    const token = Cookies.get('access_token') || localStorage.getItem('jwt_token') || localStorage.getItem('access_token')
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchTiers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/tiers`)
      if (response.ok) {
        const data = await response.json()
        setTiers(data)
      } else {
        console.error('Failed to fetch subscription tiers:', response.status)
      }
    } catch (error) {
      console.error('Error fetching subscription tiers:', error)
    }
  }

  const fetchCurrentSubscription = async () => {
    if (!isAuthenticated) {
      setCurrentSubscription(null)
      return
    }

    setIsSubscriptionLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/current`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentSubscription(data)
      } else if (response.status === 404) {
        // User has no subscription, they're on free tier by default
        setCurrentSubscription(null)
      } else {
        console.error('Failed to fetch current subscription:', response.status)
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error)
    } finally {
      setIsSubscriptionLoading(false)
    }
  }

  const fetchQuotaStatus = async () => {
    if (!isAuthenticated) {
      setQuotaStatus(null)
      return
    }

    setIsQuotaLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/quota`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        setQuotaStatus(data)
      } else {
        console.error('Failed to fetch quota status:', response.status)
      }
    } catch (error) {
      console.error('Error fetching quota status:', error)
    } finally {
      setIsQuotaLoading(false)
    }
  }

  const refreshAllData = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchTiers(),
      fetchCurrentSubscription(),
      fetchQuotaStatus()
    ])
    setIsLoading(false)
  }

  const subscribeTo = async (tierName: string, callbackUrl?: string) => {
    try {
      const body: { tier_name: string; callback_url?: string } = { tier_name: tierName }
      if (callbackUrl) {
        body.callback_url = callbackUrl
      }

//      console.log('Request body being sent:', body)
//      console.log('API_BASE_URL:', API_BASE_URL)
//      console.log('Full URL:', `${API_BASE_URL}/subscription/subscribe`)

      const response = await fetch(`${API_BASE_URL}/subscription/subscribe`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      })

//      console.log('Response status:', response.status)
//      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (response.ok) {
        const data = await response.json()
        
        // If it's a free tier subscription, update local state immediately
        if (tierName === 'free' && data.id) {
          setCurrentSubscription(data)
          await fetchQuotaStatus() // Refresh quota after subscription change
        }
        
        return data
      } else {
        throw new Error(`Subscription failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error subscribing:', error)
      throw error
    }
  }

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reference })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.subscription) {
          setCurrentSubscription(data.subscription)
          await fetchQuotaStatus() // Refresh quota after successful payment
        }
        return data
      } else {
        throw new Error(`Payment verification failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
      throw error
    }
  }

  const cancelSubscription = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/cancel`, {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        // Refresh subscription data after cancellation
        await fetchCurrentSubscription()
        await fetchQuotaStatus()
      } else {
        throw new Error(`Cancellation failed: ${response.status}`)
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }

  const checkCanSendMessage = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription/quota`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        const data = await response.json()
        return data.can_send_message
      }
      return false
    } catch (error) {
      console.error('Error checking message quota:', error)
      return false
    }
  }

  const updateQuotaAfterMessage = () => {
    // Refresh quota status after a message is sent
    setTimeout(fetchQuotaStatus, 1000)
  }

  // Initialize data when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshAllData()
    } else {
      setCurrentSubscription(null)
      setQuotaStatus(null)
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Removed periodic refresh - quota only updates after messages are sent

  // Listen for message events to update quota
  useEffect(() => {
    const handleMessageSent = () => {
      updateQuotaAfterMessage()
    }

    window.addEventListener('ai-response-complete', handleMessageSent)
    return () => window.removeEventListener('ai-response-complete', handleMessageSent)
  }, [])

  return (
    <SubscriptionContext.Provider value={{
      tiers,
      currentSubscription,
      quotaStatus,
      isLoading,
      isSubscriptionLoading,
      isQuotaLoading,
      fetchTiers,
      fetchCurrentSubscription,
      fetchQuotaStatus,
      refreshAllData,
      subscribeTo,
      verifyPayment,
      cancelSubscription,
      checkCanSendMessage,
      updateQuotaAfterMessage
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}

// Export the types for use in other components
export type { SubscriptionTier, CurrentSubscription, QuotaStatus }