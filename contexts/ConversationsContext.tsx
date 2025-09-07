"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./AuthContext"

interface Conversation {
  id: string
  title: string
  lastMessage: string
  updatedAt: string
  createdAt: string
}

interface ConversationsContextType {
  conversations: Conversation[]
  activeConversation: string | null
  isLoading: boolean
  setActiveConversation: (id: string) => void
  createConversation: () => string
  updateConversationTitle: (id: string, title: string) => void
  fetchConversations: () => Promise<void>
}

const ConversationsContext = createContext<ConversationsContextType>({
  conversations: [],
  activeConversation: null,
  isLoading: true,
  setActiveConversation: () => { },
  createConversation: () => "",
  updateConversationTitle: () => { },
  fetchConversations: async () => { }
})

export const useConversations = () => {
  const context = useContext(ConversationsContext)
  if (!context) {
    throw new Error("useConversations must be used within a ConversationsProvider")
  }
  return context
}

interface ConversationsProviderProps {
  children: React.ReactNode
}

export function ConversationsProvider({ children }: ConversationsProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { token, isAuthenticated } = useAuth()

  const fetchConversations = async () => {
    if (!token || !isAuthenticated) return

    try {
      setIsLoading(true)
      const response = await fetch("/api/agent/conversations", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.ok) {
        const { conversations } = await response.json()
        // Sort conversations by updated_at in descending order (most recent first)
        const sortedConversations = conversations.sort((a: any, b: any) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ).map((conv: any) => ({
          id: conv.id,
          title: conv.title,
          lastMessage: conv.lastMessage || "",
          updatedAt: conv.updated_at,
          createdAt: conv.created_at
        }))
        setConversations(sortedConversations)
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createConversation = () => {
    const newId = `conv_${Date.now()}`
    const newConversation: Conversation = {
      id: newId,
      title: "New Conversation",
      lastMessage: "",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    setConversations(prev => [newConversation, ...prev])
    setActiveConversation(newId)
    return newId
  }

  const updateConversationTitle = (id: string, title: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === id ? { ...conv, title } : conv
      )
    )
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations()
    } else {
      setConversations([])
      setActiveConversation(null)
      setIsLoading(false)
    }
  }, [isAuthenticated, token])

  return (
    <ConversationsContext.Provider
      value={{
        conversations,
        activeConversation,
        isLoading,
        setActiveConversation,
        createConversation,
        updateConversationTitle,
        fetchConversations
      }}
    >
      {children}
    </ConversationsContext.Provider>
  )
}