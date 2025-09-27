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
  DialogTrigger,
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
import { Search, Mail, UserPlus, RefreshCw, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Subscriber {
  id: string
  email: string
  name?: string
  source: string
  status: 'active' | 'unsubscribed' | 'bounced'
  subscribed_at: string
  updated_at: string
}

interface SubscribersResponse {
  subscribers: Subscriber[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [total, setTotal] = useState<number>(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newSubscriber, setNewSubscriber] = useState({ email: "", name: "" })
  const [isAddingSubscriber, setIsAddingSubscriber] = useState(false)

  const fetchSubscribers = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/subscribers?page=${page}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch subscribers')
      }

      const data: SubscribersResponse = await response.json()
      setSubscribers(data.subscribers)
      setTotal(data.total)
      setCurrentPage(data.page)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addSubscriber = async () => {
    if (!newSubscriber.email) {
      toast.error('Email is required')
      return
    }

    try {
      setIsAddingSubscriber(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newSubscriber.email,
          name: newSubscriber.name || null,
          source: 'admin'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add subscriber')
      }

      toast.success('Subscriber added successfully')
      setNewSubscriber({ email: "", name: "" })
      await fetchSubscribers(currentPage)
    } catch (err) {
      console.error('Error adding subscriber:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to add subscriber')
    } finally {
      setIsAddingSubscriber(false)
    }
  }

  const updateSubscriberStatus = async (subscriberId: string, status: 'active' | 'unsubscribed') => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        throw new Error('Failed to update subscriber status')
      }

      toast.success('Subscriber status updated')
      await fetchSubscribers(currentPage)
      setSelectedSubscriber(null)
    } catch (err) {
      console.error('Error updating subscriber status:', err)
      toast.error('Failed to update subscriber status')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteSubscriber = async (subscriberId: string) => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete subscriber')
      }

      toast.success('Subscriber deleted')
      await fetchSubscribers(currentPage)
      setSelectedSubscriber(null)
    } catch (err) {
      console.error('Error deleting subscriber:', err)
      toast.error('Failed to delete subscriber')
    } finally {
      setIsUpdating(false)
    }
  }

  const exportSubscribers = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/admin/subscribers?export=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to export subscribers')
      }

      const data = await response.json()
      const csv = [
        ['Email', 'Name', 'Source', 'Status', 'Subscribed At'].join(','),
        ...data.subscribers.map((sub: Subscriber) => [
          sub.email,
          sub.name || '',
          sub.source,
          sub.status,
          new Date(sub.subscribed_at).toISOString()
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `subscribers_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success('Subscribers exported successfully')
    } catch (err) {
      console.error('Error exporting subscribers:', err)
      toast.error('Failed to export subscribers')
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const filteredSubscribers = subscribers.filter(subscriber =>
    subscriber.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subscriber.name && subscriber.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading && subscribers.length === 0) {
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
          <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
          <p className="text-muted-foreground">
            Manage newsletter subscribers and mailing lists
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportSubscribers} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => fetchSubscribers(currentPage)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {/* {subscribers.filter(s => s.status === 'active').length} */}
              {total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <UserPlus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {subscribers.filter(s => s.status === 'unsubscribed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounced</CardTitle>
            <UserPlus className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {subscribers.filter(s => s.status === 'bounced').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>
            All newsletter subscribers in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscribers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Subscriber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subscriber</DialogTitle>
                  <DialogDescription>
                    Add a new subscriber to the newsletter
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSubscriber.email}
                      onChange={(e) => setNewSubscriber(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="subscriber@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name (Optional)</Label>
                    <Input
                      id="name"
                      value={newSubscriber.name}
                      onChange={(e) => setNewSubscriber(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <Button
                    onClick={addSubscriber}
                    disabled={isAddingSubscriber || !newSubscriber.email}
                    className="w-full"
                  >
                    {isAddingSubscriber ? 'Adding...' : 'Add Subscriber'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscribed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">{subscriber.email}</div>
                        {subscriber.name && (
                          <div className="text-sm text-muted-foreground">{subscriber.name}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{subscriber.source}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        subscriber.status === 'active' ? 'default' :
                          subscriber.status === 'unsubscribed' ? 'secondary' : 'destructive'
                      }
                    >
                      {subscriber.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(subscriber.subscribed_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubscriber(subscriber)}
                        >
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Subscriber: {selectedSubscriber?.email}</DialogTitle>
                          <DialogDescription>
                            Update subscriber status or remove from list
                          </DialogDescription>
                        </DialogHeader>

                        {selectedSubscriber && (
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              {selectedSubscriber.status !== 'active' && (
                                <Button
                                  onClick={() =>
                                    updateSubscriberStatus(selectedSubscriber.id, 'active')
                                  }
                                  disabled={isUpdating}
                                >
                                  Reactivate
                                </Button>
                              )}

                              {selectedSubscriber.status === 'active' && (
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    updateSubscriberStatus(selectedSubscriber.id, 'unsubscribed')
                                  }
                                  disabled={isUpdating}
                                >
                                  Unsubscribe
                                </Button>
                              )}

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" disabled={isUpdating}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete {selectedSubscriber.email} from
                                      the subscriber list. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteSubscriber(selectedSubscriber.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({subscribers.length} subscribers)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSubscribers(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSubscribers(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}