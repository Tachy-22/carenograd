import ChatArea from "@/components/ChatArea"

interface ChatInterfaceProps {
  conversationId?: string
}

export default function ChatInterface({ conversationId }: ChatInterfaceProps) {
  return <ChatArea conversationId={conversationId} />
}