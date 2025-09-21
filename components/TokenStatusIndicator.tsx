'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TokenStatusIndicator() {
  const { tokenInfo, refreshToken, isTokenExpiring, isAuthenticated } = useAuth()
  const [status, setStatus] = useState<'valid' | 'warning' | 'expired' | 'refreshing'>('valid')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Cache the expiration time to prevent unnecessary re-renders
  const expiresAt = tokenInfo?.expiresAt?.getTime()

  useEffect(() => {
    if (!expiresAt || !isAuthenticated) {
      setStatus('valid')
      return
    }

    const checkStatus = () => {
      const now = Date.now()
      const timeUntilExpiry = expiresAt - now

      if (timeUntilExpiry <= 0) {
        setStatus('expired')
      } else if (timeUntilExpiry <= 5 * 60 * 1000) { // 5 minutes
        setStatus('warning')
      } else {
        setStatus('valid')
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [expiresAt, isAuthenticated])

  // Update status based on isTokenExpiring prop
  useEffect(() => {
    if (isTokenExpiring) {
      setStatus(prevStatus => prevStatus === 'valid' ? 'warning' : prevStatus)
    }
  }, [isTokenExpiring])

  const handleRefresh = async () => {
    if (isRefreshing) return
    
    try {
      setIsRefreshing(true)
      setStatus('refreshing')
      const success = await refreshToken()
      
      if (success) {
        setStatus('valid')
      } else {
        setStatus('expired')
      }
    } catch (error) {
      console.error('Manual refresh failed:', error)
      setStatus('expired')
    } finally {
      setIsRefreshing(false)
    }
  }

  const getTimeRemaining = (): string => {
    if (!tokenInfo) return ''
    
    const now = Date.now()
    const expiresAt = tokenInfo.expiresAt.getTime()
    const timeUntilExpiry = expiresAt - now
    
    if (timeUntilExpiry <= 0) return 'Expired'
    
    const minutes = Math.floor(timeUntilExpiry / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  // Don't show for valid tokens or when not authenticated
  if (status === 'valid' || !isAuthenticated) return null

  const getStatusConfig = () => {
    switch (status) {
      case 'warning':
        return {
          bgColor: 'bg-yellow-100 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-600',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          icon: Clock,
          title: 'Token Expiring Soon',
          message: `Your session expires in less than 5 minutes. ${getTimeRemaining()}`,
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600 text-white'
        }
      case 'expired':
        return {
          bgColor: 'bg-red-100 border-red-400 dark:bg-red-900/20 dark:border-red-600',
          textColor: 'text-red-800 dark:text-red-200',
          iconColor: 'text-red-600 dark:text-red-400',
          icon: AlertCircle,
          title: 'Token Expired',
          message: 'Your session has expired. Please refresh to continue.',
          buttonColor: 'bg-red-500 hover:bg-red-600 text-white'
        }
      case 'refreshing':
        return {
          bgColor: 'bg-blue-100 border-blue-400 dark:bg-blue-900/20 dark:border-blue-600',
          textColor: 'text-blue-800 dark:text-blue-200',
          iconColor: 'text-blue-600 dark:text-blue-400',
          icon: RefreshCw,
          title: 'Refreshing Token',
          message: 'Updating your session...',
          buttonColor: 'bg-blue-500 hover:bg-blue-600 text-white'
        }
      default:
        return {
          bgColor: 'bg-green-100 border-green-400 dark:bg-green-900/20 dark:border-green-600',
          textColor: 'text-green-800 dark:text-green-200',
          iconColor: 'text-green-600 dark:text-green-400',
          icon: CheckCircle,
          title: 'Token Valid',
          message: 'Your session is active.',
          buttonColor: 'bg-green-500 hover:bg-green-600 text-white'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg border max-w-sm z-50 ${config.bgColor}`}>
      <div className="flex items-start space-x-3">
        <div className={`mt-0.5 ${config.iconColor}`}>
          <Icon 
            className={`w-5 h-5 ${status === 'refreshing' ? 'animate-spin' : ''}`} 
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${config.textColor}`}>
            {config.title}
          </p>
          <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>
            {config.message}
          </p>
        </div>
        {status !== 'refreshing' && (
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
            className={`text-xs px-3 py-1 ${config.buttonColor} border-0 shadow-sm`}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>
    </div>
  )
}