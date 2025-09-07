"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to start your graduate school journey</DialogTitle>
          <DialogDescription>
            Access personalized AI guidance, document analysis, and application tracking
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={handleGoogleAuth}
            className="w-full"
            size="lg"
          >
            Continue with Google
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  )
}