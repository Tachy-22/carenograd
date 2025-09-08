"use client"

import { useEffect, useState, Fragment, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useConversations } from "@/contexts/ConversationsContext"
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
} from '@/components/ai-elements/prompt-input'
import { Response } from '@/components/ai-elements/response'
import { Loader } from '@/components/ai-elements/loader'
import { Tool, ToolHeader, ToolContent } from '@/components/ai-elements/tool'
import { Task, TaskTrigger, TaskContent, TaskItem } from '@/components/ai-elements/task'
import { File, X, Check, AlertCircle, Paperclip, CheckCircle } from "lucide-react"

interface ChatAreaProps {
  conversationId?: string
  initialMessages?: DatabaseMessage[]
}

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

export default function ChatArea({ conversationId, initialMessages = [] }: ChatAreaProps) {
  const { user, token, isAuthenticated, isLoading } = useAuth()
  const { setActiveConversation, activeConversation } = useConversations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [input, setInput] = useState("")
  const [currentConversationId, setCurrentConversationId] = useState<string>(conversationId || "n")
  const conversationIdRef = useRef<string>(activeConversation || conversationId || "n")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agent/chat",
      headers: () => {
        const headers: Record<string, string> = {}
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }
        return headers
      },
      body: () => {
        const body: { conversationId?: string } = {}
        console.log("has CurrentId: ", conversationIdRef.current !== "n", conversationId, currentConversationId, conversationIdRef.current)
        if (conversationIdRef.current !== "n") {
          console.log("attatching this :", conversationIdRef.current)
          body.conversationId = conversationIdRef.current
        }
        return body
      }
    }),
    onError: (error: Error) => {
      console.error("Chat error:", error)
    },
    onData: (data) => {
      console.log('Received data part from server:', data)

      // Check if this is conversation data and we're in a new chat
      if (currentConversationId === "n" && data && typeof data === 'object') {
        if ('type' in data && data.type === 'data-conversation' && 'data' in data && data.data && typeof data.data === 'object' && 'conversationId' in data.data) {
          const conversationIdv = data.data.conversationId
          console.log('Captured conversationId from data:', conversationIdv)
          //  conversationIdv !== "n" && router.push(`/chat/${conversationIdv}`)
          setCurrentConversationId(conversationIdv as string)
          setActiveConversation(conversationIdv as string)
          conversationIdRef.current = conversationIdv as string
        }
      }
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !attachedFile) || status === "streaming") return

    let messageText = input

    if (attachedFile) {
      try {
        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024 // 50MB
        if (attachedFile.size > maxSize) {
          console.error('File too large. Maximum size is 50MB')
          return
        }

        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', attachedFile)

        console.log(`Uploading PDF: ${attachedFile.name} (${(attachedFile.size / 1024 / 1024).toFixed(1)} MB)`)

        // Upload file to dedicated endpoint
        const uploadResponse = await fetch('http://localhost:3000/agent/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message || 'Upload failed')
        }

        console.log('Upload successful:', uploadResult)

        // If user added text with the file, send it as a follow-up message
        if (messageText.trim()) {
          sendMessage({ text: messageText })
        }
      } catch (error) {
        console.error('File upload failed:', error)
        return
      }
    } else {
      sendMessage({ text: messageText })
    }

    setInput("")
    setAttachedFile(null)
  }


  const validateFile = (file: File): { valid: boolean; message?: string } => {
    if (file.type !== 'application/pdf') {
      return { valid: false, message: 'Only PDF files are supported' }
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit to match backend
      return { valid: false, message: 'File too large. Maximum size is 50MB' }
    }

    return { valid: true }
  }


  const handleFileAttach = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const validation = validateFile(file)

    if (!validation.valid) {
      console.error('File validation failed:', validation.message)
      return
    }

    setAttachedFile(file)
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
      return
    }

    // Handle initial message from URL
    const initialMessage = searchParams.get("message")
    if (initialMessage) {
      setInput(initialMessage)
    }
  }, [isLoading, isAuthenticated, searchParams, router])

  // Update ref when activeConversation changes
  useEffect(() => {
    conversationIdRef.current = activeConversation || conversationId || "n"
  }, [activeConversation, conversationId])


  // Parse content to show tool actions and final response
  const parseStreamingContent = (text: string) => {
    const components: React.ReactNode[] = []

    // Extract final content (skip noise)
    const lines = text.split('\n').filter(line => line.trim())
    const finalContent: string[] = []

    lines.forEach((line) => {
      const trimmed = line.trim()

      //   Skip noise but keep meaningful final content
      if (trimmed.startsWith('🔄 Starting new analysis step...') ||
        trimmed.startsWith('✨ Step completed:') ||
        trimmed.startsWith('✨ Completed reasoning step') ||
        trimmed.startsWith('🎉 Analysis complete!') ||
        trimmed.startsWith('✅')) {
        return
      }

      if (trimmed.length > 0) {
        finalContent.push(trimmed)
      }
    })



    // Add the final response content
    if (finalContent.length > 0) {
      const cleanText = finalContent.join('\n\n')
      components.push(
        <Response key="final-response">{cleanText}</Response>
      )
    }

    return components
  }

  console.log({ messages })
  console.log("ess", initialMessages)

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden justify-between max-w-3xl mx-auto w-full" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      <Conversation className="h-full">
        <ConversationContent>
          {/* Render initial messages from server-side fetch */}
          {initialMessages.map((dbMessage) => (
            <div key={dbMessage.id}>
              <Message from={dbMessage.role}>
                <MessageContent>
                  {/* Show tool calls from metadata if available */}
                  {dbMessage.metadata.toolCalls && dbMessage.metadata.toolCalls.length > 0 && (
                    <Task>
                      <TaskTrigger title="Tools" />
                      <TaskContent className="">
                        {dbMessage.metadata.toolCalls.map((toolCall, i) => (
                          <Fragment key={`${dbMessage.id}-tool-${i}`}>
                            <TaskItem className="text-muted-foreground w-fit rounded-full border p-2 py-1">
                              {toolCall.toolName}
                            </TaskItem>
                          </Fragment>
                        ))}
                      </TaskContent>
                    </Task>
                  )}
                  <Response>{dbMessage.content}</Response>
                </MessageContent>
              </Message>
            </div>
          ))}

          {/* Render current streaming messages */}
          {messages.map((message) => (
            <div key={message.id}>
              <Message from={message.role}>
                <MessageContent>
                  {/* Render all tool parts in one Task component */}
                  {message.parts.filter(part => part.type === 'tool-ai-tool').length > 0 && (
                    <Task>
                      <TaskTrigger title="Tasks" />
                      <TaskContent className=" bg-gray-50/50 border border-gray-300 rounded-lg mt-2 p-2 ">
                        {message.parts
                          .filter(part => part.type === 'tool-ai-tool')
                          .map((part, i) => (
                            <Fragment key={`${message.id}-tool-${i}`}>
                              {(part as any).output ? (
                                <TaskItem className="text-muted-foreground flex gap-2 -ml-3" ><><CheckCircle /></>{(part as any).output?.result}</TaskItem>
                              ) : (
                                <TaskItem className="text-muted-foreground flex gap-2 -ml-3" ><><Loader className="animate-spin" /></>{(part as any).input?.description || 'Processing...'}</TaskItem>
                              )}
                            </Fragment>
                          ))}
                      </TaskContent>
                    </Task>
                  )}

                  {/* Then render text parts */}
                  {message.parts
                    .filter(part => part.type === 'text')
                    .map((part, i) => (
                      <Fragment key={`${message.id}-text-${i}`}>
                        {message.role === 'assistant' ? (
                          parseStreamingContent(part.text).map((component, index) => (
                            <Fragment key={`${message.id}-text-${i}-${index}`}>
                              {component}
                            </Fragment>
                          ))
                        ) : (
                          <Response>{part.text}</Response>
                        )}
                      </Fragment>
                    ))}
                </MessageContent>
              </Message>
            </div>
          ))}


          {status === 'submitted' && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="my-4 px-2 pb-2 pt-0 rounded-4xl  border mb-4 flex items-end">
        {attachedFile && (
          <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-2">
            <File className="h-4 w-4 text-red-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{attachedFile.name}</span>
            <button
              onClick={() => setAttachedFile(null)}
              className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              title="Remove attachment"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <PromptInputButton
          onClick={() => fileInputRef.current?.click()}
          disabled={status === "streaming"}
          title="Attach PDF document"
          variant={"ghost"}
          className=" shadow-none rounded-full"
        >
          <Paperclip className="h-4 w-4" />
        </PromptInputButton>
        <PromptInputTextarea
          placeholder="Ask me about graduate programs..."
          onChange={(e) => setInput(e.target.value)}
          value={input}
        />
        <PromptInputSubmit disabled={!input.trim() && !attachedFile} status={status} />

        {/* <PromptInputToolbar>
          <PromptInputTools>

          </PromptInputTools>
        </PromptInputToolbar> */}
      </PromptInput>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => handleFileAttach(e.target.files)}
        className="hidden"
      />
    </div>
  )
}