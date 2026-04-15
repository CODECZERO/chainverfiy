"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "@/lib/redux/store"
import { loginUser } from "@/lib/redux/slices/user-auth-slice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShieldCheck, MessageCircle, ArrowRight, CheckCircle2, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface AuthCardProps {
  defaultMode?: "login" | "signup"
  onSuccess?: () => void
  className?: string
}

export function AuthCard({ defaultMode = "login", onSuccess, className }: AuthCardProps) {
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error } = useSelector((state: RootState) => state.userAuth)
  const [mode, setMode] = useState<"login" | "signup">(defaultMode)
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    whatsappNumber: "",
    role: "SUPPLIER" as "SUPPLIER",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setMode(defaultMode)
    setLocalError(null)
  }, [defaultMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (mode === "login") {
      const result = await dispatch(loginUser({ email: form.email, password: form.password }))
      if (loginUser.fulfilled.match(result) && onSuccess) onSuccess()
    } else {
      setIsSubmitting(true)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/signup`, {
          method: "POST", 
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (res.ok) { 
          await dispatch(loginUser({ email: form.email, password: form.password })); 
          if (onSuccess) onSuccess() 
        } else {
          const data = await res.json().catch(() => null);
          setLocalError(data?.message || "Registration failed. Please try again.");
        }
      } catch (err) {
        setLocalError("Network error. Please check your connection.")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="glass-premium rounded-[2.5rem] border border-white/10 p-8 shadow-2xl overflow-hidden relative group">
        {/* Background Accents */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700" />

        <div className="relative z-10">
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-500/20 mb-4 transform hover:scale-110 transition-all duration-300">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Partner Intelligence</h1>
            <p className="text-sm text-slate-400 font-medium">
              Join the ecosystem of verified high-integrity manufacturers.
            </p>
          </header>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")} className="mb-8">
            <TabsList className="grid grid-cols-2 bg-white/[0.03] border border-white/5 p-1 rounded-2xl h-12">
              <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">Register</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Entity Name</label>
                    <Input 
                      placeholder="e.g. Global Tech Solutions" 
                      className="h-12 bg-white/[0.03] border-white/10 rounded-xl focus:ring-indigo-500/30"
                      value={form.name} 
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">WhatsApp Context</label>
                    <Input
                      placeholder="+91 98765 43210"
                      className="h-12 bg-white/[0.03] border-white/10 rounded-xl focus:ring-indigo-500/30 font-mono"
                      value={form.whatsappNumber}
                      onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Secure Email</label>
              <Input 
                type="email" 
                placeholder="identity@chainverify.io" 
                className="h-12 bg-white/[0.03] border-white/10 rounded-xl focus:ring-indigo-500/30"
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Encryption Key</label>
              <Input 
                type="password" 
                placeholder="••••••••••••" 
                className="h-12 bg-white/[0.03] border-white/10 rounded-xl focus:ring-indigo-500/30"
                value={form.password} 
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
              />
            </div>

            {(localError || error) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center"
              >
                <p className="text-red-400 text-xs font-bold">{localError || error}</p>
              </motion.div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || isSubmitting} 
              className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-900/20 active:scale-95 transition-all mt-4"
            >
              {isLoading || isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {mode === "login" ? "Initiate Session" : "Provision Profile"}
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            <div className="pt-6 border-t border-white/5 mt-6">
              <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Need operational assistance?</p>
                <a 
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=HELP_AUTH`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full"
                >
                  <Button variant="ghost" className="w-full text-xs text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/5 rounded-xl border border-white/5">
                    <MessageCircle className="w-4 h-4 mr-2" /> Connect with Support
                  </Button>
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      <p className="text-center mt-8 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">
        ChainVerify Identity Protocol v1.4.2 — Secured by Community Consensus
      </p>
    </div>
  )
}
