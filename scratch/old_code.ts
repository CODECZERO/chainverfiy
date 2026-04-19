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
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const resp = await fetch("/api/seller/dashboard")
      if (resp.ok) {
        const data = await resp.json()
        setProducts(data.products || [])
        setOrders(data.orders || [])
        setBounties(data.bounties || [])
        setStats(data.stats)
      }
    } catch (err) {
      console.error("[SellerDashboard] Failed to load data:", err)
    } finally {
      setLoading(false)
    }
  }

  const copyWallet = () => {
    if (user?.stellarWallet) {
      navigator.clipboard.writeText(user.stellarWallet)
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
      <div className="min-h-screen bg-[#030408] text-white flex items-center justify-center pt-24">
        <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin shadow-[0_0_30px_rgba(37,99,235,0.4)]" />
      </div>
    )
  }

  if (user?.role !== 'SUPPLIER') {
    return (
      <div className="min-h-screen bg-[#030408] flex items-center justify-center p-8">
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
        "h-screen flex flex-col bg-[#030408] text-slate-400 selection:bg-blue-500/30 selection:text-blue-200 overflow-hidden relative",
        inter.className
      )}
    >
      {/* ── Deep Space Atmospheric Effects ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

