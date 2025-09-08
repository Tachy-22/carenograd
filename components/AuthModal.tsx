"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter()

  const handleAuthRedirect = () => {
    onClose()
    router.push("/auth")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-10">
        <DialogHeader>
          <DialogTitle className="text-center font-bold text-3xl mb-2">Welcome back</DialogTitle>
          <DialogDescription className="text-center mb-2 text-xl">
            Log in or sign up to get smarter responses, upload files and images, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Button
            onClick={handleAuthRedirect}
            className="w-full rounded-full"
            size="lg"
          >
            Log in
          </Button>

          <Button
            onClick={handleAuthRedirect}
            variant="outline"
            className="w-full rounded-full"
            size="lg"
          >
            Sign up for free
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}