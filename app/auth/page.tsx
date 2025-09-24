'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function AuthPage() {
  const router = useRouter()

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google"
  }



  return (
    <div className="fixed inset-0 w-screen h-screen flex relative bg-white z-50">
      {/* Back to Home Button - Fixed at top left */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      {/* Left Column - Sign In Form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-4 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          <Card className="w-full border-0 border-none shadow-none">
            <CardHeader className="space-y-1">
              {/* Carenograd Logo */}
              <div className="flex justify-center w-fit mx-auto mb-4">
                <Image
                  src="/logo.png"
                  alt="Carenograd Logo"
                  width={60}
                  height={60}
                  className="rounded-lg"
                />
              </div>

              <CardTitle className="text-2xl text-center">Log in for a more personalized experience</CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                Get smarter responses, upload files and images, and access your conversation history.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 mt-8">
              <Button
                className="w-full"
                onClick={handleGoogleAuth}
                size="lg"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column - Image (Hidden on mobile, visible on large screens) */}
      <div className="hidden lg:flex flex-1 relative w-full">
        <Image
          src="/login.jpg"
          alt="Sign in background"
          fill
          className="object-cover"
        />
      </div>
    </div>
  )
}