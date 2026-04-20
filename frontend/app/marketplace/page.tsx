"use client"

import React, { useState } from "react"
import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import { Search, Sparkles, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Outfit, Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { useProducts, useExchangeRates } from "@/hooks/use-api-queries"

const outfit = Outfit({ subsets: ["latin"] as const })
const inter = Inter({ subsets: ["latin"] as const })

const CATEGORIES = ["ALL", "Food & Spices", "Textiles", "Handicrafts", "Agriculture", "Electronics", "Other"]

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilters, setActiveFilters] = useState({
    status: "ALL",
    category: "ALL"
  })

  // 🪄 Centralized Data Fetching via React Query
  const { data: items, isLoading: itemsLoading } = useProducts()
  const { data: ratesData } = useExchangeRates()

  const tasks = Array.isArray(items) ? items : (items?.products || items?.data || [])
  const usdcInr = ratesData?.USDC?.inr || 83.33
  const loading = itemsLoading

  const filteredTasks = tasks.filter(t => {
    if (!t) return false;
    
    if (activeFilters.status !== "ALL") {
      if (activeFilters.status === "VERIFIED" && t.status !== "VERIFIED") return false
      if (activeFilters.status === "PENDING" && t.status !== "PENDING_VERIFICATION") return false
    }
    if (activeFilters.category !== "ALL" && t.category !== activeFilters.category) return false
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const titleMatch = t.title ? t.title.toLowerCase().includes(q) : false;
      const supplierMatch = t.supplierName ? t.supplierName.toLowerCase().includes(q) : false;
      return titleMatch || supplierMatch;
    }
    return true
  })

  return (
    <div className={`min-h-screen bg-[#05060A] text-slate-200 overflow-x-hidden selection:bg-indigo-500/30 ${inter.className}`}>
      
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          
          {/* ── Section Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-indigo-500/40" />
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Premium Selection</span>
              </div>
              <h1 className={`${outfit.className} text-4xl md:text-6xl font-bold tracking-tight text-white mb-6`}>
                Ethical <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">Storefront</span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed font-light">
                Discover authentic products verified by local communities and anchored on the Stellar blockchain for absolute transparency.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4 min-w-[320px]"
            >
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products or makers..." 
                  className="pl-14 h-16 bg-white/[0.04] border-white/10 rounded-2xl focus:ring-indigo-500/20 text-sm shadow-inner"
                />
              </div>
              <div className="flex gap-3">
                 <div className="flex-1 px-6 py-3 rounded-2xl bg-indigo-500/5 border border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">Currency</span>
                    <span className="text-sm font-mono font-bold text-indigo-400 leading-none">NETWORK BASE ASSET: USDC</span>
                 </div>
                 <Button variant="outline" className="rounded-2xl h-14 px-6 border-white/10 hover:bg-white/5 active:scale-95 transition-all">
                     <Filter className="w-4 h-4 mr-2 text-slate-400" /> 
                     <span className="text-xs font-bold text-slate-400">Filter</span>
                  </Button>
              </div>
            </motion.div>
          </div>

          {/* ── Category Pipeline ── */}
          <div className="flex flex-wrap items-center gap-3 mb-16">
            {CATEGORIES.map((cat, idx) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveFilters(prev => ({ ...prev, category: cat }))}
                className={cn(
                  "px-7 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all border",
                  activeFilters.category === cat 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-xl" 
                    : "bg-white/[0.03] border-white/5 text-slate-500 hover:text-slate-200 hover:bg-white/[0.08]"
                )}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* ── Asset Grid ── */}
          <div className="relative">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-white/[0.02] animate-pulse border border-white/[0.05]" />
                ))}
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task, idx) => (
                    <motion.div
                      key={task.id || task._id || idx}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ duration: 0.5, delay: Math.min(idx * 0.05, 0.4) }}
                    >
                      <ProductCard task={task} index={idx} usdcInr={usdcInr} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-40 flex flex-col items-center justify-center text-center bg-white/[0.01] rounded-[4rem] border border-dashed border-white/10"
              >
                <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] flex items-center justify-center mb-8 border border-white/5 shadow-inner">
                  <Sparkles className="w-12 h-12 text-slate-800" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">No Products Found</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-light text-lg">We couldn't find any verified products matching your current filters.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveFilters({ status: "ALL", category: "ALL" })}
                  className="mt-10 rounded-xl border-white/10 hover:bg-white/5"
                >
                  Clear all filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
