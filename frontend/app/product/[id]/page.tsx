"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useParams } from "next/navigation"
import type { RootState } from "@/lib/redux/store"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CheckCircle2, XCircle, Clock, MapPin, ExternalLink, MessageCircle, ShieldCheck, Package, Lightbulb, Coins, ArrowLeft, Star, QrCode, ArrowRight, Lock, Loader2, Globe, Activity, Sparkles, User as UserIcon, Zap, Users } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { PaymentModal } from "@/components/payment-modal"
import { BountyModal } from "@/components/bounty-modal"
import { SubmitProofModal } from "@/components/submit-proof-modal"
import { BuyerProfileModal } from "@/components/buyer-profile-modal"
import { convertInrToUsdc, getUsdcInrRate } from "@/lib/exchange-rates"
import { getBountiesByProduct, getProduct, getVerificationStatus, getBuyerProfile, updateBuyerProfile, voteProduct } from "@/lib/api-service"
import { useToast } from "@/components/ui/use-toast"
import { getIPFSUrl } from "@/lib/image-utils"
import { cn } from "@/lib/utils"
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

const PAYMENT_CURRENCIES = ["USDC", "USDT", "XLM"]

export default function ProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState("USDC")
  const [activeImg, setActiveImg] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showBountyModal, setShowBountyModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showProofModal, setShowProofModal] = useState(false)
  const [selectedBounty, setSelectedBounty] = useState<any>(null)
  const [buyerProfile, setBuyerProfile] = useState<any>(null)
  const [bounties, setBounties] = useState<any[]>([])
  const [usdcInr, setUsdcInr] = useState(83.33)
  const [allRates, setAllRates] = useState<any>(null)
  const [isVerifiedUserForThisProduct, setIsVerifiedUserForThisProduct] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const { isAuthenticated, user } = useSelector((s: RootState) => s.userAuth)
  const { isConnected, publicKey } = useSelector((state: RootState) => state.wallet)
  const { toast } = useToast()

  useEffect(() => { loadProduct() }, [id, isAuthenticated, publicKey])
  useEffect(() => { 
    import('@/lib/exchange-rates').then(m => {
      m.getAllRates().then(rates => {
        setAllRates(rates)
        if (rates?.USDC?.inr) setUsdcInr(rates.USDC.inr)
      }).catch(() => {})
    })
  }, [])

  const loadProduct = async () => {
    try {
      // 1. Load basic product and bounties using standardized helpers
      const [prodData, bountyRes, vRes] = await Promise.all([
        getProduct(id as string),
        getBountiesByProduct(id as string),
        getVerificationStatus(id as string, publicKey || undefined)
      ])

      if (prodData) {
        setProduct(prodData)
        if (prodData.userHasVoted) setHasVoted(true)
      }

      // getBountiesByProduct now returns direct data array or object from api-service
      if (bountyRes) {
        if (Array.isArray(bountyRes)) {
          setBounties(bountyRes)
        } else if (typeof bountyRes === 'object') {
          // Fallback for cases where it's wrapped in { bounties: [...] } or { data: [...] }
          const bouts = bountyRes.bounties || bountyRes.data || [];
          if (Array.isArray(bouts)) setBounties(bouts);
        }
      }

      // 2. Map verification status
      if (vRes && vRes.isVerified) {
        setIsVerifiedUserForThisProduct(true)
      }
    } catch (e) {
      console.error("[ProductPage] Sync error:", e)
    } finally {
      setLoading(false)
    }
  }

  const checkProfileAndBuy = async () => {
    if (!isAuthenticated && !isConnected) {
      toast({ title: "Auth Required", description: "Please connect your wallet or login first." })
      return
    }
    try {
      const data = await getBuyerProfile(publicKey || undefined)
      if (data && (data.id || data._id)) {
        setBuyerProfile(data)
        setShowModal(true)
      } else {
        setShowProfileModal(true)
      }
    } catch (e) {
      setShowProfileModal(true)
    }
  }

  const handleProfileSave = async (profileData: any) => {
    try {
      const data = await updateBuyerProfile({ ...profileData, stellarWallet: publicKey })
      if (data) {
        setBuyerProfile(data)
        setShowProfileModal(false)
        setShowModal(true)
        toast({ title: "Profile Ready", description: "Your shipping details have been secured." })
      }
    } catch (e: any) {
      toast({ title: "Save Failed", description: e.message || "Failed to save profile", variant: "destructive" })
    }
  }
  
  const handleVote = async (voteType: 'REAL' | 'FAKE' | 'NEEDS_MORE_PROOF') => {
    if (isVoting) return
    setIsVoting(true)
    try {
      const data = await voteProduct(id as string, { userId: user?.id, stellarWallet: publicKey, voteType })
      if (data) {
        setHasVoted(true)
        toast({ title: "Vote Cast Successfully", description: "Your contribution has been recorded on-chain." })
        loadProduct()
      }
    } catch (e: any) {
      toast({ title: "Voting Error", description: e.message || "Network error occurred while voting.", variant: "destructive" })
    } finally {
      setIsVoting(false)
    }
  }

  if (loading) return (
    <div className={cn("min-h-screen bg-[#050608] text-slate-200", inter.className)}>
      <Header />
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-32 animate-pulse space-y-8">
        <div className="h-4 bg-white/[0.03] rounded-lg w-48" />
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="aspect-[16/10] bg-white/[0.02] rounded-2xl border border-white/[0.04]" />
            <div className="h-12 bg-white/[0.02] rounded-xl w-3/4" />
          </div>
          <div className="lg:col-span-4 h-[500px] bg-white/[0.02] rounded-2xl border border-white/[0.04]" />
        </div>
      </div>
    </div>
  )

  if (!product) return null

  const total = product.voteReal + product.voteFake
  const realPct = total > 0 ? Math.round((product.voteReal / total) * 100) : 0
  const usdcPrice = typeof product.priceUsdc === "number" && product.priceUsdc > 0 
    ? product.priceUsdc 
    : convertInrToUsdc(Number(product.priceInr) || 0, usdcInr)
  const isVerified = product.status === "VERIFIED"

  return (
    <div className={cn("min-h-screen bg-[#050608] text-slate-200 pb-24 selection:bg-indigo-500/30 overflow-x-hidden relative", inter.className)}>
      <Header />
      
      {/* ── Atmospheric Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] -left-[10%] w-[400px] h-[400px] bg-indigo-600/[0.06] rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[15%] w-[450px] h-[450px] bg-blue-600/[0.05] rounded-full blur-[140px]" />
      </div>

      <main className="relative z-10 pt-32">
        {/* ── Breadcrumb & Global ID ── */}
        <div className="border-b border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link href="/marketplace" className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-indigo-400 transition-all">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Marketplace
            </Link>
            <div className="flex items-center gap-3">
               <span className="text-[11px] font-mono text-slate-500">{id?.slice(0, 8)}</span>
               <span className={cn(
                 "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium border",
                 isVerified ? "bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/15" : "bg-amber-500/[0.08] text-amber-400 border-amber-500/15"
               )}>
                 {isVerified ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                 {isVerified ? "Verified" : "Pending"}
               </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-14">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

          {/* ── Left Column: Media & Data (8 columns) ── */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* 1. Brand & Title */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-2.5 py-1 bg-indigo-500/[0.08] border border-indigo-500/15 text-indigo-400 rounded-md text-[10px] font-medium">
                  Verified Product
                </span>
                {product.category && (
                  <span className="px-2.5 py-1 bg-amber-500/[0.08] border border-amber-500/15 text-amber-400 rounded-md text-[10px] font-medium">
                    {product.category}
                  </span>
                )}
              </div>
              <h1 className={`${outfit.className} text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-5 text-white`}>
                {String(product.title || "")}
              </h1>
              <div className="border-l-2 border-indigo-500/20 pl-5">
                <p className="text-base text-slate-400 leading-relaxed max-w-3xl">
                  {String(product.description || "No description available.")}
                </p>
              </div>
            </motion.div>

            {/* 2. Media visualizer */}
            <div className="space-y-6">
              <div className="aspect-[16/10] bg-white/[0.015] rounded-2xl overflow-hidden relative group border border-white/[0.06]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-transparent to-transparent opacity-60 z-10 pointer-events-none" />
                
                {/* On-Chain Watermark */}
                <div className="absolute top-4 left-5 z-20 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-emerald-400/80">On-Chain Proof</span>
                </div>

                {product.proofMediaUrls?.[activeImg] ? (
                  <Image 
                    src={getIPFSUrl(product.proofMediaUrls[activeImg])} 
                    alt={product.title} 
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-700 z-0"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-white/[0.01] z-0">
                    <Package className="w-12 h-12 text-slate-700 mb-3" />
                    <span className="text-[11px] font-medium text-slate-600">Visual Evidence Pending</span>
                  </div>
                )}
              </div>
              
              {/* Floating Thumbnails */}
              {product.proofMediaUrls?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 px-1">
                  {product.proofMediaUrls.map((_: string, i: number) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={cn(
                        "relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-300",
                        i === activeImg 
                          ? "border-indigo-500 scale-105 z-10" 
                          : "border-white/[0.04] opacity-50 hover:opacity-100 hover:border-white/15"
                      )}
                    >
                      <Image src={getIPFSUrl(product.proofMediaUrls[i])} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Consensus Engine Block */}
            <div className="bg-white/[0.015] rounded-2xl p-6 md:p-8 border border-white/[0.06] relative overflow-hidden">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                <div>
                  <p className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider mb-1">Community Verification</p>
                  <h3 className={`${outfit.className} text-xl md:text-2xl font-semibold flex items-center gap-2.5 text-white`}>
                    <ShieldCheck className="w-6 h-6 text-indigo-400" /> Community Review
                  </h3>
                </div>
                <Button 
                  onClick={() => setShowBountyModal(true)}
                  className="rounded-xl h-10 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all active:scale-95"
                >
                  <Coins className="w-3.5 h-3.5 mr-1.5" /> Request Verification
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5 text-center">
                  <div className={`${outfit.className} text-3xl lg:text-4xl font-semibold text-indigo-400 mb-1 tracking-tight`}>{String(realPct)}%</div>
                  <p className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Trust Score
                  </p>
                </div>
                
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5 text-center">
                  <div className={`${outfit.className} text-3xl lg:text-4xl font-semibold text-white mb-1 tracking-tight`}>{String(total)}</div>
                  <p className="text-[11px] font-medium text-slate-500 flex items-center justify-center gap-1.5">
                    <Users className="w-3 h-3" /> Total Votes
                  </p>
                </div>
                
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between bg-emerald-500/[0.06] border border-emerald-500/10 rounded-lg px-3 py-2">
                    <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Authentic</span>
                    <span className={`${outfit.className} text-lg font-semibold text-emerald-400`}>{String(product.voteReal)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-red-500/[0.06] border border-red-500/10 rounded-lg px-3 py-2">
                    <span className="text-[10px] font-medium text-red-500 flex items-center gap-1.5"><XCircle className="w-3 h-3" /> Fake</span>
                    <span className={`${outfit.className} text-lg font-semibold text-red-400`}>{String(product.voteFake)}</span>
                  </div>
                </div>
              </div>

              <div className="relative h-1.5 bg-white/[0.03] rounded-full overflow-hidden mb-3">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${realPct}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full" 
                />
              </div>

              {/* ── Governance Interface ── */}
              {isVerifiedUserForThisProduct && (
                <div className="mt-12 pt-12 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                      <h4 className="text-xl font-bold text-white flex items-center gap-3">
                        <Activity className="w-6 h-6 text-indigo-400" /> Buyer Feedback
                      </h4>
                      <p className="text-sm text-slate-500 mt-1 font-medium">As a confirmed buyer, your feedback helps the community verify this product.</p>
                    </div>
                  </div>

                  {!hasVoted && (
                    <div className="bg-indigo-600/[0.03] border border-indigo-500/10 rounded-xl p-6">
                      <p className="text-sm font-medium text-slate-300 mb-1">Did you receive the product as described?</p>
                      <p className="text-[11px] text-slate-500 mb-5">Your vote helps verify this product and earns community points.</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Button 
                          onClick={() => handleVote('REAL')}
                          disabled={isVoting}
                          className="h-11 rounded-xl bg-white/[0.02] hover:bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-medium text-xs transition-all"
                        >
                          {isVoting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                          Confirm Authentic
                        </Button>
                        <Button 
                          onClick={() => handleVote('FAKE')}
                          disabled={isVoting}
                          className="h-11 rounded-xl bg-white/[0.02] hover:bg-red-500/10 text-red-400 border border-red-500/15 font-medium text-xs transition-all"
                        >
                          {isVoting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                          Flag as Fake
                        </Button>
                      </div>
                    </div>
                  )}
                  {hasVoted && (
                    <div className="bg-emerald-500/[0.06] border border-emerald-500/15 p-5 rounded-xl flex items-center justify-center gap-2">
                       <Sparkles className="w-5 h-5 text-emerald-400" />
                       <span className="text-sm font-medium text-emerald-400">Feedback Recorded</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3.5. Bounty Hub (Restored) */}
            {bounties?.length > 0 && (
              <div className="bg-white/[0.015] rounded-2xl p-6 md:p-8 border border-amber-500/10 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                  <div>
                    <p className="text-[11px] font-medium text-amber-500 uppercase tracking-wider mb-1">Proof Incentives</p>
                    <h3 className={`${outfit.className} text-xl font-semibold flex items-center gap-2.5 text-white`}>
                      <Coins className="w-5 h-5 text-amber-500" /> Active Bounties
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-amber-500/[0.08] border border-amber-500/15 text-[11px] font-medium text-amber-500">
                    {bounties.length} Open
                  </span>
                </div>

                <div className="space-y-3">
                  {bounties.map((b) => (
                    <motion.div 
                      key={b.id} 
                      whileHover={{ x: 4 }}
                      className="flex flex-col md:flex-row items-center gap-5 bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 hover:border-amber-500/25 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-2 leading-relaxed">"{b.description}"</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {b.issuer?.email?.split('@')[0] || "Community"}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-5 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/[0.04] pt-4 md:pt-0 md:pl-5">
                        <div className="text-center md:text-right flex-1 md:flex-none">
                          <p className="text-[10px] text-slate-600 mb-0.5">Reward</p>
                          <p className={`${outfit.className} text-xl font-semibold text-amber-500 tracking-tight`}>{b.amount} USDC</p>
                        </div>
                        {(() => {
                          const isDispute = String(b.description).startsWith("DISPUTE AUDIT: Order ");
                          const orderIdMatch = String(b.description).match(/Order #?([a-f0-9\-]+)/);
                          if (isDispute && orderIdMatch) {
                            return (
                              <Link href={`/audit/${orderIdMatch[1]}`}>
                                <Button className="h-9 px-5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-medium text-xs transition-all active:scale-95">Audit</Button>
                              </Link>
                            )
                          }
                          return (
                            <Button 
                              onClick={() => { setSelectedBounty(b); setShowProofModal(true); }}
                              className="h-9 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-medium text-xs transition-all active:scale-95"
                            >Fulfill</Button>
                          )
                        })()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Traceability Ledger */}
            {product.stageUpdates?.length > 0 && (
              <div className="pt-4">
                <h3 className={`${outfit.className} text-xl font-semibold mb-6 text-white flex items-center gap-2`}>
                  <Globe className="w-5 h-5 text-indigo-400" /> Product History
                </h3>
                
                <div className="pl-6 border-l border-indigo-500/20 space-y-4 relative">
                  {product.stageUpdates.map((s: any, i: number) => (
                    <div key={s.id} className="relative z-10">
                      <div className="absolute -left-[28px] top-4 w-6 h-6 rounded-full bg-[#050608] border-2 border-indigo-500/30 flex items-center justify-center z-10">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0, x: 12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-5 hover:border-indigo-500/25 transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <h4 className={`${outfit.className} text-base font-semibold text-white`}>{String(s.stageName || "LOG_ENTRY")}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                          </span>
                        </div>
                        
                        {s.note && <p className="text-sm text-slate-400 mb-4 leading-relaxed border-l-2 border-indigo-500/20 pl-4">"{String(s.note)}"</p>}
                        
                        <div className="flex flex-wrap items-center gap-2">
                          {(s.gpsLat && s.gpsLng) && (
                            <a href={`https://www.google.com/maps?q=${encodeURIComponent(`${s.gpsLat},${s.gpsLng}`)}`}
                               target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-400 bg-indigo-500/[0.08] border border-indigo-500/15 px-3 py-1.5 rounded-lg hover:bg-indigo-500/15 transition-all">
                              <MapPin className="w-3 h-3" />
                              {String(s.gpsAddress ? s.gpsAddress : "View Location")}
                            </a>
                          )}
                          {s.stellarTxId && (
                            <a href={`https://stellar.expert/explorer/testnet/tx/${s.stellarTxId}`} 
                               target="_blank" rel="noopener noreferrer" 
                               className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/[0.08] border border-blue-500/15 px-3 py-1.5 rounded-lg hover:bg-blue-500/15 transition-all">
                              <ExternalLink className="w-3 h-3" /> On-Chain
                            </a>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Strategic Acquisition (4 columns) ── */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-5">

            {/* Acquisition Interface */}
            <div className="bg-white/[0.015] rounded-2xl p-6 border border-white/[0.06] relative overflow-hidden">
              
              <div className="mb-6 relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/[0.08] flex items-center justify-center border border-indigo-500/15">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">Purchase</span>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-white/[0.02] border border-white/[0.04] p-5 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-medium text-slate-500">Base Price</span>
                      <span className="text-[10px] px-2 py-0.5 bg-white/[0.03] rounded-md text-slate-400">Fixed</span>
                    </div>
                    <p className={`${outfit.className} text-2xl font-semibold text-white tracking-tight mb-4`}>{Number(product.priceUsdc || 0).toFixed(2)} USDC</p>
                    
                    <div className="h-px bg-white/[0.04] my-4" />

                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Payable</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`${outfit.className} text-2xl font-semibold text-emerald-400 tracking-tight`}>
                          {(() => {
                            const price = Number(product.priceInr || 0)
                            if (selectedCurrency === 'USDC') return (price / (allRates?.USDC?.inr || 83.33)).toFixed(2)
                            if (selectedCurrency === 'USDT') return (price / (allRates?.USDT?.inr || 83.33)).toFixed(2)
                            if (selectedCurrency === 'XLM') return (price / (allRates?.XLM?.inr || 28.6)).toFixed(1)
                            return price.toLocaleString()
                          })()}
                        </span>
                        <span className="text-xs text-emerald-500/60 font-medium">{selectedCurrency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-white/[0.02] p-1 rounded-xl border border-white/[0.04]">
                    {PAYMENT_CURRENCIES.map(c => (
                      <button key={c} onClick={() => setSelectedCurrency(c)}
                        className={cn(
                          "flex-1 text-[11px] font-medium py-2.5 rounded-lg transition-all",
                          selectedCurrency === c 
                            ? "bg-indigo-600/15 border border-indigo-500/20 text-indigo-300" 
                            : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Escrow Protocol Notice */}
              <div className="bg-emerald-500/[0.04] border border-emerald-500/15 rounded-xl p-4 mb-6 flex gap-3 relative z-10">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-300/60 leading-relaxed">
                  Funds secured in <span className="text-emerald-400 font-medium">Soroban Smart Escrow</span>. Settlement occurs post-verification.
                </p>
              </div>

              <Button onClick={checkProfileAndBuy} className="w-full rounded-xl h-11 text-sm font-medium bg-white text-black hover:bg-indigo-50 transition-all active:scale-95 relative z-10">
                <span className="flex items-center gap-1.5">Purchase <ArrowRight className="w-3.5 h-3.5" /></span>
              </Button>
            </div>

            {/* Provider Module */}
            <Link href={`/supplier/${product.supplier?.id}`} className="block">
              <div className="bg-white/[0.015] border border-white/[0.06] hover:border-indigo-500/25 rounded-2xl p-5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center font-semibold text-xl text-white group-hover:scale-105 transition-transform shrink-0">
                    {String(product.supplier?.name?.[0] || "S").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 mb-0.5">Seller</p>
                    <h4 className={`${outfit.className} font-semibold text-base text-white group-hover:text-indigo-400 transition-colors truncate`}>
                      {String(product.supplier?.name || "Verified Supplier")}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                       <span className="flex items-center gap-1 bg-emerald-500/[0.08] px-2 py-0.5 rounded-md border border-emerald-500/15 text-[10px] font-medium text-emerald-400">
                          <Star className="w-2.5 h-2.5 fill-emerald-400" /> {String(product.supplier?.trustScore || 85)}%
                       </span>
                       <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-white/[0.02] px-2 py-0.5 rounded-md border border-white/[0.04]">
                          <MapPin className="w-2.5 h-2.5" /> {String(product.supplier?.location || "Global")}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </main>

      {/* Modals */}
      {product && (
        <PaymentModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          product={{
            id: product.id,
            title: product.title,
            priceInr: Number(product.priceInr),
            priceUsdc: usdcPrice,
            supplier: product.supplier,
          }}
          shippingDetails={buyerProfile}
          initialCurrency={selectedCurrency as any}
        />
      )}
      {product && (
        <BountyModal
          isOpen={showBountyModal}
          onClose={() => { setShowBountyModal(false); loadProduct(); }}
          product={product}
        />
      )}
      {product && (
        <SubmitProofModal
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
          bounty={selectedBounty}
          onSuccess={() => loadProduct()}
        />
      )}
      <BuyerProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
        onSave={handleProfileSave}
        initialData={buyerProfile}
      />
    </div>
  )
}
