"use client"

import { useEffect, useState } from "react"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, MessageSquare, Upload, Brain, Search, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function SubscriptionPage() {
  const { tiers, currentSubscription, subscribeTo, isLoading } = useSubscription()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, router])

  const handleSubscribe = async (tierName: string) => {
    // console.log('handleSubscribe called with:', tierName)

    if (!isAuthenticated) {
      //  console.log('User not authenticated, redirecting to auth')
      router.push('/auth')
      return
    }

    // console.log('Setting subscribing state for:', tierName)
    setIsSubscribing(tierName)
    try {
      const callbackUrl = `${window.location.origin}/subscription/verify`
      // console.log('Calling subscribeTo with:', { tierName, callbackUrl })
      const result = await subscribeTo(tierName, callbackUrl)
      //  console.log('subscribeTo result:', result)

      if (tierName === 'free') {
        toast.success('Successfully switched to Free tier!')
        router.push('/')
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
    return currentSubscription?.tier_name || 'free'
  }

  const isCurrentTier = (tierName: string) => {
    return getCurrentTierName() === tierName
  }

  const features = {
    free: [
      { icon: MessageSquare, text: "20 messages per day" },
      { icon: Upload, text: "Limited file uploads" },
      { icon: Brain, text: "Basic AI assistance" },
      { icon: Search, text: "Limited research capabilities" }
    ],
    pro: [
      { icon: MessageSquare, text: "100 messages per day" },
      { icon: Upload, text: "Expanded file uploads" },
      { icon: Brain, text: "Advanced AI reasoning" },
      { icon: Search, text: "Deep research and analysis" },
      { icon: Settings, text: "Priority support" }
    ]
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="w-full max-w-4xl max-h-[100vh]  rounded-lg overflow-y-auto ">
      <h1 className="text-2xl font-semibold text-foreground mx-auto w-fit pt-8 md:pt-0">
        Upgrade your plan
      </h1>
      <div className="px-6 py-6">
        {/* Header */}
        <div className="flex justify-end mb-6 ">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            {isLoading ? (
              <div className="col-span-2 text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading subscription options...</p>
              </div>
            ) : (
              tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative p-6 rounded-xl border transition-all bg-background ${tier.name === 'pro'
                    ? 'border-primary shadow-lg'
                    : 'border-border'
                    } ${isCurrentTier(tier.name) ? 'ring-2 ring-primary' : ''}`}
                >
                  {tier.name === 'pro' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        POPULAR
                      </Badge>
                    </div>
                  )}

                  {isCurrentTier(tier.name) && (
                    <div className="mb-4">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Your current plan
                      </Badge>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-foreground mb-2">
                      {tier.display_name}
                    </h3>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xs text-muted-foreground">₦</span>
                      <span className="text-4xl font-bold text-foreground">
                        {tier.price_ngn.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        {tier.price_ngn > 0 ? ' / month' : ''}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm">
                      {tier.name === 'free'
                        ? 'Intelligence for everyday tasks'
                        : 'More access to advanced intelligence'
                      }
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {features[tier.name as keyof typeof features]?.map((feature, index) => {
                      const IconComponent = feature.icon
                      return (
                        <li key={index} className="flex items-center gap-3">
                          <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground">{feature.text}</span>
                        </li>
                      )
                    })}
                  </ul>

                  <Button
                    className={`w-full ${isCurrentTier(tier.name)
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : tier.name === 'pro'
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                      }`}
                    onClick={() => handleSubscribe(tier.name)}
                    disabled={isSubscribing === tier.name || isCurrentTier(tier.name)}
                  >
                    {isSubscribing === tier.name ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        Processing...
                      </div>
                    ) : isCurrentTier(tier.name) ? (
                      'Current Plan'
                    ) : tier.name === 'pro' ? (
                      'Get Pro'
                    ) : (
                      'Downgrade'
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>


  )
}