"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Zap, 
  Activity,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

interface SystemOverview {
  modelName: string
  totalRequestsAvailable: number
  totalRequestsUsed: number
  requestsRemaining: number
  systemUsagePercentage: number
  activeUsersCount: number
  requestsPerUser: number
  utilizationEfficiency: number
}

interface KeyPoolStats {
  totalKeys: number
  availableKeys: number
  rateLimitedKeys: number
  exhaustedKeys: number
  systemHealth: string
  keyUtilization: number
  estimatedRecoveryTime: string
}

interface UserAllocation {
  userId: string
  userEmail: string
  userName: string
  modelName: string
  allocatedRequestsToday: number
  requestsUsedToday: number
  requestsRemainingToday: number
  allocationPercentageUsed: number
  canMakeRequest: boolean
  warningLevel: string
  lastRequestAt: string
}

interface UsageTrend {
  date: string
  totalRequests: number
  uniqueUsers: number
  averageRequestsPerUser: number
  systemUtilization: number
  peakHourUsage: number
}

interface UsageTrendsData {
  model: string
  timeRange: {
    days: number
    startDate: string
    endDate: string
  }
  trends: UsageTrend[]
  summary: {
    totalRequests: number
    avgDailyUsers: number
    peakUsageDay: {
      date: string
      totalRequests: number
    }
    utilizationTrend: string
  }
}

interface QuotaAlert {
  userId: string
  userEmail: string
  userName: string
  alertLevel: string
  usagePercentage: number
  requestsRemaining: number
  model: string
  canMakeRequest: boolean
  message: string
}

interface AlertsData {
  alerts: QuotaAlert[]
  summary: {
    totalAlerts: number
    criticalAlerts: number
    highAlerts: number
    usersOverLimit: number
  }
}

const chartConfig = {
  requests: { label: "Requests", color: "#3b82f6" },
  users: { label: "Users", color: "#10b981" },
  utilization: { label: "Utilization", color: "#f59e0b" },
} satisfies ChartConfig

export default function QuotaMonitoringPage() {
  const [systemOverview, setSystemOverview] = useState<SystemOverview[]>([])
  const [keyPoolStats, setKeyPoolStats] = useState<KeyPoolStats | null>(null)
  const [userAllocations, setUserAllocations] = useState<{ allocations: UserAllocation[], total: number, page: number, totalPages: number }>({ allocations: [], total: 0, page: 1, totalPages: 1 })
  const [usageTrends, setUsageTrends] = useState<UsageTrendsData | null>(null)
  const [alerts, setAlerts] = useState<AlertsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash")
  const [trendsTimeRange, setTrendsTimeRange] = useState("30")
  const [allocationsPage, setAllocationsPage] = useState(1)
  const [allocationsLimit] = useState(10)
  
  // Adjustment modal state
  const [adjustingUser, setAdjustingUser] = useState<UserAllocation | null>(null)
  const [newAllocation, setNewAllocation] = useState("")

  const fetchSystemOverview = useCallback(async () => {
    try {
    //  console.log('🔄 Fetching system overview...')
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/admin/quota/system-overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch system overview')
      const data = await response.json()
     // console.log('📊 System Overview Data:', data)
      setSystemOverview(data)
    } catch (err) {
      console.error('❌ Error fetching system overview:', err)
      setSystemOverview([])
    }
  }, [])

  const fetchKeyPoolStats = useCallback(async () => {
    try {
     // console.log('🔄 Fetching key pool stats...')
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/admin/quota/key-pool-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch key pool stats')
      const data = await response.json()
    //  console.log('🔑 Key Pool Stats Data:', data)
      setKeyPoolStats(data)
    } catch (err) {
      console.error('❌ Error fetching key pool stats:', err)
      setKeyPoolStats(null)
    }
  }, [])

  const fetchUserAllocations = useCallback(async (page = 1, model = selectedModel) => {
    try {
   //   console.log(`🔄 Fetching user allocations (page ${page}, model: ${model})...`)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/quota/users?page=${page}&limit=${allocationsLimit}&model=${model}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch user allocations')
      const data = await response.json()
      // console.log('👥 User Allocations Data:', {
      //   totalUsers: data.total,
      //   currentPage: data.page,
      //   totalPages: data.totalPages,
      //   allocationsCount: data.allocations?.length || 0,
      //   model: model,
      //   data: data
      // })
      setUserAllocations(data)
    } catch {
      //console.error('❌ Error fetching user allocations:', err)
      setUserAllocations({ allocations: [], total: 0, page: 1, totalPages: 1 })
    }
  }, [selectedModel, allocationsLimit])

  const fetchUsageTrends = useCallback(async (days = trendsTimeRange, model = selectedModel) => {
    try {
    //  console.log(`🔄 Fetching usage trends (${days} days, model: ${model})...`)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/quota/usage-trends?days=${days}&model=${model}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch usage trends')
      const data = await response.json()
      // console.log('📈 Usage Trends Data:', {
      //   model: data.model,
      //   timeRange: data.timeRange,
      //   trendsCount: data.trends?.length || 0,
      //   summary: data.summary,
      //   data: data
      // })
      setUsageTrends(data)
    } catch (err) {
      console.error('❌ Error fetching usage trends:', err)
      setUsageTrends(null)
    }
  }, [trendsTimeRange, selectedModel])

  const fetchAlerts = useCallback(async () => {
    try {
     // console.log('🔄 Fetching quota alerts...')
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/admin/quota/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch alerts')
      const data = await response.json()
      // console.log('🚨 Quota Alerts Data:', {
      //   alertsCount: data.alerts?.length || 0,
      //   summary: data.summary,
      //   criticalAlerts: data.summary?.criticalAlerts || 0,
      //   highAlerts: data.summary?.highAlerts || 0,
      //   usersOverLimit: data.summary?.usersOverLimit || 0,
      //   data: data
      // })
      setAlerts(data)
    } catch {
     // console.error('❌ Error fetching alerts:', err)
      setAlerts({ alerts: [], summary: { totalAlerts: 0, criticalAlerts: 0, highAlerts: 0, usersOverLimit: 0 } })
    }
  }, [])

  const adjustUserAllocation = async (userId: string, modelName: string, dailyAllocation: number) => {
    try {
      // console.log(`🔄 Adjusting allocation for user ${userId}:`, {
      //   userId,
      //   modelName,
      //   dailyAllocation,
      //   previousAllocation: adjustingUser?.allocatedRequestsToday
      // })
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/quota/users/${userId}/adjust`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          modelName,
          dailyAllocation
        })
      })
      if (!response.ok) throw new Error('Failed to adjust allocation')
      
      await response.json()
     // console.log('✅ Allocation adjustment successful:', result)
      
      // Refresh user allocations
      await fetchUserAllocations(allocationsPage, selectedModel)
      setAdjustingUser(null)
      setNewAllocation("")
    } catch (err) {
     // console.error('❌ Error adjusting allocation:', err)
      setError(err instanceof Error ? err.message : 'Failed to adjust allocation')
      setAdjustingUser(null)
      setNewAllocation("")
    }
  }

  const refreshAllData = useCallback(async () => {
   // console.log('🔄 Refreshing all quota data...')
    setLoading(true)
    setError(null)
    try {
    //  console.log('⏱️ Starting parallel data fetch...')
      await Promise.all([
        fetchSystemOverview(),
        fetchKeyPoolStats(),
        fetchUserAllocations(allocationsPage, selectedModel),
        fetchUsageTrends(trendsTimeRange, selectedModel),
        fetchAlerts()
      ])
    //  console.log('✅ All quota data refreshed successfully')
    } catch (err) {
      console.error('❌ Failed to refresh quota data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [fetchSystemOverview, fetchKeyPoolStats, fetchUserAllocations, fetchUsageTrends, fetchAlerts, allocationsPage, selectedModel, trendsTimeRange])

  useEffect(() => {
   // console.log('🚀 Quota monitoring dashboard mounted, loading initial data...')
    refreshAllData()
  }, [refreshAllData])

  useEffect(() => {
    //console.log(`📊 User allocations filter changed (page: ${allocationsPage}, model: ${selectedModel})`)
    fetchUserAllocations(allocationsPage, selectedModel)
  }, [fetchUserAllocations, allocationsPage, selectedModel])

  useEffect(() => {
  //  console.log(`📈 Usage trends filter changed (days: ${trendsTimeRange}, model: ${selectedModel})`)
    fetchUsageTrends(trendsTimeRange, selectedModel)
  }, [fetchUsageTrends, trendsTimeRange, selectedModel])

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'HEALTHY': return 'text-green-600'
      case 'WARNING': return 'text-yellow-600'
      case 'CRITICAL': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'HEALTHY': return <CheckCircle className="h-4 w-4" />
      case 'WARNING': return <AlertTriangle className="h-4 w-4" />
      case 'CRITICAL': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getWarningLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-blue-100 text-blue-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Token Quota Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor AI model token usage, allocations, and system health
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="claude-3">Claude 3</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshAllData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {systemOverview.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No system overview data available</p>
            </CardContent>
          </Card>
        ) : (
          systemOverview.map((overview) => (
          <Card key={overview.modelName}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{overview.modelName}</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.systemUsagePercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {overview.totalRequestsUsed.toLocaleString()} / {overview.totalRequestsAvailable.toLocaleString()} requests used
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Active Users:</span>
                  <span>{overview.activeUsersCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Efficiency:</span>
                  <span>{overview.utilizationEfficiency.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Key Pool Health */}
      {keyPoolStats ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Key Pool Health
              <div className={`flex items-center gap-1 ${getHealthColor(keyPoolStats.systemHealth)}`}>
                {getHealthIcon(keyPoolStats.systemHealth)}
                <span className="text-sm font-medium">{keyPoolStats.systemHealth}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Total Keys</p>
                <p className="text-2xl font-bold">{keyPoolStats.totalKeys}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Available</p>
                <p className="text-2xl font-bold text-green-600">{keyPoolStats.availableKeys}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Rate Limited</p>
                <p className="text-2xl font-bold text-yellow-600">{keyPoolStats.rateLimitedKeys}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Exhausted</p>
                <p className="text-2xl font-bold text-red-600">{keyPoolStats.exhaustedKeys}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Utilization: {keyPoolStats.keyUtilization?.toFixed(1) || 0}%
              </span>
              {keyPoolStats.estimatedRecoveryTime && (
                <span className="text-sm text-muted-foreground">
                  Recovery: {keyPoolStats.estimatedRecoveryTime}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Key pool stats not available</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Usage Trends</TabsTrigger>
          <TabsTrigger value="allocations">User Allocations</TabsTrigger>
          <TabsTrigger value="alerts">Quota Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Select value={trendsTimeRange} onValueChange={setTrendsTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {usageTrends ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Request Trends</CardTitle>
                  <CardDescription>Daily request volume over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={usageTrends.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area 
                          type="monotone" 
                          dataKey="totalRequests" 
                          stroke={chartConfig.requests.color}
                          fill={chartConfig.requests.color}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>Daily active users and utilization</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={usageTrends.trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line 
                          type="monotone" 
                          dataKey="uniqueUsers" 
                          stroke={chartConfig.users.color}
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="systemUtilization" 
                          stroke={chartConfig.utilization.color}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Usage trends data not available</p>
              </CardContent>
            </Card>
          )}

          {usageTrends ? (
            <Card>
              <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Total Requests</p>
                    <p className="text-2xl font-bold">{usageTrends.summary.totalRequests.toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Avg Daily Users</p>
                    <p className="text-2xl font-bold">{usageTrends.summary.avgDailyUsers}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Peak Usage Day</p>
                    <p className="text-lg font-bold">{new Date(usageTrends.summary.peakUsageDay.date).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">{usageTrends.summary.peakUsageDay.totalRequests} requests</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Trend</p>
                    <div className="flex items-center gap-1">
                      {usageTrends.summary.utilizationTrend === 'increasing' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : usageTrends.summary.utilizationTrend === 'decreasing' ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="text-lg font-bold capitalize">{usageTrends.summary.utilizationTrend}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Usage summary not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Token Allocations
              </CardTitle>
              <CardDescription>
                Showing {userAllocations.allocations.length} of {userAllocations.total} users for {selectedModel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userAllocations.allocations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No user allocation data available</p>
                  </div>
                ) : (
                  userAllocations.allocations.map((allocation) => (
                  <div key={allocation.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{allocation.userName}</span>
                        <span className="text-sm text-muted-foreground">({allocation.userEmail})</span>
                        <Badge className={getWarningLevelColor(allocation.warningLevel)}>
                          {allocation.warningLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Used: {allocation.requestsUsedToday}/{allocation.allocatedRequestsToday}</span>
                        <span>Remaining: {allocation.requestsRemainingToday}</span>
                        <span>Usage: {allocation.allocationPercentageUsed.toFixed(1)}%</span>
                        {allocation.lastRequestAt && (
                          <span>Last: {new Date(allocation.lastRequestAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {allocation.canMakeRequest ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAdjustingUser(allocation)
                          setNewAllocation(allocation.allocatedRequestsToday.toString())
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  Page {userAllocations.page} of {userAllocations.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={userAllocations.page <= 1}
                    onClick={() => setAllocationsPage(userAllocations.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={userAllocations.page >= userAllocations.totalPages}
                    onClick={() => setAllocationsPage(userAllocations.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Adjustment Modal */}
          {adjustingUser && (
            <Card>
              <CardHeader>
                <CardTitle>Adjust Allocation for {adjustingUser.userName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="allocation">Daily Allocation</Label>
                    <Input
                      id="allocation"
                      type="number"
                      value={newAllocation}
                      onChange={(e) => setNewAllocation(e.target.value)}
                      placeholder="Enter new daily allocation"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => adjustUserAllocation(
                        adjustingUser.userId,
                        adjustingUser.modelName,
                        parseInt(newAllocation)
                      )}
                      disabled={!newAllocation || parseInt(newAllocation) <= 0}
                    >
                      Apply Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAdjustingUser(null)
                        setNewAllocation("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{alerts.summary.totalAlerts}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{alerts.summary.criticalAlerts}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Alerts</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{alerts.summary.highAlerts}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Over Limit</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{alerts.summary.usersOverLimit}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Active Quota Alerts</CardTitle>
                  <CardDescription>Users approaching or exceeding their quota limits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.alerts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No quota alerts at this time</p>
                      </div>
                    ) : (
                      alerts.alerts.map((alert) => (
                        <div key={alert.userId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{alert.userName}</span>
                              <span className="text-sm text-muted-foreground">({alert.userEmail})</span>
                              <Badge className={getAlertLevelColor(alert.alertLevel)}>
                                {alert.alertLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Usage: {alert.usagePercentage.toFixed(1)}%</span>
                              <span>Remaining: {alert.requestsRemaining}</span>
                              <span>Model: {alert.model}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {alert.canMakeRequest ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Convert alert to allocation format for adjustment
                                const allocation: UserAllocation = {
                                  userId: alert.userId,
                                  userEmail: alert.userEmail,
                                  userName: alert.userName,
                                  modelName: alert.model,
                                  allocatedRequestsToday: 50, // Default, will be adjusted
                                  requestsUsedToday: 0,
                                  requestsRemainingToday: alert.requestsRemaining,
                                  allocationPercentageUsed: alert.usagePercentage,
                                  canMakeRequest: alert.canMakeRequest,
                                  warningLevel: alert.alertLevel,
                                  lastRequestAt: ""
                                }
                                setAdjustingUser(allocation)
                                setNewAllocation("75") // Suggest increased allocation
                              }}
                            >
                              <Settings className="h-3 w-3 mr-1" />
                              Increase Quota
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Quota alerts data not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}