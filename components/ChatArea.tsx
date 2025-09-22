"use client"

import { useEffect, useState, Fragment, useRef, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import Cookies from "js-cookie"
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
  PromptInputButton,
} from '@/components/ai-elements/prompt-input'
import { Response } from '@/components/ai-elements/response'
import { Actions, Action } from '@/components/ai-elements/actions'
import { Task, TaskTrigger, TaskContent, TaskItem } from '@/components/ai-elements/task'
import { File, X, Copy, Check, Paperclip, CheckCircle, Loader } from "lucide-react"
import { revalidateData } from "@/lib/revalidate"
import { cn } from "@/lib/utils"
import Link from "next/link"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface ChatAreaProps {
  conversationId?: string | null
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
    toolsUsed?: string[]
    stepsUsed?: number
    executionTime?: number
    errors?: unknown[]
  }
  created_at: string
}

// Component for handling copy functionality
const MessageWithCopy = ({ content, role }: { content: string; role: 'user' | 'assistant' | 'system' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const isAssistant = role === 'assistant';
  const isUser = role === 'user';

  // Position classes based on role
  const positionClasses = isAssistant
    ? '-bottom-[2.5rem] -left-[0.5rem]'
    : isUser
      ? '-bottom-[3.5rem] -right-[0.5rem]'
      : 'bottom-0 right-2'; // fallback

  return (
    <div className="group relative">
      <Response role={role}>{content}</Response>
      <Actions className={cn(
        'absolute opacity-0 group-hover:opacity-100 transition-opacity rounded  z-30',
        positionClasses
      )}>
        <Action
          onClick={handleCopy}
          tooltip={copied ? "Copied!" : "Copy text"}
          label={copied ? "Copied" : "Copy"}
        >
          {copied ? (
            <Check className="size-4 text-green-600" />
          ) : (
            <Copy className="size-4" />
          )}
        </Action>
      </Actions>
    </div>
  );
};

export default function ChatArea({ conversationId, initialMessages = [] }: ChatAreaProps) {
  const { token, isAuthenticated, isLoading } = useAuth()
  // console.log('Environment:', process.env.NEXT_PUBLIC_NODE_ENV)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const searchParams = useSearchParams()
  const [input, setInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)

  const pendingNavigationIdRef = useRef<string | null>(null)

  const { messages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agent/chat",
      headers: async () => {
        const headers: Record<string, string> = {}

        // Get fresh token from localStorage (updated by auth system)
        const currentToken = Cookies.get('access_token') || localStorage.getItem('jwt_token') || localStorage.getItem('access_token') || token

        if (currentToken) {
          headers["Authorization"] = `Bearer ${currentToken}`
        } else {
          console.warn('No auth token available for AI request')
        }

        return headers
      },
      body: () => {
        const body: { conversationId?: string } = {}
        if (conversationId) {
          body.conversationId = conversationId
        }
        return body
      }
    }),
    onError: (error: Error) => {
      console.error("Chat error:", error)
      setIsWaitingForResponse(false)
      pendingNavigationIdRef.current = null
    },
    onData: (data) => {
      console.log('Received data part from server:', data)
      console.log('Current isWaitingForResponse:', isWaitingForResponse)

      // Validate streaming data structure before processing
      if (!data || typeof data !== 'object') {
        console.warn('Invalid data received in stream:', data)
        return
      }

      // First data chunk means response has started - always clear waiting state
      setIsWaitingForResponse(false)

      // Handle new conversation creation when conversationId is null - store for later navigation
      console.log('onData - conversationId:', conversationId, 'data:', data)
      if (conversationId === null) {
        if ('type' in data && data.type === 'data-conversation' && 'data' in data && data.data && typeof data.data === 'object' && 'conversationId' in data.data) {
          const newConversationId = data.data.conversationId as string
          console.log('New conversation created, will navigate after streaming completes:', newConversationId)
          console.log('Setting pendingNavigationId to:', newConversationId)
          pendingNavigationIdRef.current = newConversationId
        }
      }
    },
    onFinish: async () => {
      console.log('AI response completed - dispatching token usage update event')
      console.log('onFinish - pendingNavigationId:', pendingNavigationIdRef.current)
      console.log('onFinish - conversationId:', conversationId)
      setIsWaitingForResponse(false)
      window.dispatchEvent(new CustomEvent('ai-response-complete'))

      // Navigate to new conversation if one was created during streaming
      if (pendingNavigationIdRef.current) {
        console.log('Streaming complete, navigating to:', pendingNavigationIdRef.current)
        const newConversationId = pendingNavigationIdRef.current
        pendingNavigationIdRef.current = null


        // Prefetch and navigate smoothly without flash
        router.prefetch(`/chat/${newConversationId}`)
        startTransition(() => {
          router.push(`/chat/${newConversationId}`)
        })
        await revalidateData(`/chat/${newConversationId}`)

        console.log('Updated URL to new conversation')
      } else if (conversationId && conversationId !== 'null') {
        // For existing conversations, revalidate the current conversation messages
        console.log('Revalidating current conversation messages:', conversationId)
        await revalidateData(`/chat/${conversationId}`)

      }
      await revalidateData(`/`)

    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !attachedFile) || status === "streaming") return

    // Don't allow submission if auth is still loading or user is not authenticated
    if (isLoading || !isAuthenticated || !token) {
      console.warn('Cannot submit: auth not ready', { isLoading, isAuthenticated, hasToken: !!token })
      return
    }

    // Clear input immediately for better UX
    const messageText = input
    const fileToSend = attachedFile
    setInput("")
    setAttachedFile(null)
    setIsWaitingForResponse(true)

    // Send message immediately for instant UI feedback
    if (!fileToSend) {
      sendMessage({ text: messageText })
    } else {
      // For files, show user message immediately with file indicator
      const immediateMessage = `${messageText.trim() ? messageText + '\n\n' : ''}📎 ${fileToSend.name}`
      sendMessage({ text: immediateMessage })

      // Then handle file upload in the background
      try {
        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024 // 50MB
        if (fileToSend.size > maxSize) {
          console.error('File too large. Maximum size is 50MB')
          return
        }

        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', fileToSend)

        console.log(`Uploading PDF: ${fileToSend.name} (${(fileToSend.size / 1024 / 1024).toFixed(1)} MB)`)

        // Upload file to dedicated endpoint
        const uploadResponse = await fetch(`${API_BASE_URL}/agent/upload`, {
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
      } catch (error) {
        console.error('File upload failed:', error)
        return
      }
    }
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

  // Log when conversationId changes for debugging
  useEffect(() => {
    console.log('ChatArea: conversationId changed to:', conversationId)
  }, [conversationId])



  // Parse content to separate progress from final response using --- separator
  const parseStreamContent = (text: string) => {
    const separatorPattern = /\n\n---\n\n/
    const parts = text.split(separatorPattern)

    if (parts.length >= 2) {
      return {
        progress: parts[0].trim(),
        response: parts.slice(1).join('\n\n---\n\n').trim(),
        hasResponse: true
      }
    } else {
      return {
        progress: text.trim(),
        response: '',
        hasResponse: false
      }
    }
  }

  console.log({ messages })
  console.log("ess", initialMessages)

  // Check if we have any messages (initial or streaming)
  const hasMessages = initialMessages.length > 0 || messages.length > 0

  // If no messages, show centered layout
  if (!hasMessages) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] items-center justify-center max-w-4xl mx-auto w-full px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-4xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {isAuthenticated ? <>Welcome to Carenograd!</> : <>Carenograd</>}
          </h1>
          {isAuthenticated && <>Your AI assistant for graduate school success</>}
        </div>

        <div className="w-full max-w-4xl">
          <PromptInput onSubmit={handleSubmit} className="my-4 max-w-[95%] mx-auto px-2 pb-2 pt-0 rounded-4xl  border mb-6 flex items-end">
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
            <div className="flex items-end w-full">

              <PromptInputButton
                onClick={() => fileInputRef.current?.click()}
                disabled={status === "streaming"}
                title="Attach PDF document"
                variant={"ghost"}
                className="shadow-none rounded-full"
              >
                <Paperclip className="h-4 w-4" />
              </PromptInputButton>
              <PromptInputTextarea
                placeholder="Ask me about graduate programs..."
                onChange={(e) => setInput(e.target.value)}
                value={input}
                className="min-h-[60px]"
              />
              <PromptInputSubmit disabled={!input.trim() && !attachedFile} status={status} />

            </div>
          </PromptInput>
        </div>

        {/* Terms and Privacy Policy for unauthenticated users */}
        {!isAuthenticated && (
          <div className="text-center mt-6 absolute bottom-2 right-0 left-0">
            <p className="text-sm ">
              By messaging Carenograd, you agree to our{" "}
              <Link href="/terms" className="underline font-semibold ">
                Terms
              </Link>{" "}
              and have read our{" "}
              <Link href="/privacy" className="underline font-semibold">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        )}
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

  // Normal layout when messages exist
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden justify-between max-w-4xl mx-auto w-full" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
      <Conversation className="h-full pt-4">
        <ConversationContent>
          {/* Render initial messages from server-side fetch */}
          {initialMessages.map((dbMessage) => (
            <div key={dbMessage.id}>
              <Message from={dbMessage.role}>
                <MessageContent>
                  {/* Show tools used from metadata for assistant messages - only in development */}
                  {process.env.NEXT_PUBLIC_NODE_ENV !== 'production' && dbMessage.role === 'assistant' && dbMessage.metadata.toolsUsed && dbMessage.metadata.toolsUsed.length > 0 && (
                    <Task>
                      <TaskTrigger title="Tools Used" />
                      <TaskContent className="bg-gray-50/50 border border-gray-300 rounded-lg mt-2 p-2">
                        {dbMessage.metadata.toolsUsed.map((tool: string, i: number) => (
                          <TaskItem key={`${dbMessage.id}-tool-${i}`} className="text-muted-foreground flex gap-2 -ml-3">
                            <CheckCircle className="h-4 w-4" />
                            {tool.replace('Tool', '')} {/* Clean up tool names */}
                          </TaskItem>
                        ))}
                        {dbMessage.metadata.executionTime && (
                          <TaskItem className="text-muted-foreground flex gap-2 -ml-3 mt-1 text-xs opacity-70">
                            <CheckCircle className="h-3 w-3" />
                            {dbMessage.metadata.stepsUsed} steps • {((dbMessage.metadata.executionTime || 0) / 1000).toFixed(1)}s
                          </TaskItem>
                        )}
                      </TaskContent>
                    </Task>
                  )}

                  {/* Display message content for all messages */}
                  <MessageWithCopy content={dbMessage.content} role={dbMessage.role} />
                </MessageContent>
              </Message>
            </div>
          ))}

          {/* Only render streaming messages when actively streaming */}
          {status === "streaming" && messages?.filter(message => message && message.id && message.role && message.parts).map((message) => (
            <div key={message.id}>
              <Message from={message.role}>
                <MessageContent>

                  {/* Single unified Task component for both tools and progress - only show during streaming and in development */}
                  {process.env.NEXT_PUBLIC_NODE_ENV !== 'production' && status === "streaming" && (message.parts?.filter(part => part && part.type === 'tool-ai-tool').length > 0 ||
                    (message.role === 'assistant' && message.parts?.some(part => part?.type === 'text' && part.text))) && (
                      <Task>
                        <TaskTrigger title="Tasks" />
                        <TaskContent className="bg-gray-50/50 border border-gray-300 rounded-lg mt-2 p-2">
                          {message.parts
                            ?.filter(part => part && (part.type === 'tool-ai-tool' || part.type?.startsWith('tool-')) && part.type !== 'tool-input-available')
                            ?.map((part, i) => {
                              if (!part) return null

                              const hasOutput = (part as unknown as { output?: unknown }).output
                              const description = (part as unknown as { input?: { description?: string } }).input?.description || 'Processing...'
                              const result = (part as unknown as { output?: { result?: string } }).output?.result

                              return (
                                <TaskItem key={`${message.id}-tool-${i}`} className="text-muted-foreground flex gap-2 -ml-3">
                                  {hasOutput ? <CheckCircle className="h-4 w-4" /> : <Loader className="animate-spin h-4 w-4" />}
                                  {hasOutput ? result : description}
                                </TaskItem>
                              )
                            })}

                          {message.role === 'assistant' && message.parts
                            ?.filter(part => part && part.type === 'text')
                            ?.map((part, i) => {
                              if (!part || typeof part.text !== 'string') return null

                              const parsed = parseStreamContent(part.text)
                              if (parsed.progress) {
                                // For quota retry messages, show only the latest line
                                if (parsed.progress.includes('Quota limit reached') || parsed.progress.includes('Smart retry')) {
                                  const lines = parsed.progress.split('\n').filter(line => line.trim())
                                  const latestLine = lines[lines.length - 1] || parsed.progress
                                  return (
                                    <div key={`${message.id}-progress-${i}`} className="text-muted-foreground text-xs border-t pt-2 mt-2">
                                      {latestLine}
                                    </div>
                                  )
                                }
                                return (
                                  <div key={`${message.id}-progress-${i}`} className="text-muted-foreground whitespace-pre-wrap text-xs border-t pt-2 mt-2">
                                    {parsed.progress}
                                  </div>
                                )
                              }
                              return null
                            })}
                        </TaskContent>

                      </Task>
                    )}
                  {isWaitingForResponse && message.role === 'assistant' && <p className="flex items-center gap-1">

                    <span className="flex gap-1 mt-3">
                      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-current rounded-full animate-bounce"></span>
                    </span>
                  </p>}
                  {/* Then render final response only */}
                  {message.parts
                    ?.filter(part => part && part.type === 'text')
                    ?.map((part, i) => {
                      if (!part || typeof part.text !== 'string') return null

                      if (message.role === 'assistant') {
                        const parsed = parseStreamContent(part.text)
                        return (
                          <Fragment key={`${message.id}-text-${i}`}>
                            {/* Show response section if it exists */}
                            {parsed.hasResponse && parsed.response && (
                              <MessageWithCopy content={parsed.response} role={message.role} />
                            )}
                          </Fragment>
                        )
                      } else {
                        return (
                          <Fragment key={`${message.id}-text-${i}`}>
                            <MessageWithCopy content={part.text} role={message.role} />
                          </Fragment>
                        )
                      }
                    })}
                </MessageContent>
              </Message>
            </div>
          ))}



        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="my-4 max-w-[95%] mx-auto px-2 pb-2 pt-0 rounded-4xl  border mb-6  flex flex-col">
        {attachedFile && (
          <div className="mb-2 w-fit mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center gap-2">
            <File className="h-4 w-4 text-red-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300 w-fit">{attachedFile.name}</span>
            <button
              onClick={() => setAttachedFile(null)}
              className="ml-auto p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl w-fit"
              title="Remove attachment"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <div className="flex items-end">
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
        </div>

      </PromptInput>



      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => handleFileAttach(e.target.files)}
        className="hidden"
      />
    </div >
  )
}