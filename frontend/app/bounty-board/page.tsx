"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Briefcase, Search, ArrowRight, ShieldCheck, Sparkles, Coins, Clock, Package } from "lucide-react"
import { getAllBounties } from "@/lib/api-service"
import { useEffect } from "react"
import { Outfit, Inter } from "next/font/google"
import { cn } from "@/lib/utils"

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
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="max-w-5xl mx-auto px-6 md:px-8 pt-28 md:pt-32 pb-8 md:pb-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 md:gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm font-semibold uppercase tracking-widest">Community Tasks</span>
            </div>
            <h1 className={`${outfit.className} text-3xl md:text-5xl font-bold tracking-tight mt-4`}>Rewards <span className="text-amber-500">Hub</span></h1>
            <p className="text-slate-500 mt-4 text-base leading-relaxed max-w-xl">Earn rewards by verifying product origins and helping the community stay safe.</p>
          </div>
          <div className="flex w-full md:w-auto gap-3">
            <Button asChild variant="outline" className="flex-1 md:flex-none h-12 md:h-14 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold transition-all active:scale-95">
              <Link href="/marketplace">
                <Package className="w-4 h-4 mr-2" />
                Shop
              </Link>
            </Button>
            <Button asChild className="flex-1 md:flex-none h-12 md:h-14 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
              <Link href="/verify">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Verify
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full text-xs font-semibold">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks..." className={`${outfit.className} pl-12 h-14 rounded-xl bg-white/[0.02] border-white/10 focus:ring-amber-500/20 text-sm`} />
          </div>
          <div className="flex bg-white/[0.03] border border-white/5 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('verification')}
              className={cn(
                "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'verification' ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Verification
            </button>
            <button 
              onClick={() => setActiveTab('governance')}
              className={cn(
                "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'governance' ? "bg-rose-500 text-black shadow-lg shadow-rose-500/20" : "text-slate-500 hover:text-slate-300"
              )}
            >
              Governance
            </button>
          </div>
        </div>

        <div className="grid gap-4 mt-8">
          {loading ? (
             <div className="space-y-4 animate-pulse">
               {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
             </div>
          ) : filteredBounties.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
                <Coins className="w-4 h-4" /> Active Missions
              </h3>
              {filteredBounties.map((b) => {
                  const isDispute = String(b.description).startsWith("DISPUTE AUDIT: Order ");
                  return (
                    <Card key={b.id} className={cn(
                      "p-6 transition-all group overflow-hidden relative border",
                      isDispute ? "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10" : "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                    )}>
                      <div className={cn(
                        "absolute top-0 right-0 w-32 h-32 blur-3xl -mr-16 -mt-16 transition-colors",
                        isDispute ? "bg-rose-500/5 group-hover:bg-rose-500/10" : "bg-amber-500/5 group-hover:bg-amber-500/10"
                      )} />
                      
                      <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 relative z-10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-3">
                            <span className={cn(
                              "font-bold text-xl transition-colors",
                              isDispute ? "group-hover:text-rose-500" : "group-hover:text-amber-500"
                            )}>
                              {isDispute ? "Dispute Audit" : String(b.product?.title || "Product Proof")}
                            </span>
                            <Badge className={cn(
                              "border font-bold text-[10px] uppercase tracking-wider px-2 py-0.5",
                              isDispute ? "bg-rose-500/20 text-rose-500 border-rose-500/30" : "bg-amber-500/20 text-amber-500 border-amber-500/30"
                            )}>
                              {isDispute ? "Governance" : "Verification"}
                            </Badge>
                        <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${
                          b.status === 'ACTIVE' ? 'border-emerald-500/20 text-emerald-400' : 
                          b.status === 'COMPLETED' ? 'border-blue-500/20 text-blue-400' : 
                          'border-white/10 text-slate-500'
                        }`}>
                          {b.status || 'Active'}
                        </Badge>
                        {b.expiresAt && new Date(b.expiresAt).getTime() - Date.now() < 86400000 * 2 && (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px] font-semibold flex items-center">
                            Closing soon: <Clock className="w-3 h-3 ml-1.5" /> {Math.max(0, Math.floor((new Date(b.expiresAt).getTime() - Date.now()) / 3600000))}h left
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{String(b.description || "")}</p>
                      
                        <div className="flex items-center gap-4 mt-5 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
                          <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                            <Package className={cn("w-3 h-3", isDispute ? "text-rose-500/70" : "text-amber-500/70")} /> {String(b.product?.category || "General")}
                          </span>
                          <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                            <Clock className={cn("w-3 h-3", isDispute ? "text-rose-500/70" : "text-amber-500/70")} /> {b.createdAt ? new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                          {(b.issuer?.email || b.issuerWallet) && (
                            <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                              By {b.issuer?.email?.split('@')[0] || (b.issuerWallet ? `${b.issuerWallet.slice(0, 6)}...${b.issuerWallet.slice(-4)}` : "System")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={cn(
                        "flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-8 min-w-[140px]",
                        isDispute ? "border-rose-500/10" : "border-amber-500/10"
                      )}>
                        <div className="text-center md:text-right">
                          <div className={cn("text-xl font-bold tracking-tight", isDispute ? "text-rose-500" : "text-amber-500")}>
                            {Number(b.amount || 0).toLocaleString()} USDC
                          </div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Reward</div>
                        </div>
                        {(() => {
                          const orderIdMatch = String(b.description).match(/Order #?([a-f0-9\-]+)/);
                          const href = isDispute && orderIdMatch ? `/dispute/${orderIdMatch[1]}` : `/product/${b.productId}`;
                          
                          return (
                            <Link href={href}>
                              <Button className={cn(
                                "text-black font-bold h-11 rounded-xl px-8 shadow-lg active:scale-95 transition-all",
                                isDispute ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                              )}>
                                {isDispute ? "Audit Dispute" : "Details"} <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </Link>
                          )
                        })()}
                      </div>
                    </div>
                  </Card>
                  )
                })}
              </div>
            ) : (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-6">Try searching for something else or create a new community task.</p>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/marketplace">Create Task from Marketplace</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
