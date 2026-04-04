"use client"

import React, { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import { MessageCircle, CheckCircle2, MapPin, Calendar, Package, AlertTriangle, ShieldCheck, Star, Activity, Globe, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { getSupplier, getSupplierProducts, flagSupplier } from "@/lib/api-service"


export default function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const id = resolvedParams.id
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [flagging, setFlagging] = useState(false)
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  useEffect(() => {
    async function fetchProfile() {
      try {
        const [prof, prods] = await Promise.all([
          getSupplier(id),
          getSupplierProducts(id)
        ])
        setProfile(prof)
        setProducts(prods || [])
      } catch (e) {
        console.error("Failed to load supplier", e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id])

  const handleFlagSupplier = async () => {
    if (!profile || flagging) return;
    if (!confirm("Confirm protocol violation report? This will initiate a consensus audit.")) return;
    
    setFlagging(true);
    try {
      const res = await flagSupplier(id);
      
      if (res) {
        alert("Violation reported successfully.");
        setProfile((prev: any) => ({ ...prev, flagCount: (prev.flagCount || 0) + 1 }));
      } else {
        alert("Failed to report violation.");
      }
    } catch(err) {
      console.error(err);
      alert("Network error during report.");
    } finally {
      setFlagging(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030408] text-foreground">
        <Header />
        <div className="max-w-[1600px] mx-auto px-6 py-24 animate-pulse space-y-12">
          <div className="h-64 bg-white/5 rounded-[3rem] w-full" />
          <div className="flex flex-col md:flex-row gap-12 -mt-32 relative z-10 px-8">
             <div className="w-56 h-56 bg-white/5 rounded-[2.5rem] shrink-0" />
             <div className="flex-1 mt-32 space-y-4">
                <div className="h-12 bg-white/5 rounded-xl w-1/3" />
                <div className="h-4 bg-white/5 rounded-full w-1/2" />
             </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return <div className="min-h-screen bg-[#030408] text-white flex items-center justify-center font-display font-black uppercase tracking-widest italic">Node Not Found</div>

  const ts = profile.trustScore || 85
  const verifiedCount = products.filter(p => p.status === "VERIFIED").length
  const totalSales = products.reduce((acc, p) => acc + (p.soldCount || 0), 0)

  return (
    <div className="min-h-screen bg-[#030408] text-slate-200 pb-32 selection:bg-indigo-500/30 overflow-hidden relative">
      <Header />

      {/* ── Atmospheric Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="glow-orb w-[800px] h-[800px] bg-indigo-600/5 top-[-20%] left-[-10%] animate-float-slow" />
        <div className="glow-orb w-[600px] h-[600px] bg-blue-600/5 bottom-[-10%] right-[-10%] animate-float-fast" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
      </div>

      {/* ── Terminal Cover ── */}
      <div className="h-64 md:h-96 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-[#030408] to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#030408] to-transparent" />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 -mt-32 md:-mt-56 relative z-10 flex flex-col md:flex-row gap-8 lg:gap-16">
        
        {/* ── Identity Module ── */}
        <div className="flex flex-col items-center md:items-start shrink-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="relative w-48 h-48 md:w-80 md:h-80 glass-premium rounded-[3.5rem] flex items-center justify-center border border-white/[0.08] shadow-3xl group overflow-hidden"
          >
            <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors pointer-events-none" />
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-cover p-3 rounded-[3.5rem] group-hover:scale-110 transition-transform duration-1000" />
            ) : (
              <span className="text-7xl md:text-[10rem] font-display font-black bg-gradient-to-br from-indigo-400 via-white to-blue-600 bg-clip-text text-transparent italic drop-shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                {profile.name?.[0]?.toUpperCase() || "S"}
              </span>
            )}
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 px-8 py-3 rounded-2xl border border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.5)] flex items-center gap-3 whitespace-nowrap z-20">
              <ShieldCheck className="w-5 h-5 text-white" />
              <span className="text-[11px] font-display font-black text-white uppercase tracking-[0.3em] italic">{ts}% Trust Score</span>
            </div>
          </motion.div>
        </div>

        {/* ── Node Intelligence ── */}
        <div className="flex-1 mt-8 md:mt-56 text-center md:text-left">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-12">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
                 <div className="w-10 h-[1px] bg-indigo-500/40" />
                 <span className="text-[10px] font-display font-black text-indigo-400 uppercase tracking-[0.5em] italic">Validated Identity Node</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter mb-8 text-white uppercase italic leading-[0.85] flex flex-wrap items-center justify-center md:justify-start gap-6">
                {profile.name}
                {profile.isVerified && (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                     <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                )}
              </h1>
              <div className="bg-white/[0.02] border-l-4 border-indigo-500/30 rounded-r-3xl p-8 backdrop-blur-3xl mb-10 max-w-3xl">
                 <p className="text-xl text-slate-400 leading-relaxed italic font-medium">
                   {profile.description || "Authorized production node integrated with the ChainVerify Oracle Protocol. All listed units have undergone multi-sig verification and cryptographic audit."}
                 </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {profile.location && (
                  <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] px-6 py-3 rounded-2xl text-[10px] font-display font-black text-slate-400 uppercase tracking-[0.3em] italic">
                    <MapPin className="w-4 h-4 text-indigo-500" /> {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] px-6 py-3 rounded-2xl text-[10px] font-display font-black text-slate-400 uppercase tracking-[0.3em] italic">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Genesis 2024
                </div>
              </div>
            </motion.div>
            
            {/* Action Matrix */}
            <div className="flex shrink-0 gap-4 items-center bg-white/[0.02] backdrop-blur-3xl p-5 rounded-[3rem] border border-white/[0.06] shadow-2xl">
              <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi ${profile.name}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                <button className="w-full xl:w-auto h-20 px-12 bg-white text-black hover:bg-slate-200 font-display font-black rounded-2xl text-[11px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 italic shadow-[0_25px_50px_rgba(255,255,255,0.1)] active:scale-[0.98]">
                  <MessageCircle className="w-6 h-6" /> Contact Node
                </button>
              </a>
              <button 
                onClick={handleFlagSupplier}
                disabled={flagging}
                className="h-20 px-10 bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600/20 font-display font-black rounded-2xl text-[10px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 italic active:scale-[0.98]"
              >
                <AlertTriangle className="w-6 h-6" /> {flagging ? "Analyzing..." : "Report Leak"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Analytics ── */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-24 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {[
            { label: "Active Assets", value: products.length, icon: Package, col: "text-indigo-400", glow: "shadow-[0_0_30px_rgba(79,70,229,0.2)]" },
            { label: "Audit Success", value: verifiedCount, icon: ShieldCheck, col: "text-emerald-400", glow: "shadow-[0_0_30px_rgba(16,185,129,0.2)]" },
            { label: "Network Activity", value: totalSales || "842", icon: Zap, col: "text-blue-400", glow: "shadow-[0_0_30px_rgba(37,99,235,0.2)]" },
            { label: "Protocol Alerts", value: profile.flagCount || 0, icon: AlertTriangle, col: "text-red-500", glow: "shadow-[0_0_30px_rgba(239,68,68,0.2)]" }
          ].map((s, idx) => (
            <motion.div 
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-premium rounded-[2.5rem] p-8 md:p-10 group relative overflow-hidden transition-all hover:scale-[1.02] ${s.glow}`}
            >
               <div className="absolute inset-0 bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[10px] font-display font-black uppercase tracking-[0.4em] text-slate-500 mb-6 italic">{s.label}</div>
              <div className="flex items-end justify-between">
                <div className={`text-5xl md:text-6xl font-display font-black ${s.col} italic tracking-tighter drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>{s.value}</div>
                <s.icon className={`w-10 h-10 ${s.col} opacity-40 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Merchant Repository ── */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-32 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-indigo-500/40" />
              <span className="text-[10px] font-display font-black text-indigo-400 uppercase tracking-[0.5em] italic">Full Repository</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic tracking-tighter text-white">
              Localized <span className="text-indigo-500">Inventory</span>
            </h2>
          </div>
          <div className="px-8 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[10px] font-display font-black text-slate-500 uppercase tracking-[0.3em] italic">
             {products.length} Validated Data Streams
          </div>
        </div>

        {products.length === 0 ? (
          <div className="glass-premium rounded-[3rem] p-32 flex flex-col items-center justify-center text-center border-dashed border-white/[0.1]">
            <div className="w-24 h-24 bg-white/[0.02] rounded-3xl flex items-center justify-center mb-8">
              <Package className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-2xl font-display font-black text-white italic uppercase tracking-widest mb-3">Null Repository</h3>
            <p className="text-slate-500 max-w-md text-sm leading-relaxed">This production node has not yet initialized its product ledger.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((p, idx) => (
              <ProductCard key={p.id} task={p} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
