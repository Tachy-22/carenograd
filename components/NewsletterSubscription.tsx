"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface NewsletterSubscriptionProps {
  title?: string
  description?: string
  placeholder?: string
  source?: string
  className?: string
  compact?: boolean
}

export default function NewsletterSubscription({
  title = "Stay Updated",
  description = "Get the latest updates on Carenograd and graduate school tips delivered to your inbox.",
  placeholder = "Enter your email address",
  source = "website",
  className = "",
  compact = false
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubscribing(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          name: name.trim() || null,
          source
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('You are already subscribed to our newsletter!')
        } else {
          throw new Error(data.error || 'Failed to subscribe')
        }
        return
      }

      setIsSubscribed(true)
      toast.success('Successfully subscribed to our newsletter!')
      setEmail("")
      setName("")
      
      // Reset success state after 5 seconds
      setTimeout(() => {
        setIsSubscribed(false)
      }, 5000)

    } catch (error) {
      console.error('Error subscribing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubscribe} className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubscribing || isSubscribed}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={isSubscribing || isSubscribed || !email}
          className="flex-shrink-0"
        >
          {isSubscribing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : isSubscribed ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">
            {isSubscribed ? 'Subscribed!' : 'Subscribe'}
          </span>
        </Button>
      </form>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="flex items-center gap-2 p-4 bg-green-50 text-green-800 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span>Thank you for subscribing! Check your email for confirmation.</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder={placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubscribing}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubscribing}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubscribing || !email}
              className="w-full"
            >
              {isSubscribing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subscribing...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Subscribe to Newsletter
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}