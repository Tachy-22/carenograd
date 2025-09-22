"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import Cookies from "js-cookie"

interface User {
  id: string
  email: string
  name: string
  picture?: string
  created_at: string
}

interface TokenInfo {
  accessToken: string
  expiresAt: Date
  isExpiringSoon: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  tokenInfo: TokenInfo | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  apiCall: (config: any) => Promise<any>
  isTokenExpiring: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  tokenInfo: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => { },
  logout: async () => { },
  refreshToken: async () => false,
  apiCall: async () => { },
  isTokenExpiring: false
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTokenExpiring, setIsTokenExpiring] = useState(false)

  const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL 

  // Token refresh constants
  const REFRESH_BUFFER = 5 * 60 * 1000 // 5 minutes before expiration
  const AUTO_REFRESH_INTERVAL = 30 * 60 * 1000 // 30 minutes for proactive refresh

  // Promise caching for refresh operations
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null)

  // Helper method to check if token should be refreshed
  const shouldRefreshToken = useCallback((): boolean => {
    if (!tokenInfo?.expiresAt) return true

    const expirationTime = tokenInfo.expiresAt.getTime()
    const currentTime = Date.now()

    // Refresh if token expires within REFRESH_BUFFER time
    return currentTime >= (expirationTime - REFRESH_BUFFER)
  }, [tokenInfo, REFRESH_BUFFER])

  // Helper method to check if token is completely expired
  const isTokenExpired = useCallback((): boolean => {
    if (!tokenInfo?.expiresAt) return true

    const expirationTime = tokenInfo.expiresAt.getTime()
    const currentTime = Date.now()

    return currentTime >= expirationTime
  }, [tokenInfo])

  const login = useCallback(async (newToken: string, newUser: User) => {
    console.log('Login function called with:', { token: !!newToken, user: newUser?.email })

    setToken(newToken)
    setUser(newUser)

    // Set token info with expiration tracking
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    const tokenInfoData: TokenInfo = {
      accessToken: newToken,
      expiresAt: tokenExpiry,
      isExpiringSoon: false
    }
    setTokenInfo(tokenInfoData)

    console.log('State updated, storing in localStorage...')

    // Store in localStorage for persistence across browser sessions (as per guide)
    localStorage.setItem("jwt_token", newToken)
    localStorage.setItem("user_data", JSON.stringify(newUser))
    localStorage.setItem("token_expires_at", tokenExpiry.toISOString())

    // Keep old keys for compatibility during transition
    localStorage.setItem("access_token", newToken)
    localStorage.setItem("user", JSON.stringify(newUser))

    // Also set client-side cookies for immediate access (non-httpOnly)
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      expires: 7,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/'
    }
    Cookies.set("access_token", newToken, cookieOptions)
    Cookies.set("user", JSON.stringify(newUser), cookieOptions)

    console.log('localStorage and client-side cookies updated successfully')

    console.log('Login function completed')
  }, [])

  const logout = useCallback(async () => {
    try {
      // Call server-side logout endpoint to clear server-side cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    } catch (error) {
      console.error('Server logout failed:', error)
    }

    // Clear state first
    setToken(null)
    setUser(null)
    setTokenInfo(null)
    setIsTokenExpiring(false)

    // Clear localStorage (both new and old keys)
    localStorage.removeItem("jwt_token")
    localStorage.removeItem("user_data")
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    localStorage.removeItem("token_expires_at")

    // Clear sessionStorage if it exists
    sessionStorage.removeItem("access_token")
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("token_expires_at")
    sessionStorage.removeItem("auth_redirect")

    Cookies.remove("access_token")

    // Clear any remaining cookies with all possible options
    const cookieRemoveOptions = [
      { path: '/' },
      { path: '/', domain: window.location.hostname },
      { path: '/', domain: `.${window.location.hostname}` },
      {}, // Default options
    ]

    // Try removing with different options to ensure cleanup
    cookieRemoveOptions.forEach(options => {
      Cookies.remove("access_token", options)
      Cookies.remove("user", options)
    })

    // Also try with secure/sameSite options if in production
    if (process.env.NODE_ENV === 'production') {
      cookieRemoveOptions.forEach(baseOptions => {
        Cookies.remove("access_token", { ...baseOptions, secure: true, sameSite: 'lax' })
        Cookies.remove("user", { ...baseOptions, secure: true, sameSite: 'lax' })
      })
    }

    // Force a page reload to clear any cached state
    // Don't redirect if on admin pages - let admin layout handle it
    if (!window.location.pathname.startsWith('/admin')) {
      window.location.href = '/'
    }
  }, [])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous refresh requests
    if (refreshPromiseRef.current) {
      console.log('Token refresh already in progress, waiting for result...')
      return refreshPromiseRef.current
    }

    // Create new refresh promise
    refreshPromiseRef.current = (async (): Promise<boolean> => {
      try {
        console.log('Starting token refresh...')
        const response = await fetch(`${NEXT_PUBLIC_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: 'include', // Include cookies for refresh token
        })

        if (response.ok) {
          const { token: newToken, user: userData } = await response.json()
          console.log('Token refresh successful')

          setToken(newToken)
          setUser(userData)

          // Update token info with proper expiration
          const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
          const tokenInfoData: TokenInfo = {
            accessToken: newToken,
            expiresAt: tokenExpiry,
            isExpiringSoon: false
          }
          setTokenInfo(tokenInfoData)
          setIsTokenExpiring(false)

          // Update storage
          localStorage.setItem("jwt_token", newToken)
          localStorage.setItem("user_data", JSON.stringify(userData))
          localStorage.setItem("access_token", newToken)
          localStorage.setItem("user", JSON.stringify(userData))
          localStorage.setItem("token_expires_at", tokenExpiry.toISOString())

          // Also update client-side cookies
          const isProduction = process.env.NODE_ENV === 'production'
          const cookieOptions = {
            expires: 7,
            secure: isProduction,
            sameSite: 'lax' as const,
            path: '/'
          }
          Cookies.set("access_token", newToken, cookieOptions)
          Cookies.set("user", JSON.stringify(userData), cookieOptions)

          return true
        } else {
          console.error('Token refresh failed with status:', response.status)
          await logout()
          return false
        }
      } catch (error) {
        console.error("Token refresh failed:", error)
        await logout()
        return false
      } finally {
        // Clear the promise reference
        refreshPromiseRef.current = null
      }
    })()

    const result = await refreshPromiseRef.current
    return result
  }, [logout, NEXT_PUBLIC_BASE_URL])

  const fetchProfile = useCallback(async (authToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${NEXT_PUBLIC_BASE_URL}/api/auth/profile`, {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      })
      console.log({ response })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        return true
      } else if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshToken()
        if (!refreshed) {
          logout()
        }
        return refreshed
      } else {
        // Don't logout on server errors (500, 404, etc.) - only on auth errors
        console.error("Profile fetch failed with status:", response.status)
        return false
      }
    } catch (error) {
      console.error("Profile fetch failed with network error:", error)
      // Don't logout on network errors - backend might be down temporarily
      return false
    }
  }, [refreshToken, logout])

  // Enhanced API call function with automatic token refresh and retry
  const apiCall = async (config: any) => {
    const getCurrentToken = () => token || Cookies.get('access_token') || localStorage.getItem('jwt_token') || localStorage.getItem('access_token')

    let currentToken = getCurrentToken()
    if (!currentToken) {
      throw new Error('Not authenticated')
    }

    // Proactively refresh token if it should be refreshed
    if (shouldRefreshToken()) {
      console.log('Token should be refreshed, refreshing proactively...')
      const refreshed = await refreshToken()
      if (refreshed) {
        currentToken = getCurrentToken() // Get the new token
      } else {
        throw new Error('Proactive token refresh failed')
      }
    }

    const makeRequest = async (authToken: string, isRetry: boolean = false): Promise<any> => {
      try {
        const response = await fetch(config.url, {
          ...config,
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
            Authorization: `Bearer ${authToken}`,
          },
        })

        if (!response.ok) {
          if (response.status === 401 && !isRetry) {
            console.log('Received 401, attempting token refresh and retry...')
            // Token expired or invalid, try to refresh once
            const refreshed = await refreshToken()
            if (refreshed) {
              // Retry with new token
              const newToken = getCurrentToken()
              if (newToken) {
                console.log('Retrying request with new token...')
                return makeRequest(newToken, true) // Retry with new token, mark as retry
              }
            }
            // Refresh failed or no new token, logout
            console.error('Token refresh failed, logging out...')
            await logout()
            throw new Error('Authentication failed - token refresh unsuccessful')
          }

          // For other errors or if this is already a retry, don't retry
          const errorText = await response.text().catch(() => 'Unknown error')
          throw new Error(`API call failed: ${response.status} - ${errorText}`)
        }

        return response.json()
      } catch (error) {
        if (error instanceof Error && error.message.includes('Authentication failed')) {
          throw error // Re-throw auth errors
        }
        throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return makeRequest(currentToken!)
  }

  useEffect(() => {
    let isMounted = true

    const initAuth = async () => {
      try {
        // Check localStorage for JWT token and user data (as per guide)
        const storedToken = Cookies.get('access_token') || localStorage.getItem("jwt_token") || localStorage.getItem("access_token")
        const storedUser = Cookies.get('user') || localStorage.getItem("user_data") || localStorage.getItem("user")

        if (!isMounted) return

        if (storedToken && storedUser && isMounted) {
          try {
            const userData = JSON.parse(storedUser)
            setToken(storedToken)
            setUser(userData)

            // Set token info
            const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
            const tokenInfoData: TokenInfo = {
              accessToken: storedToken,
              expiresAt: tokenExpiry,
              isExpiringSoon: false
            }
            setTokenInfo(tokenInfoData)

            // Optionally verify token is still valid with backend
            // Only logout if we get a definitive 401, not on network errors
            try {
              await fetchProfile(storedToken)
            } catch (error) {
              console.log('Profile validation failed during init, but keeping token:', error)
              // Don't logout on initialization errors - user can try using the token
            }
          } catch (parseError) {
            console.error("Error parsing stored user data:", parseError)
            if (isMounted) {
              await logout()
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization failed:", error)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [])

  // Optimized token expiration monitoring with improved timing logic
  useEffect(() => {
    if (!tokenInfo) return

    const checkTokenExpiration = () => {
      // Use our improved helper methods
      if (isTokenExpired()) {
        console.log('Token expired, logging out')
        logout()
        return
      }

      if (shouldRefreshToken()) {
        console.log('Token should be refreshed, refreshing proactively...')
        // Only update if not already in expiring state
        if (!isTokenExpiring) {
          setIsTokenExpiring(true)
        }
        // Only update token info if isExpiringSoon is not already true
        if (!tokenInfo.isExpiringSoon) {
          setTokenInfo(prev => prev ? { ...prev, isExpiringSoon: true } : null)
        }
        // Refresh in background
        refreshToken().then(success => {
          if (success && isTokenExpiring) {
            setIsTokenExpiring(false)
          }
        })
      } else {
        // Token is still good, clear expiring state only if needed
        if (isTokenExpiring) {
          setIsTokenExpiring(false)
        }
        if (tokenInfo.isExpiringSoon) {
          setTokenInfo(prev => prev ? { ...prev, isExpiringSoon: false } : null)
        }
      }
    }

    // Check immediately
    checkTokenExpiration()

    // Check every minute with our optimized logic
    const interval = setInterval(checkTokenExpiration, 60000)
    return () => clearInterval(interval)
  }, [tokenInfo?.expiresAt?.getTime(), isTokenExpiring, logout, refreshToken])

  // Optimized auto-refresh setup
  useEffect(() => {
    if (!token || !tokenInfo) return

    const setupAutoRefresh = () => {
      // Only refresh if token should be refreshed (within buffer time)
      const autoRefreshInterval = setInterval(async () => {
        if (token && tokenInfo && shouldRefreshToken()) {
          console.log('Auto-refresh interval: refreshing token...')
          await refreshToken()
        }
      }, AUTO_REFRESH_INTERVAL)

      return () => clearInterval(autoRefreshInterval)
    }

    const cleanup = setupAutoRefresh()
    return cleanup
  }, [token, tokenInfo, refreshToken, shouldRefreshToken, AUTO_REFRESH_INTERVAL])

  // Auth callback is now handled by dedicated /auth/callback page

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tokenInfo,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
        refreshToken,
        apiCall,
        isTokenExpiring
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}