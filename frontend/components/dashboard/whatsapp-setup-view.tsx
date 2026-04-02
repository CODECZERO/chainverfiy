"use client"

import React, { useEffect, useState } from "react"
import { MessageCircle, CheckCircle2, AlertCircle, RefreshCw, Zap, Shield, Phone, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import { getWhatsappStatus } from "@/lib/api-service"

export function WhatsappSetupView({ sid }: { sid: string }) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await getWhatsappStatus()
      if (res.success) setStatus(res.data)
    } catch (err) {
      console.error("Failed to fetch WhatsApp status", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">WhatsApp <span className="text-emerald-500">Integration</span></h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Automated Product Ingestion Gateway</p>
        </div>
        <button 
          onClick={fetchStatus}
          className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all active:scale-95 group"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span className="text-white">Refresh Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Status Card */}
        <div className="lg:col-span-12">
          <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-emerald-500/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
               <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform duration-700">
                  <MessageCircle className="w-12 h-12 text-emerald-500" />
               </div>
               
               <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                     <h3 className="text-2xl font-black text-white tracking-tight uppercase italic underline decoration-emerald-500/30 underline-offset-8">
                        Global Gateway Status
                     </h3>
                     {status?.connected ? (
                        <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                          <Zap className="w-3 h-3 fill-emerald-500" /> Operational
                        </span>
                     ) : (
                        <span className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle className="w-3 h-3" /> Connection Required
                        </span>
                     )}
                  </div>
                  <p className="text-slate-500 text-sm font-medium max-w-xl">
                    {status?.connected 
                      ? "Your WhatsApp node is currently active and processing product metadata in real-time."
                      : "Initialize your WhatsApp merchant gateway to enable rapid product listing and automated inventory management via chat."}
                  </p>
               </div>
               
               <div className="shrink-0 flex flex-col gap-4">
                  <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=STATUS`} target="_blank" rel="noopener noreferrer">
                    <button className="w-full px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95">
                       {status?.connected ? "View Admin Console" : "Launch WhatsApp Setup"}
                    </button>
                  </a>
                  <button className="w-full px-8 py-3 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-white/10 transition-all">
                     API Documentation
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
           <FeatureCard 
             icon={Shield} 
             title="End-to-End Verification" 
             desc="All data transmitted via WhatsApp is cryptographically verified before indexing."
             color="blue"
           />
           <FeatureCard 
             icon={Phone} 
             title="Instant Ingestion" 
             desc="Send product photos and 1-line descriptions to create a digital twin instantly."
             color="emerald"
           />
           <FeatureCard 
             icon={CheckCircle2} 
             title="Automated KYC" 
             desc="WhatsApp Business identity is cross-referenced with your merchant profile."
             color="purple"
           />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, color }: any) {
  const colorMap: any = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  }

  return (
    <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-8 group">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
       </div>
       <h4 className="text-lg font-black text-white uppercase tracking-tight italic mb-3">{title}</h4>
       <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{desc}</p>
    </div>
  )
}
