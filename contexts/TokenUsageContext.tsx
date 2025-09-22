"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useAuth } from "./AuthContext"
import Cookies from "js-cookie"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface AllocationData {
  userId: string
  modelName: string
  allocatedRequestsToday: number
  requestsUsedToday: number
  requestsRemainingToday: number
  allocationPercentageUsed: number
  canMakeRequest: boolean
  activeUsersCount: number
  allocationMessage: string
  warningLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  shouldWarn: boolean
}

interface AllocationContextType {
  allocation: AllocationData | null
  isLoading: boolean
  refreshAllocation: () => Promise<void>
  updateAllocationAfterResponse: () => void
  checkCanMakeRequest: () => Promise<boolean>
}

const AllocationContext = createContext<AllocationContextType | undefined>(undefined)

interface AllocationProviderProps {
  children: ReactNode
}

export function AllocationProvider({ children }: AllocationProviderProps) {
  const [allocation, setAllocation] = useState<AllocationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  const getWarningLevel = (percentage: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" => {
    if (percentage >= 95) return "CRITICAL"
    if (percentage >= 80) return "HIGH"
    if (percentage >= 60) return "MEDIUM"
    return "LOW"
  }

  const fetchAllocation = async () => {
    if (!isAuthenticated) {
      setAllocation(null)
      setIsLoading(false)
      return
    }

    try {
      // Get token from cookies first, then fallback to localStorage
      const token = Cookies.get('access_token') || localStorage.getItem('jwt_token') || localStorage.getItem('access_token')
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/allocation/daily`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Allocation data received:', data)
        setAllocation(data)
      } else {
        console.error('Failed to fetch allocation:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      }
    } catch (error) {
      console.error('Error fetching allocation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshAllocation = async () => {
    setIsLoading(true)
    await fetchAllocation()
  }

  const updateAllocationAfterResponse = () => {
    setTimeout(fetchAllocation, 1000)
  }

  const checkCanMakeRequest = async (): Promise<boolean> => {
    try {
      // Get token from cookies first, then fallback to localStorage
      const token = Cookies.get('access_token') || localStorage.getItem('jwt_token') || localStorage.getItem('access_token')
      if (!token) return false

      const response = await fetch(`${API_BASE_URL}/allocation/can-request`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.allowed
      }
      return false
    } catch (error) {
      console.error('Error checking allocation:', error)
      return false
    }
  }

  useEffect(() => {
    fetchAllocation()

    const interval = setInterval(fetchAllocation, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    const handleAIResponse = () => {
      updateAllocationAfterResponse()
    }

    window.addEventListener('ai-response-complete', handleAIResponse)
    return () => window.removeEventListener('ai-response-complete', handleAIResponse)
  }, [])

  return (
    <AllocationContext.Provider value={{
      allocation,
      isLoading,
      refreshAllocation,
      updateAllocationAfterResponse,
      checkCanMakeRequest
    }}>
      {children}
    </AllocationContext.Provider>
  )
}

export function useAllocation() {
  const context = useContext(AllocationContext)
  if (context === undefined) {
    throw new Error('useAllocation must be used within an AllocationProvider')
  }
  return context
}

// Backward compatibility alias
export const useTokenUsage = useAllocation
export const TokenUsageProvider = AllocationProvider