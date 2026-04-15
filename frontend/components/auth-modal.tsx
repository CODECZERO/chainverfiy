"use client"

import { AuthCard } from "./auth-card"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: "login" | "signup"
}

export function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none overflow-visible">
        <AuthCard defaultMode={defaultMode} onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  )
}
