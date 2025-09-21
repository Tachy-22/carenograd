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
  DialogFooter,
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Shield, UserX, User, RefreshCw } from "lucide-react"

interface User {
  id: string
  email: string
  name: string
  picture?: string
  role: 'user' | 'admin'
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/users?page=${page}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setCurrentPage(data.page)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })

      if (!response.ok) {
        throw new Error('Failed to update user role')
      }

      // Refresh users list
      await fetchUsers(currentPage)
      setSelectedUser(null)
    } catch (err) {
      console.error('Error updating user role:', err)
      alert('Failed to update user role')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      // Refresh users list
      await fetchUsers(currentPage)
      setSelectedUser(null)
    } catch (err) {
      console.error('Error updating user status:', err)
      alert('Failed to update user status')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      setIsUpdating(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      // Refresh users list
      await fetchUsers(currentPage)
      setSelectedUser(null)
    } catch (err) {
      console.error('Error deleting user:', err)
      alert('Failed to delete user')
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading && users.length === 0) {
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button onClick={() => fetchUsers(currentPage)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            All registered users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          User
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage User: {selectedUser?.name}</DialogTitle>
                          <DialogDescription>
                            Update user role and account status
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedUser && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="role">Role</Label>
                              <Select
                                value={selectedUser.role}
                                onValueChange={(value: 'user' | 'admin') =>
                                  updateUserRole(selectedUser.id, value)
                                }
                                disabled={isUpdating}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant={selectedUser.is_active ? "destructive" : "default"}
                                onClick={() =>
                                  updateUserStatus(selectedUser.id, !selectedUser.is_active)
                                }
                                disabled={isUpdating}
                              >
                                {selectedUser.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <User className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </Button>

                              {selectedUser.role !== 'admin' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isUpdating}>
                                      Delete User
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete User
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete {selectedUser.name} and all
                                        associated data. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteUser(selectedUser.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
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
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(currentPage + 1)}
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