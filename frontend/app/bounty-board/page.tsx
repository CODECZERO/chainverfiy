"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Briefcase, Search, ArrowRight, ShieldCheck, Sparkles, Coins, Clock, Package } from "lucide-react"
import { getAllBounties } from "@/lib/api-service"
import { useEffect } from "react"
import { Outfit, Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

type Bounty = {
  id: string
  title: string
  reward: string
  difficulty: "Easy" | "Medium" | "Hard"
  category: "Verification" | "Growth" | "Ops" | "Engineering"
  description: string
}

const BOUNTIES: Bounty[] = [
  {
    id: "verify-queue-ux",
    title: "Improve verification queue UX",
    reward: "50 points",
    difficulty: "Easy",
    category: "Verification",
    description: "Refine the verify flow to reduce misclicks and improve decision clarity.",
  },
  {
    id: "seller-dashboard-kpis",
    title: "Add seller KPI widgets",
    reward: "100 points",
    difficulty: "Medium",
    category: "Growth",
    description: "Add conversion-focused KPI widgets for sellers (views → orders → completion).",
  },
  {
    id: "onchain-proof-viewer",
    title: "On-chain proof viewer",
    reward: "250 points",
    difficulty: "Hard",
    category: "Engineering",
    description: "Build a lightweight explorer panel for proofs/tx links with clear verification status.",
  },
]

export default function BountyBoardPage() {
  const [q, setQ] = useState("")
  const [realBounties, setRealBounties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'verification' | 'governance'>('verification')

  useEffect(() => {
    getAllBounties().then(res => {
      // res is now the unwrapped data array from api-service
      if (res && Array.isArray(res)) {
        setRealBounties(res)
      } else if (res && typeof res === 'object') {
        // Fallback for cases where it's wrapped in { bounties: [...] } or { data: [...] }
        const bounties = res.bounties || res.data || [];
        if (Array.isArray(bounties)) setRealBounties(bounties);
      }
      setLoading(false)
    }).catch((err) => {
      console.error("Failed to load bounties:", err)
      setLoading(false)
    })
  }, [])

  const filteredBounties = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let filtered = realBounties

    // Tab filtering
    if (activeTab === 'governance') {
      filtered = filtered.filter(b => String(b.description).startsWith("DISPUTE AUDIT:"))
    } else {
      filtered = filtered.filter(b => !String(b.description).startsWith("DISPUTE AUDIT:"))
    }

    if (!needle) return filtered
    return filtered.filter(b => 
      `${b.product?.title} ${b.description} ${b.product?.category}`.toLowerCase().includes(needle)
    )
  }, [q, realBounties, activeTab])

  return (
    <div className={`min-h-screen bg-[#050608] text-slate-200 ${inter.className} selection:bg-amber-500/30 relative overflow-hidden`}>
      {/* ── Subtle Atmospheric ── */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-600/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-indigo-600/[0.03] rounded-full blur-[120px] pointer-events-none" />
      
      <Header />
      
      <div className="max-w-5xl mx-auto px-6 md:px-8 pt-28 md:pt-32 pb-12 relative z-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-3">
              <Briefcase className="w-4 h-4" />
              <span className="text-[11px] font-medium uppercase tracking-wider">Community Tasks</span>
            </div>
            <h1 className={`${outfit.className} text-3xl md:text-5xl font-semibold tracking-tight text-white mb-3`}>Rewards <span className="text-amber-400">Hub</span></h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xl">Earn rewards by verifying product origins and helping the community stay safe.</p>
          </div>
          <div className="flex w-full md:w-auto gap-2.5">
            <Button asChild variant="outline" className="flex-1 md:flex-none h-10 rounded-xl border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] text-xs font-medium transition-all active:scale-95">
              <Link href="/marketplace">
                <Package className="w-3.5 h-3.5 mr-1.5" />
                Shop
              </Link>
            </Button>
            <Button asChild className="flex-1 md:flex-none h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-lg shadow-amber-500/15 active:scale-95 transition-all">
              <Link href="/verify">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                Verify
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks..." className={`${outfit.className} pl-11 h-12 rounded-xl bg-white/[0.02] border-white/[0.06] focus:ring-amber-500/20 text-sm`} />
          </div>
          <div className="flex bg-white/[0.02] border border-white/[0.05] p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('verification')}
              className={cn(
                "px-5 py-2.5 rounded-lg text-xs font-medium transition-all",
                activeTab === 'verification' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/15" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Verification
            </button>
            <button 
              onClick={() => setActiveTab('governance')}
              className={cn(
                "px-5 py-2.5 rounded-lg text-xs font-medium transition-all",
                activeTab === 'governance' ? "bg-rose-500 text-black shadow-lg shadow-rose-500/15" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Governance
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {loading ? (
             <div className="space-y-3">
               {[1,2,3].map(i => <div key={i} className="h-28 bg-white/[0.015] rounded-xl border border-white/[0.04] animate-pulse" />)}
             </div>
          ) : filteredBounties.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                <Coins className="w-3.5 h-3.5" /> Active Missions
              </h3>
              {filteredBounties.map((b, idx) => {
                  const isDispute = String(b.description).startsWith("DISPUTE AUDIT: Order ");
                  return (
                    <motion.div 
                      key={b.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "p-5 rounded-xl transition-all group overflow-hidden relative border bg-white/[0.015]",
                        isDispute ? "border-rose-500/15 hover:border-rose-500/30" : "border-amber-500/15 hover:border-amber-500/30"
                      )}
                    >
                      <div className="flex flex-col md:flex-row items-stretch justify-between gap-5 relative z-10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap mb-2">
                            <span className={cn(
                              "font-semibold text-base transition-colors",
                              isDispute ? "group-hover:text-rose-400 text-white" : "group-hover:text-amber-400 text-white"
                            )}>
                              {isDispute ? "Dispute Audit" : String(b.product?.title || "Product Proof")}
                            </span>
                            <Badge className={cn(
                              "border font-medium text-[10px] px-2 py-0.5",
                              isDispute ? "bg-rose-500/[0.08] text-rose-400 border-rose-500/15" : "bg-amber-500/[0.08] text-amber-400 border-amber-500/15"
                            )}>
                              {isDispute ? "Governance" : "Verification"}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] font-medium px-2 py-0.5 ${
                              b.status === 'ACTIVE' ? 'border-emerald-500/15 text-emerald-400' : 
                              b.status === 'COMPLETED' ? 'border-blue-500/15 text-blue-400' : 
                              'border-white/[0.06] text-slate-500'
                            }`}>
                              {b.status || 'Active'}
                            </Badge>
                            {b.expiresAt && new Date(b.expiresAt).getTime() - Date.now() < 86400000 * 2 && (
                              <Badge className="bg-red-500/[0.08] text-red-400 border-red-500/15 text-[10px] font-medium flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> {Math.max(0, Math.floor((new Date(b.expiresAt).getTime() - Date.now()) / 3600000))}h left
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">{String(b.description || "")}</p>
                          
                          <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-600 font-medium">
                            <span className="flex items-center gap-1 bg-white/[0.02] px-2 py-0.5 rounded-md border border-white/[0.04]">
                              <Package className="w-3 h-3 text-slate-500" /> {String(b.product?.category || "General")}
                            </span>
                            <span className="flex items-center gap-1 bg-white/[0.02] px-2 py-0.5 rounded-md border border-white/[0.04]">
                              <Clock className="w-3 h-3 text-slate-500" /> {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </span>
                            {(b.issuer?.email || b.issuerWallet) && (
                              <span className="flex items-center gap-1 bg-white/[0.02] px-2 py-0.5 rounded-md border border-white/[0.04]">
                                By {b.issuer?.email?.split('@')[0] || (b.issuerWallet ? `${b.issuerWallet.slice(0, 6)}...${b.issuerWallet.slice(-4)}` : "System")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className={cn(
                          "flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-6 min-w-[130px]",
                          isDispute ? "border-rose-500/[0.06]" : "border-amber-500/[0.06]"
                        )}>
                          <div className="text-center md:text-right">
                            <div className={cn(`${outfit.className} text-lg font-semibold tracking-tight`, isDispute ? "text-rose-400" : "text-amber-400")}>
                              {Number(b.amount || 0).toLocaleString()} USDC
                            </div>
                            <p className="text-[10px] text-slate-600 font-medium">Reward</p>
                          </div>
                          {(() => {
                            const orderIdMatch = String(b.description).match(/Order #?([a-f0-9\-]+)/);
                            const href = isDispute && orderIdMatch ? `/audit/${orderIdMatch[1]}` : `/product/${b.productId}`;
                            
                            return (
                              <Link href={href}>
                                <Button className={cn(
                                  "text-black font-semibold h-9 rounded-xl px-6 active:scale-95 transition-all text-xs",
                                  isDispute ? "bg-rose-500 hover:bg-rose-400 shadow-lg shadow-rose-500/15" : "bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/15"
                                )}>
                                  {isDispute ? "Audit" : "Details"} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Button>
                              </Link>
                            )
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
            </div>
            ) : (
            <div className="text-center py-20 bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.08]">
              <div className="w-14 h-14 bg-white/[0.02] rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                <Search className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className={`${outfit.className} text-lg font-semibold text-white mb-2`}>No tasks found</h3>
              <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Try searching for something else or create a new community task.</p>
              <Button asChild variant="outline" className="rounded-xl border-white/[0.06] hover:bg-white/[0.04]">
                <Link href="/marketplace">Create Task from Marketplace</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
