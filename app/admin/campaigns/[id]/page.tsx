"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  Edit,
  RefreshCw,
  Users,
  Mail,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send
} from "lucide-react"
import { toast } from "sonner"
import { EmailCampaign, CampaignStatus, EmailLog, EmailLogStatus, SubscriberStatus, SubscriberSource } from "@/types/email"
import { useAuth } from "@/contexts/AuthContext"

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  const { token } = useAuth()
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [isSendModalOpen, setIsSendModalOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendFilter, setSendFilter] = useState({
    status: [SubscriberStatus.ACTIVE],
    source: [] as SubscriberSource[],
    include_users: true,
    include_manual: true
  })
  const [error, setError] = useState<string | null>(null)

  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Campaign not found')
          router.push('/admin/campaigns')
          return
        }
        throw new Error('Failed to fetch campaign')
      }

      const data = await response.json()
      setCampaign(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [campaignId, token])

  const fetchEmailLogs = useCallback(async () => {
    try {
      setLogsLoading(true)
      const response = await fetch(`/api/admin/campaigns/${campaignId}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch email logs')
      }

      const data = await response.json()
      setEmailLogs(data.logs || [])
    } catch (err) {
      console.error('Error fetching email logs:', err)
      toast.error('Failed to fetch email logs')
    } finally {
      setLogsLoading(false)
    }
  }, [campaignId, token])

  const sendCampaign = async () => {
    try {
      setSending(true)
      const response = await fetch(`/api/admin/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient_filter: sendFilter
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send campaign')
      }

      toast.success('Campaign sent successfully!')
      setIsSendModalOpen(false)
      fetchCampaign() // Refresh campaign data
    } catch (err) {
      console.error('Error sending campaign:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to send campaign')
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: CampaignStatus) => {
    const statusConfig = {
      [CampaignStatus.DRAFT]: { variant: "secondary" as const, color: "gray" },
      [CampaignStatus.SCHEDULED]: { variant: "outline" as const, color: "blue" },
      [CampaignStatus.SENDING]: { variant: "default" as const, color: "yellow" },
      [CampaignStatus.COMPLETED]: { variant: "default" as const, color: "green" },
      [CampaignStatus.FAILED]: { variant: "destructive" as const, color: "red" },
      [CampaignStatus.CANCELLED]: { variant: "secondary" as const, color: "gray" },
    }

    const config = statusConfig[status]
    return (
      <Badge variant={config.variant}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getLogStatusBadge = (status: EmailLogStatus) => {
    const statusConfig = {
      [EmailLogStatus.QUEUED]: { variant: "outline" as const, icon: Clock },
      [EmailLogStatus.SENDING]: { variant: "outline" as const, icon: RefreshCw },
      [EmailLogStatus.SENT]: { variant: "default" as const, icon: Mail },
      [EmailLogStatus.DELIVERED]: { variant: "default" as const, icon: CheckCircle },
      [EmailLogStatus.BOUNCED]: { variant: "destructive" as const, icon: XCircle },
      [EmailLogStatus.FAILED]: { variant: "destructive" as const, icon: AlertCircle },
      [EmailLogStatus.UNSUBSCRIBED]: { variant: "secondary" as const, icon: XCircle },
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  useEffect(() => {
    fetchCampaign()
  }, [fetchCampaign])

  useEffect(() => {
    if (campaign && campaign.status !== CampaignStatus.DRAFT) {
      fetchEmailLogs()
    }
  }, [campaign, fetchEmailLogs])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error: {error || 'Campaign not found'}</div>
      </div>
    )
  }

  const deliveryRate = campaign.total_recipients > 0
    ? ((campaign.delivered_count / campaign.total_recipients) * 100).toFixed(1)
    : "0"

  const failureRate = campaign.total_recipients > 0
    ? ((campaign.failed_count / campaign.total_recipients) * 100).toFixed(1)
    : "0"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/campaigns')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(campaign.status)}
              <span className="text-sm text-muted-foreground">
                Created {new Date(campaign.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.status === CampaignStatus.DRAFT && (
            <Button onClick={() => router.push(`/admin/campaigns/${campaignId}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Campaign
            </Button>
          )}
          {campaign.status === CampaignStatus.DRAFT && (
            <Button onClick={() => setIsSendModalOpen(true)} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Send Campaign
            </Button>
          )}
          <Button variant="outline" onClick={fetchEmailLogs} disabled={logsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.total_recipients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Mail className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{campaign.sent_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{campaign.delivered_count}</div>
            <p className="text-xs text-muted-foreground">{deliveryRate}% rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{campaign.failed_count}</div>
            <p className="text-xs text-muted-foreground">{failureRate}% rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{campaign.unsubscribe_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              {campaign.status !== CampaignStatus.DRAFT && (
                <TabsTrigger value="logs">Email Logs</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Campaign Name</Label>
                    <p className="text-sm">{campaign.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email Subject</Label>
                    <p className="text-sm">{campaign.subject}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(campaign.status)}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm">{new Date(campaign.created_at).toLocaleString()}</p>
                  </div>
                  {campaign.started_at && (
                    <div>
                      <Label className="text-sm font-medium">Started</Label>
                      <p className="text-sm">{new Date(campaign.started_at).toLocaleString()}</p>
                    </div>
                  )}
                  {campaign.completed_at && (
                    <div>
                      <Label className="text-sm font-medium">Completed</Label>
                      <p className="text-sm">{new Date(campaign.completed_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label className="text-sm font-medium">HTML Content Preview</Label>
                <div
                  className="mt-2 border p-4 rounded bg-white max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: campaign.html_content || 'No HTML content' }}
                />
              </div>
              {campaign.text_content && (
                <div>
                  <Label className="text-sm font-medium">Text Content</Label>
                  <pre className="mt-2 text-sm bg-gray-50 p-4 rounded whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {campaign.text_content}
                  </pre>
                </div>
              )}
            </TabsContent>

            {campaign.status !== CampaignStatus.DRAFT && (
              <TabsContent value="logs" className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Label className="text-sm font-medium">Email Delivery Logs</Label>
                    <p className="text-xs text-muted-foreground">
                      Individual email delivery status for each recipient
                    </p>
                  </div>
                  <Button variant="outline" onClick={fetchEmailLogs} disabled={logsLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                {logsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Delivered At</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No email logs available
                          </TableCell>
                        </TableRow>
                      ) : (
                        emailLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{log.email}</div>
                                {log.name && (
                                  <div className="text-sm text-muted-foreground">{log.name}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getLogStatusBadge(log.status)}</TableCell>
                            <TableCell>
                              {log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell>
                              {log.delivered_at ? new Date(log.delivered_at).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell>
                              {log.error_message ? (
                                <span className="text-red-600 text-sm">{log.error_message}</span>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Send Campaign Modal */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Campaign</DialogTitle>
            <DialogDescription>
              Configure recipient filters and send your campaign.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Subscriber Status</Label>
              <div className="mt-2 space-y-2">
                {Object.values(SubscriberStatus).map(status => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={sendFilter.status?.includes(status)}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setSendFilter(prev => ({
                          ...prev,
                          status: checked
                            ? [...(prev.status || []), status]
                            : (prev.status || []).filter(s => s !== status)
                        }))
                      }}
                    />
                    <span className="text-sm">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>Include Sources</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sendFilter.include_users}
                    onChange={(e) => setSendFilter(prev => ({
                      ...prev,
                      include_users: e.target.checked
                    }))}
                  />
                  <span className="text-sm">Registered Users</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sendFilter.include_manual}
                    onChange={(e) => setSendFilter(prev => ({
                      ...prev,
                      include_manual: e.target.checked
                    }))}
                  />
                  <span className="text-sm">Manual Subscribers</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                This will send the campaign to subscribers matching your filter criteria. This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={sendCampaign}
              disabled={sending}
              className="bg-green-600 hover:bg-green-700"
            >
              {sending ? 'Sending...' : 'Send Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}