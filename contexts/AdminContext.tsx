"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
}

interface AdminContextType {
  isAdmin: boolean
  isLoading: boolean
  adminUser: AdminUser | null
  error: string | null
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, token } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isAuthenticated || !token || !user) {
        setIsAdmin(false)
        setAdminUser(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Check admin access by calling admin health endpoint
        const response = await fetch('/api/admin/health', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          // User has admin access
          setIsAdmin(true)
          setAdminUser({
            id: user.id || '',
            email: user.email || '',
            name: user.name || '',
            role: 'admin',
            is_active: true
          })
        } else {
          setIsAdmin(false)
          setAdminUser(null)
          if (response.status === 403) {
            setError('Admin access required')
          }
        }
      } catch (err) {
        console.error('Admin access check failed:', err)
        setIsAdmin(false)
        setAdminUser(null)
        setError('Failed to check admin access')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [isAuthenticated, token, user])

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isLoading,
        adminUser,
        error
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}