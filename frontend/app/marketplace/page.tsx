"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { 
  LayoutGrid, List, Search, AlertCircle, 
  ArrowRight, Package, ShieldCheck, Activity,
  Globe, Zap, Lock, ShoppingBag, TrendingUp,
  Tag, Filter, SlidersHorizontal, ChevronRight
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getTasks } from "@/lib/api-service"
import { getUsdcInrRate } from "@/lib/exchange-rates"
import { getIPFSUrl } from "@/lib/image-utils"
import { ProductCard } from "@/components/product-card"
import { motion, AnimatePresence } from "framer-motion"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { MarketplaceSidebar } from "@/components/marketplace-sidebar"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"

export default function MarketplacePage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usdcInr, setUsdcInr] = useState(83.33)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Filter States
  const [category, setCategory] = useState("ALL")
  const [statuses, setStatuses] = useState<string[]>(["VERIFIED", "PENDING_VERIFICATION"])
  const [priceRange, setPriceRange] = useState([0, 1000])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const data = await getTasks()
        setTasks(Array.isArray(data) ? data : [])
        const rate = await getUsdcInrRate()
        setUsdcInr(rate)
      } catch (err) {
        console.error("Marketplace fetch error:", err)
        setError("Network sync failure. Re-establishing link...")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const categories = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean)))

  const filteredTasks = tasks.filter((t) => {
    const matchCategory = category === "ALL" || t.category === category
    const matchStatus = statuses.length === 0 || statuses.includes(t.status || t.missionStatus || "PENDING_VERIFICATION")
    const price = typeof t.priceUsdc === "number" && t.priceUsdc > 0 ? t.priceUsdc : (t.priceInr / usdcInr)
    const matchPrice = price >= priceRange[0] && price <= priceRange[1]
    return matchCategory && matchStatus && matchPrice
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05060B] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shadow-[0_0_20px_rgba(37,99,235,0.2)]" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 animate-pulse italic">Connecting Terminal...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#05060B] text-foreground">
      <Header />
      
      <SidebarProvider defaultOpen={true}>
        <div className="flex w-full min-h-[calc(100vh-64px)] overflow-hidden">
          <MarketplaceSidebar 
            categories={categories}
            selectedCategory={category}
            setCategory={setCategory}
            selectedStatus={statuses}
            setStatus={setStatuses}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
          />
          
          <SidebarInset className="bg-transparent overflow-y-auto">
            <main className="flex-1 p-8 lg:p-12 max-w-[1400px] mx-auto w-full">
               
               {/* ── Terminal Header ── */}
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                  <div>
                     <div className="flex items-center gap-2 text-blue-500 mb-3">
                        <LayoutGrid className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Institutional Access</span>
                     </div>
                     <h1 className="text-4xl lg:text-5xl font-black text-white italic uppercase tracking-tighter mb-4">
                        Protocol <span className="text-blue-600">Marketplace</span>
                     </h1>
                     <p className="text-slate-500 text-sm font-medium max-w-xl leading-relaxed">
                        Secure, decentralized exchange for authenticated premium commodities. All units are audited via cross-node consensus mechanisms.
                     </p>
                  </div>

                  <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-1.5 backdrop-blur-xl">
                     <Button 
                       onClick={() => setViewMode("grid")}
                       className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all ${viewMode === "grid" ? "bg-white text-black shadow-2xl" : "bg-transparent text-slate-500 hover:text-white"}`}
                     >
                       <LayoutGrid className="w-3.5 h-3.5 mr-2" /> Grid View
                     </Button>
                     <Button 
                       onClick={() => setViewMode("list")}
                       className={`h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-all ${viewMode === "list" ? "bg-white text-black shadow-2xl" : "bg-transparent text-slate-500 hover:text-white"}`}
                     >
                       <List className="w-3.5 h-3.5 mr-2" /> List View
                     </Button>
                  </div>
               </div>

               {/* ── Asset Display ── */}
               {error ? (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-[2rem] p-12 text-center">
                     <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-50" />
                     <p className="text-sm font-black text-red-400 uppercase tracking-widest italic">{error}</p>
                  </div>
               ) : filteredTasks.length === 0 ? (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2rem] p-24 text-center">
                     <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-slate-700" />
                     </div>
                     <h3 className="text-lg font-black text-white uppercase tracking-widest italic mb-2">No Matching Units</h3>
                     <p className="text-sm text-slate-500 max-w-xs mx-auto italic font-medium">Adjust your terminal filters to Broaden the network search.</p>
                  </div>
               ) : (
                  <>
                     {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                          {filteredTasks.map((task, i) => (
                            <ProductCard key={task.id || task._id} task={task} index={i} usdcInr={usdcInr} />
                          ))}
                        </div>
                     ) : (
                        <div className="bg-[#0A0D14]/80 border border-white/[0.06] rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-3xl">
                          <Table>
                            <TableHeader className="bg-white/[0.02] border-b border-white/[0.06]">
                              <TableRow className="border-none hover:bg-transparent">
                                <TableHead className="py-6 px-8 text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Asset Identifer</TableHead>
                                <TableHead className="py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Status</TableHead>
                                <TableHead className="py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Trust Index</TableHead>
                                <TableHead className="py-6 text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Valuation</TableHead>
                                <TableHead className="py-6 px-8 text-right text-[11px] font-black text-slate-500 uppercase tracking-widest italic">Terminal Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredTasks.map((task) => (
                                <TableRow key={task.id || task._id} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                                  <TableCell className="py-6 px-8">
                                     <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#0F1219] border border-white/[0.05] overflow-hidden shrink-0 group-hover:border-blue-500/30 transition-colors">
                                           {task.proofMediaUrls?.[0] ? (
                                              <Image src={getIPFSUrl(task.proofMediaUrls[0])} alt="" width={48} height={48} className="w-full h-full object-cover" />
                                           ) : (
                                              <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-700" /></div>
                                           )}
                                        </div>
                                        <div>
                                           <div className="text-xs font-black text-white uppercase italic tracking-widest group-hover:text-blue-400 transition-colors">{task.title}</div>
                                           <div className="text-[10px] text-slate-500 mt-0.5">{task.category || "UNCLASSIFIED"}</div>
                                        </div>
                                     </div>
                                  </TableCell>
                                  <TableCell className="py-6">
                                     <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${(task.status === "VERIFIED" || task.missionStatus === "VERIFIED") ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"}`} />
                                        <span className="text-[10px] font-black text-slate-400 uppercase italic">{(task.status || task.missionStatus || "PENDING").replace("_", " ")}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell className="py-6">
                                     <div className="flex flex-col gap-1.5">
                                        <div className="text-[10px] font-black text-emerald-400 uppercase italic">{task.supplier?.trustScore || 0}% SECURE</div>
                                        <div className="w-24 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                                           <div className="h-full bg-emerald-500" style={{ width: `${task.supplier?.trustScore || 0}%` }} />
                                        </div>
                                     </div>
                                  </TableCell>
                                  <TableCell className="py-6">
                                     <div className="flex flex-col">
                                        <div className="text-sm font-black text-white italic">₹{Number(task.priceInr).toLocaleString()}</div>
                                        <div className="text-[10px] font-mono font-bold text-blue-500">{(task.priceUsdc && task.priceUsdc > 0 ? task.priceUsdc : task.priceInr / usdcInr).toFixed(2)} USDC</div>
                                     </div>
                                  </TableCell>
                                  <TableCell className="py-6 px-8 text-right">
                                     <Link href={`/product/${task.id || task._id}`}>
                                        <Button variant="outline" className="h-9 px-6 rounded-xl border-white/[0.1] bg-white/[0.02] hover:bg-white hover:text-black text-[10px] font-black uppercase tracking-widest italic transition-all group/btn">
                                           Inspect <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                     </Link>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                     )}
                  </>
               )}

            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
