
import { DatabaseMessage, fetchConversationMessages } from "@/app/layout"
import ChatArea from "@/components/ChatArea"
import { cookies } from "next/headers"



interface ChatPageProps {
  params: Promise<{
    conversationId: string
  }>
}


export default async function ChatPage({ params }: ChatPageProps) {
  const { conversationId } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  
  // console.log('Server-side token check:', { 
  //   conversationId, 
  //   hasToken: !!token, 
  //   tokenLength: token?.length,
  //   allCookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
  // })
  
  // Fetch conversation messages server-side
  const previousMessages: DatabaseMessage[] = token ? await fetchConversationMessages(conversationId, token) : []

  // console.log('Messages fetched:', { 
  //   conversationId, 
  //   messageCount: previousMessages.length,
  //   willFetch: !!(token && conversationId !== "n")
  // })
  
  return (
    <ChatArea
      conversationId={conversationId}
      initialMessages={previousMessages}
    />
  )
}