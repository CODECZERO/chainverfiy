"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search, CheckCircle2, XCircle, Clock, Package, ArrowUpDown,
  Sparkles, Award, ShoppingBag, Leaf, Palette, Cpu, Gem, LayoutGrid,
  Zap, Shield, Globe, Filter, SlidersHorizontal
} from "lucide-react"
import Link from "next/link"
import { convertInrToUsdc, getUSDCInrRate } from "@/lib/exchange-rates"
import { ProductCard } from "@/components/product-card"
import { motion, AnimatePresence } from "framer-motion"

const CATEGORIES = [
  { name: "ALL", icon: <LayoutGrid className="w-4 h-4" /> },
  { name: "FOOD & SPICES", icon: <Leaf className="w-4 h-4" /> },
  { name: "TEXTILES", icon: <ShoppingBag className="w-4 h-4" /> },
  { name: "HANDICRAFTS", icon: <Palette className="w-4 h-4" /> },
  { name: "AGRICULTURE", icon: <Sparkles className="w-4 h-4" /> },
  { name: "ELECTRONICS", icon: <Cpu className="w-4 h-4" /> },
  { name: "JEWELRY", icon: <Gem className="w-4 h-4" /> },
]

interface Product {
  id: string
  title: string
  description?: string
  category: string
  priceInr: number
  priceUsdc?: number
  status: string
  proofMediaUrls: string[]
  voteReal: number
  voteFake: number
  supplier: { name: string; location: string; trustScore: number; isVerified: boolean }
}

export default function Marketplace() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("ALL")
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "most-voted">("newest")
  const [usdcInr, setUsdcInr] = useState<number>(83.33)

  useEffect(() => { loadProducts() }, [category, verifiedOnly])
  useEffect(() => { getUSDCInrRate().then(setUsdcInr).catch(() => {}) }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (category !== "ALL") params.set("category", category)
      if (verifiedOnly) params.set("status", "VERIFIED")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${params}`)
      const data = await res.json()
      setProducts(data.data?.products || [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = products
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low": return a.priceInr - b.priceInr
        case "price-high": return b.priceInr - a.priceInr
        case "most-voted": return (b.voteReal + b.voteFake) - (a.voteReal + a.voteFake)
        default: return 0
      }
    })

  return (
    <div className="min-h-screen bg-[#05060B] text-foreground pb-32 selection:bg-blue-500/30">
      <Header />
      
      {/* ── Dynamic Atmospheric Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      {/* ── Strategic Page Header ── */}
      <div className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden border-b border-white/[0.04]">
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] italic">Open Protocol Marketplace</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase leading-[0.9] mb-8 text-white">
              VERIFIED <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500 drop-shadow-[0_0_30px_rgba(37,99,235,0.3)]">INTELLIGENCE</span>.<br/>
              GLOBAL TRUST.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed max-w-2xl italic">
              Access a decentralized repository of authenticated premium goods. Every unit is validated via multi-node consensus and secured by Stellar escrow logic.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-16 relative z-10">
        
        {/* ── Command Center (Filters) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-6 mb-20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]"
        >
          <div className="flex flex-col xl:flex-row gap-8">
            
            {/* Tactical Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              <Input
                placeholder="PROBE CATALOG FOR AUTHENTICATED UNITS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-16 rounded-2xl h-16 text-[10px] font-black uppercase tracking-widest italic bg-black/40 border-white/[0.06] focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-all placeholder:text-slate-600 shadow-inner"
              />
            </div>
            
            {/* Tactical Controls */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all border-2 ${
                  verifiedOnly
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                    : "bg-black/40 border-white/[0.06] text-slate-500 hover:border-slate-300 hover:text-white"
                }`}
              >
                <Shield className={`w-4 h-4 ${verifiedOnly ? "text-emerald-400" : "text-slate-600"}`} /> 
                Verified Protocol Only
              </button>

              <div className="relative group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-black/40 border-2 border-white/[0.06] text-white font-black uppercase tracking-widest italic text-[10px] rounded-2xl px-8 py-4 pr-16 cursor-pointer hover:border-slate-300 transition-all focus:outline-none focus:border-blue-500 h-[64px]"
                >
                  <option value="newest">INDEX: NEWEST ARRIVAL</option>
                  <option value="price-low">VALUATION: ASCENDING</option>
                  <option value="price-high">VALUATION: DESCENDING</option>
                  <option value="most-voted">CONSENSUS: HIGHEST VOWED</option>
                </select>
                <SlidersHorizontal className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>

          {/* Strategic Categories */}
          <div className="flex gap-4 overflow-x-auto pb-4 pt-8 mt-8 border-t border-white/[0.04] scrollbar-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                className={`flex items-center gap-3 px-8 py-4 rounded-[1.25rem] text-[9px] font-black uppercase tracking-[0.2em] italic transition-all whitespace-nowrap border ${
                  category === c.name
                    ? "bg-white text-black border-white shadow-[0_20px_40px_rgba(255,255,255,0.15)] scale-105"
                    : "bg-black/20 border-white/[0.06] text-slate-500 hover:bg-white/[0.04] hover:text-white hover:border-white/[0.2]"
                }`}
              >
                <span className={`${category === c.name ? "text-black" : "text-blue-500"}`}>{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Operational Grid ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#0A0D14]/60 border border-white/[0.04] rounded-[2.5rem] overflow-hidden h-[540px] animate-pulse">
                  <div className="aspect-[4/3] bg-white/[0.02] m-3 rounded-[2rem]" />
                  <div className="p-8 space-y-6">
                    <div className="h-6 bg-white/[0.04] rounded-lg w-3/4" />
                    <div className="h-4 bg-white/[0.02] rounded-lg w-full" />
                    <div className="h-24 bg-white/[0.02] rounded-3xl" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
            >
              {filtered.map((p, i) => (
                <ProductCard key={p.id} task={p} index={i} usdcInr={usdcInr} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Termination State (Empty) ── */}
        {!loading && filtered.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl mx-auto text-center py-32 bg-[#0A0D14]/40 border border-white/[0.04] rounded-[4rem] mt-20 backdrop-blur-2xl"
          >
            <div className="w-24 h-24 mx-auto mb-10 rounded-[2rem] bg-black/40 flex items-center justify-center border border-white/[0.06] shadow-2xl">
              <Package className="w-10 h-10 text-slate-700" strokeWidth={1} />
            </div>
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">No Tactical Matches Found</h3>
            <p className="text-slate-500 font-medium mb-12 max-w-sm mx-auto italic uppercase tracking-widest text-[10px]">
              The current query parameters yielded zero results in the decentralized repository. Re-calibrate your filters.
            </p>
            <Button 
              onClick={() => { setSearch(""); setCategory("ALL"); setVerifiedOnly(false); }}
              className="rounded-2xl h-16 px-12 font-black uppercase tracking-[0.3em] italic text-[10px] border-white/[0.1] bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-[0_20px_40px_rgba(37,99,235,0.3)]"
            >
              Reset Protocol Filters
            </Button>
          </motion.div>
        )}

        {/* ── Intelligence Sum ── */}
        {!loading && filtered.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-20 text-center"
          >
            <div className="inline-flex items-center gap-4 px-10 py-5 rounded-full bg-[#0A0D14]/60 border border-white/[0.06] shadow-2xl backdrop-blur-xl">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Intelligence Nodes Active</span>
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              <strong className="text-lg font-black text-white italic tracking-tighter">{filtered.length}</strong>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
