import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import AdminSidebar from "@/components/AdminSidebar"
import AdminHeader from "@/components/AdminHeader"

interface User {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
}

async function checkAdminAccess(token: string): Promise<User | null> {
  try {
    // First, get user profile to check their actual role
    const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/profile`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })

    if (profileResponse.ok) {
      const user = await profileResponse.json()
      
      // Check if user has admin role and is active
      if (user.role === 'admin' && user.is_active) {
        console.log('Admin access granted for user:', user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          is_active: user.is_active
        }
      } else {
        console.log('Admin access denied: insufficient permissions', { role: user.role, active: user.is_active })
        return null
      }
    } else {
      console.log('Admin access denied: profile fetch failed', profileResponse.status)
      return null
    }

  } catch (error) {
    console.error('Admin access check failed:', error)
    return null
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  if (!token) {
    redirect('/auth')
  }

  const user = await checkAdminAccess(token)

  if (!user) {
    redirect('/?error=admin_access_denied')
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <AdminHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

