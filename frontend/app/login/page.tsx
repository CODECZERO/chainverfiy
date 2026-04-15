"use client"

import { AuthCard } from "@/components/auth-card"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function LoginPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#020408] text-white selection:bg-indigo-500/30">
      <Header />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 pt-32 pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <AuthCard 
            defaultMode="login" 
            onSuccess={() => router.push("/marketplace")} 
            className="shadow-3xl"
          />
        </motion.div>
      </div>

      {/* Footer Branding */}
      <div className="fixed bottom-8 left-0 right-0 pointer-events-none text-center">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">
          Distributed Ledger Authentication Interface
        </p>
      </div>
    </main>
  )
}
