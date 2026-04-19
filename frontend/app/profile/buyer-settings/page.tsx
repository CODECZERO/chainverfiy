"use client"

import React, { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { getBuyerProfile, updateBuyerProfile, getMe } from "@/lib/api-service"
import { 
  User, Mail, Wallet, Shield, 
  Save, CheckCircle2, AlertCircle,
  CreditCard, Settings, Bell,
  ChevronRight, ArrowRight, Globe
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { truncateWallet } from "@/lib/qr-utils"
import { Outfit, Inter } from "next/font/google"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

import { useWallet } from "@/lib/wallet-context"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"

export default function BuyerSettingsPage() {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useSelector((s: RootState) => s.userAuth)
  const { publicKey } = useWallet()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>({
    name: "",
    email: "",
    phoneNumber: "",
    deliveryAddress: ""
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meRes, profileRes] = await Promise.all([
          getMe(),
          getBuyerProfile()
        ])
        
        if (meRes?.id) setUser(meRes)
        if (profileRes) {
          setProfile({
            name: profileRes.name || "",
            email: profileRes.email || "",
            phoneNumber: profileRes.phoneNumber || "",
            deliveryAddress: profileRes.deliveryAddress || ""
          })
        }
      } catch (err) {
        console.error("Failed to load profile", err)
      }
      setLoading(false)
    }
    
    if (authUser?.id || publicKey) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [authUser?.id, publicKey])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await updateBuyerProfile(profile)
      if (res.id) { // Usually returns the updated profile object
        setMessage({ type: 'success', text: "Profile updated successfully" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: "Failed to update profile" })
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Network error occurred" })
    }
    setSaving(false)
  }

  const isProfileReady = isAuthenticated || publicKey

  if (authLoading || loading) return (
    <div className={cn("min-h-screen bg-[#05060A] flex items-center justify-center", inter.className)}>
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  if (!isProfileReady) {
    return (
      <div className={`min-h-screen bg-[#05060A] text-slate-200 ${inter.className}`}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <Shield className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className={`${outfit.className} text-4xl font-bold text-white mb-4`}>Sign In Required</h1>
          <p className="text-slate-500 font-medium text-sm mb-10 leading-relaxed max-w-sm mx-auto">Please sign in or connect your wallet to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-[#05060A] text-slate-200 overflow-x-hidden selection:bg-indigo-500/30", inter.className)}>
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Header />
      
      <main className="relative z-10 pt-32 pb-24 max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-indigo-500/40" />
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Configuration</span>
            </div>
            <h1 className={`${outfit.className} text-4xl md:text-5xl font-bold tracking-tight text-white`}>
              Buyer <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">Settings</span>
            </h1>
            <p className="text-slate-500 mt-3 text-sm font-medium">Manage your verified procurement identity</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 bg-white/5 border border-white/[0.08] rounded-2xl px-6 py-4 shadow-inner">
             <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
               <Wallet className="w-5 h-5 text-blue-400" />
             </div>
             <div>
               <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Wallet</div>
               <div className="text-xs font-mono text-white">{truncateWallet(user?.stellarWallet || publicKey || "Not connected")}</div>
             </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Nav */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-4 space-y-4">
             <NavButton active icon={User} label="Personal Profile" />
             <NavButton icon={Shield} label="Security & Privacy" />
             <NavButton icon={Bell} label="Notification Center" />
             <NavButton icon={CreditCard} label="Payment Methods" />
             
             <div className="mt-10 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-8 relative overflow-hidden group shadow-3xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Trust Score</h3>
                <div className={`${outfit.className} text-4xl font-bold text-white tracking-tight`}>Gold Tier</div>
                <p className="text-[11px] text-slate-400 font-medium mt-4">Verified Transactions: <span className="text-white font-bold">12</span></p>
                <button className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">
                  View Badges <ArrowRight className="w-3 h-3" />
                </button>
             </div>
          </motion.div>

          {/* Settings Form */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-3xl"
            >
              <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input 
                    label="Full Legal Name" 
                    icon={User} 
                    value={profile.name}
                    placeholder="Enter your name"
                    onChange={(e: any) => setProfile({...profile, name: e.target.value})}
                  />
                  <Input 
                    label="Verification Email" 
                    icon={Mail} 
                    type="email"
                    value={profile.email}
                    placeholder="name@company.com"
                    onChange={(e: any) => setProfile({...profile, email: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input 
                    label="Direct Contact (WhatsApp)" 
                    icon={Settings} 
                    value={profile.phoneNumber}
                    placeholder="+1 234 567 890"
                    onChange={(e: any) => setProfile({...profile, phoneNumber: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
                     <Globe className="w-3 h-3 text-indigo-400" /> Default Delivery Yard
                   </label>
                   <div className="relative group">
                     <textarea 
                       className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 text-white font-medium focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/[0.02] transition-all min-h-[120px] resize-none"
                       placeholder="Enter full shipping/receiving address..."
                       value={profile.deliveryAddress}
                       onChange={(e: any) => setProfile({...profile, deliveryAddress: e.target.value})}
                     />
                     <div className="absolute bottom-1 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-focus-within:via-indigo-500/50 transition-all duration-700" />
                   </div>
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-2xl border",
                        message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                      )}
                    >
                      {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{message.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-8 border-t border-white/[0.05] flex justify-end">
                   <button 
                     type="submit"
                     disabled={saving}
                     className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                   >
                     {saving ? (
                       <>
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         Synchronizing...
                       </>
                     ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Update Verified Identity
                        </>
                     )}
                   </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

function NavButton({ active, icon: Icon, label }: any) {
  return (
    <button className={cn(
      "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
      active ? "bg-white/[0.04] border border-white/10 text-white shadow-xl" : "hover:bg-white/[0.02] text-slate-400 border border-transparent"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
          active ? "bg-indigo-500/20 text-indigo-400" : "bg-white/5 text-slate-500 group-hover:text-slate-300"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight className={cn("w-4 h-4 transition-transform", active ? "text-indigo-500" : "text-slate-700 group-hover:translate-x-1")} />
    </button>
  )
}

function Input({ label, icon: Icon, ...props }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">
        <Icon className="w-3 h-3 text-indigo-400" /> {label}
      </label>
      <div className="relative group">
        <input 
          {...props}
          className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-4 text-white font-medium focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/[0.02] transition-all"
        />
        <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-focus-within:via-indigo-500/50 transition-all duration-700" />
      </div>
    </div>
  )
}
