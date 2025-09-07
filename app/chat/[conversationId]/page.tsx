
import ChatArea from "@/components/ChatArea"
import { cookies } from "next/headers"

interface DatabaseMessage {
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
  }
  created_at: string
}

interface ChatPageProps {
  params: Promise<{
    conversationId: string
  }>
}

async function fetchConversationMessages(conversationId: string, token: string): Promise<DatabaseMessage[]> {
  try {
    const response = await fetch(`http://localhost:3000/agent/conversations/${conversationId}/messages`, {
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

export default async function ChatPage({ params }: ChatPageProps) {
  const { conversationId } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  // Fetch conversation messages server-side (skip for new chats)
  const previousMessages = token && conversationId !== "n" ? await fetchConversationMessages(conversationId, token) : []

  return (

    <ChatArea
      conversationId={conversationId}
      initialMessages={previousMessages}
    />

  )
}