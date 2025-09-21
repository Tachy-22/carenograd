"use client"

import { useAllocation } from '@/contexts/TokenUsageContext'

export function AllocationDisplay() {
  const { allocation, isLoading } = useAllocation()

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (!allocation) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
        <div className="text-sm text-gray-500">Unable to load allocation data</div>
      </div>
    )
  }

  const getStatusColor = (warningLevel: string) => {
    switch (warningLevel) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200'
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-orange-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Daily Usage</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(allocation.warningLevel)}`}>
          {allocation.warningLevel}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Requests Used</span>
          <span>{allocation.requestsUsedToday}/{allocation.allocatedRequestsToday}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(allocation.allocationPercentageUsed)}`}
            style={{ width: `${Math.min(allocation.allocationPercentageUsed, 100)}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {allocation.allocationPercentageUsed.toFixed(1)}% used
        </div>
      </div>

      {/* Allocation Message */}
      <div className="text-sm text-gray-700 mb-3">
        {allocation.allocationMessage}
      </div>

      {/* Active Users Info */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Active users today: {allocation.activeUsersCount}</span>
        <span>Remaining: {allocation.requestsRemainingToday}</span>
      </div>

      {/* Warning Alert */}
      {allocation.shouldWarn && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
          ⚠️ You&apos;re approaching your daily limit. Your allocation may increase if fewer users are active.
        </div>
      )}

      {/* Model Info */}
      {/* <div className="mt-2 text-xs text-gray-400">
        Model: {allocation.modelName}
      </div> */}
    </div>
  )
}