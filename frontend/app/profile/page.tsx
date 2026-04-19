"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/wallet-context"
import { getUserProfile } from "@/lib/api-service"
import {
  User, Mail, Wallet, Shield, ShieldCheck, Copy, CheckCircle2,
  ExternalLink, LayoutDashboard, Settings, ShoppingBag, ArrowRight,
  Package, Clock, Zap, Star, Trophy, Activity, MapPin, Coins
} from "lucide-react"
import { motion } from "framer-motion"
import { Outfit, Inter } from "next/font/google"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

export default function SelfProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useSelector((s: RootState) => s.userAuth)
  const { publicKey } = useWallet()
  const [copied, setCopied] = useState(false)
  const [enrichedProfile, setEnrichedProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Fetch enriched profile data (trust tokens, orders, etc.)
  useEffect(() => {
    setProfileLoading(true)
    if (user?.id) {
      getUserProfile(user.id)
        .then(data => setEnrichedProfile(data))
        .catch(err => console.warn("[Profile] Could not load enriched profile:", err))
        .finally(() => setProfileLoading(false))
    } else if (publicKey) {
      import("@/lib/api-service").then(({ getWalletProfile }) => {
        getWalletProfile(publicKey)
          .then(data => setEnrichedProfile(data))
          .catch(err => console.warn("[Profile] Could not load wallet profile:", err))
          .finally(() => setProfileLoading(false))
      })
    } else {
      setProfileLoading(false)
    }
  }, [user?.id, publicKey])

  const walletAddress = user?.stellarWallet || publicKey || ""

  const copyWallet = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  const isSupplier = user?.role === "SUPPLIER"
  const isBuyer = !user || user?.role === "BUYER"
  const dashboardUrl = isSupplier ? "/seller-dashboard" : "/buyer-dashboard"

  const trustScore = enrichedProfile?.supplierProfile?.trustScore || 0
  const totalTrustTokens = enrichedProfile?.totalTrustTokens || 0
  const recentOrders = enrichedProfile?.buyerOrders || []
  const supplierProducts = enrichedProfile?.supplierProfile?.products || []
  const badges = enrichedProfile?.supplierProfile?.badges || []
  const memberSince = enrichedProfile?.createdAt
    ? new Date(enrichedProfile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "N/A"

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-[#05060A] text-slate-200 ${inter.className}`}>
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <User className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse">Loading Profile...</span>
        </div>
      </div>
    )
  }

  const isProfileReady = isAuthenticated || publicKey

  if (!isProfileReady && !isLoading) {
    return (
      <div className={`min-h-screen bg-[#05060A] text-slate-200 ${inter.className}`}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-10 shadow-2xl">
            <Shield className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className={`${outfit.className} text-4xl font-bold text-white mb-4`}>Sign In Required</h1>
          <p className="text-slate-500 font-medium text-sm mb-10 leading-relaxed max-w-sm mx-auto">Please sign in or connect your wallet to view your profile.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition-all">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/10 text-white font-bold text-sm transition-all hover:bg-white/5">Create Account</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-[#05060A] text-slate-200 overflow-x-hidden selection:bg-indigo-500/30", inter.className)}>
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">

          {/* ── Profile Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16"
          >
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-indigo-500/40" />
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Account Profile</span>
              </div>
              <h1 className={`${outfit.className} text-4xl md:text-6xl font-bold tracking-tight text-white mb-6`}>
                My <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">Profile</span>
              </h1>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] border border-white/20">
                  {((user?.email || publicKey) || "U")[0].toUpperCase()}
                </div>
                <div>
                  <div className={`${outfit.className} font-bold text-white text-lg tracking-tight`}>
                    {user?.supplierProfile?.name || user?.email?.split("@")[0] || "Buyer"}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border",
                      isSupplier
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                      {user?.role || "BUYER"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Since {memberSince}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-3 min-w-[300px]"
            >
              <Link href={dashboardUrl}>
                <Button className="w-full h-14 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  {isSupplier ? "Seller Dashboard" : "Buyer Dashboard"}
                </Button>
              </Link>
              <div className="flex gap-3">
                <Link href="/profile/buyer-settings" className="flex-1">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.04] text-[10px] font-bold uppercase tracking-widest transition-all">
                    <Settings className="w-4 h-4 mr-2" /> Settings
                  </Button>
                </Link>
                <Link href="/marketplace" className="flex-1">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.04] text-[10px] font-bold uppercase tracking-widest transition-all">
                    <ShoppingBag className="w-4 h-4 mr-2" /> Shop
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Info Cards Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

            {/* Account Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-5 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-10 shadow-3xl"
            >
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Account Details
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Email</div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    {user.email || "Not set"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Role</div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    {user.role === "SUPPLIER" ? "Verified Seller" : user.role === "BUYER" ? "Verified Buyer" : user.role}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">User ID</div>
                  <div className="text-slate-400 font-mono text-xs">{user.id}</div>
                </div>
              </div>
            </motion.div>

            {/* Wallet Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-4 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-10 shadow-3xl"
            >
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Stellar Wallet
              </h3>
              {walletAddress ? (
                <div className="space-y-6">
                  <button
                    onClick={copyWallet}
                    className="w-full p-5 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all group text-left"
                    title="Click to copy"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Address</span>
                      {copied ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-slate-300 break-all leading-relaxed">{walletAddress}</p>
                    {copied && <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1 block">Copied!</span>}
                  </button>
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-colors"
                  >
                    View on Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                  <p className="text-slate-600 text-sm font-medium">No wallet connected</p>
                </div>
              )}
            </motion.div>

            {/* Trust Score / Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-10 shadow-3xl flex flex-col"
            >
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Reputation
              </h3>
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-amber-500/20 to-indigo-500/10 border border-white/10 flex items-center justify-center shadow-2xl">
                    <span className={`${outfit.className} text-3xl font-bold text-white`}>{totalTrustTokens}</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Coins className="w-4 h-4 text-black" />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Trust Tokens</div>
                  <div className="text-slate-600 text-[10px] font-medium">Earned through verified activity</div>
                </div>
                {isSupplier && (
                  <div className="w-full pt-4 border-t border-white/5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-2">
                      <span>Trust Score</span>
                      <span className="text-emerald-400">{trustScore}/100</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${trustScore}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── Supplier Profile Section (Conditional) ── */}
          {isSupplier && user.supplierProfile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-10 shadow-3xl mb-12"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Seller Profile
                </h3>
                <Link href="/seller-dashboard" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 transition-colors">
                  Manage Store <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Store Name</div>
                  <div className="text-white font-bold text-lg">{user.supplierProfile.name}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Verification</div>
                  <div className="flex items-center gap-2">
                    {user.supplierProfile.isVerified ? (
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Products</div>
                  <div className="text-white font-bold text-lg">{supplierProducts.length}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Badges</div>
                  <div className="flex items-center gap-2">
                    {badges.length > 0 ? badges.slice(0, 3).map((b: any, i: number) => (
                      <div key={i} className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center" title={b.badgeName}>
                        <Star className="w-4 h-4 text-indigo-400" />
                      </div>
                    )) : (
                      <span className="text-slate-600 text-sm font-medium">None yet</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Recent Orders (for buyers) ── */}
          {recentOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-10 shadow-3xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-blue-400" /> Recent Orders
                </h3>
                <Link href="/buyer-dashboard" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 transition-colors">
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-4">
                {recentOrders.slice(0, 5).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all group">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{o.product?.title || "Product"}</div>
                        <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-bold text-white font-mono">{Number(o.priceUsdc || o.priceInr || 0).toFixed(2)} <span className="text-[10px] text-blue-400">USDC</span></div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border",
                        o.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        o.status === "PAID" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        o.status === "SHIPPED" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                        o.status === "DISPUTED" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-white/5 text-slate-500 border-white/10"
                      )}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  )
}
