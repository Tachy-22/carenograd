"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Save,
  Eye,
  Users,
  Mail,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { EmailCampaign, CampaignStatus, CampaignPreview, SubscriberStatus, SubscriberSource } from "@/types/email"
import { useAuth } from "@/contexts/AuthContext"

export default function CampaignEditPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string
  const { token } = useAuth()
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<CampaignPreview | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    html_content: "",
    text_content: "",
    recipient_filter: {
      status: [SubscriberStatus.ACTIVE],
      source: [] as SubscriberSource[],
      include_users: true,
      include_manual: true
    }
  })

  const fetchCampaign = async () => {
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
      setFormData({
        name: data.name,
        subject: data.subject,
        html_content: data.html_content || "",
        text_content: data.text_content || "",
        recipient_filter: data.recipient_filter || {
          status: [SubscriberStatus.ACTIVE],
          source: [],
          include_users: true,
          include_manual: true
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const saveCampaign = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          subject: formData.subject,
          html_content: formData.html_content,
          text_content: formData.text_content
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save campaign')
      }

      const updatedCampaign = await response.json()
      setCampaign(updatedCampaign)
      toast.success('Campaign saved successfully')
    } catch (err) {
      console.error('Error saving campaign:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  const previewCampaign = async () => {
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          html_content: formData.html_content,
          text_content: formData.text_content,
          subject: formData.subject
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to preview campaign')
      }

      const previewData = await response.json()
      setPreview(previewData)
      setIsPreviewOpen(true)
    } catch (err) {
      console.error('Error previewing campaign:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to preview campaign')
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

  useEffect(() => {
    fetchCampaign()
  }, [campaignId, fetchCampaign])

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

  const canEdit = campaign.status === CampaignStatus.DRAFT

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
          <Button variant="outline" onClick={previewCampaign}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          {canEdit && (
            <Button onClick={saveCampaign} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <Mail className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{campaign.delivered_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{campaign.failed_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>
            {canEdit ? 'Edit your campaign details and content' : 'Campaign details (read-only)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Email Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div>
                <Label htmlFor="html_content">HTML Content</Label>
                <Textarea
                  id="html_content"
                  value={formData.html_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, html_content: e.target.value }))}
                  disabled={!canEdit}
                  rows={12}
                  placeholder="Enter your HTML email content here..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can use HTML tags and inline CSS for styling
                </p>
              </div>
              <div>
                <Label htmlFor="text_content">Text Content (Optional)</Label>
                <Textarea
                  id="text_content"
                  value={formData.text_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                  disabled={!canEdit}
                  rows={6}
                  placeholder="Plain text version of your email..."
                />
              </div>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-4">
              <div>
                <Label>Subscriber Status</Label>
                <div className="mt-2 space-y-2">
                  {Object.values(SubscriberStatus).map(status => (
                    <label key={status} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.recipient_filter.status?.includes(status)}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setFormData(prev => ({
                            ...prev,
                            recipient_filter: {
                              ...prev.recipient_filter,
                              status: checked
                                ? [...(prev.recipient_filter.status || []), status]
                                : (prev.recipient_filter.status || []).filter(s => s !== status)
                            }
                          }))
                        }}
                        disabled={!canEdit}
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
                      checked={formData.recipient_filter.include_users}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recipient_filter: {
                          ...prev.recipient_filter,
                          include_users: e.target.checked
                        }
                      }))}
                      disabled={!canEdit}
                    />
                    <span className="text-sm">Registered Users</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.recipient_filter.include_manual}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        recipient_filter: {
                          ...prev.recipient_filter,
                          include_manual: e.target.checked
                        }
                      }))}
                      disabled={!canEdit}
                    />
                    <span className="text-sm">Manual Subscribers</span>
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Campaign Preview</DialogTitle>
            <DialogDescription>
              Preview how your email will look to recipients
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Subject:</Label>
                <p className="text-sm">{preview.subject}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">HTML Content:</Label>
                <div
                  className="border p-4 rounded bg-white"
                  dangerouslySetInnerHTML={{ __html: preview.html_content }}
                />
              </div>
              {preview.text_content && (
                <div>
                  <Label className="text-sm font-medium">Text Content:</Label>
                  <pre className="text-sm bg-gray-50 p-4 rounded whitespace-pre-wrap">
                    {preview.text_content}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}