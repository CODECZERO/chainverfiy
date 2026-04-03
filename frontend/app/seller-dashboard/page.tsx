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
  BarChart3, Package, User, Users, ShoppingCart, ArrowUpRight,
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
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

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

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

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
  const [stats, setStats] = useState({ 
    active: 0, 
    pending: 0, 
    flagged: 0, 
    totalSales: 0, 
    usdcBalance: "0.0000", 
    usdtBalance: "0.0000", 
    xlmBalance: "0.00", 
    usdcInr: "0", 
    withdrawableInr: 0, 
    totalEarningsInr: 0, 
    pendingEarningsInr: 0,
    analytics: null as any 
  })
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
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
        const withdrawableUsdc = ords.filter((o: any) => o.status === "COMPLETED" || o.status === "DELIVERED").reduce((s: number, o: any) => s + Number(o.priceUsdc || 0), 0)
        const pendingUsdc = ords.filter((o: any) => o.status === "PAID" || o.status === "SHIPPED").reduce((s: number, o: any) => s + Number(o.priceUsdc || 0), 0)

        setStats({
          active:       prods.filter((p: any) => p.status === "VERIFIED").length,
          pending:      prods.filter((p: any) => p.status === "PENDING_VERIFICATION").length,
          flagged:      prods.filter((p: any) => p.status === "FLAGGED").length,
          totalSales:   completed.length,
          usdcBalance:  totalUsdc.toFixed(4),
          usdtBalance:  "0.0000",
          xlmBalance:   "0.00",
          usdcInr:      (totalUsdc * 85).toFixed(0),
          withdrawableInr: Number((withdrawableUsdc * 85).toFixed(0)),
          totalEarningsInr: Number(((withdrawableUsdc + pendingUsdc) * 85).toFixed(0)),
          pendingEarningsInr: Number((pendingUsdc * 85).toFixed(0)),
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
  };

  const copyWallet = () => {
    if (user?.stellarWallet) {
      navigator.clipboard.writeText(user.stellarWallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      loadAll();
    }, 2000);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#030408] text-white flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin shadow-[0_0_30px_rgba(37,99,235,0.4)]" />
      </div>
    )
  }

  if (!user || user.role !== "SUPPLIER") {
    return (
      <div className="min-h-screen bg-[#030408] flex items-center justify-center p-8">
        <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3rem] p-12 text-center max-w-md shadow-3xl">
          <div className="w-20 h-20 bg-red-600/10 rounded-[2.5rem] flex items-center justify-center border border-red-500/20 mx-auto mb-8">
             <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className={`${outfit.className} text-3xl font-black text-white uppercase italic mb-4`}>Unauthorized Access</h2>
          <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em] mb-10 leading-relaxed italic">Supplier clearance required for this terminal node.</p>
          <Button onClick={() => router.push('/')} className="bg-white text-black h-16 w-full rounded-2xl font-black uppercase tracking-widest text-xs">Return to Surface</Button>
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
          {/* Merchant Identity Node */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-7 shadow-3xl relative overflow-hidden group"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="relative">
                <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-[0_10px_40px_rgba(37,99,235,0.35)] border border-white/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                  {String(user?.supplierProfile?.name || user?.email || "S")[0].toUpperCase()}
                </div>
                {user?.supplierProfile?.isVerified && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-[3px] border-[#030408] shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  >
                    <ShieldCheck className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </div>
              <div className="min-w-0">
                <div className={`${outfit.className} font-black text-white text-base truncate tracking-tight uppercase italic`}>{String(user?.supplierProfile?.name || "My Shop")}</div>
                <div className="flex items-center gap-1.5 mt-1.5 text-blue-400 font-black text-[8px] uppercase tracking-[0.25em] italic">
                   <ShieldCheck className="w-3 h-3" /> Merchant Authority
                </div>
              </div>
            </div>

            {/* Reputation Metric */}
            <div className="mt-8 space-y-3 relative z-10">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em]">
                <span className="text-slate-500">Reputation</span>
                <span className="text-blue-400 font-mono italic">{user?.supplierProfile?.trustScore ?? 0}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05] shadow-inner">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${user?.supplierProfile?.trustScore ?? 0}%` }}
                   transition={{ duration: 1.5, ease: "circOut" }}
                   className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Navigation Matrix */}
          <nav className="flex-1 overflow-y-auto pr-2 space-y-3 mt-4 scrollbar-hide">
            <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-4 ml-4 italic opacity-80">Command Matrix</div>
            {NAV.map((n, i) => (
              <motion.button 
                key={n.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`w-full group flex items-center gap-5 px-7 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all relative overflow-hidden italic ${
                  active === n.id
                    ? "text-white bg-blue-600/10 border border-blue-500/20 shadow-[0_0_50px_rgba(37,99,235,0.08)]"
                    : "text-slate-600 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
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
                  <motion.div layoutId="seller-nav-glow" className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent" />
                )}
                <n.icon className={`w-5 h-5 transition-all duration-700 group-hover:scale-125 ${active === n.id ? "text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]" : "text-slate-800"}`} />
                <span className="relative z-10">{n.label}</span>
                
                {n.id === "listings" && stats.pending > 0 && (
                  <span className="ml-auto bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1.5 rounded-xl border border-amber-500/20 animate-pulse shadow-lg">{stats.pending}</span>
                )}
                {n.id === "orders" && orders.filter(o => o.status === "PAID").length > 0 && (
                  <span className="ml-auto bg-blue-500 text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                    {orders.filter(o => o.status === "PAID").length}
                  </span>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Intelligence Reservoir */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-premium bg-[#0A0D14]/60 border border-white/[0.08] rounded-[2.5rem] p-8 shadow-3xl mt-auto relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
               <Activity className="w-16 h-16 text-emerald-400 rotate-12" />
            </div>
            <div className="flex items-center justify-between mb-5 relative z-10">
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Net Equity Hub</div>
               <div className="flex gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-75 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
               </div>
            </div>
            <div className="space-y-2 relative z-10">
               <div className={`${outfit.className} text-3xl font-black text-white tracking-tighter flex items-end gap-3 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]`}>
                 {String(stats.usdcBalance)} <span className="text-[11px] text-blue-500 font-black uppercase tracking-widest italic mb-1.5 opacity-80">USDC</span>
               </div>
               <div className="text-[12px] font-black text-slate-700 tracking-widest italic uppercase">≈ ₹{String(stats.usdcInr)} <span className="text-emerald-500/40">INR</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
              <button className={`${outfit.className} text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-slate-200 py-3.5 rounded-2xl transition-all shadow-xl active:scale-95 italic border-2 border-black/5`}>Withdraw</button>
              <button className={`${outfit.className} text-[10px] font-black uppercase tracking-widest bg-white/5 text-slate-500 hover:bg-white/10 hover:text-white py-3.5 rounded-2xl transition-all border border-white/5 active:scale-95 italic`}>Activity</button>
            </div>
          </motion.div>
        </aside>

        {/* ── Intelligence Deck ── */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar p-6 md:p-12 relative">
           {/* Mobile Navigation Matrix */}
           <div className="lg:hidden flex overflow-x-auto gap-4 pb-8 mb-4 scrollbar-hide no-scrollbar -mx-2 px-2">
             {NAV.map((n) => (
               <button
                 key={n.id}
                 onClick={() => {
                   if ((n as any).link) {
                     router.push((n as any).link)
                     return
                   }
                   setActive(n.id)
                 }}
                 className={`flex-none flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all ${
                   active === n.id 
                     ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                     : "bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-slate-300"
                 }`}
               >
                 <n.icon className="w-4 h-4" />
                 {n.label}
               </button>
             ))}
           </div>

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
                <div className="space-y-12">
                  {/* Institutional Header Area */}
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-16">
                    <div>
                      <motion.h2 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${outfit.className} text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic tracking-[-0.05em] drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]`}
                      >
                        Intelligence <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.4)]">Hub</span>
                      </motion.h2>
                      <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3 italic">
                        <Activity className="w-4 h-4 text-blue-500 animate-pulse" /> Real-time Protocol Network Telemetry
                      </p>
                    </div>
                    <div className="flex gap-5">
                      <button 
                        onClick={loadAll} 
                        className="p-4 text-slate-500 hover:text-white bg-[#0A0D14]/60 border border-white/[0.08] rounded-[1.5rem] transition-all active:scale-90 shadow-2xl hover:bg-white/[0.05] group"
                      >
                        <RefreshCw className={`w-6 h-6 ${loading ? "animate-spin text-blue-400" : "group-hover:rotate-180"} transition-transform duration-700`} />
                      </button>
                      <Link href="/seller-dashboard/new-product">
                        <Button className={`${outfit.className} bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.25em] uppercase text-[10px] md:text-[11px] rounded-[1.25rem] md:rounded-[1.5rem] h-12 md:h-16 px-6 md:px-12 shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all transform active:scale-95 border border-white/10 italic`}>
                          <Plus className="w-5 h-5 mr-2 md:mr-3" /> New Asset Entry
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* High-Impact Institutional Stat Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
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
                        className={`glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 relative overflow-hidden group shadow-3xl hover:border-white/20 transition-all duration-500 ${s.glow}`}
                      >
                         <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-700`} />
                         <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-slate-400 group-hover:text-white transition-all duration-500 shadow-inner">
                               <s.icon className={`w-5 h-5 md:w-6 md:h-6 ${s.color} drop-shadow-[0_0_10px_currentColor]`} />
                            </div>
                            <span className={`text-[8px] md:text-[10px] font-black tracking-[0.15em] px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-white/[0.04] border border-white/[0.08] ${s.trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-600'}`}>
                              {s.trend}
                            </span>
                         </div>
                         <div className="space-y-2 relative z-10">
                            <div className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">{s.label}</div>
                            <div className={`${outfit.className} text-3xl md:text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_25px_rgba(255,255,255,0.15)] italic leading-none`}>{s.value}</div>
                         </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Main Intelligence Reservoir */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                     {/* Revenue Performance Chart */}
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-8 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3.5rem] p-12 shadow-3xl relative overflow-hidden group"
                     >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 opacity-20 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12 md:mb-16">
                           <div>
                              <h3 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Node Revenue Velocity</h3>
                              <div className={`${outfit.className} text-2xl md:text-4xl font-black text-white tracking-tighter mt-2 italic uppercase tracking-[-0.03em] drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]`}>Escrow Pipeline Traffic</div>
                           </div>
                           <div className="flex gap-2 p-2 bg-[#080B12] rounded-[1.25rem] border border-white/[0.06] shadow-inner">
                              <button className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-400/10 rounded-xl transition-all border border-blue-500/20 italic">Daily</button>
                              <button className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white rounded-xl transition-all italic">Monthly</button>
                           </div>
                        </div>
                        <div className="h-[400px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={stats.analytics?.revenueByMonth || []}>
                                 <defs>
                                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                       <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                 <XAxis 
                                    dataKey="name" 
                                    stroke="#334155" 
                                    fontSize={10} 
                                    fontWeight="900" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dy={15} 
                                    className="uppercase tracking-[0.2em] font-mono italic"
                                 />
                                 <YAxis 
                                    stroke="#334155" 
                                    fontSize={10} 
                                    fontWeight="900" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    dx={-15}
                                    className="font-mono italic"
                                 />
                                 <RechartsTooltip 
                                    contentStyle={{backgroundColor: 'rgba(10, 13, 20, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)'}}
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '6 6' }}
                                 />
                                 <Area type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#revenueGrad)" />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </motion.div>

                     {/* Portfolio Node Density */}
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-4 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-3xl relative overflow-hidden flex flex-col group"
                     >
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12 flex items-center gap-3 italic">
                           <Globe className="w-4 h-4 text-blue-500 animate-spin-slow" /> Asset Pool Density
                        </h3>
                        <div className="flex-1 relative min-h-[300px] flex items-center justify-center">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={stats.analytics?.currencyDistribution?.length > 0 ? stats.analytics.currencyDistribution : [{name: 'Empty', value: 1}]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={85}
                                    outerRadius={120}
                                    paddingAngle={15}
                                    dataKey="value"
                                    stroke="none"
                                 >
                                    {(stats.analytics?.currencyDistribution || []).map((entry: any, index: number) => (
                                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]" />
                                    ))}
                                    {(!stats.analytics?.currencyDistribution || stats.analytics.currencyDistribution.length === 0) && <Cell fill="#161b22" />}
                                 </Pie>
                                 <RechartsTooltip contentStyle={{backgroundColor: 'rgba(12, 15, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', backdropFilter: 'blur(20px)'}} />
                              </PieChart>
                           </ResponsiveContainer>
                           <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-5">
                              <span className="text-[11px] font-black text-slate-700 uppercase tracking-[0.3em] mb-2 italic">Total Pool</span>
                              <span className={`${outfit.className} text-4xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.25)]`}>${stats.usdcBalance}</span>
                           </div>
                        </div>
                        <div className="mt-12 grid grid-cols-2 gap-5">
                           {(stats.analytics?.currencyDistribution || []).map((c: any, i: number) => (
                              <div key={c.name} className="flex items-center gap-4 bg-[#0C121E]/60 p-5 rounded-2xl border border-white/[0.04] shadow-inner group/item hover:border-blue-500/20 transition-all duration-500">
                                 <div className="w-3.5 h-3.5 rounded-full shadow-[0_0_15px_currentColor] shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                 <div className="min-w-0">
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none mb-2 italic">{c.name} Pool</div>
                                    <div className="text-base font-black text-white font-mono leading-none tracking-tight">${Number(c.value).toFixed(2)}</div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </motion.div>
                  </div>

                  {/* Secondary Intelligence Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                     {/* WhatsApp Protocol Bridge */}
                     <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="glass-premium bg-gradient-to-br from-[#0D1A10]/60 to-[#030408]/80 border border-[#25D366]/20 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 flex flex-col sm:flex-row items-center gap-8 md:gap-12 group relative overflow-hidden shadow-3xl hover:border-[#25D366]/40 transition-all duration-700"
                     >
                        <div className="absolute inset-0 bg-[#25D366]/[0.02] pointer-events-none group-hover:bg-[#25D366]/[0.05] transition-colors" />
                        <div className="w-24 h-24 bg-[#25D366]/10 rounded-[2rem] flex items-center justify-center shrink-0 border border-[#25D366]/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl relative overflow-hidden">
                           <div className="absolute inset-0 bg-[#25D366]/10 animate-pulse" />
                           <MessageCircle className="w-12 h-12 text-[#25D366] drop-shadow-[0_0_15px_rgba(37,211,102,0.6)] relative z-10" />
                        </div>
                        <div className="flex-1 min-w-0 relative z-10 text-center sm:text-left">
                           <h4 className={`${outfit.className} text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic tracking-[-0.03em]`}>Rapid Node <span className="text-[#25D366]">Entry</span></h4>
                           <p className="text-slate-400 text-[13px] font-medium mt-3 leading-relaxed opacity-70">Direct WhatsApp-to-Protocol bridge. Deploy physical assets to the global catalog in seconds via encrypted telemetry.</p>
                           <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=NEW`} target="_blank" rel="noopener noreferrer" className="inline-block mt-8">
                              <Button variant="outline" className={`${outfit.className} bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20 rounded-2xl h-14 px-10 text-[10px] font-black uppercase tracking-[0.25em] shadow-2xl transition-all active:scale-95 italic`}>Open Merchant API</Button>
                           </a>
                        </div>
                     </motion.div>

                     {/* Inventory Pulse Summary */}
                     <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                        className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 shadow-3xl relative overflow-hidden group"
                     >
                        <div className="flex items-center justify-between mb-12">
                           <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 px-3 border-l-2 border-blue-500 italic">Inventory Pulse</h3>
                           <button onClick={() => setActive("listings")} className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-3 italic group/btn">
                              View Ledger <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                           </button>
                        </div>
                        <div className="space-y-5">
                           {products.slice(0, 3).map((p: any) => {
                              const s = STATUS[p.status] || STATUS.PENDING_VERIFICATION;
                              return (
                                 <Link key={p.id} href={`/product/${p.id}`} className="group/item flex items-center gap-6 bg-[#0C121E]/40 border border-white/[0.04] hover:border-blue-500/30 rounded-3xl p-5 transition-all duration-500 shadow-inner overflow-hidden relative">
                                    <div className="absolute inset-0 bg-blue-600/[0.02] opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                    <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center shrink-0 border border-white/[0.08] group-hover/item:bg-blue-600/10 group-hover/item:border-blue-500/30 transition-all duration-500 overflow-hidden relative shadow-2xl">
                                       {p.proofMediaUrls?.[0] ? (
                                         <Image src={getIPFSUrl(p.proofMediaUrls[0])} alt="" fill className="object-cover opacity-50 group-hover/item:opacity-100 transition-all duration-1000 scale-110 group-hover/item:scale-100" />
                                       ) : <Package className="w-8 h-8 text-slate-700 group-hover/item:text-blue-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0 relative z-10">
                                       <div className={`${outfit.className} font-black text-base md:text-lg text-white truncate group-hover/item:text-blue-400 transition-colors tracking-tight uppercase italic`}>{p.title}</div>
                                       <div className="flex items-center gap-4 mt-2">
                                          <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${s.cls} shadow-lg backdrop-blur-md italic`}>
                                             <div className={`w-1.5 h-1.5 rounded-full ${s.dot} animate-pulse shadow-[0_0_10px_currentColor]`} /> {s.label}
                                          </div>
                                          <span className="text-slate-800 font-black text-xs opacity-50 italic">/</span>
                                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em] font-mono italic opacity-60">NODE-{p.id.slice(0, 8)}</span>
                                       </div>
                                    </div>
                                    <div className="text-right shrink-0 relative z-10">
                                       <div className={`${outfit.className} text-xl md:text-2xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] italic`}>₹{Number(p.priceInr).toLocaleString()}</div>
                                       <div className="text-[9px] font-black text-slate-700 uppercase tracking-[0.25em] mt-1.5 italic opacity-60">Settlement</div>
                                    </div>
                                 </Link>
                              );
                           })}
                           {products.length === 0 && (
                              <div className="py-16 text-center border-2 border-dashed border-white/[0.04] rounded-[2.5rem] bg-white/[0.01] group-hover:border-white/[0.08] transition-colors">
                                 <Activity className="w-12 h-12 text-slate-800 mx-auto mb-5 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                                 <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.4em] italic opacity-60">No real-time inventory signals detected</p>
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
                  className="space-y-12"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div>
                      <h2 className={`${outfit.className} text-5xl font-black text-white tracking-tighter uppercase italic tracking-[-0.05em]`}>Inventory <span className="text-blue-500">Ledger</span></h2>
                      <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3 italic">
                         <Package className="w-4 h-4 text-blue-500" /> Secure Protocol Asset Registry
                      </p>
                    </div>
                    <Link href="/seller-dashboard/new-product">
                      <Button className={`${outfit.className} bg-white text-black hover:bg-slate-200 font-black tracking-[0.25em] uppercase text-[11px] rounded-[1.5rem] h-16 px-12 shadow-3xl transition-all active:scale-95 border-2 border-transparent italic`}>
                        <Plus className="w-5 h-5 mr-3" /> Register New Asset
                      </Button>
                    </Link>
                  </div>

                  {products.length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-white/[0.08] rounded-[4rem] bg-white/[0.01] relative overflow-hidden group shadow-inner">
                      <div className="absolute inset-0 bg-blue-500/[0.02] group-hover:bg-blue-500/[0.04] transition-colors duration-1000" />
                      <Package className="w-24 h-24 text-slate-800 mx-auto mb-8 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000" />
                      <h3 className={`${outfit.className} text-4xl font-black text-white uppercase italic tracking-widest opacity-80`}>Inventory Void</h3>
                      <p className="text-slate-600 text-[13px] font-black uppercase tracking-[0.4em] mt-5 leading-relaxed max-w-md mx-auto opacity-60 italic">No active protocol signals detected within your secure node cluster legacy.</p>
                      <Link href="/seller-dashboard/new-product" className="inline-block mt-16 relative z-10">
                        <Button className={`${outfit.className} bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.3em] uppercase text-[12px] rounded-2xl h-18 px-16 shadow-[0_25px_60px_rgba(37,99,235,0.4)] transition-all transform active:scale-95 border border-white/10 italic`}>
                          Deploy First Asset
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                      <AnimatePresence mode="popLayout">
                        {products.map((p: any, i: number) => {
                           const s = STATUS[p.status] || STATUS.PENDING_VERIFICATION;
                           return (
                             <motion.div 
                               key={p.id}
                               layout
                               initial={{ opacity: 0, scale: 0.95 }}
                               animate={{ opacity: 1, scale: 1 }}
                               exit={{ opacity: 0, scale: 0.95 }}
                               transition={{ delay: i * 0.05 }}
                               className="glass-premium bg-[#0A0D14]/80 border border-white/[0.1] rounded-[3rem] overflow-hidden group hover:border-blue-500/40 transition-all duration-700 flex flex-col h-full shadow-3xl hover:shadow-blue-500/20 relative"
                             >
                                <div className="relative h-72 w-full group-hover:scale-110 transition-transform duration-1000 overflow-hidden">
                                   {p.proofMediaUrls?.[0] ? (
                                     <Image 
                                        src={getIPFSUrl(p.proofMediaUrls[0])} 
                                        alt={p.title} 
                                        fill 
                                        className="object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-1000 scale-110 group-hover:scale-100" 
                                        unoptimized
                                     />
                                   ) : (
                                     <div className="w-full h-full bg-white/[0.02] flex items-center justify-center">
                                        <Package className="w-20 h-20 text-slate-800" />
                                     </div>
                                   )}
                                   <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/70 to-transparent" />
                                   <div className={`absolute top-8 right-8 flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-2xl ${s.cls} shadow-2xl italic`}>
                                      <div className={`w-2 h-2 rounded-full ${s.dot} animate-pulse shadow-[0_0_12px_currentColor]`} /> {s.label}
                                   </div>
                                </div>
                                <div className="p-10 flex-1 flex flex-col relative z-10 -mt-16">
                                   <div className="flex-1">
                                      <h4 className={`${outfit.className} text-3xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors uppercase italic tracking-[-0.03em]`}>{p.title}</h4>
                                      <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-4 flex items-center gap-3 italic opacity-70">
                                         <Radio className="w-4 h-4 text-blue-400 animate-pulse" /> {p.condition} Protocol
                                      </p>
                                   </div>
                                   <div className="mt-10 pt-10 border-t border-white/[0.06] flex items-center justify-between">
                                      <div>
                                         <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none mb-3">Ask Yield</div>
                                         <div className={`${outfit.className} text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] italic`}>₹{Number(p.priceInr).toLocaleString()}</div>
                                      </div>
                                      <div className="flex gap-4">
                                         <button onClick={() => setSelectedQrProduct(p)} className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:bg-blue-600/30 transition-all active:scale-90 shadow-2xl hover:scale-110 duration-500"><QrCode className="w-6 h-6 shadow-[0_0_15px_rgba(37,99,235,0.4)]" /></button>
                                         <Link href={`/product/${p.id}`} className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:bg-emerald-600/30 transition-all active:scale-90 shadow-2xl hover:scale-110 duration-500"><Eye className="w-6 h-6 shadow-[0_0_15px_rgba(16,185,129,0.4)]" /></Link>
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
                  className="space-y-12"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div>
                      <h2 className={`${outfit.className} text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic tracking-[-0.05em]`}>Transaction <span className="text-blue-500">Ledger</span></h2>
                      <p className="text-slate-500 text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3 italic">
                         <Activity className="w-4 h-4 text-blue-500 animate-pulse" /> Stellar Escrow Infrastructure Telemetry
                      </p>
                    </div>
                  </div>

                  {/* Order Volume Chart */}
                  <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3.5rem] p-12 shadow-3xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/[0.05] rounded-full blur-[120px] pointer-events-none" />
                     <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-16">
                        <div>
                           <h3 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Order Velocity Magnitude</h3>
                           <div className={`${outfit.className} text-2xl md:text-4xl font-black text-white tracking-tighter mt-2 italic uppercase tracking-[-0.02em] drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]`}>Global Fulfillment Traffic</div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="flex items-center gap-4 bg-[#080B12] px-6 py-3 rounded-2xl border border-white/[0.06] shadow-inner">
                              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic font-mono">Live Settlement Data</span>
                           </div>
                        </div>
                     </div>
                     <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={stats.analytics?.revenueByMonth || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                              <XAxis dataKey="name" stroke="#334155" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dy={15} className="uppercase tracking-[0.2em] font-mono italic" />
                              <YAxis stroke="#334155" fontSize={10} fontWeight="900" tickLine={false} axisLine={false} dx={-15} className="font-mono italic" />
                              <RechartsTooltip 
                                 contentStyle={{backgroundColor: 'rgba(10, 13, 20, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)'}}
                                 cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                              />
                              <Bar dataKey="uv" fill="#3b82f6" radius={[12, 12, 0, 0]} className="drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-40 text-center border-2 border-dashed border-white/[0.08] rounded-[4rem] bg-white/[0.01] relative overflow-hidden group shadow-inner">
                      <div className="absolute inset-0 bg-blue-500/[0.02] group-hover:bg-blue-500/[0.04] transition-colors duration-1000" />
                      <ShoppingCart className="w-24 h-24 text-slate-800 mx-auto mb-8 opacity-20 group-hover:scale-110 transition-transform duration-1000" />
                      <h3 className={`${outfit.className} text-4xl font-black text-white uppercase italic tracking-widest opacity-80`}>Transaction Void</h3>
                      <p className="text-slate-600 text-[13px] font-black uppercase tracking-[0.4em] mt-5 leading-relaxed max-w-md mx-auto opacity-60 italic">Escrow channels are currently idle. No buyer signals detected on the protocol layer.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-10">
                      <AnimatePresence mode="popLayout">
                        {orders.map((o, i) => {
                          const s = STATUS[o.status] || STATUS.PAID;
                          return (
                            <motion.div 
                              key={o.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3.5rem] p-10 shadow-3xl flex flex-col xl:flex-row items-center gap-12 group hover:border-blue-500/40 transition-all duration-700 relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                              
                              <div className="flex items-center gap-10 flex-1 min-w-0">
                                <div className="w-28 h-28 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center border border-white/[0.08] shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000 overflow-hidden relative shadow-2xl">
                                   {o.product?.proofMediaUrls?.[0] ? (
                                      <Image src={getIPFSUrl(o.product.proofMediaUrls[0])} alt="" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-1000 scale-110 group-hover:scale-100" />
                                   ) : <Package className="w-12 h-12 text-slate-700" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-5 mb-3">
                                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] font-mono italic opacity-60">TXN-{o.id.slice(0, 10)}</span>
                                      <span className="text-slate-800 font-black text-xs opacity-50">/</span>
                                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic opacity-60">{new Date(o.createdAt).toLocaleDateString()}</span>
                                   </div>
                                   <h4 className={`${outfit.className} text-xl md:text-3xl font-black text-white tracking-tighter group-hover:text-blue-400 transition-colors uppercase italic tracking-[-0.03em] leading-none`}>{o.product?.title || 'Protocol Asset'}</h4>
                                   <div className="flex items-center gap-6 mt-5">
                                      <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-2xl ${s.cls} shadow-2xl italic`}>
                                         <div className={`w-2 h-2 rounded-full ${s.dot} shadow-[0_0_12px_currentColor]`} /> {s.label}
                                      </div>
                                      <div className="flex items-center gap-3 bg-white/[0.03] px-5 py-2 rounded-2xl border border-white/[0.06]">
                                         <User className="w-4 h-4 text-blue-400" />
                                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Node: {o.buyer?.walletAddress?.slice(0, 6)}...{o.buyer?.walletAddress?.slice(-4)}</span>
                                      </div>
                                   </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-12 w-full xl:w-auto shrink-0 pt-10 xl:pt-0 border-t xl:border-t-0 xl:border-l border-white/[0.06] xl:pl-12">
                                <div className="text-center md:text-right">
                                   <div className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none mb-3">Escrow Value</div>
                                   <div className={`${outfit.className} text-3xl md:text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] italic`}>₹{Number(o.totalPriceInr).toLocaleString()}</div>
                                </div>
                                <Link href={`/product/${o.product?.id}`} className="w-14 h-14 md:w-18 md:h-18 rounded-[1.25rem] md:rounded-[1.5rem] bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white hover:bg-blue-600/30 transition-all active:scale-90 shadow-2xl hover:scale-110 duration-500 group/btn">
                                   <ArrowRight className="w-6 h-6 md:w-8 md:h-8 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
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
                  className="space-y-12"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div>
                      <h2 className={`${outfit.className} text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic tracking-[-0.05em]`}>Yield <span className="text-blue-500">Vault</span></h2>
                      <p className="text-slate-500 text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] mt-3 flex items-center gap-3 italic">
                         <Coins className="w-4 h-4 text-blue-500 animate-pulse" /> Protocol Liquidity & Net Equity
                      </p>
                    </div>
                    {/* Institutional Settle Action */}
                    <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-6 pr-8 flex flex-col sm:flex-row items-center gap-6 md:gap-10 shadow-3xl w-full md:w-auto">
                       <div className="flex items-center gap-6 w-full sm:w-auto justify-center sm:justify-start border-b sm:border-b-0 sm:border-r border-white/[0.06] pb-6 sm:pb-0 sm:pr-10">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.25rem] md:rounded-[1.5rem] bg-blue-600/10 flex items-center justify-center border border-blue-500/20 shadow-2xl shrink-0">
                             <Zap className="w-6 h-6 md:w-7 md:h-7 text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                          </div>
                          <div>
                             <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono italic">Maturity Yield</div>
                             <div className={`${outfit.className} text-2xl md:text-3xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>₹{Number(stats.withdrawableInr).toLocaleString()}</div>
                          </div>
                       </div>
                       <Button 
                          onClick={handleWithdraw}
                          disabled={withdrawing || Number(stats.withdrawableInr) <= 0}
                          className={`${outfit.className} bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.25em] uppercase text-[10px] md:text-[11px] rounded-[1.25rem] h-14 md:h-16 px-8 md:px-12 shadow-[0_20px_50px_rgba(37,99,235,0.35)] transition-all transform active:scale-90 disabled:opacity-20 italic border border-white/10 w-full sm:w-auto`}
                       >
                          {withdrawing ? "SYCHRONIZING..." : "Execute Settle"}
                       </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                     {/* Aggregate Capital Intelligence */}
                     <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-12 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 shadow-3xl relative overflow-hidden group"
                     >
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[120px] pointer-events-none group-hover:bg-blue-600/[0.06] transition-colors duration-1000" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-16 relative z-10">
                           <div className="space-y-4 border-b lg:border-b-0 lg:border-r border-white/[0.06] pb-10 lg:pb-0 lg:pr-16 text-center lg:text-left">
                              <div className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] italic mb-4 md:mb-6">Total Net Protocol Equity</div>
                              <div className={`${outfit.className} text-5xl md:text-7xl font-black text-white tracking-tighter italic drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] leading-none`}>₹{Number(stats.totalEarningsInr).toLocaleString()}</div>
                              <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
                                 <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+14.2%</span>
                                 </div>
                                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Institutional Grade Efficiency</span>
                              </div>
                           </div>
                           <div className="space-y-8 px-8">
                              <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Pending Node Validations</span>
                                    <span className={`${outfit.className} text-xl font-black text-amber-500 italic`}>₹{Number(stats.pendingEarningsInr).toLocaleString()}</span>
                                 </div>
                                 <div className="w-full h-3 bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.06] p-0.5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Unlocked Settlement Liquidity</span>
                                    <span className={`${outfit.className} text-xl font-black text-blue-500 italic`}>₹{Number(stats.totalEarningsInr - stats.pendingEarningsInr).toLocaleString()}</span>
                                 </div>
                                 <div className="w-full h-3 bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.06] p-0.5">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} className="h-full bg-gradient-to-r from-blue-700 to-blue-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                 </div>
                              </div>
                           </div>
                           <div className="bg-[#080B12]/80 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-10 border border-white/[0.08] shadow-2xl flex flex-col items-center justify-center text-center relative group/inner shadow-inner">
                              <div className="absolute inset-0 bg-blue-600/[0.02] opacity-0 group-hover/inner:opacity-100 transition-opacity" />
                              <div className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic mb-6">Aggregate Yield Score</div>
                              <div className={`${outfit.className} text-4xl md:text-6xl font-black text-blue-500 italic tracking-tighter drop-shadow-[0_0_30px_rgba(59,130,246,0.4)]`}>99.42<span className="text-xl md:text-2xl text-blue-900">%</span></div>
                              <div className="mt-8 flex items-center justify-center gap-3">
                                 <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-[#030408] bg-blue-600" />)}
                                 </div>
                                 <span className="text-[8px] md:text-[9px] font-black text-slate-700 uppercase tracking-widest italic">Tier-1 Protocol Audit</span>
                              </div>
                           </div>
                        </div>
                     </motion.div>

                     {/* Protocol Settlement Config */}
                     <motion.div 
                        whileHover={{ scale: 1.005 }}
                        className="lg:col-span-12 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3.5rem] p-12 relative overflow-hidden group shadow-3xl"
                     >
                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-600/[0.03] to-transparent pointer-events-none" />
                        <div className="grid lg:grid-cols-2 gap-20 relative z-10">
                           <div className="space-y-12">
                              <div className="flex flex-col sm:flex-row items-center gap-6">
                                 <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] bg-blue-600/10 flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-2xl shrink-0">
                                    <Wallet className="w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                                 </div>
                                 <div className="text-center sm:text-left">
                                    <h3 className={`${outfit.className} text-2xl md:text-3xl font-black text-white italic tracking-tighter`}>Liquid Reserve <span className="text-blue-500">Node</span></h3>
                                    <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic mt-1">Stellar Distributed Ledger Protocol</div>
                                 </div>
                              </div>
                              
                              <div className="space-y-10">
                                 <div className="bg-[#080B12] border border-white/[0.06] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-inner group/wallet relative overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-500/[0.02] opacity-0 group-hover/wallet:opacity-100 transition-opacity" />
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                                       <div className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">Public Secure Identity</div>
                                       <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                                          <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest font-mono">Synchronized</span>
                                       </div>
                                    </div>
                                    <div className="font-mono text-sm md:text-xl text-blue-300 break-all leading-relaxed tracking-[0.1em] border-b border-white/5 pb-8 mb-8 text-center sm:text-left">{user?.stellarWallet || 'RESOLUTION_FAILED'}</div>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 md:gap-6">
                                       <Button onClick={copyWallet} variant="ghost" className="h-10 md:h-12 px-4 md:px-6 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all flex items-center gap-2 md:gap-3 font-black uppercase tracking-widest text-[8px] md:text-[9px]">
                                          {copied ? <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />} {copied ? 'CAPTURED' : 'COPY IDENTITY'}
                                       </Button>
                                       <a href={`https://stellar.expert/explorer/testnet/account/${user?.stellarWallet}`} target="_blank" rel="noopener noreferrer">
                                          <Button variant="ghost" className="h-10 md:h-12 px-4 md:px-6 rounded-xl hover:bg-blue-600/10 text-slate-500 hover:text-blue-400 transition-all flex items-center gap-2 md:gap-3 font-black uppercase tracking-widest text-[8px] md:text-[9px]">
                                             <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" /> TRACE LEDGER
                                          </Button>
                                       </a>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           <div className="flex flex-col justify-between">
                              <div className="space-y-10 mt-12 lg:mt-0">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
                                    <div className="space-y-3 bg-white/[0.02] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/[0.04] text-center sm:text-left">
                                       <div className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Current USDC Balance</div>
                                       <div className={`${outfit.className} text-4xl md:text-5xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] leading-none`}>{stats.usdcBalance}</div>
                                       <div className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest font-mono italic opacity-60">Settlement Asset</div>
                                    </div>
                                    <div className="space-y-3 bg-white/[0.02] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/[0.04] text-center sm:text-left">
                                       <div className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Asset Pair Value</div>
                                       <div className={`${outfit.className} text-4xl md:text-5xl font-black text-slate-300 italic tracking-tighter tabular-nums leading-none`}>₹{Number(stats.usdcInr).toLocaleString()}</div>
                                       <div className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-widest font-mono italic opacity-60">FIAT MAGNITUDE</div>
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                                    <div className="flex items-center gap-5 p-5 md:p-6 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-[1.5rem] md:rounded-[2rem]">
                                       <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-500/40" />
                                       <div>
                                          <div className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Escrow Status</div>
                                          <div className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest italic">ACTIVE_PROTECTED</div>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-5 p-5 md:p-6 bg-blue-500/[0.03] border border-white/5 rounded-[1.5rem] md:rounded-[2rem]">
                                       <RefreshCw className="w-5 h-5 md:w-6 md:h-6 text-blue-500/40 animate-spin-slow" />
                                       <div>
                                          <div className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Live Sync Rate</div>
                                          <div className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest italic">1.2ms_LATENCY</div>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mt-12">
                                 <Button className={`${outfit.className} bg-white text-black hover:bg-slate-200 h-14 md:h-20 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] md:text-[11px] shadow-[0_20px_50px_rgba(255,255,255,0.15)] transition-all active:scale-95 italic`}>Liquidate to Fiat</Button>
                                 <Button variant="outline" className={`${outfit.className} h-14 md:h-20 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] md:text-[11px] border-white/[0.1] hover:bg-white/5 transition-all text-slate-400 hover:text-white italic`}>Node Settings</Button>
                              </div>
                           </div>
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

                  <div className="premium-card bg-gradient-to-br from-[#121F14] to-[#0A0D14] border border-[#25D366]/20 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 group shadow-2xl">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-[#25D366]/10 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center shrink-0 border border-[#25D366]/20 group-hover:rotate-6 transition-all duration-700 shadow-xl">
                      <MessageCircle className="w-12 h-12 md:w-16 md:h-16 text-[#25D366]" />
                    </div>
                    <div className="flex-1 min-w-0 text-center md:text-left">
                      <div className="text-[9px] md:text-[10px] font-black text-[#25D366] uppercase tracking-[0.3em] mb-3">Merchant Communication Gateway</div>
                      <h3 className={`${outfit.className} text-3xl md:text-4xl font-black text-white tracking-tighter uppercase mb-4`}>WhatsApp Integration Hub</h3>
                      <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-2xl opacity-70">Connect your existing communication endpoint to ChainVerify API. List new inventory and broadcast stage updates directly through encrypted chat.</p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8 md:mt-10">
                        <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=NEW`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                          <Button className="bg-[#25D366] hover:bg-[#1db954] text-black h-14 md:h-16 w-full px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-[0_15px_40px_rgba(37,211,102,0.2)] transform active:scale-95 transition-all">Connect Global Endpoint</Button>
                        </a>
                        <Button variant="outline" className="h-14 md:h-16 w-full sm:w-auto px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs border-white/[0.1] text-white hover:bg-white/[0.05]">Documentation</Button>
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
                                     "Save +1 415 523 8886 as ChainVerify Network",
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
                          <div key={b.id} className="premium-card bg-[#0A0D14]/60 backdrop-blur-xl border border-white/[0.08] hover:border-amber-500/30 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 transition-all group relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-10 relative z-10">
                               <div className="flex-1 min-w-0 space-y-4 md:space-y-6 w-full text-center lg:text-left">
                                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                     <span className={`${outfit.className} text-xl md:text-2xl font-black uppercase tracking-tighter text-white group-hover:text-amber-500 transition-colors`}>{b.product?.title || "Target Asset"}</span>
                                     <span className={`px-3 py-1 rounded-full border text-[9px] md:text-[10px] font-black uppercase tracking-widest ${s.cls} italic shadow-lg`}>{s.label}</span>
                                  </div>
                                  <blockquote className="border-l-4 border-amber-500/20 bg-white/[0.02] p-5 md:p-6 rounded-r-2xl italic text-slate-400 text-base md:text-lg leading-relaxed font-medium">
                                     "{b.description}"
                                  </blockquote>
                                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-600 italic">
                                     <div className="flex items-center gap-2">BY <span className="text-slate-400">{b.issuer?.email?.split('@')[0]}</span></div>
                                     <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}</div>
                                  </div>
                               </div>
                               <div className="shrink-0 flex flex-col items-center border-t lg:border-t-0 lg:border-l border-white/[0.04] pt-8 lg:pt-0 pl-0 lg:pl-10 w-full lg:w-auto">
                                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-[1.5rem] md:rounded-3xl p-6 md:p-8 text-center min-w-full sm:min-w-[200px] mb-6">
                                     <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-2 italic">Reward Pool</div>
                                     <div className={`${outfit.className} text-3xl md:text-4xl font-black text-amber-500 tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]`}>₹{b.amount}</div>
                                  </div>
                                  <Link href={`/product/${b.productId}`} className="w-full">
                                     <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-[0_15px_40px_rgba(245,158,11,0.2)] active:scale-95 transition-all italic">
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
               <DialogTitle className={`${outfit.className} text-2xl md:text-3xl font-black tracking-tighter uppercase italic`}>Physical Asset Link</DialogTitle>
               <DialogDescription className="text-slate-500 font-black text-[9px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-widest italic opacity-60">
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
               <div className="bg-[#0C0F17] border border-white/[0.04] rounded-[2rem] p-6 md:p-8 text-left shadow-inner group/meta">
                  <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 italic">Asset Metadata Signature</p>
                  <p className={`${outfit.className} text-xl md:text-2xl font-black text-white tracking-tight uppercase truncate italic leading-none`}>{selectedQrProduct?.title}</p>
                  <div className="flex items-center gap-3 mt-4">
                     <span className="text-[8px] md:text-[9px] font-mono text-blue-500 uppercase font-black bg-blue-500/5 px-2.5 py-1 rounded-lg border border-blue-500/20 italic">Node Hash</span>
                     <span className="text-[8px] md:text-[9px] font-mono text-slate-600 font-black truncate max-w-[150px]">{selectedQrProduct?.id}</span>
                  </div>
               </div>

               <div className="flex gap-4">
                  <a href={selectedQrProduct?.qrCodeUrl} download={`chainverify-qr-${selectedQrProduct?.id}.png`} className="flex-2">
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
