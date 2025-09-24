import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ConditionalLayout from "@/components/ConditionalLayout"
import { SubscriptionProvider } from "@/contexts/SubscriptionContext"
import { cookies } from "next/headers"
import { SidebarProvider } from "@/components/ui/sidebar";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Carenograd - AI Graduate School Assistant",
  description: "Your AI Assistant for Graduate School Success",
};

interface RawConversation {
  id: string
  title: string
  lastMessage?: string
  updated_at: string
  created_at: string
}


export interface Conversation {
  id: string
  title: string
  lastMessage: string
  updatedAt: string
  createdAt: string
}

export interface DatabaseMessage {
  id: string
  conversation_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: {
    usage?: {
      inputTokens: number
      totalTokens: number
      outputTokens: number
    }
    toolCalls?: Array<{
      args: Record<string, unknown>
      toolName: string
    }>
    finishReason?: string
    toolsUsed?: string[]
    stepsUsed?: number
    executionTime?: number
    errors?: unknown[]
  }
  created_at: string
}

async function fetchConversations(token: string): Promise<Conversation[] | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/conversations`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    })

    if (response.ok) {
      const { conversations } = await response.json()

     // console.log('DEBUG: Backend returned conversations:', conversations)

      if (!conversations || conversations.length === 0) {
        return null
      }

      // Sort conversations by updated_at in descending order (most recent first)
      return conversations.sort((a: RawConversation, b: RawConversation) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ).map((conv: RawConversation) => ({
        id: conv.id,
        title: conv.title,
        lastMessage: conv.lastMessage || "",
        updatedAt: conv.updated_at,
        createdAt: conv.created_at
      }))
    } else {
      console.error('Failed to fetch conversations:', response.statusText)
      return null
    }
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return null
  }
}

export async function fetchConversationMessages(conversationId: string, token: string): Promise<DatabaseMessage[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/conversations/${conversationId}/messages`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache"
      }
    })

    if (response.ok) {
      const data = await response.json()
      return data.messages || []
    } else {
      console.error('Failed to fetch conversation messages:', response.statusText)
      return []
    }
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    return []
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  // Fetch conversations server-side
  const initialConversations = token ? await fetchConversations(token) : null

  // console.log('Server-side conversations fetch:', {
  //   hasToken: !!token,
  //   conversationCount: initialConversations && initialConversations.length
  // })
  const conversations = initialConversations && initialConversations.length > 0 ? initialConversations : null
 // console.log('DEBUG: Before passing to AppLayout - conversations:', conversations)
  //console.log('DEBUG: Before passing to AppLayout - initialConversations:', initialConversations)

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SubscriptionProvider>
            <SidebarProvider defaultOpen={true}>
              <ConditionalLayout initialConversations={conversations}>
                {children}
              </ConditionalLayout>
            </SidebarProvider >
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
