"use client"

import { useState } from "react"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Upload, Brain, Search, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SubscriptionModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function SubscriptionModal({ isOpen, onOpenChange }: SubscriptionModalProps) {
  const { tiers, currentSubscription, subscribeTo, isLoading } = useSubscription()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null)

  const handleSubscribe = async (tierName: string) => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    setIsSubscribing(tierName)
    try {
      const callbackUrl = `${window.location.origin}/subscription/verify`
      const result = await subscribeTo(tierName, callbackUrl)

      if (tierName === 'free') {
        toast.success('Successfully switched to Free tier!')
        onOpenChange(false)
      } else if (result.authorization_url) {
        // Redirect to Paystack for payment
        window.location.href = result.authorization_url
      } else {
        toast.error('Failed to initialize subscription')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      toast.error('Failed to subscribe. Please try again.')
    } finally {
      setIsSubscribing(null)
    }
  }

  const getCurrentTierName = () => {
    if (!currentSubscription || currentSubscription.tier_name === 'free') return 'free'
    return currentSubscription.tier_name
  }

  const isCurrentTier = (tierName: string) => {
    return getCurrentTierName() === tierName
  }

  if (isLoading || !tiers) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription>Loading subscription plans...</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center">
            Select the perfect plan for your graduate school journey
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative border rounded-lg p-6 ${tier.name === 'pro'
                ? 'border-primary'
                : 'border-border'
                }`}
            >
              {tier.name === 'pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-foreground mb-2">{tier.display_name}</h3>
                <div className="text-3xl font-bold text-foreground mb-1">
                  ₦{tier.price_ngn.toLocaleString()}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                {tier.name === 'free' && (
                  <p className="text-xs  font-medium">
                    (                    Available for first 3 days
                    )                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {tier.daily_message_limit} messages per day
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">File uploads</span>
                </div>

                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Advanced AI features</span>
                </div>

                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Research assistance</span>
                </div>

                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Priority support</span>
                </div>
              </div>

              <Button
                onClick={() => handleSubscribe(tier.name)}
                disabled={isCurrentTier(tier.name) || isSubscribing === tier.name}
                className={`w-full ${tier.name === 'pro'
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-secondary hover:bg-secondary/80'
                  }`}
              >
                {isSubscribing === tier.name ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </div>
                ) : isCurrentTier(tier.name) ? (
                  'Current Plan'
                ) : tier.name === 'free' ? (
                  'Downgrade to Free'
                ) : (
                  `Upgrade to ${tier.display_name}`
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">
            All plans include access to our AI assistant for graduate school success
          </p>
          <p className="text-xs text-muted-foreground">
            Cancel anytime. No hidden fees. Secure payment powered by Paystack.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}