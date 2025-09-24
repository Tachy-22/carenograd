"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Search, LogOut, PenBox, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import Image from "next/image"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

interface Conversation {
  id: string
  title: string
  lastMessage: string
  updatedAt: string
  createdAt: string
}

interface ChatSidebarProps {
  open?: boolean
  onClose?: () => void
  conversations: Conversation[] | null
}

export default function ChatSidebar({ conversations }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isLogoHovered, setIsLogoHovered] = useState(false)
  const { logout } = useAuth()
  const router = useRouter()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const pathname = usePathname()

  const currentConversationId = pathname.split('/').pop()

 // console.log({ conversations })
  const filteredConversations = conversations && conversations?.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewChat = () => {
    router.push(`/`)
    // Close mobile sidebar after navigation
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await logout()
      // logout() now handles the redirect automatically with window.location.href
    } catch (error) {
      console.error('Sign out failed:', error)
      // Fallback redirect
      router.push("/")
    }
  }

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={() => setIsLogoHovered(true)}
      onMouseLeave={() => setIsLogoHovered(false)}
    >
      <SidebarHeader className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 h-8 w-8 ">
            {isCollapsed && isLogoHovered ? (
              <SidebarTrigger className="h-8 w-8 p-2" />
            ) : (
              <Image
                src="/logo.png"
                alt="Carenograd Logo"
                width={32}
                height={32}
                className="rounded-md"
              />
            )}
          </div>
          {!isCollapsed && <SidebarTrigger className="h-8 w-8" />}
        </div>

        {!isCollapsed ? (
          <Button
            onClick={handleNewChat}
            variant="ghost"
            className="justify-start gap-2 p-0"
            size="sm"
          >
            <PenBox className="h-4 w-4" />
            New Chat
          </Button>
        ) : (
          <Button
            onClick={handleNewChat}
            variant="ghost"
            className="justify-center p-2"
            size="sm"
            title="New Chat"
          >
            <PenBox className="h-4 w-4" />
          </Button>
        )}
      </SidebarHeader>

      {conversations && conversations?.length > 0 && <SidebarContent>
        {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            {!conversations || conversations.length === 0 ? (
              !isCollapsed && (
                <div className="p-4 text-center text-muted-foreground">
                  Loading conversations...
                </div>
              )
            ) : isCollapsed ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <HoverCard openDelay={300} closeDelay={150}>
                    <HoverCardTrigger asChild>
                      <SidebarMenuButton className="justify-center p-2" title="Chat History">
                        <MessageSquare className="h-4 w-4" />
                      </SidebarMenuButton>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="start"
                      sideOffset={8}
                      className="w-80 p-0"
                    >
                      <div className="p-3 border-b">
                        <h4 className="font-semibold text-sm">Chat History</h4>
                      </div>
                      <ScrollArea className="h-64">
                        <div className="p-2">
                          {filteredConversations?.map((conversation) => (
                            <button
                              key={conversation.id}
                              onClick={() => {
                                router.push(`/chat/${conversation.id}`)
                                // Close mobile sidebar after navigation
                                if (isMobile) {
                                  setOpenMobile(false)
                                }
                              }}
                              className={`w-full text-left p-2 rounded hover:bg-accent transition-colors ${currentConversationId === conversation.id ? 'bg-accent' : ''
                                }`}
                            >
                              <div className="font-medium text-sm truncate">
                                {conversation.title}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(conversation.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </HoverCardContent>
                  </HoverCard>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : (
              <SidebarMenu>
                <h4 className="text-muted-foreground px-2">Chats</h4>
                {filteredConversations?.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        router.push(`/chat/${conversation.id}`)
                        // Close mobile sidebar after navigation
                        if (isMobile) {
                          setOpenMobile(false)
                        }
                      }}
                      isActive={currentConversationId === conversation.id}
                      className="flex flex-col items-start h-auto p-2"
                    >
                      <div className="font-medium text-sm truncate w-full">
                        {conversation.title}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      }
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className={isCollapsed ? 'justify-center p-2' : undefined}
              title={isCollapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && 'Sign Out'}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}