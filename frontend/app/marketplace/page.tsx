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
    <div className={`min-h-screen bg-[#050608] text-slate-200 overflow-x-hidden selection:bg-indigo-500/30 ${inter.className}`}>
      
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] -left-[10%] w-[400px] h-[400px] bg-indigo-600/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-[30%] -right-[15%] w-[450px] h-[450px] bg-blue-600/[0.05] rounded-full blur-[140px]" />
      </div>

      <Header />

      <main className="relative z-10 pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          
          {/* ── Section Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-xl"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-px w-8 bg-indigo-500/30" />
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Premium Selection</span>
              </div>
              <h1 className={`${outfit.className} text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4`}>
                Ethical <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Storefront</span>
              </h1>
              <p className="text-base text-slate-400 leading-relaxed">
                Discover authentic products verified by local communities and anchored on the Stellar blockchain.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-3 w-full md:w-auto md:min-w-[300px]"
            >
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products or makers..." 
                  className="pl-11 h-12 bg-white/[0.03] border-white/[0.06] rounded-xl focus:ring-indigo-500/20 text-sm"
                />
              </div>
              <div className="flex gap-2.5">
                 <div className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Currency</span>
                    <span className="text-xs font-mono font-semibold text-indigo-400">USDC</span>
                 </div>
                 <Button variant="outline" className="rounded-xl h-10 px-4 border-white/[0.06] hover:bg-white/[0.04] active:scale-95 transition-all">
                     <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 
                     <span className="text-xs text-slate-400">Filter</span>
                  </Button>
              </div>
            </motion.div>
          </div>

          {/* ── Category Pipeline ── */}
          <div className="flex flex-wrap items-center gap-2 mb-10">
            {CATEGORIES.map((cat, idx) => (
              <motion.button
                key={cat}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => setActiveFilters(prev => ({ ...prev, category: cat }))}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium transition-all border",
                  activeFilters.category === cat 
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                    : "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                )}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* ── Asset Grid ── */}
          <div className="relative">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="aspect-[4/5] rounded-2xl bg-white/[0.02] animate-pulse border border-white/[0.04]" />
                ))}
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task, idx) => (
                    <motion.div
                      key={task.id || task._id || idx}
                      initial={{ opacity: 0, scale: 0.97, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }}
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
                className="py-24 flex flex-col items-center justify-center text-center bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.08]"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6 border border-white/[0.05]">
                  <Sparkles className="w-8 h-8 text-slate-700" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">No Products Found</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm">We couldn't find any verified products matching your current filters.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveFilters({ status: "ALL", category: "ALL" })}
                  className="mt-8 rounded-xl border-white/[0.08] hover:bg-white/[0.04]"
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
