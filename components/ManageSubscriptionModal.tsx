"use client"

import { useState } from "react"
import { useSubscription } from "@/contexts/SubscriptionContext"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CreditCard, Crown } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface ManageSubscriptionModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function ManageSubscriptionModal({ isOpen, onOpenChange }: ManageSubscriptionModalProps) {
  const { currentSubscription, quotaStatus, cancelSubscription, fetchCurrentSubscription } = useSubscription()
  const { isAuthenticated } = useAuth()
  const [isCancelling, setIsCancelling] = useState(false)

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

  if (!isAuthenticated || !currentSubscription || currentSubscription.tier_name === 'free') {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Manage Subscription
          </DialogTitle>
          <DialogDescription>
            View and manage your Pro subscription details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{currentSubscription.tier_display_name}</h3>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ₦{currentSubscription.price_ngn.toLocaleString()}/month
                </div>
                <p className="text-sm text-muted-foreground">
                  Next billing: {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Daily message limit</p>
                <p className="font-medium">{currentSubscription.daily_message_limit}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Current period</p>
                <p className="font-medium">
                  {new Date(currentSubscription.current_period_start).toLocaleDateString()} - {' '}
                  {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Usage Overview */}
          {quotaStatus && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <h4 className="font-medium">Usage Today</h4>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Messages used:</span>
                  <span className="font-medium">{quotaStatus.messages_used} / {quotaStatus.daily_limit}</span>
                </div>

                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((quotaStatus.messages_used / quotaStatus.daily_limit) * 100, 100)}%`
                    }}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Usage resets daily at midnight
                </p>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="border border-destructive/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <h4 className="font-medium">Cancel Subscription</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Cancelling will downgrade you to the Free plan at the end of your current billing period.
              You&apos;ll lose access to Pro features and your daily message limit will be reduced to 20 messages.
            </p>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" >
                  Downgrade                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will cancel your Pro subscription and you&apos;ll be downgraded to the Free plan
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
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}