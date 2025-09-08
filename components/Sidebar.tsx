"use client"

import { useState } from "react"
import { Pen, Search, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useConversations } from "@/contexts/ConversationsContext"
import { useRouter } from "next/navigation"

interface ChatSidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function ChatSidebar({ open, onClose }: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { logout } = useAuth()
  const router = useRouter()
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    isLoading
  } = useConversations()
  console.log({ conversations })
  const filteredConversations = conversations && conversations?.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNewChat = () => {
    router.push(`/chat/n`)
  }

  const handleSignOut = () => {
    logout()
    router.push("/")
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col gap-4 ">
        <div className="flex justify-between"> <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Remotegrad Logo"
            width={32}
            height={32}
            className="rounded-md"
          />

        </div>          <SidebarTrigger />
        </div>


        <Button
          onClick={handleNewChat}
          variant="ghost"
          className="justify-start gap-2 p-4"
          size="sm"
        >
          <Pen className="h-4 w-4" />
          New Chat
        </Button>


      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="relative mt-3 ">
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
        <SidebarGroup>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading conversations...
              </div>
            ) : (
              <SidebarMenu>
                <h4 className="text-muted-foreground px-2">Chats</h4>
                {filteredConversations?.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        setActiveConversation(conversation.id)
                        router.push(`/chat/${conversation.id}`)
                      }}
                      isActive={activeConversation === conversation.id}
                      className={`flex flex-col items-start h-auto p-2 
                      }`}
                    >
                      <div className="font-medium text-sm truncate w-full">
                        {conversation.title}
                      </div>
                      {/* <div className="text-xs text-muted-foreground truncate w-full">
                        {conversation.lastMessage}
                      </div> */}
                      {/* <div className="text-xs text-muted-foreground">
                        {new Date(conversation.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div> */}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}