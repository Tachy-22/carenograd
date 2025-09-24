"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, BarChart3, Target, Zap } from "lucide-react"
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  ResponsiveContainer
} from "recharts"

interface ChartDataPoint {
  date: string
  count: number
}

interface CombinedMetrics {
  timeRange: {
    days: number
    startDate: string
    endDate: string
  }
  charts: {
    userRegistrations: ChartDataPoint[]
    activeUsers: ChartDataPoint[]
    conversations: ChartDataPoint[]
    messages: ChartDataPoint[]
  }
  summary: {
    totalNewUsers: number
    avgDailyActiveUsers: number
    totalConversations: number
    totalMessages: number
  }
}

interface UserBehaviorData {
  userRetention: Array<{ cohort: string; week1: number; week2: number; week3: number; week4: number }>
  sessionDuration: Array<{ duration: string; users: number }>
  featureUsage: Array<{ feature: string; usage: number; color: string }>
  peakHours: Array<{ hour: number; activity: number }>
  userJourney: Array<{ step: string; users: number; conversionRate: number }>
}

const chartConfig = {
  users: { label: "Users", color: "#10b981" },
  conversations: { label: "Conversations", color: "#3b82f6" },
  messages: { label: "Messages", color: "#f59e0b" },
  active: { label: "Active Users", color: "#8b5cf6" },
  retention: { label: "Retention", color: "#ef4444" },
} satisfies ChartConfig

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<CombinedMetrics | null>(null)
  const [, setBehaviorData] = useState<UserBehaviorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("30")

  const fetchMetrics = useCallback(async (days = "30") => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/charts/combined-metrics?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
    //  console.log('DEBUG Full API response:', data)
      
      setMetrics(data)
      generateBehaviorData()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const generateBehaviorData = () => {
    // TODO: Replace with actual API calls to your analytics backend
    // For now, don't show behavior data until real endpoints are available
    setBehaviorData(null)
  }

  useEffect(() => {
    fetchMetrics(timeRange)
    generateBehaviorData()
  }, [timeRange, fetchMetrics])

  const calculateTrend = (data: ChartDataPoint[]) => {
    if (data.length < 2) return 0
    const recent = data.slice(-7)
    const previous = data.slice(-14, -7)
    
    const recentAvg = recent.reduce((sum, point) => sum + point.count, 0) / recent.length
    const previousAvg = previous.reduce((sum, point) => sum + point.count, 0) / previous.length
    
    if (previousAvg === 0) return 0
    return ((recentAvg - previousAvg) / previousAvg) * 100
  }

  const formatTrend = (trend: number) => {
    const isPositive = trend > 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const color = isPositive ? 'text-green-600' : 'text-red-600'
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs">{Math.abs(trend).toFixed(1)}%</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error || 'No data available'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into user behavior and engagement patterns
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
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

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateTrend(metrics.charts.userRegistrations).toFixed(1)}%</div>
            {formatTrend(calculateTrend(metrics.charts.userRegistrations))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics.summary.totalMessages / metrics.summary.totalConversations) * 10).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on msg/conversation ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metrics.summary.avgDailyActiveUsers / metrics.summary.totalNewUsers) * 100).toFixed(1)}%
            </div>
            {formatTrend(calculateTrend(metrics.charts.activeUsers))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Excellent</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>Daily new registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.charts.userRegistrations}>
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
                        dataKey="count" 
                        stroke={chartConfig.users.color}
                        fill={chartConfig.users.color}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Comparison</CardTitle>
                <CardDescription>Conversations vs Messages daily</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={(() => {
                      const conversationsData = metrics.charts.conversations.slice(-14)
                      const messagesData = metrics.charts.messages.slice(-14)
                      
                    //  console.log('DEBUG conversations data:', conversationsData)
                      // console.log('DEBUG messages data:', messagesData)
                      
                      // Create a proper date-based mapping
                      const combinedData = conversationsData.map((convItem) => {
                        // Find matching message data by date
                        const matchingMessage = messagesData.find(msgItem => msgItem.date === convItem.date)
                        const result = {
                          date: convItem.date,
                          conversations: convItem.count,
                          messages: matchingMessage?.count || 0
                        }
                     //   console.log('DEBUG combined item:', result)
                        return result
                      })
                      
                      return combinedData
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={12}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis fontSize={12} />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="conversations" 
                        stroke={chartConfig.conversations.color}
                        strokeWidth={3}
                        dot={{ r: 4, fill: chartConfig.conversations.color }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="messages" 
                        stroke={chartConfig.messages.color}
                        strokeWidth={3}
                        dot={{ r: 4, fill: chartConfig.messages.color }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Over Time</CardTitle>
                <CardDescription>Active users and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.charts.activeUsers}>
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
                        dataKey="count" 
                        stroke={chartConfig.active.color}
                        fill={chartConfig.active.color}
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}