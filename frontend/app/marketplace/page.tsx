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
  ArrowUpDown, Loader2, Sparkles, AlertCircle 
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
      <div className="min-h-screen bg-[#030408] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
        
        {/* Atmospheric Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="glow-orb w-[600px] h-[600px] bg-indigo-600/10 top-[-100px] left-[-100px] animate-float-slow" />
          <div className="glow-orb w-[500px] h-[500px] bg-blue-600/10 bottom-[-100px] right-[-100px] animate-float-fast" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
        </div>

        <Header />
        
        <div className="flex pt-24 md:pt-28">
          <MarketplaceSidebar onFilterChange={setActiveFilters} />
          
          <SidebarInset className="bg-transparent">
            <main className="p-4 md:p-8 lg:p-12 max-w-[1600px] mx-auto w-full relative z-10">
              
              {/* Header Interface */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px w-8 bg-indigo-500/50" />
                    <span className="text-[10px] font-display font-black text-indigo-400 uppercase tracking-[0.4em]">Node Registry</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-display font-black text-white italic tracking-tight mb-4">
                    Market <span className="text-indigo-500">Terminal</span>
                  </h1>
                  <p className="text-slate-500 text-sm max-w-lg leading-relaxed">
                    Access high-fidelity cryptographic assets verified by the Pramanik Decentralized Oracle Network.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1.5 p-1">
                    <button 
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-indigo-600 shadow-lg text-white" : "text-slate-500 hover:text-white"}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-indigo-600 shadow-lg text-white" : "text-slate-500 hover:text-white"}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-10 w-px bg-white/5 mx-2 hidden md:block" />
                  <Button variant="outline" className="h-10 rounded-xl bg-white/[0.03] border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.06] text-[10px] font-display font-bold uppercase tracking-widest gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5" /> Sort Priority
                  </Button>
                </div>
              </div>

              {/* Data Visualization Grid */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-40 gap-4"
                  >
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <span className="text-[10px] font-display font-black uppercase tracking-[0.3em] text-slate-500 italic">Synchronizing Nodes...</span>
                  </motion.div>
                ) : filteredTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-40 text-center glass-premium rounded-[2rem] border-dashed border-white/[0.08]"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-display font-black text-white uppercase italic tracking-widest mb-2">Null Result</h3>
                    <p className="text-slate-500 text-xs max-w-xs">No assets match the current cryptographic filters. Try adjusting your parameters.</p>
                  </motion.div>
                ) : viewMode === "grid" ? (
                  <motion.div 
                    key="grid"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8"
                  >
                    {filteredTasks.map((task, idx) => (
                      <ProductCard key={task.id || idx} task={task} index={idx} usdcInr={usdcInr} />
                    ))}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="glass-premium rounded-[2rem] overflow-hidden border border-white/[0.06]"
                  >
                    <Table>
                      <TableHeader className="bg-white/[0.02]">
                        <TableRow className="hover:bg-transparent border-white/[0.04]">
                          <TableHead className="text-[10px] uppercase font-display font-black tracking-widest text-slate-400 h-14 pl-8">Asset Identifier</TableHead>
                          <TableHead className="text-[10px] uppercase font-display font-black tracking-widest text-slate-400 h-14">Protocol Status</TableHead>
                          <TableHead className="text-[10px] uppercase font-display font-black tracking-widest text-slate-400 h-14">Classification</TableHead>
                          <TableHead className="text-[10px] uppercase font-display font-black tracking-widest text-slate-400 h-14">Valuation (INR)</TableHead>
                          <TableHead className="text-[10px] uppercase font-display font-black tracking-widest text-slate-400 h-14 pr-8 text-right">Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map((task) => (
                          <TableRow key={task.id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                            <TableCell className="py-5 pl-8">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] overflow-hidden group-hover:border-indigo-500/40 transition-all" />
                                <div>
                                  <div className="text-[11px] font-display font-black text-white uppercase italic tracking-wide group-hover:text-indigo-400 transition-colors">
                                    {task.title || task.name}
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                    NODE_{task.id?.slice(0, 8)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[8px] uppercase font-display font-black tracking-widest italic rounded-md">
                                {task.status || "SYNC_PENDING"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                              {task.category || "UNCLASSIFIED"}
                            </TableCell>
                            <TableCell className="text-[11px] font-mono font-black text-white italic">
                              ₹{Number(task.priceInr).toLocaleString()}
                            </TableCell>
                            <TableCell className="pr-8 text-right">
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-display font-black uppercase tracking-widest italic h-8 px-4">
                                Inspect
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
