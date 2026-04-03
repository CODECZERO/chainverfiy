"use client"

import React, { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { convertInrToUsdc } from "@/lib/exchange-rates"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  BarChart3, Package, Users, ShoppingCart, ArrowUpRight,
  ExternalLink, Copy, QrCode, Bell, Camera, Video, MapPin, Tag, Zap, Lock, Coins, Eye, Download, X, ArrowRight,
  Wallet, MessageCircle, Plus, CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle, ChevronRight, Star, Settings, BarChart2, ShieldCheck,
  Cpu, Activity, Radio, Globe
}
from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from 'next/dynamic'
import Image from "next/image"
import { getIPFSUrl } from "@/lib/image-utils"
import { CustomerManager } from "@/components/customer-manager"
import { MachineRegistry } from "@/components/dashboard/machine-registry"
import { WhatsappSetupView } from "@/components/dashboard/whatsapp-setup-view"

import { 
  getWhatsappStatus, 
  registerMachine, 
  getExchangeRates 
} from "@/lib/api-service"

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
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
  { id: "overview",     label: "Overview",        icon: BarChart2 },
  { id: "listings",     label: "My Listings",      icon: Package },
  { id: "orders",       label: "Orders",           icon: ShoppingCart },
  { id: "machines",     label: "Machine Registry", icon: Cpu },
  { id: "earnings",     label: "Earnings",         icon: Wallet },
  { id: "verification", label: "Verification Tips", icon: CheckCircle2 },
  { id: "whatsapp",     label: "WhatsApp Setup",   icon: MessageCircle },
  { id: "transparency", label: "Transparency",    icon: Globe, link: "/transparency" },
  { id: "bounties",     label: "Bounties",         icon: Coins },
  { id: "customers",    label: "Customer Manager",  icon: Users },
]

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  VERIFIED:             { label: "Verified",  cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  PENDING_VERIFICATION: { label: "Pending",   cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",     dot: "bg-amber-400" },
  FLAGGED:              { label: "Flagged",   cls: "bg-red-500/10 text-red-400 border-red-500/20",           dot: "bg-red-400" },
  PAID:                 { label: "Paid",      cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",        dot: "bg-blue-400" },
  COMPLETED:            { label: "Completed", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  DISPUTED:             { label: "Disputed",  cls: "bg-red-500/10 text-red-400 border-red-500/20",           dot: "bg-red-400" },
  SHIPPED:              { label: "Shipped",   cls: "bg-purple-500/10 text-purple-400 border-purple-500/20",  dot: "bg-purple-400" },
  ACTIVE:               { label: "Active",    cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",     dot: "bg-amber-400" },
}

export default function SellerDashboard() {
  const router = useRouter()
  const { isAuthenticated, user, isLoading: authLoading } = useSelector((s: RootState) => s.userAuth)
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])
  const [active, setActive] = useState("overview")
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [bounties, setBounties] = useState<any[]>([])
  const [stats, setStats] = useState({ active: 0, pending: 0, flagged: 0, totalSales: 0, usdcBalance: "0.0000", usdtBalance: "0.0000", xlmBalance: "0.00", usdcInr: "0", analytics: null as any })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [selectedQrProduct, setSelectedQrProduct] = useState<any>(null)
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
  const sid = user?.supplierProfile?.id

  useEffect(() => { loadAll() }, [sid])

  const loadAll = async () => {
    setLoading(true)
    try {
      if (sid) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
        const headers: Record<string, string> = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        const opts: RequestInit = { credentials: "include", headers }
        const [prodRes, ordRes, anRes, bntRes] = await Promise.all([
          fetch(`${api}/suppliers/${sid}/products`, opts),
          fetch(`${api}/donations/supplier/${sid}`, opts),
          fetch(`${api}/suppliers/${sid}/analytics`, opts),
          fetch(`${api}/bounties/supplier/${sid}`, opts)
        ])
        const prods = (await prodRes.json()).data || []
        const ords  = (await ordRes.json()).data  || []
        const analyticsData = (await anRes.json()).data || null
        const bnts  = (await bntRes.json()).data || []
        setProducts(prods)
        setOrders(ords)
        setBounties(bnts)
        const completed = ords.filter((o: any) => o.status === "COMPLETED")
        const shippedHalf = ords.filter((o: any) => o.status === "SHIPPED" || o.status === "DELIVERED")
        
        const completedUsdc = completed.reduce((s: number, o: any) => s + Number(o.priceUsdc || 0), 0)
        const shippedHalfUsdc = shippedHalf.reduce((s: number, o: any) => s + (Number(o.priceUsdc || 0) / 2), 0)
        const totalUsdc = completedUsdc + shippedHalfUsdc
        setStats({
          active:       prods.filter((p: any) => p.status === "VERIFIED").length,
          pending:      prods.filter((p: any) => p.status === "PENDING_VERIFICATION").length,
          flagged:      prods.filter((p: any) => p.status === "FLAGGED").length,
          totalSales:   completed.length,
          usdcBalance:  totalUsdc.toFixed(4),
          usdtBalance:  "0.0000",
          xlmBalance:   "0.00",
          usdcInr:      (totalUsdc * 85).toFixed(0),
          analytics:    analyticsData
        })
      }
    } catch {}
    setLoading(false)
  }

  const handleDispatch = async (orderId: string) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const res = await fetch(`${api}/orders/${orderId}/dispatch`, {
        method: "PATCH",
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        loadAll();
      }
    } catch (e) {
      console.error("Dispatch failed", e);
    }
  }

  const copyWallet = () => {
    if (user?.stellarWallet) navigator.clipboard.writeText(user.stellarWallet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "SUPPLIER") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Supplier Access Only</h1>
          <p className="text-muted-foreground mb-8">
            Please sign in as a supplier to access your dashboard and manage your listings.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button variant="outline" className="rounded-xl">Go Home</Button>
            </Link>
            <Button className="rounded-xl" onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}>
              Supplier Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#020408] text-slate-400 font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* ── Premium Sidebar ── */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 gap-3 p-6 h-full border-r border-white/[0.04] bg-[#0A0D14]/20 backdrop-blur-sm">
          {/* Supplier Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-7 shadow-3xl relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition-colors duration-700 pointer-events-none" />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl font-black text-white shadow-2xl border border-white/20 transform group-hover:scale-110 transition-transform duration-500">
                  {String(user?.supplierProfile?.name || user?.email || "S")[0].toUpperCase()}
                </div>
                {user?.supplierProfile?.isVerified && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-[3px] border-[#10141a] shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-black text-white text-base truncate tracking-tight uppercase italic">{String(user?.supplierProfile?.name || "My Shop")}</div>
                <div className="flex items-center gap-1.5 mt-1 opacity-60">
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#2775CA] font-mono">ID: {sid?.slice(0, 10)}</span>
                </div>
              </div>
            </div>

            {/* Trust Meter */}
            <div className="mt-8 space-y-2.5 relative z-10">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em]">
                <span className="text-slate-500">Reputation</span>
                <span className="text-blue-400 font-mono">{user?.supplierProfile?.trustScore ?? 0}%</span>
              </div>
              <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05] shadow-inner p-[1px]">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${user?.supplierProfile?.trustScore ?? 0}%` }}
                   transition={{ duration: 1.5, ease: "circOut" }}
                   className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-400 rounded-full relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 py-6 scrollbar-hide">
            {NAV.map((n, i) => (
              <motion.button 
                key={n.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={`w-full group flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden ${
                  active === n.id
                    ? "text-white bg-blue-600/10 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                }`}
                onClick={() => {
                  if ((n as any).link) {
                    router.push((n as any).link)
                    return
                  }
                  setActive(n.id)
                }}
              >
                {active === n.id && (
                  <motion.div layoutId="nav-glow-seller" className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent" />
                )}
                <n.icon className={`w-4 h-4 transition-all duration-500 group-hover:scale-125 ${active === n.id ? "text-blue-400 drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]" : "text-slate-600"}`} />
                <span className="relative z-10">{n.label}</span>
                
                {n.id === "listings" && stats.pending > 0 && (
                  <motion.span 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="ml-auto bg-amber-500/20 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded-lg border border-amber-500/20 shadow-lg"
                  >
                    {stats.pending}
                  </motion.span>
                )}
                {n.id === "orders" && orders.filter(o => o.status === "PAID").length > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                    {orders.filter(o => o.status === "PAID").length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Wallet Balance Widget */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="premium-card bg-[#0A0D14]/60 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-7 shadow-2xl mt-auto group hover:border-[#2775CA]/30 transition-all duration-500"
          >
            <div className="flex items-center justify-between mb-5">
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Network Vault</div>
               <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse delay-75 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
               </div>
            </div>
            <div className="space-y-1.5">
               <div className="text-3xl font-black text-white tracking-tighter flex items-end gap-2.5">
                 {String(stats.usdcBalance)} <span className="text-[10px] text-[#2775CA] uppercase tracking-widest font-mono mb-1">USDC</span>
               </div>
               <div className="text-[11px] font-black text-slate-600 tracking-[0.05em] font-mono">≈ ₹{String(stats.usdcInr)} <span className="text-emerald-500/50">INR</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-7">
              <button className="text-[9px] font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-slate-200 py-3 rounded-2xl transition-all shadow-xl active:scale-95">Withdraw</button>
              <button className="text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white py-3 rounded-2xl transition-all border border-white/5 active:scale-95">Activity</button>
            </div>
          </motion.div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar p-8">

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-8"
            >
              {active === "overview" && (
                <div className="space-y-8">
                  {/* Header Area */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                    <div>
                      <motion.h2 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-4xl font-black text-white tracking-tighter uppercase italic tracking-[-0.05em]"
                      >
                        Command <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.4)]">Center</span>
                      </motion.h2>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-blue-500" /> Real-time Node Intelligence Hub
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={loadAll} 
                        className="p-3.5 text-slate-500 hover:text-white bg-[#0A0D14]/50 border border-white/[0.06] rounded-2xl transition-all active:scale-95 shadow-xl hover:bg-white/[0.05]"
                      >
                        <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-blue-400" : ""}`} />
                      </button>
                      <Link href="/seller-dashboard/new-product">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.2em] uppercase text-[10px] rounded-2xl h-14 px-10 shadow-[0_15px_40px_rgba(37,99,235,0.25)] transition-all transform active:scale-95 border border-white/10">
                          <Plus className="w-4 h-4 mr-2" /> New Asset Entry
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* High-Impact Stat Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "Active Inventory", value: stats.active, color: "text-emerald-400", bg: "from-emerald-500/10", icon: ShieldCheck, trend: "+12.4%", glow: "shadow-emerald-500/10" },
                      { label: "Market Audit", value: stats.pending, color: "text-amber-400", bg: "from-amber-500/10", icon: Clock, trend: "-0.5%", glow: "shadow-amber-500/10" },
                      { label: "Settled Orders", value: stats.totalSales, color: "text-blue-400", bg: "from-blue-500/10", icon: Zap, trend: "+8.2%", glow: "shadow-blue-500/10" },
                      { label: "Global Yield", value: `₹${stats.usdcInr}`, color: "text-white", bg: "from-blue-600/10", icon: Coins, trend: "Stable", glow: "shadow-white/5" },
                    ].map((s, i) => (
                      <motion.div 
                        key={s.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className={`premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-7 relative overflow-hidden group shadow-2xl hover:border-white/20 transition-all duration-500 ${s.glow}`}
                      >
                         <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-700`} />
                         <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-400 group-hover:text-white transition-all duration-500 shadow-inner">
                               <s.icon className={`w-5 h-5 ${s.color} drop-shadow-[0_0_8px_currentColor]`} />
                            </div>
                            <span className={`text-[10px] font-black tracking-[0.1em] px-2 py-1 rounded-lg bg-white/[0.02] border border-white/[0.05] ${s.trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {s.trend}
                            </span>
                         </div>
                         <div className="space-y-1.5 relative z-10">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">{s.label}</div>
                            <div className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">{s.value}</div>
                         </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Main Analytics Hub */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                     {/* Revenue Performance Chart */}
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-8 premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500"
                     >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 opacity-30 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                           <div>
                              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Node Revenue Velocity</h3>
                              <div className="text-3xl font-black text-white tracking-tighter mt-1 italic uppercase tracking-[-0.03em]">Escrow Pipeline Traffic</div>
                           </div>
                           <div className="flex gap-2 p-1.5 bg-[#080B12] rounded-2xl border border-white/[0.04] shadow-inner">
                              <button className="px-6 py-2.5 text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 rounded-xl transition-all border border-blue-500/20">Daily</button>
                              <button className="px-6 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white rounded-xl transition-all">Monthly</button>
                           </div>
                        </div>
                        <div className="h-[360px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.analytics?.revenueByMonth || []}>
                                 <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="0%" stopColor="#2775CA" stopOpacity={0.5}/>
                                       <stop offset="100%" stopColor="#2775CA" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" vertical={false} />
                                 <XAxis 
                                    dataKey="name" 
                                    stroke="#334155" 
                                    fontSize={9} 
                                    fontWeight="900" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dy={15} 
                                    className="uppercase tracking-widest"
                                 />
                                 <YAxis 
                                    stroke="#334155" 
                                    fontSize={9} 
                                    fontWeight="900" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dx={-15}
                                    className="font-mono"
                                 />
                                 <RechartsTooltip 
                                    contentStyle={{backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)'}}
                                    cursor={{ stroke: '#2775CA', strokeWidth: 2, strokeDasharray: '5 5' }}
                                 />
                                 <Area type="monotone" dataKey="uv" stroke="#2775CA" strokeWidth={5} fillOpacity={1} fill="url(#revenueGrad)" />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </motion.div>

                     {/* Portfolio Distribution */}
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-4 premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden flex flex-col group hover:border-blue-500/20 transition-all duration-500"
                     >
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-10 flex items-center gap-2 italic">
                           <Globe className="w-3 h-3 text-blue-500" /> Asset Pool Density
                        </h3>
                        <div className="flex-1 relative min-h-[300px] flex items-center justify-center">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={stats.analytics?.currencyDistribution?.length > 0 ? stats.analytics.currencyDistribution : [{name: 'Empty', value: 1}]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={75}
                                    outerRadius={105}
                                    paddingAngle={12}
                                    dataKey="value"
                                    stroke="none"
                                 >
                                    {(stats.analytics?.currencyDistribution || []).map((entry: any, index: number) => (
                                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-[0_0_15px_rgba(39,117,202,0.3)]" />
                                    ))}
                                    {(!stats.analytics?.currencyDistribution || stats.analytics.currencyDistribution.length === 0) && <Cell fill="#1A1F26" />}
                                 </Pie>
                                 <RechartsTooltip contentStyle={{backgroundColor: '#0C0F17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', backdropFilter: 'blur(10px)'}} />
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Total Pool</span>
                              <span className="text-3xl font-black text-white italic tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">${stats.usdcBalance}</span>
                           </div>
                        </div>
                        <div className="mt-10 grid grid-cols-2 gap-4">
                           {(stats.analytics?.currencyDistribution || []).map((c: any, i: number) => (
                              <div key={c.name} className="flex items-center gap-4 bg-[#0C121E]/60 p-4 rounded-2xl border border-white/[0.04] shadow-inner group/item hover:border-white/10 transition-all">
                                 <div className="w-3 h-3 rounded-full shadow-[0_0_12px_currentColor] shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                 <div className="min-w-0">
                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{c.name} Pool</div>
                                    <div className="text-sm font-black text-white font-mono leading-none tracking-tight">${Number(c.value).toFixed(2)}</div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </motion.div>
                  </div>

                  {/* Secondary Insights Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                     {/* WhatsApp Integration Banner */}
                     <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="premium-card bg-gradient-to-br from-[#0D1A10] to-[#020408] border border-[#25D366]/20 rounded-[2.5rem] p-10 flex items-center gap-10 group relative overflow-hidden shadow-2xl hover:border-[#25D366]/40 transition-all duration-500"
                     >
                        <div className="absolute inset-0 bg-[#25D366]/[0.02] pointer-events-none group-hover:bg-[#25D366]/[0.05] transition-colors" />
                        <div className="w-20 h-20 bg-[#25D366]/10 rounded-3xl flex items-center justify-center shrink-0 border border-[#25D366]/20 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                           <MessageCircle className="w-10 h-10 text-[#25D366] drop-shadow-[0_0_10px_rgba(37,211,102,0.4)]" />
                        </div>
                        <div className="flex-1 min-w-0 relative z-10">
                           <h4 className="text-2xl font-black text-white tracking-tight uppercase italic tracking-[-0.03em]">Rapid Node Entry</h4>
                           <p className="text-slate-400 text-sm font-medium mt-2 leading-relaxed">Direct WhatsApp-to-Protocol bridge. Deploy physical assets to the global catalog in seconds.</p>
                           <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=NEW`} target="_blank" rel="noopener noreferrer" className="inline-block mt-6">
                              <Button variant="outline" className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20 rounded-xl h-12 px-8 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95">Open Merchant API</Button>
                           </a>
                        </div>
                     </motion.div>

                     {/* Recent Products Summary */}
                     <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500"
                     >
                        <div className="flex items-center justify-between mb-10">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 px-1 border-l-2 border-blue-500">Inventory Pulse</h3>
                           <button onClick={() => setActive("listings")} className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2">View Ledger <ArrowRight className="w-3 h-3" /></button>
                        </div>
                        <div className="space-y-4">
                           {products.slice(0, 3).map((p: any) => {
                              const s = STATUS[p.status] || STATUS.PENDING_VERIFICATION;
                              return (
                                 <Link key={p.id} href={`/product/${p.id}`} className="group/item flex items-center gap-5 bg-[#0C121E]/60 border border-white/[0.04] hover:border-blue-500/30 rounded-2xl p-4 transition-all duration-300 shadow-inner">
                                    <div className="w-14 h-14 bg-white/[0.02] rounded-xl flex items-center justify-center shrink-0 border border-white/[0.06] group-hover/item:bg-blue-600/10 group-hover/item:border-blue-500/20 transition-all duration-300 overflow-hidden relative">
                                       {p.proofMediaUrls?.[0] ? (
                                         <Image src={getIPFSUrl(p.proofMediaUrls[0])} alt="" fill className="object-cover opacity-40 group-hover/item:opacity-100 transition-all duration-700" />
                                       ) : <Package className="w-7 h-7 text-slate-600 group-hover/item:text-blue-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <div className="font-black text-base text-white truncate group-hover/item:text-blue-400 transition-colors tracking-tight uppercase italic">{p.title}</div>
                                       <div className="flex items-center gap-3 mt-1.5">
                                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${s.cls} shadow-lg`}>
                                             <div className={`w-1 h-1 rounded-full ${s.dot} animate-pulse shadow-[0_0_8px_currentColor]`} /> {s.label}
                                          </div>
                                          <span className="text-slate-800 font-black text-xs leading-none">/</span>
                                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">NODE-{p.id.slice(0, 8)}</span>
                                       </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                       <div className="text-xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">₹{Number(p.priceInr).toLocaleString()}</div>
                                       <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Settlement</div>
                                    </div>
                                 </Link>
                              );
                           })}
                           {products.length === 0 && (
                              <div className="py-12 text-center border-2 border-dashed border-white/[0.04] rounded-[2rem] bg-white/[0.01]">
                                 <Activity className="w-10 h-10 text-slate-700 mx-auto mb-4 opacity-20" />
                                 <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] italic">No real-time inventory signals detected</p>
                              </div>
                           )}
                        </div>
                     </motion.div>
                  </div>
                </div>
              )}

              {/* ── LISTINGS TAB ── */}
              {active === "listings" && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic tracking-[-0.05em]">Inventory <span className="text-blue-500">Ledger</span></h2>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                         <Package className="w-3 h-3 text-blue-500" /> Protocol Asset Registry
                      </p>
                    </div>
                    <Link href="/seller-dashboard/new-product">
                      <Button className="bg-white text-black hover:bg-slate-200 font-black tracking-[0.2em] uppercase text-[10px] rounded-2xl h-14 px-10 shadow-2xl transition-all active:scale-95 border border-white/10">
                        <Plus className="w-4 h-4 mr-2" /> Register Asset
                      </Button>
                    </Link>
                  </div>

                  {products.length === 0 ? (
                    <div className="py-32 text-center border-2 border-dashed border-white/[0.04] rounded-[4rem] bg-white/[0.01] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-500/[0.01] group-hover:bg-blue-500/[0.02] transition-colors" />
                      <Package className="w-20 h-20 text-slate-800 mx-auto mb-8 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-widest">Inventory Void</h3>
                      <p className="text-slate-600 text-xs font-black uppercase tracking-[0.4em] mt-3 leading-relaxed max-w-sm mx-auto opacity-60">No active protocol signals detected within your secure node cluster.</p>
                      <Link href="/seller-dashboard/new-product" className="inline-block mt-12 relative z-10">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.3em] uppercase text-[11px] rounded-2xl h-16 px-14 shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all transform active:scale-95 border border-white/10">
                          Deploy First Asset
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      <AnimatePresence mode="popLayout">
                        {products.map((p: any, i: number) => {
                          const s = STATUS[p.status] || STATUS.PENDING_VERIFICATION;
                          return (
                            <motion.div 
                              key={p.id}
                              layout
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ delay: i * 0.05 }}
                              className="premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] overflow-hidden group hover:border-blue-500/30 transition-all duration-500 flex flex-col h-full shadow-3xl hover:shadow-blue-500/10"
                            >
                               <div className="relative h-64 w-full group-hover:scale-105 transition-transform duration-700 overflow-hidden">
                                  {p.proofMediaUrls?.[0] ? (
                                    <Image 
                                       src={getIPFSUrl(p.proofMediaUrls[0])} 
                                       alt={p.title} 
                                       fill 
                                       className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" 
                                       unoptimized
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-white/[0.02] flex items-center justify-center">
                                       <Package className="w-16 h-16 text-slate-800" />
                                    </div>
                                  )}
                                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/60 to-transparent" />
                                  <div className={`absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest backdrop-blur-xl ${s.cls} shadow-2xl`}>
                                     <div className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse shadow-[0_0_8px_currentColor]`} /> {s.label}
                                  </div>
                               </div>
                               <div className="p-8 flex-1 flex flex-col relative z-10 -mt-10">
                                  <div className="flex-1">
                                     <h4 className="text-2xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors uppercase italic tracking-[-0.02em]">{p.title}</h4>
                                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-3 flex items-center gap-2 italic">
                                        <Radio className="w-3 h-3 text-blue-500" /> {p.condition} Protocol
                                     </p>
                                  </div>
                                  <div className="mt-8 pt-8 border-t border-white/[0.04] flex items-center justify-between">
                                     <div>
                                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Ask Yield</div>
                                        <div className="text-2xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">₹{Number(p.priceInr).toLocaleString()}</div>
                                     </div>
                                     <div className="flex gap-3">
                                        <button onClick={() => setSelectedQrProduct(p)} className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-white hover:bg-blue-600/20 transition-all active:scale-90 shadow-xl"><QrCode className="w-5 h-5" /></button>
                                        <Link href={`/product/${p.id}`} className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-500 hover:text-white hover:bg-emerald-600/20 transition-all active:scale-90 shadow-xl"><Eye className="w-5 h-5" /></Link>
                                     </div>
                                  </div>
                               </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}

              {active === "orders" && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic tracking-[-0.05em]">Transaction <span className="text-blue-500">Ledger</span></h2>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                         <Activity className="w-3 h-3 text-blue-500" /> Stellar Escrow Infrastructure
                      </p>
                    </div>
                  </div>

                  {/* Order Volume Chart */}
                  <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/[0.02] rounded-full blur-[100px] pointer-events-none" />
                     <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                        <div>
                           <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Order Velocity Velocity</h3>
                           <div className="text-3xl font-black text-white tracking-tighter mt-1 italic uppercase tracking-[-0.02em]">Global Fulfillment Traffic</div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-2.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)] animate-pulse" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Live Settlement Data</span>
                           </div>
                        </div>
                     </div>
                     <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={stats.analytics?.revenueByMonth || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" vertical={false} />
                              <XAxis dataKey="name" stroke="#334155" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} dy={15} className="uppercase tracking-widest font-mono" />
                              <YAxis stroke="#334155" fontSize={9} fontWeight="900" tickLine={false} axisLine={false} dx={-15} className="font-mono" />
                              <RechartsTooltip 
                                 contentStyle={{backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)'}}
                                 cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                              />
                              <Bar dataKey="uv" fill="#2775CA" radius={[8, 8, 0, 0]} className="drop-shadow-[0_0_15px_rgba(39,117,202,0.4)]" />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-32 text-center border-2 border-dashed border-white/[0.04] rounded-[4rem] bg-white/[0.01] relative overflow-hidden group">
                      <ShoppingCart className="w-20 h-20 text-slate-800 mx-auto mb-8 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                      <h3 className="text-3xl font-black text-white uppercase italic tracking-widest">Transaction Void</h3>
                      <p className="text-slate-600 text-xs font-black uppercase tracking-[0.4em] mt-3 leading-relaxed max-w-sm mx-auto opacity-60">Escrow channels are currently idle. No buyer signals detected.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-8">
                      <AnimatePresence mode="popLayout">
                        {orders.map((o, i) => {
                          const s = STATUS[o.status] || STATUS.PAID;
                          return (
                            <motion.div 
                              key={o.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] p-8 shadow-3xl flex flex-col xl:flex-row items-center gap-10 group hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                              
                              <div className="flex items-center gap-8 flex-1 min-w-0">
                                <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center border border-white/[0.08] shrink-0 group-hover:scale-110 transition-transform duration-700 overflow-hidden relative shadow-inner">
                                   {o.product?.proofMediaUrls?.[0] ? (
                                      <Image src={getIPFSUrl(o.product.proofMediaUrls[0])} alt="" fill className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" />
                                   ) : <Package className="w-10 h-10 text-slate-600" />}
                                </div>
                                <div className="min-w-0 space-y-3">
                                  <div className="flex flex-wrap items-center gap-4">
                                    <span className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] shadow-lg ${s.cls}`}>
                                       <div className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse shadow-[0_0_8px_currentColor] inline-block mr-2`} />
                                       {s.label}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono bg-white/[0.02] px-3 py-1.5 rounded-lg border border-white/[0.04]">TX_ID: {o.id.slice(0, 16)}</span>
                                  </div>
                                  <h3 className="text-3xl font-black text-white truncate tracking-tighter uppercase italic group-hover:text-blue-400 transition-colors">{o.product?.title || "Protocol Asset"}</h3>
                                  <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <span className="flex items-center gap-2.5 bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04] italic"><Users className="w-4 h-4 text-blue-500" /> {o.buyer?.email}</span>
                                    <span className="flex items-center gap-2.5 bg-white/[0.02] px-3 py-2 rounded-xl border border-white/[0.04] italic"><Clock className="w-4 h-4 text-slate-500" /> {new Date(o.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-center xl:items-end shrink-0 border-x border-white/[0.04] px-12 min-w-[240px]">
                                <div className="text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(39,117,202,0.3)]">{o.priceUsdc} <span className="text-sm text-blue-500 uppercase tracking-widest ml-1">USDC</span></div>
                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-2 italic">Settlement Liquidity</div>
                              </div>

                              <div className="flex flex-col gap-3 min-w-[200px]">
                                {o.status === "PAID" && (
                                  <Button onClick={() => handleDispatch(o.id)} className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl h-14 w-full shadow-[0_15px_40px_rgba(37,99,235,0.25)] transition-all transform active:scale-95 border border-white/10">
                                    Confirm Dispatch
                                  </Button>
                                )}
                                {(o.status === "SHIPPED" || o.status === "DELIVERED" || o.status === "COMPLETED") && (
                                  <div className="space-y-3">
                                     <Button disabled className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black tracking-widest uppercase text-[10px] rounded-2xl h-14 opacity-100 shadow-lg">
                                        Fulfillment Active <CheckCircle2 className="w-4 h-4 ml-3" />
                                     </Button>
                                     <div className="grid grid-cols-2 gap-3">
                                        <Button onClick={() => window.open(`/order/${o.id}/journey`, "_blank")} className="bg-white/5 hover:bg-white/10 text-white border border-white/[0.06] font-black tracking-widest uppercase text-[9px] rounded-xl h-11 transition-all active:scale-95">
                                           Node Map
                                        </Button>
                                        <Button onClick={() => window.open(`/proof/${o.id}?viewType=origin`, "_blank")} className="bg-white/5 hover:bg-white/10 text-white border border-white/[0.06] font-black tracking-widest uppercase text-[9px] rounded-xl h-11 transition-all active:scale-95">
                                           Event Log
                                        </Button>
                                     </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}

              {active === "earnings" && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-10"
                >
                  <div className="flex flex-col">
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic tracking-[-0.05em]">Settlement <span className="text-blue-500">Vault</span></h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                       <Wallet className="w-3 h-3 text-blue-500" /> On-chain Liquidity Settlement Hub
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-10">
                    {/* Main Balance Display */}
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] p-12 relative overflow-hidden group shadow-3xl"
                    >
                       <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-blue-600/20 transition-colors duration-700" />
                       <div className="relative z-10">
                          <div className="flex items-center gap-4 mb-10">
                             <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-inner">
                                <Wallet className="w-7 h-7 drop-shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                             </div>
                             <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Global Liquidity Pool</h3>
                                <div className="text-white text-[9px] font-black uppercase tracking-widest mt-1 opacity-40">Stellar Testnet Node</div>
                             </div>
                          </div>
                          
                          <div className="space-y-8">
                              <div className="flex items-center justify-between group/row">
                                 <div className="space-y-1.5">
                                    <div className="text-5xl font-black tracking-tighter tabular-nums text-white flex items-end gap-4 tracking-[-0.03em]">
                                       {stats.usdcBalance} <span className="text-[11px] font-black bg-blue-600 text-white px-3 py-1 rounded-xl mb-2 shadow-lg tracking-widest uppercase">USDC</span>
                                    </div>
                                    <div className="text-lg font-black text-slate-500 tracking-tight italic opacity-60">≈ ₹{Number(stats.usdcInr).toLocaleString()} INR</div>
                                 </div>
                                 <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/5 px-4 py-2 rounded-xl border border-blue-400/10 opacity-0 group-hover/row:opacity-100 transition-all">Verified Funds</div>
                              </div>

                              <div className="h-px bg-white/[0.04] shadow-inner" />

                              <div className="grid grid-cols-2 gap-10">
                                 <div className="space-y-2">
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">DeFi Reserve (USDT)</div>
                                    <div className="text-3xl font-black tracking-tighter tabular-nums text-slate-300 flex items-center gap-3">
                                       {stats.usdtBalance} <span className="text-[9px] font-black text-emerald-500/50">STABLE</span>
                                    </div>
                                 </div>
                                 <div className="space-y-2">
                                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Protocol Gas (XLM)</div>
                                    <div className="text-3xl font-black tracking-tighter tabular-nums text-slate-300 flex items-center gap-3">
                                       {stats.xlmBalance} <span className="text-[9px] font-black text-slate-500/50">LUMENS</span>
                                    </div>
                                 </div>
                              </div>
                           </div>

                          <div className="grid grid-cols-2 gap-6 mt-16">
                             <Button className="bg-white text-black hover:bg-slate-200 h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-95">Liquidate to Fiat</Button>
                             <Button variant="outline" className="h-16 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs border-white/[0.08] hover:bg-white/5 transition-all text-slate-400 hover:text-white">Bridge Assets</Button>
                          </div>
                       </div>
                    </motion.div>

                    {/* Network Configuration */}
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      className="premium-card bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] p-12 shadow-3xl flex flex-col justify-between group"
                    >
                       <div className="relative z-10 h-full flex flex-col">
                          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-10 flex items-center gap-3 italic">
                             <Lock className="w-4 h-4 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" /> Receiving Endpoint Status: <span className="text-emerald-500">Active</span>
                          </div>
                          {user?.stellarWallet ? (
                             <div className="space-y-10 flex-1 flex flex-col">
                                <div className="bg-[#080B12] border border-white/[0.04] rounded-[2.5rem] p-8 shadow-inner relative group/wallet overflow-hidden flex-1">
                                   <div className="absolute inset-0 bg-blue-500/[0.02] opacity-0 group-hover/wallet:opacity-100 transition-opacity" />
                                   <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 italic">Encrypted Secure Public Hash</div>
                                   <div className="font-mono text-base text-blue-300 break-all leading-relaxed tracking-wider">{user.stellarWallet}</div>
                                   <button 
                                      onClick={copyWallet}
                                      className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group-active:scale-90"
                                   >
                                      {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-slate-500" />}
                                   </button>
                                </div>
                                <div className="flex gap-4">
                                   <a href={`https://stellar.expert/explorer/testnet/account/${user.stellarWallet}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                                      <Button variant="outline" className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] border-white/[0.08] hover:bg-blue-600/10 hover:border-blue-500/30 hover:text-blue-400 transition-all">
                                         <ExternalLink className="w-4 h-4 mr-2" /> Protocol Explorer
                                      </Button>
                                   </a>
                                   <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] border-white/[0.08] hover:bg-white/5">
                                      <Settings className="w-4 h-4 mr-2" /> Node Config
                                   </Button>
                                </div>
                             </div>
                          ) : (
                             <div className="text-center py-20 bg-amber-500/[0.02] rounded-[3rem] border-2 border-dashed border-amber-500/20 flex-1 flex flex-col items-center justify-center">
                                <AlertTriangle className="w-16 h-16 text-amber-500/30 mb-8" />
                                <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em] px-12 leading-relaxed">Network Receiving endpoint not resolved.</p>
                                <Button className="mt-10 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-[0.25em] text-[10px] rounded-2xl h-14 px-12 shadow-2xl">Initialize Relay</Button>
                             </div>
                          )}
                       </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ── VERIFICATION & WHATSAPP TAB ── */}
              {active === "verification" && (
                <div className="space-y-8 text-white">
                  <div className="flex flex-col">
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase tracking-[-0.05em]">Reputation Protocol</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Proof of Authenticity Standards</p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { icon: Camera, title: "Optical Evidence", desc: "Require 3-5 high-resolution perspectives of physical markers.", color: "text-blue-400" },
                      { icon: Video, title: "Kinetic Proof", desc: "A 30-second continuous capture of the asset in-situ.", color: "text-emerald-400" },
                      { icon: MapPin, title: "Geospatial Anchor", desc: "Broadcast live GPS coordinates via encrypted WhatsApp stages.", color: "text-red-400" },
                    ].map((t, idx) => (
                      <div key={idx} className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-8 hover:border-white/[0.15] transition-all group">
                         <div className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center mb-6 border border-white/[0.06] group-hover:scale-110 transition-transform">
                            <t.icon className={`w-7 h-7 ${t.color}`} />
                         </div>
                         <h4 className="text-xl font-black tracking-tight mb-2 uppercase">{t.title}</h4>
                         <p className="text-slate-500 text-sm leading-relaxed">{t.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="premium-card bg-gradient-to-br from-[#121F14] to-[#0A0D14] border border-[#25D366]/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-12 group shadow-2xl">
                    <div className="w-32 h-32 bg-[#25D366]/10 rounded-[2.5rem] flex items-center justify-center shrink-0 border border-[#25D366]/20 group-hover:rotate-6 transition-all duration-700">
                      <MessageCircle className="w-16 h-16 text-[#25D366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-black text-[#25D366] uppercase tracking-[0.3em] mb-3">Merchant Communication Gateway</div>
                      <h3 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">WhatsApp Integration Hub</h3>
                      <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">Connect your existing communication endpoint to Pramanik API. List new inventory and broadcast stage updates directly through encrypted chat.</p>
                      <div className="flex flex-wrap gap-4 mt-10">
                        <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=NEW`} target="_blank" rel="noopener noreferrer">
                          <Button className="bg-[#25D366] hover:bg-[#1db954] text-black h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_15px_40px_rgba(37,211,102,0.2)] transform active:scale-95 transition-all">Connect Global Endpoint</Button>
                        </a>
                        <Button variant="outline" className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-xs border-white/[0.1] text-white hover:bg-white/[0.05]">Documentation</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── WHATSAPP TAB (LEGACY COMPAT) ── */}
              {active === "whatsapp" && (
                <div className="space-y-8 text-white">
                   <div className="flex flex-col">
                      <h2 className="text-3xl font-black text-white tracking-tighter uppercase tracking-[-0.05em]">Endpoint Protocol</h2>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Twilio Sandbox Configuration</p>
                   </div>
                   <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-10 shadow-2xl">
                      <div className="grid lg:grid-cols-2 gap-12">
                         <div className="space-y-8">
                            <div>
                               <h4 className="text-xl font-black tracking-tight mb-4 flex items-center gap-3"><span className="text-emerald-500">01</span> Configuration Steps</h4>
                               <div className="space-y-4">
                                  {[
                                     "Save +1 415 523 8886 as Pramanik Network",
                                     "Broadcast 'join [sandbox-keyword]' from your endpoint",
                                     "Authenticate with your Merchant ID: NEW",
                                     "Submit optical proof directly via chat"
                                  ].map((step, idx) => (
                                     <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black border border-emerald-500/20">{idx+1}</div>
                                        <span className="text-sm text-slate-300 font-medium">{step}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div className="bg-[#0C0F17] rounded-[2rem] p-8 border border-white/[0.04] shadow-inner">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-6 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500" /> Active Command Macros</h4>
                            <div className="space-y-3">
                               {[
                                  { cmd: "NEW", desc: "Initialize listing protocol" },
                                  { cmd: "STATUS", desc: "Retrieve active node telemetry" },
                                  { cmd: "HELP", desc: "Display full command manifest" },
                                  { cmd: "[IMAGE]", desc: "Push optical stage update" }
                               ].map((c, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl group hover:border-blue-500/20 transition-all">
                                     <code className="text-blue-400 font-black font-mono text-sm uppercase tracking-widest">{c.cmd}</code>
                                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c.desc}</span>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* ── BOUNTIES TAB ── */}
              {active === "bounties" && (
                <div className="space-y-8 text-white">
                  <div className="flex flex-col">
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase tracking-[-0.05em]">Community Bounties</h2>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Buyer-Initiated Proof Requests</p>
                  </div>

                  {bounties.length === 0 ? (
                    <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-20 text-center">
                      <div className="w-20 h-20 bg-white/[0.03] rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/[0.06]">
                        <Coins className="w-10 h-10 text-slate-700" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight">No Active Bounties</h3>
                      <p className="text-slate-500 text-sm mt-2">Check back later for community verification requests.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {bounties.map((b: any) => {
                        const s = STATUS[b.status] || STATUS.ACTIVE;
                        return (
                          <div key={b.id} className="premium-card bg-[#0A0D14]/60 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/30 rounded-[2.5rem] p-10 transition-all group relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
                               <div className="flex-1 min-w-0 space-y-6">
                                  <div className="flex flex-wrap items-center gap-4">
                                     <span className="text-2xl font-black uppercase tracking-tighter text-white group-hover:text-amber-500 transition-colors">{b.product?.title || "Target Asset"}</span>
                                     <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${s.cls}`}>{s.label}</span>
                                  </div>
                                  <blockquote className="border-l-4 border-amber-500/20 bg-white/[0.02] p-6 rounded-r-2xl italic text-slate-400 text-lg leading-relaxed font-medium">
                                     "{b.description}"
                                  </blockquote>
                                  <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600">
                                     <div className="flex items-center gap-2">BY <span className="text-slate-400">{b.issuer?.email}</span></div>
                                     <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}</div>
                                  </div>
                               </div>
                               <div className="shrink-0 flex flex-col items-center border-l lg:border-l-0 lg:border-t border-white/[0.04] pt-8 lg:pt-0 pl-0 lg:pl-10">
                                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 text-center min-w-[200px] mb-6">
                                     <div className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-2">Reward Pool</div>
                                     <div className="text-4xl font-black text-amber-500 font-mono tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">₹{b.amount}</div>
                                  </div>
                                  <Link href={`/product/${b.productId}`} className="w-full">
                                     <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_15px_40px_rgba(245,158,11,0.2)] active:scale-95 transition-all">
                                        Submit Fulfill Proof
                                     </Button>
                                  </Link>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── CUSTOMER MANAGER TAB ── */}
              {active === "customers" && (
                <div className="space-y-8 text-white">
                   <div className="flex flex-col">
                     <h2 className="text-3xl font-black text-white tracking-tighter uppercase tracking-[-0.05em]">Intelligence Core</h2>
                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Global Customer Relations & Logistics</p>
                   </div>
                   <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
                      <CustomerManager />
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      {/* ── ASSET QR MODAL ── */}
      <Dialog open={!!selectedQrProduct} onOpenChange={() => setSelectedQrProduct(null)}>
        <DialogContent className="sm:max-w-md bg-[#0A0D14]/95 backdrop-blur-2xl border-white/[0.08] text-white p-0 overflow-hidden rounded-[3rem] shadow-2xl">
          <div className="px-10 py-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-8 border border-blue-500/20">
               <QrCode className="w-10 h-10 text-blue-500" />
            </div>

            <div className="space-y-2 mb-10">
               <DialogTitle className="text-3xl font-black tracking-tighter uppercase">Physical Asset Link</DialogTitle>
               <DialogDescription className="text-slate-500 font-bold text-[11px] uppercase tracking-widest">
                  Secure cryptographic anchor to product journey
               </DialogDescription>
            </div>

            <div className="relative group p-8 bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl transition-all duration-700 hover:scale-[1.02] hover:bg-white/[0.08] mb-10">
               <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />
               {selectedQrProduct?.qrCodeUrl ? (
                 <div className="w-64 h-64 relative bg-white p-3 rounded-2xl group-hover:scale-110 transition-transform duration-700">
                   <Image 
                     src={getIPFSUrl(selectedQrProduct.qrCodeUrl)} 
                     alt="Product QR" 
                     fill 
                     className="object-contain" 
                     unoptimized
                   />
                 </div>
               ) : (
                 <div className="w-64 h-64 flex flex-col items-center justify-center bg-white/5 rounded-2xl border-2 border-dashed border-white/10">
                   <AlertTriangle className="w-10 h-10 text-slate-700 mb-4" />
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Key not generated</p>
                 </div>
               )}
            </div>

            <div className="w-full space-y-6">
               <div className="bg-[#0C0F17] border border-white/[0.04] rounded-[2rem] p-6 text-left shadow-inner">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Asset Metadata</p>
                  <p className="text-lg font-black text-white tracking-tight uppercase truncate">{selectedQrProduct?.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                     <span className="text-[10px] font-mono text-blue-500 uppercase font-black bg-blue-500/5 px-2 py-0.5 rounded-lg border border-blue-500/20">Node ID</span>
                     <span className="text-[10px] font-mono text-slate-500 font-black">{selectedQrProduct?.id}</span>
                  </div>
               </div>

               <div className="flex gap-4">
                  <a href={selectedQrProduct?.qrCodeUrl} download={`pramanik-qr-${selectedQrProduct?.id}.png`} className="flex-2">
                     <Button className="w-full bg-white text-black h-16 px-10 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all flex items-center gap-3 active:scale-95">
                        <Download className="w-5 h-5" /> Download Key
                     </Button>
                  </a>
                  <Button onClick={() => setSelectedQrProduct(null)} variant="outline" className="flex-1 h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs border-white/[0.1] text-white hover:bg-white/[0.05] transition-all">
                     Close
                  </Button>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
