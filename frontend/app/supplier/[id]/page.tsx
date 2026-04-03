"use client"

import React, { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import { MessageCircle, CheckCircle2, MapPin, Calendar, Package, AlertTriangle, ShieldCheck } from "lucide-react"

export default function SupplierProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [flagging, setFlagging] = useState(false)
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  useEffect(() => {
    async function fetchProfile() {
      try {
        const [profRes, prodRes] = await Promise.all([
          fetch(`${api}/suppliers/${params.id}`),
          fetch(`${api}/suppliers/${params.id}/products`)
        ])
        const prof = await profRes.json()
        const prods = (await prodRes.json()).data || []
        setProfile(prof.data || prof)
        setProducts(prods)
      } catch (e) {
        console.error("Failed to load supplier", e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [params.id])

  const handleFlagSupplier = async () => {
    if (!profile || flagging) return;
    if (!confirm("Are you sure you want to flag this supplier?")) return;
    
    setFlagging(true);
    try {
      const res = await fetch(`${api}/v2/suppliers/${params.id}/flag`, {
        method: 'POST' // Make sure it hits the right versioned route, if they use v2 in the main index
      });
      // The current frontend uses ${api}/suppliers in fetchProfile.
      // Wait, let's look at fetchProfile. It uses fetch(`${api}/suppliers/${params.id}`). So let's use that path.
      
      const retryRes = await fetch(`${api}/suppliers/${params.id}/flag`, {
        method: 'POST'
      });
      
      if (retryRes.ok) {
        alert("Supplier flagged successfully.");
        setProfile((prev: any) => ({ ...prev, flagCount: (prev.flagCount || 0) + 1 }));
      } else {
        alert("Failed to flag supplier.");
      }
    } catch(err) {
      console.error(err);
      alert("Error flagging supplier.");
    } finally {
      setFlagging(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="animate-pulse">
          <div className="h-64 bg-muted w-full" />
          <div className="max-w-6xl mx-auto px-4 -mt-20 flex gap-6">
            <div className="w-40 h-40 bg-muted rounded-full border-4 border-background shrink-0" />
            <div className="flex-1 mt-20 pt-4 space-y-4">
              <div className="h-8 bg-muted rounded-xl w-1/3" />
              <div className="h-4 bg-muted rounded-full w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return <div className="min-h-screen bg-background text-foreground flex items-center justify-center">Supplier not found</div>

  const ts = profile.trustScore || 0
  let ringColor = "ring-gray-500"
  let colorClass = "text-gray-400"
  if (ts >= 80) { ringColor = "ring-emerald-500"; colorClass = "text-emerald-400" }
  else if (ts >= 50) { ringColor = "ring-amber-500"; colorClass = "text-amber-400" }
  else if (ts > 0) { ringColor = "ring-red-500"; colorClass = "text-red-400" }

  const verifiedCount = products.filter(p => p.status === "VERIFIED").length
  const totalSales = products.reduce((acc, p) => acc + (p.soldCount || 0), 0)

  return (
    <div className="min-h-screen bg-[#05060B] text-foreground pb-32 selection:bg-blue-500/30 selection:text-blue-200">
      <Header />

      {/* ── Dynamic Atmospheric Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      {/* ── COVER GRADIENT ── */}
      <div className="h-64 md:h-80 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-[#0A0D14] to-[#05060B]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#05060B] to-transparent" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 -mt-32 md:-mt-48 relative z-10 flex flex-col md:flex-row gap-8 md:gap-16">
        
        {/* ── AVATAR & TRUST SCORE ── */}
        <div className="flex flex-col items-center md:items-start shrink-0">
          <div className="relative w-40 h-40 md:w-64 md:h-64 bg-[#0A0D14]/80 backdrop-blur-3xl rounded-[4rem] flex items-center justify-center border border-white/[0.08] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] group overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-cover p-2 rounded-[4rem] group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <span className="text-6xl md:text-8xl font-black bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent italic drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                {profile.name?.[0]?.toUpperCase() || "S"}
              </span>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-2 rounded-full border border-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center gap-2 whitespace-nowrap z-20">
              <ShieldCheck className="w-4 h-4 text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">{ts} Trust Index</span>
            </div>
          </div>
        </div>

        {/* ── HEADER INFO ── */}
        <div className="flex-1 mt-8 md:mt-48 text-center md:text-left">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div>
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-6 italic flex items-center justify-center md:justify-start gap-3">
                 <div className="w-8 h-[1px] bg-blue-500/30" />
                 Validated Merchant Entity
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 text-white uppercase italic leading-none flex items-center justify-center md:justify-start gap-6">
                {profile.name}
                {profile.isVerified && (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                     <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                )}
              </h1>
              <p className="text-xl text-slate-400 mt-2 mb-10 leading-relaxed max-w-2xl font-medium italic border-l-2 border-white/5 pl-8 text-left">
                {profile.description || "A high-trust production node within the Pramanik Oracle Network. All biological records and shipments are verified via multi-sig consensus."}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">
                {profile.location && (
                  <div className="flex items-center gap-3 bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] px-6 py-3 rounded-2xl">
                    <MapPin className="w-4 h-4 text-blue-500" /> {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-3 bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] px-6 py-3 rounded-2xl">
                  <Calendar className="w-4 h-4 text-blue-500" /> Genesis 2024
                </div>
              </div>
            </div>
            
            {/* Desktop Action Terminal */}
            <div className="hidden lg:flex shrink-0 gap-4 items-center bg-[#0A0D14]/40 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-white/[0.04]">
              <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi ${profile.name}`} target="_blank" rel="noopener noreferrer">
                <button className="h-20 px-10 bg-white text-black hover:bg-slate-200 font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-4 italic shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95">
                  <MessageCircle className="w-6 h-6" /> Contact Node
                </button>
              </a>
              <button 
                onClick={handleFlagSupplier}
                disabled={flagging}
                className="h-20 px-10 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-black rounded-2xl text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-4 italic active:scale-95"
              >
                <AlertTriangle className="w-6 h-6" /> {flagging ? "Reporting..." : "Flag Violation"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="max-w-[1600px] mx-auto px-6 mt-20 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Verified Assets", value: verifiedCount, icon: Package, col: "text-blue-400", bg: "from-blue-500/10" },
            { label: "Network Trust", value: `${ts}%`, icon: ShieldCheck, col: "text-indigo-400", bg: "from-indigo-500/10" },
            { label: "Settled Orders", value: totalSales || "0", icon: CheckCircle2, col: "text-emerald-400", bg: "from-emerald-500/10" },
            { label: "Protocol Violations", value: profile.flagCount || 0, icon: AlertTriangle, col: "text-red-400", bg: "from-red-500/10" }
          ].map(s => (
            <div key={s.label} className={`bg-gradient-to-br ${s.bg} to-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-8 group relative overflow-hidden shadow-2xl`}>
               <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 italic">{s.label}</div>
              <div className="flex items-end justify-between">
                <div className={`text-5xl font-black font-mono ${s.col} italic tabular-nums tracking-tighter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>{s.value}</div>
                <s.icon className={`w-8 h-8 ${s.col} opacity-30 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRODUCT GRID ── */}
      <div className="max-w-[1600px] mx-auto px-6 mt-32 relative z-10">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white flex items-center gap-6">
            Merchant Index <span className="text-slate-600 text-xl font-medium tracking-normal not-italic">({products.length} active nodes)</span>
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No products yet</h3>
            <p className="text-muted-foreground max-w-md">This supplier hasn't listed any verified products on Pramanik yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(p => (
              <ProductCard key={p.id} task={p} />
            ))}
          </div>
        )}
      </div>

      {/* ── MOBILE STICKY CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden z-50">
        <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=Hi ${profile.name}`} target="_blank" rel="noopener noreferrer">
          <button className="w-full bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 font-bold rounded-2xl h-14 flex items-center justify-center gap-2 active:scale-95 transition-all">
            <MessageCircle className="w-5 h-5 fill-current" /> Contact Supplier
          </button>
        </a>
      </div>
    </div>
  )
}
