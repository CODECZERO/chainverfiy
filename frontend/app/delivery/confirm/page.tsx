"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DeliveryConfirmBasePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to buyer dashboard as fallback
    router.replace("/buyer-dashboard")
  }, [router])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      <p className="text-slate-400 font-medium">Redirecting to dashboard...</p>
    </div>
  )
}
