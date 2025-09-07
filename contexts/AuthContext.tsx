"use client"

import { createContext, useContext, useEffect, useState } from "react"
import Cookies from "js-cookie"

interface User {
  id: string
  email: string
  name: string
  picture?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {}
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
  const [isLoading, setIsLoading] = useState(true)

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    
    // Store in sessionStorage
    sessionStorage.setItem("access_token", newToken)
    sessionStorage.setItem("user", JSON.stringify(newUser))
    
    // Store in cookies for server-side access (7 days)
    const isProduction = process.env.NODE_ENV === 'production'
    Cookies.set("access_token", newToken, { expires: 7, secure: isProduction, sameSite: 'lax' })
    Cookies.set("user", JSON.stringify(newUser), { expires: 7, secure: isProduction, sameSite: 'lax' })
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    
    // Clear sessionStorage
    sessionStorage.removeItem("access_token")
    sessionStorage.removeItem("user")
    
    // Clear cookies
    Cookies.remove("access_token")
    Cookies.remove("user")
  }

  const fetchProfile = async (authToken: string) => {
    try {
      const response = await fetch("/api/auth/profile", {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        logout()
      }
    } catch (error) {
      console.error("Profile fetch failed:", error)
      logout()
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      // Try sessionStorage first, then cookies as fallback
      let storedToken = sessionStorage.getItem("access_token")
      let storedUser = sessionStorage.getItem("user")
      
      // Fallback to cookies if sessionStorage is empty
      if (!storedToken) {
        storedToken = Cookies.get("access_token") || null
      }
      if (!storedUser) {
        storedUser = Cookies.get("user") || null
      }

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setToken(storedToken)
          setUser(userData)
          
          // Ensure both sessionStorage and cookies are synced
          sessionStorage.setItem("access_token", storedToken)
          sessionStorage.setItem("user", storedUser)
          const isProduction = process.env.NODE_ENV === 'production'
          Cookies.set("access_token", storedToken, { expires: 7, secure: isProduction, sameSite: 'lax' })
          Cookies.set("user", storedUser, { expires: 7, secure: isProduction, sameSite: 'lax' })
          
          // Verify token is still valid
          await fetchProfile(storedToken)
        } catch (error) {
          console.error("Auth initialization failed:", error)
          logout()
        }
      }
      
      setIsLoading(false)
    }

    initAuth()
  }, [])

  // Handle auth callback from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get("token")
    const urlUser = urlParams.get("user")

    if (urlToken && urlUser) {
      try {
        const userData = JSON.parse(decodeURIComponent(urlUser))
        login(urlToken, userData)
        
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname)
      } catch (error) {
        console.error("Auth callback failed:", error)
      }
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}