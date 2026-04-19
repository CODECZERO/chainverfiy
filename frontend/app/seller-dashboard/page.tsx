"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { 
  Plus, 
  Package,   ShoppingCart, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Wallet, 
  Download, 
  Eye, 
  QrCode,
  Globe,
  MessageCircle,
  Zap,
  ArrowUpRight,
  User,
  Radio,
  Camera,
  Video,
  Copy,
  Coins,
  MapPin,
  CheckCircle2,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { useWallet } from "@/lib/wallet-context"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import Image from "next/image"
import Link from "next/link"
import { Outfit, Inter } from "next/font/google"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import { getProducts, getSupplierProducts, getSupplierOrders, getSupplierBounties, getSupplierAnalytics, getExchangeRates } from "@/lib/api-service"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

const CustomerManager = dynamic(() => import("@/components/customer-manager").then(mod => mod.CustomerManager), { 
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center bg-white/[0.02] rounded-[2rem] border border-white/5 font-black uppercase tracking-widest text-[10px] text-slate-700 italic">Initializing Intel Core...</div>
})

const getIPFSUrl = (url?: string) => {
  if (!url) return ""
  if (url.startsWith("http")) return url
  if (url.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${url.split("ipfs://")[1]}`
  return url
}

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#0ea5e9"]

const STATUS = {
  PENDING_VERIFICATION: { label: "Validating", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20", dot: "bg-amber-500" },
  VERIFIED: { label: "Secured", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", dot: "bg-emerald-500" },
  REJECTED: { label: "Flagged", cls: "bg-red-500/10 text-red-500 border-red-500/20", dot: "bg-red-500" },
  SOLD: { label: "Settled", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20", dot: "bg-blue-500" },
  PAID: { label: "Capitalized", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", dot: "bg-emerald-500" },
  SHIPPED: { label: "In-Transit", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20", dot: "bg-blue-500" },
}

const NAV = [
  { id: "overview", label: "Intelligence", icon: Activity },
  { id: "listings", label: "Registry", icon: Package },
  { id: "orders", label: "Traffic", icon: ShoppingCart },
  { id: "earnings", label: "Vault", icon: Wallet },
  { id: "bounties", label: "Bounties", icon: Coins },
  { id: "verification", label: "Protocol", icon: ShieldCheck },
  { id: "customers", label: "Agents", icon: User },
]

export default function SellerDashboard() {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.userAuth)
  const { isConnected, publicKey } = useWallet()
  const router = useRouter()
  const [active, setActive] = useState("overview")
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [bounties, setBounties] = useState([])
  const [stats, setStats] = useState({
    totalSales: 0,
    active: 0,
    pending: 0,
    totalEarningsInr: 0,
    pendingEarningsInr: 0,
    withdrawableInr: 0,
    usdcBalance: 0,
    usdcInr: 0,
    analytics: {
      revenueByMonth: [],
      currencyDistribution: []
    }
  })
  const [selectedQrProduct, setSelectedQrProduct] = useState<any>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user?.supplierProfile?.id || user?.id) {
      loadAll()
    }
  }, [user?.supplierProfile?.id, user?.id])

  const loadAll = async () => {
    setLoading(true)
    const supplierId = user?.supplierProfile?.id || user?.id
    console.log('[SellerDashboard] Loading data for supplier:', supplierId)

    // ── Each API call is independent so one failure doesn't nuke all tabs ──

    // 1. Products
    let myProducts: any[] = []
    try {
      const supplierProducts = supplierId ? await getSupplierProducts(supplierId) : []
      myProducts = Array.isArray(supplierProducts) ? supplierProducts : (supplierProducts?.products || [])
      setProducts(myProducts)
    } catch (e) {
      console.warn('[SellerDashboard] Products fetch failed:', e)
    }

    // 2. Orders
    let ordersArr: any[] = []
    try {
      const myOrders = await getSupplierOrders(supplierId)
      ordersArr = Array.isArray(myOrders) ? myOrders : (myOrders?.orders || [])
      setOrders(ordersArr)
    } catch (e) {
      console.warn('[SellerDashboard] Orders fetch failed:', e)
    }

    // 3. Bounties
    try {
      const myBounties = supplierId ? await getSupplierBounties(supplierId) : []
      setBounties(Array.isArray(myBounties) ? myBounties : (myBounties?.bounties || []))
    } catch (e) {
      console.warn('[SellerDashboard] Bounties fetch failed:', e)
    }

    // 4. Analytics (optional — may not exist for new suppliers)
    let analytics = { revenueByMonth: [] as any[], currencyDistribution: [] as any[] }
    if (supplierId) {
      try {
        const analyticsData = await getSupplierAnalytics(supplierId)
        if (analyticsData) analytics = analyticsData
      } catch (e) {
        console.warn('[SellerDashboard] Analytics not available:', e)
      }
    }

    // 5. Exchange rates
    let usdcInr = 83.33
    try {
      const rates = await getExchangeRates()
      if (rates?.USDC?.inr) usdcInr = rates.USDC.inr
    } catch (e) { /* use default */ }

    // Compute stats from whatever data we managed to load
    const verified = myProducts.filter((p: any) => p.status === 'VERIFIED').length
    const pending = myProducts.filter((p: any) => p.status === 'PENDING_VERIFICATION').length
    const totalSalesCount = ordersArr.filter((o: any) => ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(o.status)).length
    const totalUsdc = ordersArr.reduce((sum: number, o: any) => sum + (Number(o.priceUsdc) || 0), 0)
    const pendingUsdc = ordersArr.filter((o: any) => ['PAID', 'SHIPPED'].includes(o.status)).reduce((sum: number, o: any) => sum + (Number(o.priceUsdc) || 0), 0)

    setStats({
      totalSales: totalSalesCount,
      active: verified,
      pending,
      totalEarningsInr: Math.round(totalUsdc * usdcInr),
      pendingEarningsInr: Math.round(pendingUsdc * usdcInr),
      withdrawableInr: Math.round((totalUsdc - pendingUsdc) * usdcInr),
      usdcBalance: totalUsdc,
      usdcInr: Math.round(totalUsdc * usdcInr),
      analytics: {
        revenueByMonth: analytics.revenueByMonth || [],
        currencyDistribution: analytics.currencyDistribution || []
      }
    })

    setLoading(false)
  }

  const walletAddress = (user as any)?.walletAddress || (user as any)?.stellarWallet || (user as any)?.supplierProfile?.walletAddress || (user as any)?.supplierProfile?.stellarWallet || publicKey || ""

  const copyWallet = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const handleWithdraw = async () => {
    setWithdrawing(true)
    setTimeout(() => {
      setWithdrawing(false)
      loadAll()
    }, 2000)
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#05060A] text-white flex items-center justify-center pt-24">
        <Header />
        <div className="w-16 h-16 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin shadow-[0_0_30px_rgba(99,102,241,0.4)]" />
      </div>
    )
  }

  if (user?.role !== 'SUPPLIER') {
    return (
      <div className="min-h-screen bg-[#05060A] flex items-center justify-center p-8">
        <Header />
        <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-12 text-center max-w-md shadow-3xl">
          <div className="w-20 h-20 bg-red-600/10 rounded-[2.5rem] flex items-center justify-center border border-red-500/20 mx-auto mb-8">
             <ShieldCheck className="w-10 h-10 text-red-500" />
          </div>
          <h2 className={`${outfit.className} text-3xl font-bold text-white mb-4`}>Seller Mode Required</h2>
          <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">This area is reserved for verified sellers. If you're a buyer, please go back to the main shop.</p>
          <Button onClick={() => router.push('/')} className="bg-white text-black h-16 w-full rounded-2xl font-bold text-[13px]">Back to Marketplace</Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "min-h-screen bg-[#05060A] text-slate-200 overflow-x-hidden selection:bg-indigo-500/30",
        inter.className
      )}
    >
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

          {/* ── Seller Profile Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-indigo-500/40" />
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Seller Command Center</span>
              </div>
              <h1 className={`${outfit.className} text-4xl md:text-6xl font-bold tracking-tight text-white mb-6`}>
                Store <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">Dashboard</span>
              </h1>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] border border-white/20">
                  {String(user?.supplierProfile?.name || user?.email || "S")[0].toUpperCase()}
                </div>
                <div>
                  <div className={`${outfit.className} font-bold text-white text-lg tracking-tight`}>{String(user?.supplierProfile?.name || "My Store")}</div>
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[9px] uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3" /> Verified Seller
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
              <button
                onClick={copyWallet}
                disabled={!walletAddress}
                className="w-full p-4 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all group text-left disabled:opacity-50 disabled:hover:bg-white/[0.04] disabled:hover:border-white/10 disabled:cursor-not-allowed"
                title={walletAddress ? "Click to copy full wallet address" : "No wallet connected"}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stellar Wallet</span>
                  {walletAddress && (
                    copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 ml-auto transition-colors" />
                    )
                  )}
                </div>
                <p className="font-mono text-[11px] text-slate-300 break-all leading-relaxed">
                  {walletAddress || "Not connected"}
                </p>
                {copied && <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1 block">Copied to clipboard!</span>}
              </button>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={loadAll}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-slate-500 hover:text-white hover:border-indigo-500/30 transition-all disabled:opacity-50 group text-[10px] font-bold uppercase tracking-widest"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : "group-hover:rotate-180 transition-transform duration-700"}`} />
                  {loading ? "Syncing..." : "Refresh"}
                </button>
                <Link href="/seller-dashboard/new-product">
                  <Button className="h-full px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-900/20 transition-all active:scale-95">
                    <Plus className="w-4 h-4 mr-2" /> New Product
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ── Horizontal Tab Nav (replacing sidebar) ── */}
          <div className="mb-12 overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActive(n.id)}
                  className={cn(
                    "relative px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap",
                    active === n.id
                      ? "text-indigo-400 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/20"
                      : "text-slate-500 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <n.icon className={cn(
                    "w-4 h-4 transition-transform duration-500",
                    active === n.id ? "text-indigo-400" : "text-slate-600"
                  )} />
                  {n.label}
                  {active === n.id && (
                    <motion.div
                      layoutId="dash-active-glow"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-500 rounded-full blur-[2px] opacity-80"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Intelligence Deck ── */}
          <div className="relative">
           <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {active === "overview" && (
                <div className="space-y-12">

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                      { label: "Live Products", value: stats.active, color: "text-emerald-400", bg: "from-emerald-500/10", icon: ShieldCheck },
                      { label: "Pending Review", value: stats.pending, color: "text-amber-400", bg: "from-amber-500/10", icon: Clock },
                      { label: "Completed Sales", value: stats.totalSales, color: "text-blue-400", bg: "from-blue-500/10", icon: Zap },
                      { label: "Total Revenue", value: `\u20B9${Math.round(stats.usdcInr)}`, color: "text-white", bg: "from-blue-600/10", icon: Coins },
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

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-12 shadow-3xl min-h-[480px]">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-10">Revenue Analytics</h3>
                      <div className="h-[350px] w-full">
                         {mounted && (
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={stats.analytics?.revenueByMonth || []}>
                               <defs>
                                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                     <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                               <XAxis dataKey="name" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
                               <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
                               <RechartsTooltip contentStyle={{backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px'}} />
                               <Area type="monotone" dataKey="uv" stroke="#3b82f6" strokeWidth={3} fill="url(#revenueGrad)" />
                            </AreaChart>
                         </ResponsiveContainer>
                         )}
                      </div>
                    </div>
                    <div className="lg:col-span-4 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-12 shadow-3xl">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-10">Currency Pool</h3>
                       <div className="h-[300px] w-full relative flex items-center justify-center">
                          {mounted && (
                            <>
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                  <Pie
                                     data={stats.analytics?.currencyDistribution?.length > 0 ? stats.analytics.currencyDistribution : [{name: 'Empty', value: 1}]}
                                     innerRadius={60}
                                     outerRadius={90}
                                     dataKey="value"
                                     stroke="none"
                                  >
                                     {(stats.analytics?.currencyDistribution || []).map((entry: any, index: number) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                     ))}
                                  </Pie>
                               </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                               <span className="text-xl font-bold text-white">${stats.usdcBalance}</span>
                            </div>
                           </>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {active === "listings" && (
                <div className="space-y-12">
                   <div className="flex items-center justify-between gap-8">
                    <div>
                      <h2 className={`${outfit.className} text-4xl font-bold text-white tracking-tight uppercase`}>Registry</h2>
                      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-2 flex items-center gap-3">
                         <Package className="w-4 h-4 text-blue-500" /> Manage your verified product inventory
                      </p>
                    </div>
                    <Link href="/seller-dashboard/new-product">
                      <Button className="bg-white text-black hover:bg-slate-100 rounded-[1.5rem] font-bold uppercase px-8 border-2 border-transparent">
                        <Plus className="w-5 h-5 mr-3" /> New Product
                      </Button>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((p: any) => {
                      const s = STATUS[p.status] || STATUS.PENDING_VERIFICATION;
                      return (
                        <div key={p.id} className="glass-premium bg-[#0A0D14]/80 border border-white/[0.1] rounded-[2.5rem] overflow-hidden group">
                           <div className="relative h-64 w-full overflow-hidden">
                              {p.proofMediaUrls?.[0] ? (
                                <Image src={getIPFSUrl(p.proofMediaUrls[0])} alt={p.title} fill className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" unoptimized />
                              ) : <div className="w-full h-full bg-white/5" />}
                              <div className={`absolute top-6 right-6 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest ${s.cls}`}>
                                 {s.label}
                              </div>
                           </div>
                           <div className="p-8">
                              <h4 className="text-xl font-bold text-white truncate uppercase">{p.title}</h4>
                              <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
                                 <div>
                                    <div className="text-[10px] text-slate-700 uppercase mb-1">Price</div>
                                    <div className="text-2xl font-bold text-white">\u20B9{Number(p.priceInr).toLocaleString()}</div>
                                 </div>
                                 <div className="flex gap-3">
                                   <button onClick={() => setSelectedQrProduct(p)} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-blue-600/20 text-slate-500 hover:text-white transition-all"><QrCode className="w-5 h-5" /></button>
                                   <Link href={`/product/${p.id}`} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-emerald-600/20 text-slate-500 hover:text-white transition-all"><Eye className="w-5 h-5" /></Link>
                                 </div>
                              </div>
                           </div>
                        </div>
                      )
                    })}
                    {products.length === 0 && (
                      <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.01]">
                        <Package className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-30" />
                        <h3 className="text-xl font-bold text-white opacity-60 uppercase">No Inventory Signals</h3>
                        <p className="text-slate-600 text-[10px] uppercase font-bold mt-3">Register your first product to begin</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {active === "orders" && (
                <div className="space-y-12">
                   <div className="flex items-center justify-between gap-8">
                    <div>
                      <h2 className={`${outfit.className} text-4xl font-bold text-white tracking-tight uppercase`}>Traffic</h2>
                      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-2">Manage and fulfill customer purchases</p>
                    </div>
                  </div>

                  {orders.map((o: any) => {
                    const s = STATUS[o.status] || STATUS.PAID;
                    return (
                      <div key={o.id} className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-24 h-24 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 overflow-hidden relative">
                           {o.product?.proofMediaUrls?.[0] ? (
                             <Image src={getIPFSUrl(o.product.proofMediaUrls[0])} alt="" fill className="object-cover opacity-60" />
                           ) : <Package className="w-8 h-8 text-slate-700" />}
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="text-[10px] text-slate-700 uppercase font-mono mb-2">ID-{o.id.slice(0, 10)}</div>
                           <h4 className="text-2xl font-bold text-white uppercase">{o.product?.title || 'Order'}</h4>
                           <div className="mt-4 flex gap-4">
                              <span className={`px-4 py-1.5 rounded-xl border text-[9px] font-bold uppercase ${s.cls}`}>{s.label}</span>
                              <span className="text-[10px] text-slate-600 font-bold uppercase self-center">Buyer: {o.buyer?.walletAddress?.slice(0, 8)}...</span>
                           </div>
                        </div>
                        <div className="text-right shrink-0 border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0 md:pl-10 w-full md:w-auto">
                           <div className="text-[10px] text-slate-700 uppercase mb-1">Total</div>
                           <div className="text-3xl font-bold text-white">\u20B9{Number(o.totalPriceInr).toLocaleString()}</div>
                        </div>
                      </div>
                    )
                  })}
                  {orders.length === 0 && (
                    <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.01]">
                       <ShoppingCart className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-30" />
                       <p className="text-slate-600 text-[11px] font-bold uppercase">No active fulfillment requests</p>
                    </div>
                  )}
                </div>
              )}

              {active === "earnings" && (
                <div className="space-y-12">
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
                    <div>
                      <h2 className={`${outfit.className} text-4xl font-bold text-white tracking-tight uppercase`}>Vault</h2>
                      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-2">Aggregate yield and settlement node</p>
                    </div>
                    <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.1] rounded-[2rem] p-6 flex items-center gap-8 shadow-2xl">
                       <div className="pr-10 border-r border-white/5">
                          <div className="text-[10px] text-slate-600 uppercase mb-1">Balance</div>
                          <div className="text-3xl font-bold text-white">${stats.usdcBalance}</div>
                       </div>
                       <Button 
                        onClick={handleWithdraw}
                        disabled={withdrawing || stats.usdcBalance <= 0}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 rounded-xl px-10 transition-all uppercase text-[11px]"
                       >
                         {withdrawing ? "SYCHRONIZING..." : "Settle"}
                       </Button>
                    </div>
                  </div>

                  <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-12">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                        <div className="md:col-span-2 space-y-6">
                           <div className="text-[10px] text-slate-600 uppercase font-black italic">Total Managed Capital</div>
                           <div className="text-5xl font-black text-white italic tracking-tighter">₹{Number(stats.totalEarningsInr).toLocaleString()}</div>
                           <div className="flex gap-4 mt-10">
                              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-xl text-emerald-500 font-bold text-[10px] uppercase">+12.4% yield</div>
                              <div className="text-slate-700 font-bold text-[9px] uppercase self-center italic">Verified Protocol Ledger</div>
                           </div>
                        </div>
                        <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/5 space-y-8">
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-3"><span>Pending Node</span> <span className="text-amber-500 font-mono italic">\u20B9{Number(stats.pendingEarningsInr).toLocaleString()}</span></div>
                              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "35%" }} className="h-full bg-amber-500" /></div>
                           </div>
                           <div>
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-3"><span>Liquid Node</span> <span className="text-blue-500 font-mono italic">\u20B9{Number(stats.totalEarningsInr - stats.pendingEarningsInr).toLocaleString()}</span></div>
                              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: "85%" }} className="h-full bg-blue-500" /></div>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {active === "bounties" && (
                <div className="space-y-12 text-white">
                   <h2 className="text-4xl font-black uppercase tracking-tighter italic">Bounties</h2>
                   <div className="grid gap-8">
                      {bounties.map((b: any) => (
                        <div key={b.id} className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-12 group">
                           <div className="flex-1 space-y-6 text-center md:text-left">
                              <h4 className="text-3xl font-black italic uppercase text-white group-hover:text-blue-400 transition-colors tracking-tighter">{b.product?.title || "Verification Target"}</h4>
                              <p className="text-slate-500 text-lg italic leading-relaxed font-medium">"{b.description}"</p>
                           </div>
                           <div className="shrink-0 text-center border-t md:border-t-0 md:border-l border-white/5 pt-8 md:pt-0 md:pl-12 w-full md:w-auto">
                              <div className="text-[10px] text-slate-600 font-black uppercase mb-2">Reward Pool</div>
                              <div className="text-4xl font-black text-amber-500 italic mb-8">\u20B9{b.amount}</div>
                              <Link href={`/product/${b.productId}`}><Button className="bg-blue-600 hover:bg-blue-500 text-white w-full rounded-2xl h-14 font-black uppercase text-[10px] italic">Submit Proof</Button></Link>
                           </div>
                        </div>
                      ))}
                      {bounties.length === 0 && (
                        <div className="py-20 text-center opacity-30 text-slate-700 font-black uppercase italic text-sm">No localized proof requests available</div>
                      )}
                   </div>
                </div>
              )}

              {active === "verification" && (
                <div className="space-y-12 text-white">
                   <div className="flex flex-col">
                     <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Reputation Protocol</h2>
                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Merchant Trust & Authenticity Nodes</p>
                   </div>
                   
                   <div className="grid md:grid-cols-3 gap-8">
                      {[
                        { icon: Camera, title: "Optical", desc: "High-resolution physical perspectives." },
                        { icon: Video, title: "Kinetic", desc: "Continuous temporal capture." },
                        { icon: MapPin, title: "Geospatial", desc: "Real-time coordinate authentication." },
                      ].map((t, idx) => (
                        <div key={idx} className="bg-[#0A0D14] border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center text-center group hover:border-blue-500/30 transition-all">
                           <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 group-hover:bg-blue-600/10 transition-all"><t.icon className="w-8 h-8 text-blue-500" /></div>
                           <h4 className="text-xl font-black uppercase mb-3 italic">{t.title}</h4>
                           <p className="text-slate-600 text-[11px] font-black italic">{t.desc}</p>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {active === "customers" && (
                <div className="space-y-12">
                   <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Agents</h2>
                   <div className="glass-premium bg-[#0A0D14]/80 border border-white/10 rounded-[3rem] p-10 relative overflow-hidden">
                      <CustomerManager />
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          </div>
      </div>
      </main>

      {/* ── Asset QR Dialog ── */}
      <Dialog open={!!selectedQrProduct} onOpenChange={() => setSelectedQrProduct(null)}>
        <DialogContent className="sm:max-w-md bg-[#0A0D14]/95 backdrop-blur-2xl border-white/[0.08] text-white p-0 overflow-hidden rounded-[3rem] shadow-2xl">
          <div className="px-10 py-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-10 border border-blue-500/20 shadow-2xl">
               <QrCode className="w-10 h-10 text-blue-500" />
            </div>

            <div className="space-y-3 mb-10">
               <DialogTitle className={`${outfit.className} text-3xl font-black tracking-tighter uppercase italic`}>Physical Link</DialogTitle>
               <DialogDescription className="text-slate-600 font-bold text-[10px] uppercase tracking-widest italic">Cryptographic node for asset authentication</DialogDescription>
            </div>

            <div className="relative p-8 bg-white/5 border border-white/10 rounded-[3rem] mb-10 shadow-3xl">
               {selectedQrProduct?.qrCodeUrl ? (
                 <div className="w-64 h-64 relative bg-white p-3 rounded-2xl shadow-inner">
                   <Image src={getIPFSUrl(selectedQrProduct.qrCodeUrl)} alt="QR" fill className="object-contain" unoptimized />
                 </div>
               ) : (
                 <div className="w-64 h-64 flex flex-col items-center justify-center text-slate-800"><AlertTriangle className="w-12 h-12 mb-4 opacity-20" /><span className="text-[10px] font-black uppercase">Unresolved Node</span></div>
               )}
            </div>

            <div className="w-full flex gap-4">
               <Button onClick={() => setSelectedQrProduct(null)} className="h-16 w-full rounded-2xl bg-white text-black font-black uppercase text-xs">Close Protocol</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
