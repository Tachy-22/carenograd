"use client"

import { useState } from "react"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { ChevronDown, BarChart3, Crown, Zap } from "lucide-react"
import ManageSubscriptionModal from "@/components/ManageSubscriptionModal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function SubscriptionDisplay() {
  const { quotaStatus, currentSubscription, isQuotaLoading } = useSubscription()
  const router = useRouter()
  const [isManageModalOpen, setIsManageModalOpen] = useState(false)

  const getProgressColor = (messagesRemaining: number, dailyLimit: number) => {
    const percentageUsed = ((dailyLimit - messagesRemaining) / dailyLimit) * 100
    if (percentageUsed >= 90) return "bg-red-500"
    if (percentageUsed >= 75) return "bg-orange-500"
    if (percentageUsed >= 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getTierIcon = (tierName: string) => {
    return tierName === 'pro' ? <Crown className="h-4 w-4" /> : <Zap className="h-4 w-4" />
  }

  const handleUpgrade = () => {
    router.push('/subscription')
  }

  const handleManageSubscription = () => {
    setIsManageModalOpen(true)
  }

  if (isQuotaLoading || !quotaStatus) {
    return (
      <div className="z-50">
        <div className="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
      </div>
    )
  }

  const percentageUsed = (quotaStatus.messages_used / quotaStatus.daily_limit) * 100
  const shouldShowUpgradePrompt = quotaStatus.tier_name === 'free' && quotaStatus.messages_remaining <= 5

  return (
    <div className="z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`w-fit text-sm h-[2rem] px-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-0 flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700 ${
            shouldShowUpgradePrompt ? 'bg-orange-50 border border-orange-200' : ''
          }`}>
            <span className="hidden sm:inline flex items-center gap-1">
              {getTierIcon(quotaStatus.tier_name)}
              {quotaStatus.tier_display_name}
            </span>
            <BarChart3 className="h-4 w-4 sm:hidden" />
            <ChevronDown className="h-3 w-3" />
            <span className="sr-only">
              Messages used: {quotaStatus.messages_used} of {quotaStatus.daily_limit}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[16rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="space-y-3">
            {/* Tier Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTierIcon(quotaStatus.tier_name)}
                <span className="font-medium text-sm">{quotaStatus.tier_display_name} Tier</span>
              </div>
              {quotaStatus.tier_name === 'pro' && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(quotaStatus.messages_remaining, quotaStatus.daily_limit)}`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>

            {/* Usage Stats */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Messages used today:</span>
                <span className="font-medium">{quotaStatus.messages_used}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Messages remaining:</span>
                <span className="font-medium">{quotaStatus.messages_remaining}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Daily limit:</span>
                <span className="font-medium">{quotaStatus.daily_limit}</span>
              </div>
            </div>

            {/* Subscription period for Pro users */}
            {currentSubscription && quotaStatus.tier_name === 'pro' && (
              <div className="text-xs text-gray-500 dark:text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-600">
                <div>
                  Next billing: {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </div>
                <div>
                  ₦{currentSubscription.price_ngn.toLocaleString()}/month
                </div>
              </div>
            )}

            {/* Upgrade prompt for free users */}
            {/* {quotaStatus.tier_name === 'free' && (
              <div className="mt-3 p-3 border rounded-lg">
                <div className="text-xs  font-medium mb-2">
                  🚀 Upgrade to Pro
                </div>
                <div className="text-xs text-blue-700 mb-2">
                  Get 100 messages/day for only ₦3,000/month
                </div>
                <Button
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={handleUpgrade}
                >
                  Upgrade Now
                </Button>
              </div>
            )} */}

            {/* Low messages warning */}
            {shouldShowUpgradePrompt && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                ⚠️ Only {quotaStatus.messages_remaining} messages left today
              </div>
            )}

            {/* Action buttons */}
            <DropdownMenuSeparator />
            
            {quotaStatus.tier_name === 'free' ? (
              <DropdownMenuItem onClick={handleUpgrade} className="cursor-pointer">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleManageSubscription} className="cursor-pointer">
                <BarChart3 className="h-4 w-4 mr-2" />
                Manage Subscription
              </DropdownMenuItem>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ManageSubscriptionModal 
        isOpen={isManageModalOpen} 
        onOpenChange={setIsManageModalOpen}
      />
    </div>
  )
}