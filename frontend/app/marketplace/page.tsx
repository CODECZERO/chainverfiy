"use client"

import React, { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { getTasks } from "@/lib/api-service"
import { getUsdcInrRate } from "@/lib/exchange-rates"
import { Header } from "@/components/header"
import { ProductCard } from "@/components/product-card"
import { MarketplaceSidebar } from "@/components/marketplace-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { 
  LayoutGrid, List, Search, SlidersHorizontal, 
  ArrowUpDown, Loader2, Sparkles, AlertCircle, Activity, Globe, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { SidebarItem } from "@/components/marketplace-sidebar"
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

export default function MarketplacePage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [usdcInr, setUsdcInr] = useState(83.33)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filtering states
  const [activeFilters, setActiveFilters] = useState({
    status: "ALL",
    category: "ALL",
    priceRange: [0, 100000]
  })

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [items, rate] = await Promise.all([
          getTasks(),
          getUsdcInrRate()
        ])
        setTasks(items || [])
        setUsdcInr(rate)
      } catch (err) {
        console.error("Failed to fetch marketplace data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = (task.title || task.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = activeFilters.status === "ALL" || task.status === activeFilters.status
    const matchesCategory = activeFilters.category === "ALL" || task.category === activeFilters.category
    const price = task.priceInr || 0
    const matchesPrice = price >= activeFilters.priceRange[0] && price <= activeFilters.priceRange[1]
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPrice
  })

  return (
    <SidebarProvider>
      <div className={`min-h-screen bg-[#030408] text-slate-400 ${inter.className} selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden relative w-full`}>
        
        {/* ── Deep Space Atmospheric Effects ── */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
        </div>

        <Header />
        
        <div className="flex pt-24 md:pt-28 relative z-10 w-full">
          <MarketplaceSidebar onFilterChange={setActiveFilters} />
          
          <SidebarInset className="bg-transparent w-full">
            <main className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full relative z-10">
              
              {/* ── Header Interface ── */}
              <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 mb-20">
                <div className="max-w-3xl">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 mb-6"
                  >
                    <div className="w-10 h-1 rounded-full bg-blue-500/40" />
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] italic">Consensus Node Registry</span>
                  </motion.div>
                  <h1 className={`${outfit.className} text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-[0.9]`}>
                    Market <span className="text-blue-500 drop-shadow-[0_0_30px_rgba(37,99,235,0.4)]">Terminal</span>
                  </h1>
                  <p className="text-lg text-slate-500 max-w-2xl mt-8 font-black uppercase tracking-[0.1em] italic opacity-70 leading-relaxed">
                    Access high-fidelity assets verified by the ChainVerify Decentralized Oracle Network. Peer-to-peer settlement via Soroban.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-2xl p-2 flex items-center gap-1 shadow-2xl">
                    <button 
                      onClick={() => setViewMode("grid")}
                      className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic ${viewMode === "grid" ? "bg-blue-600 text-white shadow-lg" : "text-slate-600 hover:text-slate-300"}`}
                    >
                      <LayoutGrid className="w-4 h-4" /> Grid
                    </button>
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic ${viewMode === "list" ? "bg-blue-600 text-white shadow-lg" : "text-slate-600 hover:text-slate-300"}`}
                    >
                      <List className="w-4 h-4" /> List
                    </button>
                  </div>
                  <div className="h-12 w-px bg-white/[0.04] hidden xl:block" />
                  <Button variant="outline" className={`${outfit.className} h-14 rounded-2xl bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-white hover:bg-white/[0.06] text-[10px] font-black uppercase tracking-[0.3em] gap-3 px-8 shadow-2xl italic transition-all active:scale-95`}>
                    <ArrowUpDown className="w-4 h-4" /> Sort Priority
                  </Button>
                </div>
              </div>

              {/* ── Data Visualization Grid ── */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-48 gap-8"
                  >
                    <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-4" />
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 italic animate-pulse">Synchronizing Global Asset Buffer...</span>
                  </motion.div>
                ) : filteredTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-48 text-center glass-premium bg-[#0A0D14]/60 border-2 border-dashed border-white/[0.08] rounded-[4rem] shadow-3xl"
                  >
                    <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-8 shadow-inner">
                      <AlertCircle className="w-12 h-12 text-slate-800 opacity-40" />
                    </div>
                    <h3 className={`${outfit.className} text-4xl font-black text-white uppercase italic tracking-widest opacity-80`}>Null Signal</h3>
                    <p className="text-slate-600 text-[13px] font-black uppercase tracking-[0.4em] mt-6 italic opacity-60">No assets match the current cryptographic filters.</p>
                    <Button onClick={() => setActiveFilters({ status: "ALL", category: "ALL", priceRange: [0, 100000] })} className="mt-12 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest italic h-14 px-10 rounded-2xl text-slate-500 hover:text-white transition-all">Clear Metadata Filters</Button>
                  </motion.div>
                ) : viewMode === "grid" ? (
                  <motion.div 
                    key="grid"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-10"
                  >
                    {filteredTasks.map((task, idx) => (
                      <ProductCard key={task.id || idx} task={task} index={idx} usdcInr={usdcInr} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3.5rem] overflow-hidden shadow-3xl overflow-x-auto"
                  >
                    <Table>
                      <TableHeader className="bg-white/[0.03]">
                        <TableRow className="hover:bg-transparent border-white/[0.06]">
                          <TableHead className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 h-20 pl-12 italic">Asset Identifier / Node_ID</TableHead>
                          <TableHead className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 h-20 italic">Consensus Status</TableHead>
                          <TableHead className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 h-20 italic">Module Mapping</TableHead>
                          <TableHead className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 h-20 italic">Valuation (INR)</TableHead>
                          <TableHead className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-500 h-20 pr-12 text-right italic">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map((task, idx) => (
                          <TableRow key={task.id || idx} className="border-white/[0.04] hover:bg-blue-600/[0.02] transition-colors group">
                            <TableCell className="py-8 pl-12">
                              <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] overflow-hidden group-hover:border-blue-500/40 transition-all shadow-inner" />
                                <div>
                                  <div className={`${outfit.className} text-xl font-black text-white uppercase italic tracking-tight group-hover:text-blue-400 transition-colors`}>
                                    {task.title || task.name}
                                  </div>
                                  <div className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em] mt-1.5 font-mono italic opacity-60">
                                    NODE_VEC/{String(task.id).slice(0, 12)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic border ${
                                task.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                task.status === 'FLAGGED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}>
                                <Zap className="w-3 h-3" /> {task.status || "SYNCING"}
                              </div>
                            </TableCell>
                            <TableCell className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">
                              {task.category || "UNMAPPED"}
                            </TableCell>
                            <TableCell className={`${outfit.className} text-2xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>
                              ₹{Number(task.priceInr).toLocaleString()}
                            </TableCell>
                            <TableCell className="pr-12 text-right">
                              <Button className={`${outfit.className} bg-white text-black hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest italic h-12 px-8 shadow-2xl transition-all active:scale-95`}>
                                Inspect Node
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
