"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import AuthModal from "@/components/AuthModal"
import { useAuth } from "@/contexts/AuthContext"
import { TokenUsageProvider } from "@/contexts/TokenUsageContext"
import Image from "next/image"
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"

const gradSchoolSuggestions = [
  "Help me find PhD programs in machine learning",
  "Analyze my CV for graduate school applications",
  "What are the best computer science graduate programs?",
]

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [message, setMessage] = useState("")
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    if (isAuthenticated) {
      router.push(`/?message=${encodeURIComponent(message)}`)
    } else {
      setShowAuthModal(true)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (isAuthenticated) {
      router.push(`/?message=${encodeURIComponent(suggestion)}`)
    } else {
      setMessage(suggestion)
      setShowAuthModal(true)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <TokenUsageProvider>
      <div className="min-h-screen bg-background">
        {/* Navigation Bar */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                {/* <Image
                  src="/logo.png"
                  alt="Carenograd Logo"
                  width={32}
                  height={32}
                  className="rounded-md"
                /> */}
                <h1 className="text-xl font-bold text-foreground">Carenograd</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => setShowAuthModal(true)}>Login</Button>
                <Button onClick={() => setShowAuthModal(true)}>Sign Up</Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl min-h-[calc(100vh-4rem)] flex flex-col  justify-center mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="Carenograd Logo"
                width={80}
                height={80}
                className="rounded-lg "
              />
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Your AI Assistant for Graduate School Success
            </h2>
            <p className="text-xl text-muted-foreground mb-2">
              Get personalized guidance, research assistance, and application management
            </p>
          </div>

          {/* AI Elements Input */}
          <div className="max-w-2xl w-full mx-auto mb-12">
            <PromptInput onSubmit={handleSubmit} className="relative">
              <PromptInputTextarea
                placeholder="Ask me about graduate programs..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
              <PromptInputToolbar>
                <PromptInputSubmit
                  className="absolute right-1 bottom-1"
                  disabled={!message.trim()}
                  status="ready"
                />
              </PromptInputToolbar>
            </PromptInput>
          </div>

          {/* Suggestions */}
          {/* <div className="max-w-4xl mx-auto mb-12">
            <Suggestions>
              {gradSchoolSuggestions.map((suggestion, index) => (
                <Suggestion
                  key={index}
                  suggestion={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                />
              ))}
            </Suggestions>
          </div> */}


        </main>

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </div>
    </TokenUsageProvider>
  )
}