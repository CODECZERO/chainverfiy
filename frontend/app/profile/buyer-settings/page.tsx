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

export default function BuyerSettingsPage() {
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
        
        if (meRes.success) setUser(meRes.data)
        if (profileRes.success) {
          setProfile({
            name: profileRes.data.name || "",
            email: profileRes.data.email || "",
            phoneNumber: profileRes.data.phoneNumber || "",
            deliveryAddress: profileRes.data.deliveryAddress || ""
          })
        }
      } catch (err) {
        console.error("Failed to load profile", err)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await updateBuyerProfile(profile)
      if (res.success) {
        setMessage({ type: 'success', text: "Profile updated successfully" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: res.message || "Failed to update profile" })
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Network error occurred" })
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans pb-20">
      <Header />
      
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              Buyer <span className="text-blue-500">Settings</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage your verified procurement identity</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-3">
             <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
               <Wallet className="w-5 h-5 text-blue-400" />
             </div>
             <div>
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Wallet</div>
               <div className="text-xs font-black text-white tracking-tight">{truncateWallet(user?.publicKey)}</div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Nav */}
          <div className="lg:col-span-4 space-y-4">
             <NavButton active icon={User} label="Personal Profile" />
             <NavButton icon={Shield} label="Security & Privacy" />
             <NavButton icon={Bell} label="Notification Center" />
             <NavButton icon={CreditCard} label="Payment Methods" />
             
             <div className="mt-12 p-8 bg-blue-600/5 border border-blue-600/10 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic mb-2">Trust Score</h3>
                <div className="text-3xl font-black text-blue-500 tracking-tighter">Gold Tier</div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-4">Verified Transactions: 12</p>
                <button className="mt-6 flex items-center gap-2 text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors">
                  VIEW BADGES <ArrowRight className="w-3 h-3" />
                </button>
             </div>
          </div>

          {/* Settings Form */}
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
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

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                     <Globe className="w-3 h-3" /> Default Delivery Yard
                   </label>
                   <textarea 
                     className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 text-white font-medium focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/[0.03] transition-all min-h-[120px] resize-none"
                     placeholder="Enter full shipping/receiving address..."
                     value={profile.deliveryAddress}
                     onChange={(e: any) => setProfile({...profile, deliveryAddress: e.target.value})}
                   />
                </div>

                <AnimatePresence>
                  {message && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border ${message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
                    >
                      {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-6 flex justify-end">
                   <button 
                     type="submit"
                     disabled={saving}
                     className="flex items-center gap-4 px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-500 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0"
                   >
                     {saving ? "Synchronizing..." : (
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
    <button className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all group ${active ? "bg-white/5 border border-white/10 text-white shadow-xl" : "hover:bg-white/[0.03] text-slate-500 border border-transparent"}`}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-700 group-hover:text-slate-400"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight className={`w-4 h-4 transition-transform ${active ? "text-blue-500" : "text-slate-800"}`} />
    </button>
  )
}

function Input({ label, icon: Icon, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <div className="relative group">
        <input 
          {...props}
          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/[0.03] transition-all"
        />
        <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-focus-within:via-blue-500/50 transition-all duration-700" />
      </div>
    </div>
  )
}
