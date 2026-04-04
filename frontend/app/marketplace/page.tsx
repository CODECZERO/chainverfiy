"use client"

import React, { useEffect, useState } from "react"
import { getTasks } from "@/lib/api-service"
import { getUsdcInrRate } from "@/lib/exchange-rates"
import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import { Search, Sparkles, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

const CATEGORIES = ["ALL", "Food & Spices", "Textiles", "Handicrafts", "Agriculture", "Electronics", "Other"]

export default function MarketplacePage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [usdcInr, setUsdcInr] = useState(83.33)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [activeFilters, setActiveFilters] = useState({
    status: "ALL",
    category: "ALL"
  })

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [items, rate] = await Promise.all([
          getTasks(),
          getUsdcInrRate()
        ])
        
        // Strict safe-guard against non-array payloads (e.g. 401 Unauthorized objects)
        let validItems: any[] = [];
        if (items && typeof items.map === 'function') {
           validItems = items;
        } else if (items && items.data && typeof items.data.map === 'function') {
           validItems = items.data;
        }
        
        setTasks(validItems)
        setUsdcInr(rate)
      } catch (err) {
        console.error("Failed to fetch marketplace data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
    <div className={`min-h-screen bg-[#05060A] text-slate-200 overflow-x-hidden ${inter.className}`}>
      
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] opacity-50" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Header />

      <main className="relative z-10 pt-28 pb-32 max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col min-h-screen">
        
        {/* ── Marketplace Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
               <Sparkles className="w-3.5 h-3.5" /> Authenticated Discovery
            </div>
            <h1 className={`${outfit.className} text-4xl md:text-5xl font-bold tracking-tight text-white mb-3`}>
              Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Marketplace</span>
            </h1>
            <p className="text-slate-400 font-light text-lg">
              Explore products anchoring real-world value to the Stellar network.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-shrink-0 relative group"
          >
            <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity" />
            <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-2xl p-1 backdrop-blur-md">
              <Search className="w-5 h-5 text-slate-400 ml-4 mr-2" />
              <Input
                placeholder="Search products or suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 h-12 bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-slate-500 text-sm"
              />
            </div>
          </motion.div>
        </div>

        {/* ── Filtering Pipeline ── */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-3xl p-4 mb-10 backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-2 mr-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
               <Filter className="w-4 h-4" /> Filters
            </div>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilters(prev => ({ ...prev, category: cat }))}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  activeFilters.category === cat 
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] border border-indigo-500/50' 
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
             <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/5">
                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, status: "ALL" }))}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilters.status === "ALL" ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                >
                  ALL
                </button>
                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, status: "VERIFIED" }))}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilters.status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_-5px_var(--tw-shadow-color)] shadow-emerald-500" : "text-slate-500 hover:text-slate-300"}`}
                >
                  VERIFIED
                </button>
                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, status: "PENDING" }))}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilters.status === "PENDING" ? "bg-amber-500/20 text-amber-400 shadow-[0_0_15px_-5px_var(--tw-shadow-color)] shadow-amber-500" : "text-slate-500 hover:text-slate-300"}`}
                >
                  PENDING
                </button>
             </div>
          </div>
        </motion.div>

        {/* ── Product Grid ── */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] w-full border border-white/5 rounded-[3rem] bg-white/[0.01]">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 shadow-[0_0_50px_-10px_rgba(79,70,229,0.3)]">
              <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-400 font-medium tracking-wide">Syncing with Stellar Network...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center min-h-[40vh] w-full border border-white/5 rounded-[3rem] bg-white/[0.01]"
          >
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
               <Search className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Assets Found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredTasks.map((t, idx) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.5) }}
                >
                  <ProductCard task={t} usdcInr={usdcInr} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
