"use client"

import { useAllocation } from "@/contexts/TokenUsageContext"
import { useEffect, useState } from "react"
import { ChevronDown, BarChart3 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function TokenUsageDisplay() {
  const { allocation, isLoading } = useAllocation()

 
  const getCircleColor = (warningLevel: string) => {
    switch (warningLevel) {
      case "CRITICAL": return "bg-red-500"
      case "HIGH": return "bg-orange-500"
      case "MEDIUM": return "bg-yellow-500"
      case "LOW": return "bg-green-500"
      default: return "bg-green-500"
    }
  }

  const getProgressColor = (warningLevel: string) => {
    switch (warningLevel) {
      case "CRITICAL": return "bg-red-500"
      case "HIGH": return "bg-orange-500"
      case "MEDIUM": return "bg-yellow-500"
      case "LOW": return "bg-green-500"
      default: return "bg-green-500"
    }
  }

  // Prevent hydration mismatch by not rendering until hydrated


  if (isLoading) {
    return (
      <div className="z-50">
        <div className="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
      </div>
    )
  }

  if (!allocation) {
    return null
  }

  return (
    <div className="z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`w-fit text-sm h-[2rem] px-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-0 flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-700`}>
            <span className="hidden sm:inline">Daily Allocation</span>
            <BarChart3 className="h-4 w-4 sm:hidden" />
            <ChevronDown className="h-3 w-3" />
            <span className="sr-only">Token usage: {(allocation.allocationPercentageUsed || 0).toFixed(1)}%</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[12rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="space-y-3">


            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(allocation.warningLevel || 'LOW')}`}
                style={{ width: `${Math.min(allocation.allocationPercentageUsed || 0, 100)}%` }}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Used: {allocation.requestsUsedToday || 0} ({(allocation.allocationPercentageUsed || 0).toFixed(1)}%)</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Remaining: {allocation.requestsRemainingToday || 0}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Allocated: {allocation.allocatedRequestsToday || 0}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Active users: {allocation.activeUsersCount || 0}</span>
              </div>
              {/* <div className="text-xs text-gray-500 dark:text-gray-500">
                Model: {allocation.modelName || 'Unknown'}
              </div> */}
            </div>

            {allocation.shouldWarn && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                ⚠️ Approaching limit
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}