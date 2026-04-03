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
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

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

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const NAV = [
  { id: "orders",       label: "Asset Ledger",        icon: ShoppingCart },
  { id: "tracking",     label: "Live Logistics",      icon: ScanLine },
  { id: "completed",    label: "Order History",       icon: CheckCircle2 },
  { id: "bounties",     label: "Bounty Board",         icon: Coins },
]

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:              { label: "Awaiting Settlement", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",       dot: "bg-zinc-400" },
  PAID:                 { label: "Settled",             cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",       dot: "bg-blue-400" },
  SHIPPED:              { label: "In Propagation",      cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", dot: "bg-purple-400" },
  DELIVERED:            { label: "Final Hop",           cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",    dot: "bg-amber-400" },
  COMPLETED:            { label: "Verified Node",       cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  DISPUTED:             { label: "Collision Detected",  cls: "bg-red-500/10 text-red-400 border-red-500/20",          dot: "bg-red-400" },
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
      const tokensData = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const response = await fetch(`${api}/orders/my-orders?${query}`, {
        credentials: 'include',
        headers: { ...(tokensData ? { 'Authorization': `Bearer ${tokensData}` } : {}) }
      })
      const data = await response.json()
      if (response.ok) {
        setOrders(data.data || [])
      } else {
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
      <div className={`min-h-screen bg-[#030408] text-slate-400 ${inter.className}`}>
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <Activity className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Syncing Operation Deck...</span>
        </div>
      </div>
    )
  }

  if (user && user.role !== "BUYER") {
    return (
      <div className={`min-h-screen bg-[#030408] text-slate-400 ${inter.className}`}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className={`${outfit.className} text-4xl font-black text-white uppercase italic tracking-tighter mb-4`}>Access Restricted</h1>
          <p className="text-slate-500 font-medium uppercase tracking-tight text-xs mb-10 leading-relaxed italic">This command center is reserved for verified principal buyers. Merchants and Oracles must use their respective interfaces.</p>
          <Link href="/"><button className="h-14 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all shadow-xl italic">Return to Port</button></Link>
        </div>
      </div>
    )
  }

  if (!isDashboardReady) {
    return (
      <div className={`min-h-screen bg-[#030408] text-slate-400 ${inter.className}`}>
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-32">
          <WalletRequirement fallbackMessage="Please authenticate your session to synchronize purchase history and active logistics." />
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col bg-[#030408] text-slate-400 ${inter.className} selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden relative`}>
      {/* ── Deep Space Atmospheric Effects ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header />

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* ── Institutional Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 gap-6 p-8 h-full border-r border-white/[0.04] bg-[#0A0D14]/40 backdrop-blur-xl">
          {/* Principal Identity Node */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-7 shadow-3xl relative overflow-hidden group"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-[0_10px_40px_rgba(37,99,235,0.35)] border border-white/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                {String(user?.email || publicKey || "B")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className={`${outfit.className} font-black text-white text-xl truncate tracking-tighter uppercase italic`}>{String(user?.email?.split("@")[0] || "Buyer Node")}</div>
                <div className="flex items-center gap-1.5 mt-1.5 text-blue-400 font-black text-[8px] uppercase tracking-[0.25em] italic">
                   <Shield className="w-3 h-3" /> Principal Authority
                </div>
              </div>
            </div>

            {/* Encrypted Key Metadata */}
            {(user?.stellarWallet || publicKey) && (
              <div className="mt-8 bg-black/40 border border-white/[0.03] rounded-2xl p-4 flex items-center gap-4 group/wallet hover:border-blue-500/20 transition-all shadow-inner">
                <div className="w-9 h-9 rounded-xl bg-white/[0.02] flex items-center justify-center border border-white/[0.05] shadow-inner">
                  <Wallet className="w-3.5 h-3.5 text-slate-500 group-hover/wallet:text-blue-400 transition-colors" />
                </div>
                <span className="text-[9px] font-mono text-slate-500 truncate flex-1 uppercase tracking-[0.1em]">
                  {String(user?.stellarWallet || publicKey || "").slice(0, 8)}...{String(user?.stellarWallet || publicKey || "").slice(-8)}
                </span>
                <button onClick={copyWallet} className="text-slate-600 hover:text-white transition-all bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05] active:scale-90">
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </motion.div>

          {/* Mission Control Deck Navigation */}
          <nav className="flex-1 overflow-y-auto pr-2 space-y-3 mt-4 scrollbar-hide">
            <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-4 ml-4 italic opacity-80">Command Matrix</div>
            {NAV.map((n, i) => (
              <motion.button 
                key={n.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => setActive(n.id)}
                className={`w-full group flex items-center gap-5 px-7 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden italic ${
                  active === n.id
                    ? "text-white bg-blue-600/10 border border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.08)]"
                    : "text-slate-600 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                {active === n.id && (
                  <>
                    <motion.div layoutId="buyer-nav-glow" className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent" />
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-blue-500 rounded-r-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
                  </>
                )}
                <n.icon className={`w-5 h-5 transition-all duration-700 group-hover:scale-125 ${active === n.id ? "text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]" : "text-slate-800"}`} />
                <span className="relative z-10">{n.label}</span>
                {n.id === "tracking" && activeOrders.length > 0 && (
                   <span className="ml-auto bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1.5 rounded-xl border border-amber-500/20 animate-pulse shadow-lg">{activeOrders.length}</span>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Assets Under Command */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-premium bg-[#0A0D14]/60 border border-white/[0.08] rounded-[2.5rem] p-8 shadow-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity className="w-16 h-16 text-emerald-400 rotate-12" />
            </div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 italic">Settled Liquidity</div>
            <div className="flex items-baseline gap-2">
               <div className={`${outfit.className} text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]`}>
                 ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
               </div>
               <div className="text-[11px] font-black text-blue-500 uppercase tracking-widest italic opacity-80">USDC</div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/[0.04] flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
               <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.25em] italic">Consensus Verified</span>
            </div>
          </motion.div>
        </aside>

        {/* ── Command Interface ── */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar p-12 relative">
           <AnimatePresence mode="wait">
             <motion.div
               key={active}
               initial={{ opacity: 0, y: 40, filter: "blur(15px)" }}
               animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
               exit={{ opacity: 0, y: -40, filter: "blur(15px)" }}
               transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
               className="space-y-16"
             >
               {/* Module Header */}
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div>
                    <h2 className={`${outfit.className} text-6xl font-black text-white tracking-tighter uppercase italic leading-[0.85]`}>
                      {active === "orders" ? <span className="text-white">Principal <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.3)]">Ledger</span></span> : 
                       active === "tracking" ? <span className="text-white">Active <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.3)]">Logistics</span></span> : 
                       active === "completed" ? <span className="text-white">Verified <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.3)]">History</span></span> : 
                       <span className="text-white">Incentive <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.3)]">Node</span></span>}
                    </h2>
                    <div className="flex items-center gap-4 mt-8">
                       <div className="h-[2px] w-14 bg-gradient-to-r from-blue-500 to-transparent" />
                       <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] italic flex items-center gap-3">
                         <Zap className="w-3.5 h-3.5 text-blue-500" /> Real-time Settlement Layer Synchronized
                       </p>
                    </div>
                  </div>
                  <button 
                    onClick={loadOrders} 
                    className="group relative p-6 bg-[#0A0D14]/80 border border-white/[0.08] rounded-3xl transition-all active:scale-90 hover:border-blue-500/40 shadow-3xl overflow-hidden backdrop-blur-xl"
                  >
                    <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                    <RefreshCw className={`w-7 h-7 text-slate-500 group-hover:text-blue-400 transition-all relative z-10 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-1000"}`} />
                  </button>
               </div>

               {/* Intelligence Overview */}
               {active === "orders" && (
                 <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* Settlement Velocity Chart */}
                    <div className="xl:col-span-8 glass-premium bg-[#0A0D14]/60 border border-white/[0.08] rounded-[3.5rem] p-12 relative overflow-hidden group shadow-3xl hover:border-white/[0.12] transition-colors duration-500">
                       <div className="flex items-center justify-between mb-16">
                          <div>
                             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 italic">Financial Telemetry</h3>
                             <div className={`${outfit.className} text-4xl font-black text-white tracking-tighter mt-3 uppercase italic leading-none`}>Settlement Velocity</div>
                          </div>
                          <div className="bg-white/5 border border-white/[0.08] rounded-2xl px-6 py-3.5 flex items-center gap-4 shadow-inner">
                             <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Market Propagation</span>
                          </div>
                       </div>
                       <div className="h-[350px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={spendingData}>
                                <defs>
                                   <linearGradient id="buyerSpendGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.5}/>
                                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                <XAxis dataKey="date" stroke="#475569" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} dy={20} className="uppercase italic tracking-widest" />
                                <YAxis stroke="#475569" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} dx={-20} className="font-mono" />
                                <RechartsTooltip 
                                   cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 2 }}
                                   contentStyle={{backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)'}}
                                   itemStyle={{color: '#fff', fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em'}}
                                />
                                <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={6} fillOpacity={1} fill="url(#buyerSpendGrad)" animationDuration={2500} />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Capital Composition Pie */}
                    <div className="xl:col-span-4 glass-premium bg-[#0A0D14]/60 border border-white/[0.08] rounded-[3.5rem] p-12 shadow-3xl relative overflow-hidden flex flex-col group hover:border-white/[0.12] transition-colors duration-500">
                       <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-12 italic">Capital Composition</h3>
                       <div className="flex-1 relative min-h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie 
                                  data={currencyDistribution.length > 0 ? currencyDistribution : [{name: 'Empty', value: 1}]}
                                  innerRadius={90} outerRadius={125} paddingAngle={12} dataKey="value" stroke="none"
                                  animationBegin={700} animationDuration={1800}
                                >
                                   {currencyDistribution.map((e, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer shadow-2xl" />)}
                                   {currencyDistribution.length === 0 && <Cell fill="#1F2937" />}
                                </Pie>
                                <RechartsTooltip 
                                   contentStyle={{backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', textTransform: 'uppercase', fontSize: '11px', fontWeight: '900', letterSpacing: '0.1em'}} 
                                />
                             </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover:scale-110 transition-transform duration-700">
                               <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none mb-2">Aggregate Equity</span>
                               <span className={`${outfit.className} text-4xl font-black text-white tracking-tighter`}>${totalSpent.toFixed(0)}</span>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-5 mt-16">
                           {currencyDistribution.map((c, i) => (
                             <div key={c.name} className="flex items-center gap-4 bg-white/[0.02] p-5 rounded-2xl border border-white/[0.04] hover:bg-white/[0.06] transition-all group/cell shadow-inner">
                                <div className="w-3.5 h-3.5 rounded-lg shadow-xl shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic group-hover/cell:text-slate-200 transition-colors">{c.name}</div>
                             </div>
                           ))}
                       </div>
                    </div>
                 </div>
               )}

               {/* Operations Log / Transactions */}
               {active === "bounties" ? (
                 <div className="glass-premium bg-[#0A0D14]/40 border-2 border-dashed border-white/[0.06] rounded-[4rem] p-32 text-center relative overflow-hidden group shadow-inner">
                    <div className="absolute inset-0 bg-blue-600/[0.01] group-hover:bg-blue-600/[0.03] transition-colors" />
                    <div className="w-32 h-32 rounded-[2.5rem] bg-blue-500/5 flex items-center justify-center mx-auto mb-10 shadow-2xl border border-white/[0.03] group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000 opacity-20">
                       <Coins className="w-16 h-16 text-blue-500" />
                    </div>
                    <h3 className={`${outfit.className} text-5xl font-black text-white tracking-widest uppercase italic leading-none mb-6`}>Protocol v2.1 Activated</h3>
                    <p className="text-slate-600 max-w-lg mx-auto text-[11px] font-black uppercase tracking-[0.5em] leading-relaxed opacity-60 italic">Issuance of authentication bounties is temporarily locked during Stage-R node propagation. Principal accounts will regain command in the next consensus cycle.</p>
                 </div>
               ) : (
                 <div className="space-y-10 pb-40">
                    <div className="flex items-center justify-between px-8">
                       <div className="flex items-center gap-5">
                          <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
                          <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic">Asset Signal Matrix</span>
                       </div>
                       <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic bg-white/5 px-6 py-2.5 rounded-2xl border border-white/5">{filteredOrders.length} Endpoints Synchronized</span>
                    </div>

                    <div className="grid grid-cols-1 gap-10">
                       {filteredOrders.length === 0 ? (
                         <div className="py-48 text-center border-2 border-dashed border-white/[0.03] rounded-[4rem] bg-white/[0.01] shadow-inner">
                            <Package className="w-24 h-24 text-slate-900 mx-auto mb-10 opacity-30" />
                            <p className="text-slate-700 font-black uppercase tracking-[0.6em] text-[11px] italic">Telemetry Matrix Empty / Pending Payload</p>
                         </div>
                       ) : (
                         <AnimatePresence mode="popLayout" initial={false}>
                           {filteredOrders.map((o: any, idx: number) => {
                             const s = STATUS[o.status] || STATUS.PAID
                             return (
                               <motion.div 
                                 key={o.id}
                                 layout
                                 initial={{ opacity: 0, x: -40, filter: "blur(10px)" }}
                                 animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                 transition={{ delay: idx * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                 className="glass-premium bg-[#0A0D14]/70 border border-white/[0.08] hover:border-blue-500/30 rounded-[3.5rem] p-12 transition-all group relative overflow-hidden shadow-3xl hover:shadow-blue-500/10"
                               >
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/[0.01] rounded-full blur-[80px] pointer-events-none" />
                                  
                                  <div className="flex flex-col xl:flex-row items-center gap-16 relative z-10">
                                     {/* Asset Signature */}
                                     <div className="flex items-center gap-12 flex-1 min-w-0">
                                        <div className="w-36 h-36 bg-black/80 rounded-[3rem] border border-white/[0.06] relative overflow-hidden group-hover:scale-105 group-hover:rotate-2 transition-all duration-1000 shadow-inner group-hover:shadow-blue-500/20">
                                           {o.product?.proofMediaUrls?.[0] ? (
                                             <Image 
                                               src={getIPFSUrl(o.product.proofMediaUrls[0])} 
                                               alt="" 
                                               fill 
                                               className="object-cover opacity-50 group-hover:opacity-100 transition-all duration-1000 grayscale group-hover:grayscale-0 scale-110 group-hover:scale-100" 
                                               unoptimized
                                             />
                                           ) : (
                                             <Package className="w-16 h-16 text-slate-800 absolute inset-0 m-auto opacity-30" />
                                           )}
                                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                                           <div className="absolute bottom-4 left-0 w-full text-center text-[8px] font-black text-white/50 uppercase tracking-[0.2em] italic">Media Node</div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                           <div className="flex flex-wrap items-center gap-8 mb-6">
                                              <h4 className={`${outfit.className} text-4xl font-black text-white tracking-tighter uppercase italic group-hover:text-blue-400 transition-colors duration-700 truncate leading-none`}>{o.product?.title || "Protocol Asset"}</h4>
                                              <span className={`px-6 py-2.5 rounded-2xl border text-[9px] font-black uppercase tracking-[0.3em] italic backdrop-blur-2xl shadow-3xl ${s.cls} group-hover:scale-105 transition-transform duration-500`}>
                                                 <div className={`w-2 h-2 rounded-full ${s.dot} inline-block mr-4 animate-pulse shadow-[0_0_15px_currentColor]`} /> {s.label}
                                              </span>
                                           </div>
                                           <div className="flex flex-wrap items-center gap-x-10 gap-y-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic">
                                              <span className="text-slate-400 flex items-center gap-3 bg-white/[0.03] px-5 py-2.5 rounded-2xl border border-white/[0.05] shadow-inner group-hover:text-blue-300 transition-colors">
                                                <BarChart2 className="w-4 h-4 text-blue-500" /> NODE-{o.id.slice(0, 12)}
                                              </span>
                                              <span className="flex items-center gap-3 hover:text-white transition-all cursor-pointer group-hover:translate-x-1 duration-500">
                                                <Shield className="w-4 h-4 text-emerald-500/80" /> {o.product?.supplier?.name || "Verified Counterparty"}
                                              </span>
                                              <span className="flex items-center gap-3 group-hover:text-slate-400 transition-colors">
                                                <Clock className="w-4 h-4 text-slate-800" /> {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                                              </span>
                                           </div>
                                        </div>
                                     </div>

                                     {/* Settlement Magnitude */}
                                     <div className="hidden xl:flex flex-col items-center border-x border-white/[0.04] px-20 shrink-0 group/price relative">
                                        <div className="absolute inset-0 bg-blue-500/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className={`${outfit.className} text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.15)] group-hover:scale-110 group-hover:text-blue-400 transition-all duration-700 relative z-10`}>
                                           {o.priceUsdc} <span className="text-lg text-blue-500 font-black italic opacity-60">USDC</span>
                                        </div>
                                        <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] mt-4 italic group-hover:text-slate-400 transition-colors relative z-10">Escrow Magnitude</div>
                                     </div>

                                     {/* Operation Cluster */}
                                     <div className="flex flex-col gap-4 shrink-0 w-full xl:w-auto">
                                        {(o.status === "PAID" || o.status === "SHIPPED" || o.status === "DELIVERED") && (
                                          <Button 
                                            onClick={() => window.open(`/delivery/confirm/${o.id}`, "_blank")}
                                            className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.4em] text-[12px] rounded-[2rem] h-18 px-12 shadow-[0_20px_50px_rgba(37,99,235,0.35)] active:scale-95 transition-all italic border border-white/10"
                                          >
                                             <ScanLine className="w-6 h-6 mr-4" /> Inspect Node 
                                          </Button>
                                        )}
                                        <div className="flex gap-4">
                                           <Button 
                                             onClick={() => window.open(`/order/${o.id}/journey`, "_blank")} 
                                             className="flex-1 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] rounded-2xl h-14 px-8 uppercase text-[10px] font-black italic tracking-widest transition-all group/btn shadow-inner"
                                           >
                                              <ExternalLink className="w-4 h-4 mr-3 text-slate-700 group-hover/btn:text-blue-500 group-hover/btn:scale-110 transition-all" /> Journey
                                           </Button>
                                           <Button 
                                             onClick={() => window.open(`/proof/${o.id}?viewType=logistics`, "_blank")} 
                                             className="flex-1 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.15] rounded-2xl h-14 px-8 uppercase text-[10px] font-black italic tracking-widest transition-all group/btn shadow-inner"
                                           >
                                              <Activity className="w-4 h-4 mr-3 text-slate-700 group-hover/btn:text-emerald-500 group-hover/btn:scale-110 transition-all" /> Status
                                           </Button>
                                        </div>
                                        {o.status === "COMPLETED" && o.deliveryCertCid && (
                                           <Button onClick={() => window.open(`/proof/${o.id}`, "_blank")} className="w-full bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/10 rounded-2xl h-14 uppercase text-[10px] font-black tracking-[0.3em] transition-all italic shadow-2xl">
                                              Download Protocol Passport <Download className="w-4 h-4 ml-4" />
                                           </Button>
                                        )}
                                        {o.status === "PENDING" && (
                                           <Link href={`/product/${o.productId}`} className="w-full">
                                              <Button className="w-full bg-white text-black rounded-2xl h-18 uppercase text-[12px] font-black tracking-[0.4em] hover:bg-slate-200 active:scale-95 transition-all italic shadow-3xl">Execute Handshake</Button>
                                           </Link>
                                        )}
                                     </div>
                                  </div>

                                  {/* Verification Protocol Linkage */}
                                  {(o.status === "PAID" || o.status === "SHIPPED") && o.qrCode?.qrCodeUrl && (
                                    <motion.div 
                                      whileHover={{ scale: 1.005, y: -4 }}
                                      onClick={() => setSelectedQr(o.qrCode.qrCodeUrl)}
                                      className="mt-12 bg-black/60 border border-white/[0.05] rounded-[2.5rem] p-8 flex items-center gap-12 cursor-pointer hover:border-blue-500/50 transition-all group/handshake relative overflow-hidden shadow-inner"
                                    >
                                       <div className="absolute inset-0 bg-blue-500/[0.02] translate-x-[-100%] group-hover/handshake:translate-x-0 transition-transform duration-1000" />
                                       <div className="w-28 h-28 bg-white p-2.5 rounded-[2rem] shrink-0 group-hover/handshake:scale-110 group-hover:rotate-2 transition-all duration-700 shadow-[0_0_40px_rgba(255,255,255,0.15)] relative z-10">
                                          <Image src={o.qrCode.qrCodeUrl} alt="QR" fill className="object-contain p-3" unoptimized />
                                       </div>
                                       <div className="flex-1 min-w-0 relative z-10">
                                          <div className="flex justify-between items-center mb-4">
                                             <div className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] flex items-center gap-4 italic leading-none">
                                                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.8)]" /> Cryptographic Handshake Interface
                                             </div>
                                             <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] italic group-hover/handshake:text-blue-500 transition-all">Propagate Signal</span>
                                          </div>
                                          <p className="text-slate-500 text-[11px] leading-relaxed max-w-3xl font-medium uppercase tracking-[0.05em] italic opacity-80 group-hover:opacity-100 transition-opacity">This signed credential must be presented to the fulfilling node for identity verification and multi-signature sequence release. Physical proximity is required for terminal finality.</p>
                                       </div>
                                       <div className="shrink-0 w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-800 group-hover/handshake:text-blue-500 group-hover/handshake:scale-110 transition-all">
                                          <ChevronRight className="w-8 h-8" />
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

      {/* ── Settlement Protocol Modal ── */}
      <AnimatePresence>
        {selectedQr && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#020408]/98 backdrop-blur-3xl" onClick={() => setSelectedQr(null)}>
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 100 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 100 }}
               transition={{ type: "spring", damping: 25, stiffness: 120 }}
               className="bg-[#0A0D14] border border-white/[0.12] rounded-[5rem] p-16 max-w-2xl w-full text-center relative shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80" />
                <button onClick={() => setSelectedQr(null)} className="absolute top-10 right-10 text-slate-600 hover:text-white bg-white/5 rounded-3xl p-5 transition-all hover:bg-white/10 active:scale-90 shadow-inner">
                  <X className="w-7 h-7" />
                </button>
                
                <div className="w-28 h-28 rounded-[3rem] bg-blue-600/10 flex items-center justify-center mx-auto mb-12 border border-blue-500/20 shadow-[0_0_80px_rgba(37,99,235,0.2)] group">
                   <QrCode className="w-14 h-14 text-blue-500 animate-pulse group-hover:scale-110 transition-transform duration-700" />
                </div>
                
                <h3 className={`${outfit.className} text-5xl font-black text-white tracking-[0.1em] uppercase italic mb-4 leading-none`}>Principal Key</h3>
                <p className="text-slate-600 text-[12px] font-black uppercase tracking-[0.6em] mb-14 italic opacity-80">Settlement Authorization Protocol R.4.2</p>
                
                <div className="bg-white p-8 rounded-[4rem] shadow-[0_60px_120px_rgba(0,0,0,0.6)] relative group mb-14 border-[12px] border-black/10">
                   <div className="absolute inset-0 bg-blue-500/20 blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1500" />
                   <div className="w-full h-96 relative bg-white rounded-3xl overflow-hidden shadow-inner">
                      <Image src={selectedQr} alt="QR Principal" fill className="object-contain p-6 transition-transform duration-1000 group-hover:scale-125" unoptimized />
                   </div>
                </div>

                <a href={selectedQr} download="pramanik-settlement-key.png" className="block w-full">
                   <Button className="w-full bg-white text-black h-24 rounded-[3rem] font-black uppercase tracking-[0.5em] text-sm hover:bg-slate-200 shadow-3xl transition-all active:scale-95 italic border-4 border-black/5">
                      <Download className="w-7 h-7 mr-5" /> Export Encrypted Hash
                   </Button>
                </a>
                
                <p className="mt-12 text-[10px] font-black text-slate-800 uppercase tracking-[0.5em] italic leading-relaxed max-w-sm mx-auto">
                   CRITICAL: DO NOT Propagate this key outside secure physical proximity of the fulfillment terminal.
                </p>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
