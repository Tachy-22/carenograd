"use client"

import { useEffect, useState } from "react"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Crown, Zap, AlertTriangle, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ManageSubscriptionPage() {
  const { currentSubscription, quotaStatus, cancelSubscription, fetchCurrentSubscription } = useSubscription()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, router])

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    try {
      await cancelSubscription()
      toast.success('Subscription cancelled successfully')
      await fetchCurrentSubscription()
    } catch (error) {
      console.error('Cancel subscription error:', error)
      toast.error('Failed to cancel subscription. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  const handleUpgrade = () => {
    router.push('/subscription')
  }

  if (!isAuthenticated) {
    return null
  }

  // If user has no subscription or is on free tier
  if (!currentSubscription || currentSubscription.tier_name === 'free') {
    return (
      <div className="min-h-screen w-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Zap className="h-16 w-16 text-gray-400" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              You're on the Free Plan
            </h1>

            <p className="text-gray-600 mb-8">
              Upgrade to Pro to unlock more messages per day and premium features.
            </p>

            {quotaStatus && (
              <Card className="mb-8">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Current Usage</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Messages used today:</span>
                      <span className="font-medium">{quotaStatus.messages_used}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Daily limit:</span>
                      <span className="font-medium">{quotaStatus.daily_limit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((quotaStatus.messages_used / quotaStatus.daily_limit) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button onClick={handleUpgrade} className="bg-blue-600 hover:bg-blue-700">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Manage Subscription
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Crown className="h-6 w-6 text-blue-600" />
                  <CardTitle>Current Plan</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{currentSubscription.tier_display_name}</h3>
                  <Badge className="bg-green-600">Active</Badge>
                </div>

                <div className="text-2xl font-bold text-foreground">
                  ₦{currentSubscription.price_ngn.toLocaleString()}/month
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Daily message limit:</span>
                    <span className="font-medium">{currentSubscription.daily_message_limit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current period:</span>
                    <span className="font-medium">
                      {new Date(currentSubscription.current_period_start).toLocaleDateString()} - {' '}
                      {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next billing date:</span>
                    <span className="font-medium">
                      {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                  {currentSubscription.paystack_subscription_code && (
                    <div className="flex justify-between">
                      <span>Subscription ID:</span>
                      <span className="font-mono text-xs">
                        {currentSubscription.paystack_subscription_code}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6" />
                  Usage Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quotaStatus ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Messages used today:</span>
                        <span className="font-medium">{quotaStatus.messages_used}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Messages remaining:</span>
                        <span className="font-medium">{quotaStatus.messages_remaining}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Daily limit:</span>
                        <span className="font-medium">{quotaStatus.daily_limit}</span>
                      </div>
                    </div>

                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((quotaStatus.messages_used / quotaStatus.daily_limit) * 100, 100)}%`
                        }}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Usage resets daily at midnight
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading usage data...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="mt-8 space-y-4">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 mb-4">
                  Cancelling your subscription will downgrade you to the Free plan at the end of your current billing period.
                  You'll lose access to Pro features and your daily message limit will be reduced to 20 messages.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      Downgrade                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel your Pro subscription and you'll be downgraded to the Free plan
                        at the end of your current billing period ({new Date(currentSubscription.current_period_end).toLocaleDateString()}).

                        <br /><br />

                        You will lose:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>100 messages per day (reduced to 20)</li>
                          <li>Priority support</li>
                          <li>Advanced features</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        disabled={isCancelling}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-blue-800 text-sm mb-4">
                If you have questions about your subscription or need to update your payment method,
                please contact our support team.
              </p>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}