"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSubscription, CurrentSubscription } from "@/contexts/SubscriptionContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function VerifySubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyPayment, fetchCurrentSubscription } = useSubscription()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null)

  useEffect(() => {
    const reference = searchParams.get('reference')

    if (!reference) {
      setStatus('error')
      setMessage('No payment reference found')
      return
    }

    verifyPayment(reference)
      .then((result) => {
        if (result.success) {
          setStatus('success')
          setMessage('Payment successful! Your Pro subscription is now active.')
          setSubscription(result.subscription || null)

          // Refresh subscription data
          setTimeout(() => {
            fetchCurrentSubscription()
          }, 1000)
        } else {
          setStatus('error')
          setMessage('Payment verification failed. Please contact support.')
        }
      })
      .catch((error) => {
        console.error('Payment verification error:', error)
        setStatus('error')
        setMessage('An error occurred while verifying payment. Please contact support.')
      })
  }, [searchParams, verifyPayment, fetchCurrentSubscription])

  const handleContinue = () => {
    router.push('/')
  }

  const handleRetry = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>

          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Failed'}
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>

          {subscription && status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-green-800">Subscription Details</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Plan:</strong> {subscription.tier_display_name}</p>
                <p><strong>Price:</strong> ₦{subscription.price_ngn?.toLocaleString()}/month</p>
                <p><strong>Messages per day:</strong> {subscription.daily_message_limit}</p>
                <p><strong>Next billing:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {status === 'success' && (
              <Button onClick={handleContinue} className="flex-1">
                Continue to Dashboard
              </Button>
            )}

            {status === 'error' && (
              <>
                <Button onClick={handleRetry} className="flex-1">
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleContinue} className="flex-1">
                  Back to Dashboard
                </Button>
              </>
            )}

            {status === 'loading' && (
              <Button disabled className="flex-1">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </Button>
            )}
          </div>

          {status === 'error' && (
            <p className="text-xs text-gray-500 mt-4">
              If you continue to experience issues, please contact our support team with reference: {searchParams.get('reference')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}