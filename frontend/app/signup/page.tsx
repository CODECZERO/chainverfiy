"use client"

import { AuthCard } from "@/components/auth-card"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function SignupPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#020408] text-white selection:bg-indigo-500/30">
      <Header />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-1/4 w-[60%] h-[60%] bg-emerald-600/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 pt-32 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <AuthCard 
            defaultMode="signup" 
            onSuccess={() => router.push("/marketplace")} 
            className="shadow-3xl"
          />
        </motion.div>
      </div>

      {/* Trust Signifiers */}
      <div className="fixed bottom-12 left-0 right-0 pointer-events-none flex items-center justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all duration-700 hidden lg:flex">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Stellar Optimized</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Decentralized Auth</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Verified Origins</span>
        </div>
      </div>
    </main>
  )
}
