"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, BarChart3, Activity, TrendingUp, Clock, UserCheck } from "lucide-react"
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface DashboardStats {
  users: {
    totalUsers: number
    activeUsers: number
    adminUsers: number
    newUsersToday: number
    newUsersThisWeek: number
    newUsersThisMonth: number
  }
  conversations: {
    totalConversations: number
    conversationsToday: number
    conversationsThisWeek: number
    conversationsThisMonth: number
  }
  messages: {
    totalMessages: number
    messagesToday: number
    messagesThisWeek: number
    messagesThisMonth: number
  }
}

interface ChartData {
  userRegistrations: Array<{ date: string; count: number }>
  activeUsers: Array<{ date: string; count: number }>
  conversationGrowth: Array<{ date: string; conversations: number; messages: number }>
  userEngagement: Array<{ name: string; value: number; color: string }>
}

const chartConfig = {
  users: {
    label: "Users",
    color: "#10b981",
  },
  conversations: {
    label: "Conversations",
    color: "#3b82f6",
  },
  messages: {
    label: "Messages",
    color: "#f59e0b",
  },
  active: {
    label: "Active Users",
    color: "#8b5cf6",
  },
} satisfies ChartConfig

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('access_token')
        
        // Fetch dashboard stats
        const [statsResponse, chartsResponse] = await Promise.all([
          fetch('/api/admin/dashboard/stats', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/admin/charts/combined-metrics?days=30', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ])

        if (!statsResponse.ok || !chartsResponse.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const statsData = await statsResponse.json()
        const chartsData = await chartsResponse.json()
        
       // console.log('DEBUG Dashboard - Full charts data:', chartsData)
        
        setStats(statsData)
        
        // Transform chart data for better insights
        const conversationsSliced = chartsData.charts.conversations.slice(-14)
        const messagesSliced = chartsData.charts.messages.slice(-14)
        
       // console.log('DEBUG Dashboard - conversations:', conversationsSliced)
      // console.log('DEBUG Dashboard - messages:', messagesSliced)
        
        const conversationGrowth = conversationsSliced.map((item: { date: string; count: number }) => {
          // Find matching message data by date
          const matchingMessage = messagesSliced.find((msgItem: { date: string; count: number }) => msgItem.date === item.date)
          const result = {
            date: item.date,
            conversations: item.count,
            messages: matchingMessage?.count || 0
          }
        //  console.log('DEBUG Dashboard combined item:', result)
          return result
        })
        
        setChartData({
          userRegistrations: chartsData.charts.userRegistrations.slice(-14), // Last 14 days
          activeUsers: chartsData.charts.activeUsers.slice(-14),
          conversationGrowth,
          userEngagement: [
            { name: 'Active Daily', value: statsData.users.activeUsers, color: '#10b981' },
            { name: 'Inactive', value: statsData.users.totalUsers - statsData.users.activeUsers, color: '#6b7280' },
          ]
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !stats || !chartData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error || 'No data available'}</div>
      </div>
    )
  }


  const avgMessagesPerConversation = stats.conversations.totalConversations > 0 
    ? (stats.messages.totalMessages / stats.conversations.totalConversations).toFixed(1)
    : '0'

  const userRetentionRate = stats.users.totalUsers > 0 
    ? (stats.users.activeUsers / stats.users.totalUsers * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Real-time insights into user behavior and platform performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.users.newUsersToday}</span> today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Retention</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRetentionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.activeUsers} of {stats.users.totalUsers} users active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Messages/Chat</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMessagesPerConversation}</div>
            <p className="text-xs text-muted-foreground">
              {stats.messages.totalMessages} total messages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations.conversationsToday}</div>
            <p className="text-xs text-muted-foreground">
              conversations started today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth (14 days)</CardTitle>
            <CardDescription>Daily new user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.userRegistrations}>
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
            <CardTitle>User Engagement</CardTitle>
            <CardDescription>Active vs inactive users</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.userEngagement}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.userEngagement.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Activity (14 days)</CardTitle>
          <CardDescription>Conversations and messages over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.conversationGrowth}>
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
                  dot={{ r: 5, fill: chartConfig.conversations.color }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke={chartConfig.messages.color}
                  strokeWidth={3}
                  dot={{ r: 5, fill: chartConfig.messages.color }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Growth This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">New Users</span>
              <span className="font-medium text-green-600">+{stats.users.newUsersThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Conversations</span>
              <span className="font-medium text-blue-600">+{stats.conversations.conversationsThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Messages</span>
              <span className="font-medium text-purple-600">+{stats.messages.messagesThisWeek}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Monthly Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">New Users</span>
              <span className="font-medium">{stats.users.newUsersThisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Conversations</span>
              <span className="font-medium">{stats.conversations.conversationsThisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Messages</span>
              <span className="font-medium">{stats.messages.messagesThisMonth}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Admin Users</span>
              <span className="font-medium text-red-600">{stats.users.adminUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active Rate</span>
              <span className="font-medium text-green-600">{userRetentionRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Avg Engagement</span>
              <span className="font-medium text-blue-600">{avgMessagesPerConversation} msg/chat</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}