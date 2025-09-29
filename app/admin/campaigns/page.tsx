"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Search, 
  Mail, 
  Plus, 
  RefreshCw, 
  Send, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  TrendingUp,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { EmailCampaign, CampaignStatus, CreateCampaignDto } from "@/types/email"
import { useRouter } from "next/navigation"

interface CampaignsResponse {
  campaigns: EmailCampaign[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState<CreateCampaignDto>({
    name: "",
    subject: "",
    html_content: "",
    text_content: ""
  })

  const router = useRouter()

  const fetchCampaigns = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/campaigns?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns')
      }

      const data: CampaignsResponse = await response.json()
      setCampaigns(data.campaigns)
      setCurrentPage(data.page)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.subject) {
      toast.error('Name and subject are required')
      return
    }

    try {
      setIsUpdating(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCampaign)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create campaign')
      }

      const campaign = await response.json()
      toast.success('Campaign created successfully')
      setIsCreateModalOpen(false)
      setNewCampaign({
        name: "",
        subject: "",
        html_content: "",
        text_content: ""
      })
      
      // Navigate to the campaign editor
      router.push(`/admin/campaigns/${campaign.id}/edit`)
    } catch (err) {
      console.error('Error creating campaign:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create campaign')
    } finally {
      setIsUpdating(false)
    }
  }

  const sendCampaign = async (campaignId: string) => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send campaign')
      }

      toast.success('Campaign sent successfully')
      await fetchCampaigns(currentPage)
    } catch (err) {
      console.error('Error sending campaign:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to send campaign')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete campaign')
      }

      toast.success('Campaign deleted successfully')
      await fetchCampaigns(currentPage)
    } catch (err) {
      console.error('Error deleting campaign:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete campaign')
    } finally {
      setIsUpdating(false)
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
    fetchCampaigns()
  }, [])

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && campaigns.length === 0) {
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
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create and manage email campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchCampaigns(currentPage)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {campaigns.filter(c => c.status === CampaignStatus.COMPLETED).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {campaigns.filter(c => [CampaignStatus.SENDING, CampaignStatus.SCHEDULED].includes(c.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {campaigns.reduce((sum, c) => sum + c.total_recipients, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            All email campaigns in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">{campaign.subject}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell>{campaign.total_recipients}</TableCell>
                  <TableCell>
                    {campaign.sent_count}/{campaign.total_recipients}
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/campaigns/${campaign.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {campaign.status === CampaignStatus.DRAFT && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="default" size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Send Campaign</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will send the campaign to {campaign.total_recipients} recipients. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => sendCampaign(campaign.id)}
                                disabled={isUpdating}
                              >
                                Send Campaign
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {[CampaignStatus.DRAFT, CampaignStatus.FAILED].includes(campaign.status) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteCampaign(campaign.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{campaign.name}&quot;. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteCampaign(campaign.id)}
                                disabled={isUpdating}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({campaigns.length} campaigns)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCampaigns(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCampaigns(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Create a new email campaign. You can edit the content after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Campaign Name *</Label>
              <Input
                id="name"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Beta Launch Announcement"
              />
            </div>
            <div>
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={newCampaign.subject}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="🎉 Carenograd is Live - Your AI Graduate School Assistant is Ready!"
              />
            </div>
            <div>
              <Label htmlFor="text_content">Text Content (Optional)</Label>
              <Textarea
                id="text_content"
                value={newCampaign.text_content || ""}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, text_content: e.target.value }))}
                placeholder="Plain text version of your email..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createCampaign}
                disabled={isUpdating || !newCampaign.name || !newCampaign.subject}
                className="flex-1"
              >
                {isUpdating ? 'Creating...' : 'Create Campaign'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}