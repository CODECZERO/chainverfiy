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
import { getMyOrders } from "@/lib/api-service"


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
  { id: "overview",     label: "Overview",          icon: Activity },
  { id: "orders",       label: "My Orders",        icon: ShoppingCart },
  { id: "tracking",     label: "Track Shipments",   icon: ScanLine },
  { id: "completed",    label: "Order History",    icon: CheckCircle2 },
  { id: "bounties",     label: "Earn Rewards",      icon: Coins },
]

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:              { label: "Processing Payment", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",       dot: "bg-zinc-400" },
  PAID:                 { label: "Payment Confirmed",  cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",       dot: "bg-blue-400" },
  SHIPPED:              { label: "In Transit",         cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", dot: "bg-purple-400" },
  DELIVERED:            { label: "Arriving Soon",      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",    dot: "bg-amber-400" },
  COMPLETED:            { label: "Delivered & Verified", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  DISPUTED:             { label: "Issue Found",        cls: "bg-red-500/10 text-red-400 border-red-500/20",          dot: "bg-red-400" },
}

export default function BuyerDashboard() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading: authLoading } = useSelector((s: RootState) => s.userAuth)
  
  const { publicKey } = useWallet()
  const [active, setActive] = useState("overview")
  const [mounted, setMounted] = useState(false)
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

  useEffect(() => { setMounted(true); loadOrders() }, [user?.id, publicKey])

  const loadOrders = async () => {
    if (!user?.id && !publicKey) return
    setLoading(true)
    try {
      const params: any = user?.id ? { buyerId: user.id } : { stellarWallet: publicKey }
      const data = await getMyOrders(params)
      setOrders(data || [])
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
      <div className={`min-h-screen bg-[#05060A] text-slate-200 ${inter.className}`}>
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <Activity className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse">Syncing Dashboard...</span>
        </div>
      </div>
    )
  }

  if (user && user.role !== "BUYER") {
    return (
      <div className={`min-h-screen bg-[#05060A] text-slate-200 ${inter.className}`}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h1 className={`${outfit.className} text-4xl font-bold text-white mb-4`}>Access Restricted</h1>
          <p className="text-slate-500 font-medium text-sm mb-10 leading-relaxed max-w-sm mx-auto">This dashboard is reserved for shoppers. Sellers should use the merchant dashboard to manage their store.</p>
          <Link href="/"><button className="h-14 px-10 rounded-2xl bg-white text-black font-bold text-[13px] hover:bg-slate-200 transition-all shadow-xl">Back to Home</button></Link>
        </div>
      </div>
    )
  }

  if (!isDashboardReady) {
    return (
      <div className={`min-h-screen bg-[#05060A] text-slate-200 ${inter.className}`}>
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-32">
          <WalletRequirement fallbackMessage="Please sign in or connect your wallet to view your purchase history." />
        </div>
      </div>
    )
  }

  const walletAddr = user?.stellarWallet || publicKey || ""

  return (
    <div className={`min-h-screen bg-[#05060A] text-slate-200 overflow-x-hidden selection:bg-indigo-500/30 ${inter.className}`}>
      {/* ── Background Elements (matching marketplace) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">

          {/* ── Buyer Profile Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-indigo-500/40" />
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Shopping Hub</span>
              </div>
              <h1 className={`${outfit.className} text-4xl md:text-6xl font-bold tracking-tight text-white mb-6`}>
                Buyer <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">Dashboard</span>
              </h1>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] border border-white/20">
                  {String(user?.email || publicKey || "B")[0].toUpperCase()}
                </div>
                <div>
                  <div className={`${outfit.className} font-bold text-white text-lg tracking-tight`}>{String(user?.email?.split("@")[0] || "Buyer Account")}</div>
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[9px] uppercase tracking-widest">
                    <Shield className="w-3 h-3" /> Verified Buyer
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4 min-w-[320px]"
            >
              {/* Wallet Address Card */}
              {walletAddr && (
                <button
                  onClick={copyWallet}
                  className="w-full p-4 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all group text-left"
                  title="Click to copy full wallet address"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stellar Wallet</span>
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 ml-auto transition-colors" />
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-slate-300 break-all leading-relaxed">
                    {walletAddr}
                  </p>
                  {copied && <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1 block">Copied to clipboard!</span>}
                </button>
              )}

              {/* Total Spent + Actions */}
              <div className="flex gap-3 items-stretch">
                <div className="flex-1 p-4 bg-white/[0.04] border border-white/10 rounded-2xl">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Spent</div>
                  <div className={`${outfit.className} text-2xl font-bold text-white tracking-tight`}>
                    ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">USDC</div>
                </div>
                <button
                  onClick={loadOrders}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-slate-500 hover:text-white hover:border-indigo-500/30 transition-all disabled:opacity-50 group text-[10px] font-bold uppercase tracking-widest"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : "group-hover:rotate-180 transition-transform duration-700"}`} />
                </button>
                <Link href="/marketplace">
                  <Button className="h-full px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-900/20 transition-all active:scale-95">
                    <ShoppingCart className="w-4 h-4 mr-2" /> Shop
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ── Horizontal Tab Nav ── */}
          <div className="mb-12 overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActive(n.id)}
                  className={`relative px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${
                    active === n.id
                      ? "text-indigo-400 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/20"
                      : "text-slate-500 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <n.icon className={`w-4 h-4 transition-transform duration-500 ${active === n.id ? "text-indigo-400" : "text-slate-600"}`} />
                  {n.label}
                  {n.id === "tracking" && activeOrders.length > 0 && (
                    <span className="ml-1 bg-indigo-500/20 text-indigo-400 text-[9px] font-bold px-2 py-0.5 rounded-full">{activeOrders.length}</span>
                  )}
                  {active === n.id && (
                    <motion.div
                      layoutId="buyer-active-glow"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-500 rounded-full blur-[2px] opacity-80"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content Area ── */}
          <div className="relative">
           <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-12"
              >

               {/* ── Overview / Intelligence Deck ── */}
               {active === "overview" && (
                 <div className="space-y-12">
                   {/* 4-Card Stat Grid */}
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                     {[
                       { label: "Total Orders", value: orders.length, color: "text-blue-400", bg: "from-blue-500/10", icon: ShoppingCart },
                       { label: "Active Shipments", value: activeOrders.length, color: "text-purple-400", bg: "from-purple-500/10", icon: ScanLine },
                       { label: "Completed", value: orders.filter(o => o.status === "COMPLETED").length, color: "text-emerald-400", bg: "from-emerald-500/10", icon: CheckCircle2 },
                       { label: "Total Spent", value: `$${totalSpent.toFixed(0)}`, color: "text-white", bg: "from-blue-600/10", icon: Coins },
                     ].map((s, i) => (
                       <div key={i} className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-8 relative overflow-hidden group shadow-3xl">
                         <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} to-transparent opacity-0 group-hover:opacity-40 transition-opacity`} />
                         <div className="flex items-center justify-between mb-8 relative z-10">
                           <s.icon className={`w-6 h-6 ${s.color}`} />
                         </div>
                         <div className="space-y-2 relative z-10">
                           <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
                           <div className={`${outfit.className} text-3xl font-bold text-white tracking-tight`}>{s.value}</div>
                         </div>
                       </div>
                     ))}
                   </div>

                   {/* Charts Grid */}
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                     <div className="lg:col-span-8 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-12 shadow-3xl min-h-[480px]">
                       <div className="flex items-center justify-between mb-10">
                         <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Spending Insights</h3>
                         <div className="hidden sm:flex bg-white/5 border border-white/[0.08] rounded-2xl px-6 py-3.5 items-center gap-4 shadow-inner">
                           <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
                           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Updates</span>
                         </div>
                       </div>
                       <div className="h-[350px] w-full">
                         {mounted && (
                           <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={spendingData}>
                               <defs>
                                 <linearGradient id="buyerSpendGrad" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5}/>
                                   <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                                 </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                               <XAxis dataKey="date" stroke="#475569" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} dy={20} />
                               <YAxis stroke="#475569" fontSize={9} fontWeight="bold" tickLine={false} axisLine={false} dx={-20} />
                               <RechartsTooltip
                                 cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 2 }}
                                 contentStyle={{backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)'}}
                                 itemStyle={{color: '#fff', fontWeight: 'bold', fontSize: '13px'}}
                               />
                               <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={6} fillOpacity={1} fill="url(#buyerSpendGrad)" animationDuration={2000} />
                             </AreaChart>
                           </ResponsiveContainer>
                         )}
                       </div>
                     </div>
                     <div className="lg:col-span-4 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-12 shadow-3xl">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-10">Payment Breakdown</h3>
                       <div className="h-[300px] w-full relative flex items-center justify-center">
                         {mounted && (
                           <>
                             <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                 <Pie
                                   data={currencyDistribution.length > 0 ? currencyDistribution : [{name: 'Empty', value: 1}]}
                                   innerRadius={60} outerRadius={90} paddingAngle={12} dataKey="value" stroke="none"
                                   animationBegin={500} animationDuration={1500}
                                 >
                                   {currencyDistribution.map((e, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                   {currencyDistribution.length === 0 && <Cell fill="#1F2937" />}
                                 </Pie>
                                 <RechartsTooltip contentStyle={{backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold'}} />
                               </PieChart>
                             </ResponsiveContainer>
                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                               <span className="text-xl font-bold text-white">${totalSpent.toFixed(0)}</span>
                             </div>
                           </>
                         )}
                       </div>
                       <div className="grid grid-cols-2 gap-4 mt-8">
                         {currencyDistribution.map((c, i) => (
                           <div key={c.name} className="flex items-center gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.04]">
                             <div className="w-3 h-3 rounded-lg shadow-xl shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                             <div className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{c.name}</div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               )}


               {/* Bounties Tab */}
               {active === "bounties" && (
                 <div className="glass-premium bg-white/[0.01] border-2 border-dashed border-white/[0.06] rounded-[2.5rem] md:rounded-[4rem] p-12 md:p-32 text-center relative overflow-hidden group shadow-inner">
                    <div className="absolute inset-0 bg-blue-600/[0.01] transition-colors" />
                    <div className="w-24 h-24 rounded-[2rem] bg-blue-500/5 flex items-center justify-center mx-auto mb-10 shadow-2xl border border-white/[0.03] group-hover:scale-110 transition-transform duration-1000 opacity-20">
                       <Coins className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className={`${outfit.className} text-4xl font-bold text-white tracking-tight mb-6`}>Community Rewards Coming Soon</h3>
                    <p className="text-slate-600 max-w-sm mx-auto text-sm leading-relaxed opacity-80">We are finalizing our community reward system. Soon you will be able to earn digital assets by helping verify product authenticity.</p>
                 </div>
               )}

               {/* Orders / Tracking / Completed List */}
               {(active === "orders" || active === "tracking" || active === "completed") && (
                 <div className="space-y-10 pb-40">
                    <div className="flex items-center justify-between px-8">
                       <div className="flex items-center gap-5">
                          <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Recent Activity</span>
                       </div>
                       <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white/5 px-6 py-2.5 rounded-2xl border border-white/5">{filteredOrders.length} Entries Found</span>
                    </div>

                    <div className="grid grid-cols-1 gap-10">
                       {filteredOrders.length === 0 ? (
                         <div className="py-48 text-center border-2 border-dashed border-white/[0.03] rounded-[4rem] bg-white/[0.01] shadow-inner">
                            <Package className="w-20 h-20 text-slate-900 mx-auto mb-10 opacity-30" />
                            <p className="text-slate-700 font-bold uppercase tracking-widest text-[11px]">No orders found in this section</p>
                         </div>
                       ) : (
                         <AnimatePresence mode="popLayout" initial={false}>
                           {filteredOrders.map((o: any, idx: number) => {
                             const s = STATUS[o.status] || STATUS.PAID
                             return (
                               <motion.div 
                                 key={o.id}
                                 layout
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                 className="glass-premium bg-white/[0.02] border border-white/[0.08] hover:border-blue-500/30 rounded-[2.5rem] p-6 md:p-12 transition-all group relative overflow-hidden shadow-3xl"
                               >
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/[0.01] rounded-full blur-[80px] pointer-events-none" />
                                  
                                  <div className="flex flex-col xl:flex-row items-center gap-8 md:gap-16 relative z-10">
                                     {/* Product Image */}
                                     <div className="flex flex-col sm:flex-row items-center gap-8 md:gap-12 flex-1 min-w-0 w-full">
                                        <div className="w-24 h-24 md:w-36 md:h-36 bg-black/80 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/[0.06] relative overflow-hidden group-hover:scale-105 transition-transform duration-1000 shadow-inner">
                                           {o.product?.proofMediaUrls?.[0] ? (
                                             <Image 
                                               src={getIPFSUrl(o.product.proofMediaUrls[0])} 
                                               alt="" 
                                               fill 
                                               className="object-cover opacity-50 group-hover:opacity-100 transition-all duration-1000 scale-110 group-hover:scale-100" 
                                               unoptimized
                                             />
                                           ) : (
                                             <Package className="w-16 h-16 text-slate-800 absolute inset-0 m-auto opacity-30" />
                                           )}
                                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                                        </div>
                                        <div className="min-w-0 flex-1 text-center sm:text-left w-full">
                                           <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 md:gap-8 mb-4 md:mb-6">
                                              <h4 className={`${outfit.className} text-lg md:text-2xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors duration-700 truncate leading-none`}>{o.product?.title || "Product Purchase"}</h4>
                                              <span className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl border text-[9px] font-bold uppercase tracking-widest backdrop-blur-2xl shadow-xl ${s.cls} group-hover:scale-105 transition-transform duration-500`}>
                                                 <div className={`w-2 h-2 rounded-full ${s.dot} inline-block mr-3 md:mr-4 animate-pulse shadow-[0_0_15px_currentColor]`} /> {s.label}
                                              </span>
                                           </div>
                                           <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 md:gap-x-10 gap-y-3 md:gap-y-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                                              <span className="text-slate-400 flex items-center gap-2 md:gap-3 bg-white/[0.03] px-3 md:px-5 py-2 md:py-2.5 rounded-2xl border border-white/[0.05] shadow-inner group-hover:text-blue-300 transition-colors">
                                                <BarChart2 className="w-4 h-4 text-blue-500" /> ID: {o.id.slice(0, 12)}
                                              </span>
                                              <span className="flex items-center gap-2 md:gap-3 hover:text-white transition-all cursor-pointer">
                                                <Shield className="w-4 h-4 text-emerald-500/80" /> {o.product?.supplier?.name || "Verified Seller"}
                                              </span>
                                              <span className="flex items-center gap-2 md:gap-3">
                                                <Clock className="w-4 h-4 text-slate-800" /> {new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                              </span>
                                           </div>
                                        </div>
                                     </div>

                                     {/* Order Amount */}
                                     <div className="xl:flex flex-col items-center border-y xl:border-x border-white/[0.04] py-8 md:py-10 xl:px-20 shrink-0 relative w-full xl:w-auto">
                                        <div className="absolute inset-0 bg-blue-500/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className={`${outfit.className} text-2xl md:text-4xl font-bold text-white tracking-tight tabular-nums drop-shadow-2xl group-hover:scale-110 group-hover:text-blue-400 transition-all duration-700 relative z-10 text-center`}>
                                           {o.priceUsdc} <span className="text-sm md:text-base text-blue-500 font-bold opacity-60">USDC</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-3 md:mt-4 group-hover:text-slate-400 transition-colors relative z-10 text-center">Secure Payment</div>
                                     </div>

                                     {/* Actions */}
                                     <div className="flex flex-col gap-4 shrink-0 w-full xl:w-auto">
                                        {(o.status === "PAID" || o.status === "SHIPPED" || o.status === "DELIVERED") && (
                                          <Button 
                                            onClick={() => window.open(`/delivery/confirm/${o.id}`, "_blank")}
                                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest text-[11px] rounded-[1.5rem] h-14 md:h-18 px-8 md:px-12 shadow-2xl active:scale-95 transition-all border border-white/10"
                                          >
                                             <ScanLine className="w-5 h-5 md:w-6 md:h-6 mr-3 md:mr-4" /> View Tracking 
                                          </Button>
                                        )}
                                        <div className="flex gap-4">
                                           <Button 
                                              onClick={() => window.open(`/order/${o.id}/journey`, "_blank")} 
                                              className="flex-1 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] rounded-2xl h-14 px-8 uppercase text-[10px] font-bold tracking-widest transition-all shadow-inner"
                                           >
                                              <ExternalLink className="w-4 h-4 mr-3 text-slate-700 group-hover:text-blue-500 transition-all" /> Journey
                                           </Button>
                                           <Button 
                                              onClick={() => window.open(`/proof/${o.id}?viewType=logistics`, "_blank")} 
                                              className="flex-1 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] rounded-2xl h-14 px-8 uppercase text-[10px] font-bold tracking-widest transition-all shadow-inner"
                                           >
                                              <Activity className="w-4 h-4 mr-3 text-slate-700 group-hover:text-emerald-500 transition-all" /> Status
                                           </Button>
                                        </div>
                                        {o.status === "COMPLETED" && o.deliveryCertCid && (
                                           <Button onClick={() => window.open(`/proof/${o.id}`, "_blank")} className="w-full bg-emerald-500/5 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/10 rounded-2xl h-14 uppercase text-[10px] font-bold tracking-widest transition-all shadow-2xl">
                                              Verification Receipt <Download className="w-4 h-4 ml-4" />
                                           </Button>
                                        )}
                                     </div>
                                  </div>

                                  {/* QR Receipt Section */}
                                  {(o.status === "PAID" || o.status === "SHIPPED") && o.qrCode?.qrCodeUrl && (
                                    <motion.div 
                                      whileHover={{ scale: 1.005, y: -4 }}
                                      onClick={() => setSelectedQr(o.qrCode.qrCodeUrl)}
                                      className="mt-8 md:mt-12 bg-black/60 border border-white/[0.05] rounded-[2.5rem] p-6 md:p-8 flex flex-col sm:flex-row items-center gap-8 md:gap-12 cursor-pointer hover:border-blue-500/50 transition-all group/handshake relative overflow-hidden shadow-inner"
                                    >
                                       <div className="absolute inset-0 bg-blue-500/[0.02] translate-x-[-100%] group-hover/handshake:translate-x-0 transition-transform duration-1000" />
                                       <div className="w-24 h-24 md:w-28 md:h-28 bg-white p-2.5 rounded-2xl shrink-0 group-hover/handshake:scale-110 transition-all duration-700 shadow-2xl relative z-10">
                                          <Image src={o.qrCode.qrCodeUrl} alt="QR" fill className="object-contain p-3" unoptimized />
                                       </div>
                                       <div className="flex-1 min-w-0 relative z-10 text-center sm:text-left">
                                          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                                             <div className="text-[12px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-3 md:gap-4 leading-none text-left">
                                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.8)]" /> Order Identity Receipt
                                             </div>
                                             <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest group-hover/handshake:text-blue-500 transition-all">Show to Merchant</span>
                                          </div>
                                          <p className="text-slate-500 text-[11px] leading-relaxed max-w-3xl font-medium tracking-tight opacity-80 group-hover:opacity-100 transition-opacity">This is your digital receipt. Show this QR code to the delivery partner or store manager to verify your identity and confirm the arrival of your order.</p>
                                       </div>
                                       <div className="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-800 group-hover/handshake:text-blue-500 group-hover:scale-110 transition-all">
                                          <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
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
          </div>
        </div>
      </main>

      {/* ── QR Receipt Modal ── */}
      <AnimatePresence>
        {selectedQr && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#020408]/98 backdrop-blur-3xl" onClick={() => setSelectedQr(null)}>
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 100 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 100 }}
               transition={{ type: "spring", damping: 25, stiffness: 120 }}
               className="bg-[#0A0D14] border border-white/[0.12] rounded-[4rem] p-12 md:p-16 max-w-2xl w-full text-center relative shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <button onClick={() => setSelectedQr(null)} className="absolute top-10 right-10 text-slate-600 hover:text-white bg-white/5 rounded-3xl p-5 transition-all hover:bg-white/10 active:scale-90 shadow-inner">
                  <X className="w-7 h-7" />
                </button>
                
                <div className="w-24 h-24 rounded-[2.5rem] bg-blue-600/10 flex items-center justify-center mx-auto mb-12 border border-blue-500/20 shadow-2xl">
                   <QrCode className="w-12 h-12 text-blue-500" />
                </div>
                
                <h3 className={`${outfit.className} text-4xl md:text-5xl font-bold text-white tracking-tight uppercase mb-4 leading-none`}>Your Receipt</h3>
                <p className="text-slate-600 text-[11px] font-bold uppercase tracking-widest mb-14 opacity-80">Order Verification Key</p>
                
                <div className="bg-white p-6 rounded-[3rem] shadow-2xl relative group mb-14">
                   <div className="w-full h-80 relative bg-white rounded-2xl overflow-hidden shadow-inner">
                      <Image src={selectedQr} alt="QR Code" fill className="object-contain p-4 transition-transform duration-1000 group-hover:scale-110" unoptimized />
                   </div>
                </div>

                <a href={selectedQr} download="order-receipt-qr.png" className="block w-full">
                   <Button className="w-full bg-white text-black h-20 rounded-[2.5rem] font-bold uppercase tracking-widest text-sm hover:bg-slate-200 shadow-2xl transition-all active:scale-95 italic border-4 border-black/5">
                      <Download className="w-6 h-6 mr-4" /> Download QR Code
                   </Button>
                </a>
                
                <p className="mt-12 text-[10px] font-bold text-slate-800 uppercase tracking-widest italic leading-relaxed max-w-sm mx-auto">
                   Do not share this QR code with anyone except the authorized delivery partner or store representative.
                </p>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
