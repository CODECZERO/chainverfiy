"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { WalletRequirement } from "@/components/wallet-requirement"
import {
  Package, ScanLine, ArrowRight, Lock, Loader2,
  ShoppingCart, Wallet, Clock, CheckCircle2, XCircle,
  Eye, ExternalLink, QrCode, AlertTriangle, ChevronRight,
  RefreshCw, Shield, Zap, TrendingUp, Star, Copy, BarChart2, Coins, Download, X, Activity, PieChart as PieIcon
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from 'next/dynamic'
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import Image from "next/image"
import { getIPFSUrl } from "@/lib/image-utils"

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(m => m.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then(m => m.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const RechartsTooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })

const COLORS = ['#2775CA', '#F7931A', '#627EEA', '#82ca9d', '#8884d8'];

const NAV = [
  { id: "orders",       label: "My Orders",        icon: ShoppingCart },
  { id: "tracking",     label: "Active Tracking",   icon: ScanLine },
  { id: "completed",    label: "History",            icon: CheckCircle2 },
  { id: "bounties",     label: "Bounty Board",       icon: Coins },
]

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:              { label: "Awaiting Payment", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",       dot: "bg-zinc-400" },
  PAID:                 { label: "Paid",             cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",       dot: "bg-blue-400" },
  SHIPPED:              { label: "In Transit",       cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", dot: "bg-purple-400" },
  DELIVERED:            { label: "Arrived",          cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",    dot: "bg-amber-400" },
  COMPLETED:            { label: "Verified",         cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  DISPUTED:             { label: "Disputed",         cls: "bg-red-500/10 text-red-400 border-red-500/20",          dot: "bg-red-400" },
}

export default function BuyerDashboard() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading: authLoading } = useSelector((s: RootState) => s.userAuth)
  
  const { publicKey } = useWallet()
  const [active, setActive] = useState("orders")
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedQr, setSelectedQr] = useState<string | null>(null)
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  useEffect(() => {
    if (!authLoading && !isAuthenticated && !publicKey) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router, publicKey])

  useEffect(() => { loadOrders() }, [user?.id, publicKey])

  const loadOrders = async () => {
    if (!user?.id && !publicKey) return
    setLoading(true)
    try {
      const query = user?.id ? `buyerId=${user.id}` : `stellarWallet=${publicKey}`
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const response = await fetch(`${api}/orders/my-orders?${query}`, {
        credentials: 'include',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      })
      const data = await response.json()
      if (response.ok) {
        setOrders(data.data || [])
      } else {
        // If 401/404, just set empty orders to stop the spinner and show empty state
        setOrders([])
      }
    } catch (err) {
      console.error('[BuyerDashboard] Failed to load orders:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const copyWallet = () => {
    const wallet = user?.stellarWallet || publicKey
    if (wallet) navigator.clipboard.writeText(wallet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Computed data
  const activeOrders = orders.filter(o => o.status === "PAID" || o.status === "SHIPPED" || o.status === "DELIVERED")
  const totalSpent = orders.reduce((s, o) => s + Number(o.priceUsdc || 0), 0)
  
  const spendingData = orders
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    })
    .reduce((acc: any[], order) => {
      const date = order.createdAt 
        ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : 'N/A'
      const last = acc[acc.length - 1]
      const total = (last?.total || 0) + Number(order.priceUsdc || 0)
      acc.push({ date, amount: Number(order.priceUsdc || 0), total })
      return acc
    }, [])

  const currencyDistribution = orders.reduce((acc: any[], order) => {
     const curr = order.currency || "USDC"
     const existing = acc.find(c => c.name === curr)
     if (existing) existing.value += Number(order.priceUsdc || 0)
     else acc.push({ name: curr, value: Number(order.priceUsdc || 0) })
     return acc
  }, [])

  const filteredOrders = active === "tracking" ? activeOrders
    : active === "completed" ? orders.filter(o => o.status === "COMPLETED")
    : orders

  const isDashboardReady = !authLoading && (user?.id || publicKey)
  
  if (authLoading || (loading && isDashboardReady && orders.length === 0)) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2775CA]" />
        </div>
      </div>
    )
  }

  if (user && user.role !== "BUYER") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <Lock className="w-16 h-16 text-slate-700 mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase tracking-tighter">Purchase Account Only</h1>
          <p className="text-slate-500 mt-2 mb-8">This dashboard tracks buyer history. Please sign in with a buyer account.</p>
          <Link href="/"><Button variant="outline" className="rounded-2xl h-12 px-8 uppercase tracking-widest text-[10px] font-black">Go Home</Button></Link>
        </div>
      </div>
    )
  }

  if (!isDashboardReady) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <WalletRequirement fallbackMessage="Please connect your wallet or sign in as a buyer to view your purchase history." />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#020408] text-slate-400 font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden relative">
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header />

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* ── Premium Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 gap-4 p-8 h-full border-r border-white/[0.04] bg-[#0A0D14]/40 backdrop-blur-md">
          {/* Buyer Profile Area */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-7 shadow-3xl relative overflow-hidden group"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-[0_10px_30px_rgba(37,99,235,0.4)] border border-white/20 group-hover:scale-105 transition-transform duration-500">
                {String(user?.email || publicKey || "B")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-black text-white text-xl truncate tracking-tighter uppercase italic">{String(user?.email?.split("@")[0] || "Buyer Node")}</div>
                <div className="flex items-center gap-1.5 mt-1 text-blue-400 font-black text-[9px] uppercase tracking-[0.2em] italic">
                  <Shield className="w-3 h-3" /> Certified Principal
                </div>
              </div>
            </div>

            {/* Wallet Integration Widget */}
            {(user?.stellarWallet || publicKey) && (
              <div className="mt-8 bg-black/40 border border-white/[0.03] rounded-2xl p-4 flex items-center gap-4 group/wallet hover:border-blue-500/20 transition-all">
                <div className="w-8 h-8 rounded-xl bg-white/[0.02] flex items-center justify-center border border-white/[0.05]">
                  <Wallet className="w-3.5 h-3.5 text-slate-500 group-hover/wallet:text-blue-400 transition-colors" />
                </div>
                <span className="text-[10px] font-mono text-slate-500 truncate flex-1 uppercase tracking-wider">
                  {String(user?.stellarWallet || publicKey || "").slice(0, 10)}...{String(user?.stellarWallet || publicKey || "").slice(-6)}
                </span>
                <button onClick={copyWallet} className="text-slate-600 hover:text-white transition-colors bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
                  {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </motion.div>

          {/* Navigation Matrix */}
          <nav className="flex-1 overflow-y-auto pr-2 space-y-2 mt-4 scrollbar-hide">
            <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em] mb-4 ml-4 italic">Operation Center</div>
            {NAV.map((n, i) => (
              <motion.button 
                key={n.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => setActive(n.id)}
                className={`w-full group flex items-center gap-5 px-6 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden italic ${
                  active === n.id
                    ? "text-white bg-blue-600/10 border border-blue-500/20 shadow-[0_0_40px_rgba(37,99,235,0.05)]"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                {active === n.id && (
                  <>
                    <motion.div layoutId="nav-glow-buyer" className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent" />
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
                  </>
                )}
                <n.icon className={`w-5 h-5 transition-all duration-500 group-hover:scale-125 ${active === n.id ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" : "text-slate-700"}`} />
                <span className="relative z-10">{n.label}</span>
                {n.id === "tracking" && activeOrders.length > 0 && (
                   <span className="ml-auto bg-amber-500/10 text-amber-500 text-[9px] font-black px-2.5 py-1 rounded-lg border border-amber-500/20 animate-pulse">{activeOrders.length}</span>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Portfolio Pulse */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card bg-[#0A0D14]/60 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <TrendingUp className="w-12 h-12 text-emerald-400" />
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 italic">Portfolio Yield</div>
            <div className="flex items-baseline gap-2">
               <div className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                 ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
               </div>
               <div className="text-[11px] font-black text-blue-500 uppercase tracking-widest italic">USDC</div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center gap-2 group cursor-help">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
               <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">Stellar Mainnet Synchronized</span>
            </div>
          </motion.div>
        </aside>

        {/* ── Main Operations Deck ── */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar p-10 relative">
           <AnimatePresence mode="wait">
             <motion.div
               key={active}
               initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
               animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
               exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
               transition={{ duration: 0.5, ease: "circOut" }}
               className="space-y-12"
             >
               {/* Deck Header */}
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic tracking-[-0.05em] leading-none">
                      {active === "orders" ? <span className="text-white">Asset <span className="text-blue-500">Ledger</span></span> : 
                       active === "tracking" ? <span className="text-white">Live <span className="text-blue-500">Logistics</span></span> : 
                       active === "completed" ? <span className="text-white">Order <span className="text-blue-500">History</span></span> : 
                       <span className="text-white">Bounty <span className="text-blue-500">Board</span></span>}
                    </h2>
                    {/* Fixed double rendering title above */}
                    <h2 className="sr-only">{active}</h2> 
                    <div className="flex items-center gap-3 mt-4">
                       <div className="h-[1px] w-12 bg-blue-500/30" />
                       <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic flex items-center gap-2">
                         <Zap className="w-3 h-3 text-blue-500" /> Decentralized Principal Interface
                       </p>
                    </div>
                  </div>
                  <button 
                    onClick={loadOrders} 
                    className="group relative p-5 bg-[#0A0D14]/80 border border-white/[0.08] rounded-3xl transition-all active:scale-90 hover:border-blue-500/40 shadow-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <RefreshCw className={`w-6 h-6 text-slate-400 group-hover:text-white transition-colors relative z-10 ${loading ? "animate-spin" : ""}`} />
                  </button>
               </div>

               {/* Analytics Deck */}
               {active === "orders" && (
                 <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* Spend Velocity Chart */}
                    <div className="xl:col-span-8 premium-card bg-[#0A0D14]/60 backdrop-blur-3xl border border-white/[0.06] rounded-[3rem] p-10 relative overflow-hidden group shadow-3xl">
                       <div className="flex items-center justify-between mb-12">
                          <div>
                             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">Financial Telemetry</h3>
                             <div className="text-3xl font-black text-white tracking-tighter mt-2 uppercase italic">Spend Velocity</div>
                          </div>
                          <div className="bg-black/40 border border-white/[0.03] rounded-2xl px-6 py-3 flex items-center gap-3">
                             <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.6)]" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Market Volume</span>
                          </div>
                       </div>
                       <div className="h-[320px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={spendingData}>
                                <defs>
                                   <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.6}/>
                                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.015)" vertical={false} />
                                <XAxis dataKey="date" stroke="#334155" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} dy={15} className="uppercase italic" />
                                <YAxis stroke="#334155" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} dx={-15} />
                                <RechartsTooltip 
                                   cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2 }}
                                   contentStyle={{backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}
                                   itemStyle={{color: '#fff', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase'}}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#spendGrad)" animationDuration={2000} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Asset Matrix Pie */}
                    <div className="xl:col-span-4 premium-card bg-[#0A0D14]/60 backdrop-blur-3xl border border-white/[0.06] rounded-[3rem] p-10 shadow-3xl relative overflow-hidden flex flex-col group">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-10 italic">Dominance Matrix</h3>
                       <div className="flex-1 relative min-h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie 
                                  data={currencyDistribution.length > 0 ? currencyDistribution : [{name: 'Empty', value: 1}]}
                                  innerRadius={80} outerRadius={110} paddingAngle={12} dataKey="value" stroke="none"
                                  animationBegin={500} animationDuration={1500}
                                >
                                   {currencyDistribution.map((e, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity" />)}
                                   {currencyDistribution.length === 0 && <Cell fill="#1F2937" />}
                                </Pie>
                                <RechartsTooltip 
                                   contentStyle={{backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', textTransform: 'uppercase', fontSize: '10px', fontWeight: '900'}} 
                                />
                             </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-700">
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Net Equity</span>
                              <span className="text-4xl font-black text-white tracking-tighter mt-1">${totalSpent.toFixed(0)}</span>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4 mt-12">
                           {currencyDistribution.map((c, i) => (
                             <div key={c.name} className="flex items-center gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                                <div className="w-3 h-3 rounded-md shadow-lg" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">{c.name}</div>
                             </div>
                           ))}
                       </div>
                    </div>
                 </div>
               )}

               {/* Asset Collection / Transactions */}
               {active === "bounties" ? (
                 <div className="premium-card bg-[#0A0D14]/40 border-2 border-dashed border-white/[0.04] rounded-[4rem] p-32 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-600/[0.01] group-hover:bg-blue-600/[0.02] transition-colors" />
                    <Coins className="w-24 h-24 text-slate-800 mx-auto mb-10 opacity-20 group-hover:scale-110 transition-transform duration-1000" />
                    <h3 className="text-4xl font-black text-white tracking-widest uppercase italic">Bounty Protocol Active</h3>
                    <p className="text-slate-600 mt-6 max-w-sm mx-auto text-xs font-black uppercase tracking-[0.4em] leading-relaxed opacity-60">Verified principal nodes gain issuance authority for authentication bounties in Phase 2 deployment.</p>
                 </div>
               ) : (
                 <div className="space-y-8 pb-32">
                    <div className="flex items-center justify-between px-6">
                       <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Active Signal Matrix</span>
                       </div>
                       <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic">{filteredOrders.length} Entry Points Found</span>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                       {filteredOrders.length === 0 ? (
                         <div className="py-40 text-center border-2 border-dashed border-white/[0.03] rounded-[3.5rem] bg-white/[0.01]">
                            <Package className="w-20 h-20 text-slate-900 mx-auto mb-8 opacity-40" />
                            <p className="text-slate-600 font-black uppercase tracking-[0.5em] text-[10px] italic">No Protocol History Detected</p>
                         </div>
                       ) : (
                         <AnimatePresence mode="popLayout">
                           {filteredOrders.map((o: any, idx: number) => {
                             const s = STATUS[o.status] || STATUS.PAID
                             return (
                               <motion.div 
                                 key={o.id}
                                 layout
                                 initial={{ opacity: 0, x: -30 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: idx * 0.05 }}
                                 className="premium-card bg-[#0A0D14]/60 backdrop-blur-3xl border border-white/[0.06] hover:border-blue-500/20 rounded-[3rem] p-10 transition-all group relative overflow-hidden shadow-2xl hover:shadow-blue-500/5"
                               >
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                  
                                  <div className="flex flex-col xl:flex-row items-center gap-12 relative z-10">
                                     {/* Asset Identity */}
                                     <div className="flex items-center gap-10 flex-1 min-w-0">
                                        <div className="w-32 h-32 bg-black/60 rounded-[2.5rem] border border-white/[0.06] relative overflow-hidden group-hover:scale-105 transition-transform duration-700 shadow-inner">
                                           {o.product?.proofMediaUrls?.[0] ? (
                                             <Image 
                                               src={getIPFSUrl(o.product.proofMediaUrls[0])} 
                                               alt="" 
                                               fill 
                                               className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" 
                                               unoptimized
                                             />
                                           ) : (
                                             <Package className="w-12 h-12 text-slate-800 absolute inset-0 m-auto" />
                                           )}
                                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                           <div className="flex flex-wrap items-center gap-6 mb-4">
                                              <h4 className="text-3xl font-black text-white tracking-tighter uppercase italic group-hover:text-blue-400 transition-colors duration-500 truncate">{o.product?.title || "System Asset"}</h4>
                                              <span className={`px-5 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-[0.25em] italic backdrop-blur-xl shadow-2xl ${s.cls}`}>
                                                 <div className={`w-1.5 h-1.5 rounded-full ${s.dot} inline-block mr-3 animate-pulse shadow-[0_0_10px_currentColor]`} /> {s.label}
                                              </span>
                                           </div>
                                           <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 italic">
                                              <span className="text-slate-400 flex items-center gap-2 bg-white/[0.02] px-3 py-1.5 rounded-xl border border-white/[0.04]">
                                                <BarChart2 className="w-3.5 h-3.5 text-blue-500" /> NODE-{o.id.slice(0, 12)}
                                              </span>
                                              <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                                                <Shield className="w-4 h-4 text-emerald-500" /> {o.product?.supplier?.name || "Verified Entity"}
                                              </span>
                                              <span className="flex items-center gap-2">
                                                <Clock className="w-4 h-4" /> {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                              </span>
                                           </div>
                                        </div>
                                     </div>

                                     {/* Financial Settlement State */}
                                     <div className="hidden xl:flex flex-col items-center border-x border-white/[0.04] px-16 shrink-0 group/price">
                                        <div className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(37,99,235,0.1)] group-hover:scale-110 transition-transform duration-500">
                                           {o.priceUsdc} <span className="text-base text-blue-500 font-black italic">USDC</span>
                                        </div>
                                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-3 italic group-hover:text-slate-400 transition-colors">Digital Escrow Yield</div>
                                     </div>

                                     {/* Command Cluster */}
                                     <div className="flex flex-col gap-3 shrink-0 w-full xl:w-auto">
                                        {(o.status === "PAID" || o.status === "SHIPPED" || o.status === "DELIVERED") && (
                                          <Button 
                                            onClick={() => window.open(`/delivery/confirm/${o.id}`, "_blank")}
                                            className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-[1.5rem] h-16 px-12 shadow-[0_20px_40px_rgba(37,99,235,0.3)] active:scale-95 transition-all italic"
                                          >
                                             <ScanLine className="w-5 h-5 mr-3" /> Inspect Asset 
                                          </Button>
                                        )}
                                        <div className="flex gap-3">
                                           <Button 
                                             onClick={() => window.open(`/order/${o.id}/journey`, "_blank")} 
                                             className="flex-1 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] rounded-2xl h-14 px-6 uppercase text-[9px] font-black italic tracking-widest transition-all group/btn"
                                           >
                                              <ExternalLink className="w-4 h-4 mr-2 text-slate-600 group-hover/btn:text-blue-500" /> Node Path
                                           </Button>
                                           <Button 
                                             onClick={() => window.open(`/proof/${o.id}?viewType=logistics`, "_blank")} 
                                             className="flex-1 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] rounded-2xl h-14 px-6 uppercase text-[9px] font-black italic tracking-widest transition-all group/btn"
                                           >
                                              <Activity className="w-4 h-4 mr-2 text-slate-600 group-hover/btn:text-emerald-500" /> Event Stream
                                           </Button>
                                        </div>
                                        {o.status === "COMPLETED" && o.deliveryCertCid && (
                                           <Button onClick={() => window.open(`/proof/${o.id}`, "_blank")} className="w-full bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/10 rounded-2xl h-14 uppercase text-[10px] font-black tracking-[0.2em] transition-all italic">
                                              Download Passport <Download className="w-4 h-4 ml-3" />
                                           </Button>
                                        )}
                                        {o.status === "PENDING" && (
                                           <Link href={`/product/${o.productId}`} className="w-full">
                                              <Button className="w-full bg-white text-black rounded-2xl h-16 uppercase text-[11px] font-black tracking-[0.3em] hover:bg-slate-200 active:scale-95 transition-all italic shadow-2xl">Execute Settlement</Button>
                                           </Link>
                                        )}
                                     </div>
                                  </div>

                                  {/* Handshake Protocol Segment */}
                                  {(o.status === "PAID" || o.status === "SHIPPED") && o.qrCode?.qrCodeUrl && (
                                    <motion.div 
                                      whileHover={{ scale: 1.005, y: -2 }}
                                      onClick={() => setSelectedQr(o.qrCode.qrCodeUrl)}
                                      className="mt-10 bg-black/40 border border-white/[0.04] rounded-[2rem] p-6 flex items-center gap-10 cursor-pointer hover:border-blue-500/40 transition-all group/handshake relative overflow-hidden"
                                    >
                                       <div className="absolute inset-0 bg-blue-500/5 translate-x-[-100%] group-hover/handshake:translate-x-0 transition-transform duration-1000" />
                                       <div className="w-24 h-24 bg-white p-2 rounded-[1.5rem] shrink-0 group-hover/handshake:scale-110 transition-transform duration-700 shadow-[0_0_30px_rgba(255,255,255,0.1)] relative z-10">
                                          <Image src={o.qrCode.qrCodeUrl} alt="QR" fill className="object-contain p-2" unoptimized />
                                       </div>
                                       <div className="flex-1 min-w-0 relative z-10">
                                          <div className="flex justify-between items-center mb-3">
                                             <div className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Cryptographic Handshake Protocol
                                             </div>
                                             <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic group-hover/handshake:text-slate-400">Initialize Verification</span>
                                          </div>
                                          <p className="text-slate-500 text-[11px] leading-relaxed max-w-2xl font-medium uppercase tracking-tight italic">Present this encrypted sequence to the fulfillment officer during physical asset transfer to satisfy multi-sig release requirements and initiate final on-chain settlement.</p>
                                       </div>
                                       <div className="shrink-0 w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-slate-700 group-hover/handshake:text-blue-500 transition-colors">
                                          <ChevronRight className="w-6 h-6" />
                                       </div>
                                    </motion.div>
                                  )}
                               </motion.div>
                             )
                           })}
                         </AnimatePresence>
                       )}
                    </div>
                 </div>
               )}
             </motion.div>
           </AnimatePresence>
        </main>
      </div>

      {/* ── Cryptographic Handshake Modal ── */}
      <AnimatePresence>
        {selectedQr && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#020408]/95 backdrop-blur-2xl" onClick={() => setSelectedQr(null)}>
             <motion.div 
               initial={{ scale: 0.8, opacity: 0, y: 40 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.8, opacity: 0, y: 40 }}
               transition={{ type: "spring", damping: 20, stiffness: 100 }}
               className="bg-[#0A0D14] border border-white/[0.1] rounded-[4rem] p-16 max-w-xl w-full text-center relative shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                <button onClick={() => setSelectedQr(null)} className="absolute top-8 right-8 text-slate-500 hover:text-white bg-white/5 rounded-2xl p-4 transition-all hover:bg-white/10 active:scale-90">
                  <X className="w-6 h-6" />
                </button>
                
                <div className="w-24 h-24 bg-blue-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.1)]">
                   <QrCode className="w-12 h-12 text-blue-500" />
                </div>
                
                <h3 className="text-4xl font-black text-white tracking-widest uppercase italic mb-3">Principal Key</h3>
                <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.5em] mb-12 italic">Fulfillment Auth Protocol 0.8.2</p>
                
                <div className="bg-white p-6 rounded-[3.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative group mb-12 border-8 border-black/5">
                   <div className="absolute inset-0 bg-blue-500/10 blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                   <div className="w-full h-80 relative bg-white rounded-3xl overflow-hidden">
                      <Image src={selectedQr} alt="QR Principal" fill className="object-contain p-4 transition-transform duration-700 group-hover:scale-110" unoptimized />
                   </div>
                </div>

                <a href={selectedQr} download="pramanik-auth-key.png" className="block w-full">
                   <Button className="w-full bg-white text-black h-20 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-sm hover:bg-slate-200 shadow-2xl transition-all active:scale-95 italic">
                      <Download className="w-6 h-6 mr-4" /> Secure Registry
                   </Button>
                </a>
                
                <p className="mt-10 text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-relaxed">
                   Do not share this key outside physical proximity of the certified fulfillment agent.
                </p>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
