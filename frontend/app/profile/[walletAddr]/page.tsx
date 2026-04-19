"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { getWalletProfile } from "@/lib/api-service"
import {
  ShieldCheck, MapPin, Package, Trophy, ExternalLink, User,
  Star, Activity, CheckCircle2, Copy, Shield, Wallet, ArrowRight, Coins
} from "lucide-react"
import { motion } from "framer-motion"
import { Outfit, Inter } from "next/font/google"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

const getIPFSUrl = (url?: string) => {
  if (!url) return ""
  if (url.startsWith("http")) return url
  if (url.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${url.split("ipfs://")[1]}`
  return url
}

export default function PublicProfilePage() {
  const { walletAddr } = useParams()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!walletAddr) return
    getWalletProfile(String(walletAddr))
      .then(d => setProfile(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [walletAddr])

  const shortAddr = walletAddr ? `${String(walletAddr).slice(0, 6)}...${String(walletAddr).slice(-4)}` : ""

  const copyWallet = () => {
    if (walletAddr) {
      navigator.clipboard.writeText(String(walletAddr))
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  if (loading) {
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

  if (!profile) {
    return (
      <div className={`min-h-screen bg-[#05060A] text-slate-200 ${inter.className}`}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 rounded-[2rem] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-10 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-slate-800" />
          </div>
          <h1 className={`${outfit.className} text-3xl font-bold text-white mb-4`}>Profile Not Found</h1>
          <p className="text-slate-500 font-medium text-sm mb-3 leading-relaxed">No profile found for this wallet address.</p>
          <p className="font-mono text-xs text-slate-700 mb-10">{shortAddr}</p>
          <Link href="/marketplace">
            <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition-all">
              Back to Marketplace
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isSupplier = profile.role === "SUPPLIER"
  const products = profile.supplierProfile?.products || []
  const orders = profile.buyerOrders || []
  const trustScore = profile.supplierProfile?.trustScore || 0
  const totalSales = profile.supplierProfile?.totalSales || 0
  const totalTrustTokens = profile.totalTrustTokens || 0

  return (
    <div className={cn("min-h-screen bg-[#05060A] text-slate-200 overflow-x-hidden selection:bg-indigo-500/30", inter.className)}>
      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">

          {/* ── Profile Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-10 md:p-14 shadow-3xl mb-12 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/[0.03] rounded-full blur-[80px] pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
              {/* Avatar */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-600 flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] border border-white/20 shrink-0">
                {profile.email?.[0]?.toUpperCase() || "U"}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 flex-wrap mb-3">
                  <h1 className={`${outfit.className} text-2xl md:text-4xl font-bold text-white tracking-tight`}>
                    {profile.supplierProfile?.name || profile.email?.split("@")[0] || "Anonymous"}
                  </h1>
                  {profile.supplierProfile?.isVerified && (
                    <span className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl px-3 py-1 text-[9px] font-bold uppercase tracking-widest">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                  <span className={cn(
                    "border rounded-xl px-3 py-1 text-[9px] font-bold uppercase tracking-widest",
                    isSupplier ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  )}>
                    {profile.role}
                  </span>
                </div>

                {/* Wallet Address */}
                <button
                  onClick={copyWallet}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors group mb-3"
                >
                  <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono text-xs">{shortAddr}</span>
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  )}
                  {copied && <span className="text-[9px] text-emerald-400 font-bold uppercase">Copied!</span>}
                </button>

                {profile.supplierProfile?.location && (
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    {profile.supplierProfile.location}
                  </div>
                )}
              </div>

              {/* Stellar Explorer Link */}
              <div className="shrink-0">
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${walletAddr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest"
                >
                  <ExternalLink className="w-4 h-4" /> Stellar Explorer
                </a>
              </div>
            </div>
          </motion.div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { label: "Trust Score", value: trustScore, suffix: "/100", icon: Shield, color: "text-emerald-400", bg: "from-emerald-500/10" },
              { label: "Orders", value: orders.length, suffix: "", icon: Package, color: "text-blue-400", bg: "from-blue-500/10" },
              { label: "Total Sales", value: totalSales, suffix: "", icon: Activity, color: "text-purple-400", bg: "from-purple-500/10" },
              { label: "Trust Tokens", value: totalTrustTokens, suffix: "", icon: Coins, color: "text-amber-400", bg: "from-amber-500/10" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-8 relative overflow-hidden group shadow-3xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} to-transparent opacity-0 group-hover:opacity-40 transition-opacity`} />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div className="space-y-1 relative z-10">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
                  <div className={`${outfit.className} text-3xl font-bold text-white tracking-tight`}>{s.value}{s.suffix}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Verified Products (Supplier) ── */}
          {products.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-blue-400" /> Verified Products
                </h2>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">{products.length} listings</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p: any) => (
                  <Link key={p.id} href={`/product/${p.id}`}>
                    <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2rem] overflow-hidden group hover:border-indigo-500/30 transition-all">
                      <div className="relative h-48 w-full overflow-hidden bg-white/[0.02]">
                        {p.proofMediaUrls?.[0] ? (
                          <Image src={getIPFSUrl(p.proofMediaUrls[0])} alt={p.title} fill className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-700" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-slate-800" />
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h4 className="text-lg font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{p.title}</h4>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xl font-bold text-white">₹{Number(p.priceInr).toLocaleString()}</span>
                          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Recent Orders ── */}
          {orders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-10 shadow-3xl"
            >
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Recent Orders
              </h3>
              <div className="space-y-4">
                {orders.slice(0, 5).map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/[0.05] rounded-2xl hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{o.product?.title || "Product"}</div>
                        <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-bold text-blue-400 font-mono">{Number(o.priceUsdc || 0).toFixed(4)} USDC</div>
                      <div className="text-[10px] text-slate-600 font-bold uppercase">{o.status}</div>
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
