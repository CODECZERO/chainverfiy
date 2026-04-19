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
    <div className={cn("min-h-screen bg-[#05060A] text-slate-200", inter.className)}>
      <Header />
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-32 animate-pulse space-y-12">
        <div className="h-4 bg-white/5 rounded-full w-48" />
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-8 space-y-8">
            <div className="aspect-[16/10] bg-white/5 rounded-[3rem]" />
            <div className="h-16 bg-white/5 rounded-2xl w-3/4" />
          </div>
          <div className="lg:col-span-4 h-[600px] bg-white/5 rounded-[3rem]" />
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
    <div className={cn("min-h-screen bg-[#05060A] text-slate-200 pb-24 selection:bg-indigo-500/30 overflow-x-hidden relative", inter.className)}>
      <Header />
      
      {/* ── Atmospheric Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-float-fast" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px] animate-float-slow" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <main className="relative z-10 pt-32">
        {/* ── Breadcrumb & Global ID ── */}
        <div className="glass-premium border-y border-white/[0.04]">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 md:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link href="/marketplace" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-indigo-400 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
            </Link>
            <div className="flex items-center gap-4">
               <div className="px-5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[10px] font-bold text-slate-400">
                  PRODUCT ID / {id?.slice(0, 8)}
               </div>
               <span className={cn(
                 "inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold",
                 isVerified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
               )}>
                 {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                 {isVerified ? "Verified" : "Verification Pending"}
               </span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">

          {/* ── Left Column: Media & Data (8 columns) ── */}
          <div className="lg:col-span-8 space-y-20">
            
            {/* 1. Brand & Title */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  Verified Product
                </span>
                <span className="px-3 py-1 bg-white/[0.03] border border-white/[0.08] text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                  Immutable Record
                </span>
              </div>
              <h1 className={`${outfit.className} text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-sm`}>
                {String(product.title || "")}
              </h1>
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-600 rounded-full" />
                 <div className="bg-white/[0.02] border border-white/[0.04] rounded-r-3xl rounded-l-sm p-8 backdrop-blur-xl group-hover:bg-white/[0.03] transition-colors">
                   <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-4xl font-medium">
                     {String(product.description || "No localized description available for this unit identity.")}
                   </p>
                 </div>
              </div>
            </motion.div>

            {/* 2. Media visualizer */}
            <div className="space-y-6">
              <div className="aspect-[16/10] glass-premium rounded-[3rem] overflow-hidden relative group shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] border border-white/[0.1]">
                <div className="absolute inset-0 bg-gradient-to-t from-[#05060A] via-transparent to-transparent opacity-80 z-10 pointer-events-none" />
                <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay pointer-events-none z-10" />
                
                {/* On-Chain Watermark */}
                <div className="absolute top-6 left-8 z-20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-display font-black text-emerald-400/80 uppercase tracking-[0.3em] drop-shadow-md">On-Chain Proof</span>
                </div>

                {product.proofMediaUrls?.[activeImg] ? (
                  <Image 
                    src={getIPFSUrl(product.proofMediaUrls[activeImg])} 
                    alt={product.title} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out z-0"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 bg-[#020305] z-0">
                    <Package className="w-24 h-24 mb-6 stroke-[1]" />
                    <span className="text-[10px] font-display font-black uppercase tracking-[0.3em]">Visual Evidence Unsynchronized</span>
                  </div>
                )}
                
                {/* Inner Glow Ring */}
                <div className="absolute inset-0 rounded-[3rem] ring-1 ring-inset ring-white/10 pointer-events-none z-20" />
              </div>
              
              {/* Floating Thumbnails */}
              {product.proofMediaUrls?.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide">
                  {product.proofMediaUrls.map((_: string, i: number) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={cn(
                        "relative w-24 h-24 rounded-[1.25rem] overflow-hidden shrink-0 border-2 transition-all duration-300 group/thumb",
                        i === activeImg 
                          ? "border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.4)] scale-110 z-10" 
                          : "border-white/5 opacity-50 hover:opacity-100 hover:border-white/20 scale-100"
                      )}
                    >
                      <Image src={getIPFSUrl(product.proofMediaUrls[i])} alt="" fill className="object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
                      <div className={cn("absolute inset-0 transition-opacity duration-300", i === activeImg ? "bg-indigo-500/10" : "bg-black/40 group-hover/thumb:bg-black/20")} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Consensus Engine Block */}
            <div className="glass-premium rounded-[3rem] p-8 md:p-14 border border-white/[0.08] shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-16">
                <div>
                  <div className="text-xs font-semibold text-indigo-400 mb-2">Community Verification</div>
                  <h3 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-white">
                    <ShieldCheck className="w-8 h-8 text-indigo-400" /> Community Review
                  </h3>
                </div>
                <Button 
                  onClick={() => setShowBountyModal(true)}
                  className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all active:scale-95 shadow-lg"
                >
                  <Coins className="w-4 h-4 mr-2" /> Request Verification
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-[#020305] border border-white/[0.04] rounded-[2rem] p-6 md:p-8 text-center group-hover:border-indigo-500/20 transition-all shadow-inner ring-1 ring-inset ring-black/50 relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
                  <div className="text-5xl lg:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-blue-600 mb-3 tracking-tighter drop-shadow-sm">{String(realPct)}%</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Trust Score
                  </div>
                </div>
                
                <div className="bg-[#020305] border border-white/[0.04] rounded-[2rem] p-6 md:p-8 text-center transition-all shadow-inner ring-1 ring-inset ring-black/50 flex flex-col justify-center">
                  <div className="text-5xl lg:text-6xl font-display font-black text-white mb-3 tracking-tighter">{String(total)}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Total Votes
                  </div>
                </div>
                
                <div className="bg-[#020305] border border-white/[0.04] rounded-[2rem] p-6 md:p-8 flex flex-col justify-center gap-4 shadow-inner ring-1 ring-inset ring-black/50">
                  <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-3">
                    <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Authentic
                    </div>
                    <div className="text-2xl font-display font-black text-emerald-400">{String(product.voteReal)}</div>
                  </div>
                  <div className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                    <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5" /> Fake
                    </div>
                    <div className="text-2xl font-display font-black text-red-400">{String(product.voteFake)}</div>
                  </div>
                </div>
              </div>

              <div className="relative h-2 bg-white/[0.03] rounded-full overflow-hidden mb-4 border border-white/[0.04]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${realPct}%` }}
                  transition={{ duration: 2, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.6)]" 
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
                    <div className="bg-indigo-600/[0.03] border border-indigo-500/10 rounded-3xl p-8">
                      <div className="space-y-4 mb-8">
                        <p className="text-lg font-bold text-slate-300">Did you receive the product as described?</p>
                        <p className="text-xs text-slate-500 font-medium opacity-80">Your vote helps verify this product on the blockchain and earns you community points.</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => handleVote('REAL')}
                          disabled={isVoting}
                          className="h-16 rounded-[1.25rem] bg-[#020305] hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] group/vote"
                        >
                          {isVoting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-3 group-hover/vote:scale-110 transition-transform" />}
                          Confirm Authentic
                        </Button>
                        <Button 
                          onClick={() => handleVote('FAKE')}
                          disabled={isVoting}
                          className="h-16 rounded-[1.25rem] bg-[#020305] hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/20 font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.05)] hover:shadow-[0_0_30px_rgba(239,68,68,0.15)] group/vote"
                        >
                          {isVoting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <XCircle className="w-5 h-5 mr-3 group-hover/vote:scale-110 transition-transform" />}
                          Flag as Fake
                        </Button>
                      </div>
                    </div>
                  )}
                  {hasVoted && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-3xl flex items-center justify-center gap-3">
                       <Sparkles className="w-6 h-6 text-emerald-400" />
                       <span className="text-sm font-bold text-emerald-400">Feedback Recorded on Blockchain</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3.5. Bounty Hub (Restored) */}
            {bounties?.length > 0 && (
              <div className="glass-premium rounded-[3rem] p-8 md:p-14 border border-amber-500/10 shadow-3xl relative overflow-hidden group bg-amber-500/[0.02]">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-600/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                  <div>
                    <div className="text-xs font-semibold text-amber-500 mb-2">Proof Incentives</div>
                    <h3 className="text-2xl md:text-3xl font-bold flex items-center gap-4 text-white">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                         <Coins className="w-7 h-7 text-amber-500" />
                      </div>
                      Active Bounties
                    </h3>
                  </div>
                  <div className="px-5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase text-amber-500 tracking-wider">
                    {bounties.length} Request{bounties.length > 1 ? 's' : ''} Open
                  </div>
                </div>

                <div className="grid gap-6">
                  {bounties.map((b) => (
                    <motion.div 
                      key={b.id} 
                      whileHover={{ x: 10 }}
                      className="flex flex-col md:flex-row items-center gap-8 bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] p-8 md:p-10 hover:border-amber-500/30 transition-all group/bounty"
                    >
                      <div className="flex-1 min-w-0 text-center md:text-left">
                        <p className={`${inter.className} text-xl font-bold text-white mb-4 leading-relaxed`}>"{b.description}"</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <span className="flex items-center gap-2"><UserIcon className="w-3.5 h-3.5" /> Issuer: {b.issuer?.email?.split('@')[0] || "Community"}</span>
                          <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-slate-800" />
                          <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/[0.05] pt-8 md:pt-0 md:pl-10">
                        <div className="text-center md:text-right flex-1 md:flex-none">
                          <div className="text-[10px] font-bold text-slate-600 uppercase mb-2 tracking-widest">Reward Pool</div>
                          <div className={`${outfit.className} text-3xl font-bold text-amber-500 tracking-tighter`}>₹{b.amount}</div>
                        </div>
                        <Button 
                          onClick={() => { setSelectedBounty(b); setShowProofModal(true); }}
                          className="h-14 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all active:scale-95 shadow-xl shadow-amber-900/10 flex-1 md:flex-none"
                        >
                          Fulfill Proof
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Traceability Ledger */}
            {product.stageUpdates?.length > 0 && (
              <div className="pt-8">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs font-semibold text-indigo-400">Product History</span>
                 </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-10 text-white flex items-center gap-3">
                  <Globe className="w-8 h-8 text-indigo-400" /> Product History
                </h3>
                
                <div className="pl-8 md:pl-12 border-l-2 border-indigo-500/20 space-y-12 md:space-y-16 relative">
                  <div className="absolute top-0 bottom-0 left-[-2px] w-[2px] bg-gradient-to-b from-indigo-500/50 via-blue-500/50 to-transparent" />
                  {product.stageUpdates.map((s: any, i: number) => (
                    <div key={s.id} className="relative z-10">
                      {/* Timeline Hub */}
                      <div className="absolute -left-[42px] md:-left-[64px] top-6 w-8 md:w-12 h-8 md:h-12 rounded-full bg-[#020305] border-2 border-indigo-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] z-10 group-hover/trail:border-indigo-400 group-hover/trail:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all">
                         <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-[#020305]/80 border border-white/[0.04] rounded-[2rem] p-6 md:p-10 hover:border-indigo-500/40 transition-all group/trail shadow-inner ring-1 ring-inset ring-black/50 backdrop-blur-xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />
                        <div className="flex flex-wrap items-center justify-between gap-6 mb-8 relative z-10">
                          <h4 className="text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-sm">{String(s.stageName || "LOG_ENTRY")}</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white/[0.03] px-4 py-2 rounded-full border border-white/[0.06] shadow-inner">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TIMESTAMP_MISSING'}
                          </span>
                        </div>
                        
                        {s.note && <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed italic font-medium border-l-2 border-indigo-500/40 pl-6 relative z-10">"{String(s.note)}"</p>}
                        
                        <div className="flex flex-wrap items-center gap-4 relative z-10">
                          {(s.gpsLat && s.gpsLng) && (
                            <a href={`https://www.google.com/maps?q=${encodeURIComponent(`${s.gpsLat},${s.gpsLng}`)}`}
                               target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-3 text-[10px] font-display font-black uppercase tracking-[0.2em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-6 py-4 rounded-2xl hover:bg-indigo-500/20 transition-all italic">
                              <MapPin className="w-4 h-4" />
                              {String(s.gpsAddress ? s.gpsAddress : "COORD_LOCK")}
                            </a>
                          )}
                          {s.stellarTxId && (
                            <a href={`https://stellar.expert/explorer/testnet/tx/${s.stellarTxId}`} 
                               target="_blank" rel="noopener noreferrer" 
                               className="inline-flex items-center gap-3 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-5 py-3 rounded-xl hover:bg-blue-500/20 transition-all">
                              <ExternalLink className="w-4 h-4" /> Blockchain Verified
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
          <div className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-8">

            {/* Acquisition Interface */}
            <div className="glass-premium rounded-[2.5rem] p-6 md:p-10 border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden group bg-[#020305]/40">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              
              <div className="mb-10 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Zap className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-sm font-bold text-slate-300 tracking-tight">Acquisition Portal</div>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="flex flex-col bg-[#020305] border border-white/[0.04] p-8 rounded-[2rem] relative shadow-inner ring-1 ring-inset ring-black/50">
                    <div className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-widest flex items-center justify-between">
                      Base Price
                      <span className="px-2 py-0.5 bg-white/[0.05] rounded-full text-slate-400">Fixed</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-5xl lg:text-6xl font-display font-black text-white tracking-tighter italic drop-shadow-md">₹{Number(product.priceInr || 0).toLocaleString()}</span>
                        <span className="text-slate-500 font-display font-black text-sm uppercase italic tracking-widest text-slate-600">INR</span>
                      </div>
                      
                      <div className="relative py-4">
                         <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-white/[0.03]" /></div>
                         <div className="relative flex justify-center"><span className="bg-[#020305] px-4 text-[9px] font-display font-black text-indigo-500/70 uppercase italic tracking-[0.2em]">Live Conversion</span></div>
                      </div>

                      <div className="mt-4 flex items-baseline justify-between gap-3">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Payable</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl lg:text-5xl font-display font-black text-emerald-400 tracking-tighter italic font-mono drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                            {(() => {
                              const price = Number(product.priceInr || 0)
                              if (selectedCurrency === 'USDC') return (price / (allRates?.USDC?.inr || 83.33)).toFixed(2)
                              if (selectedCurrency === 'USDT') return (price / (allRates?.USDT?.inr || 83.33)).toFixed(2)
                              if (selectedCurrency === 'XLM') return (price / (allRates?.XLM?.inr || 28.6)).toFixed(1)
                              return price.toLocaleString()
                            })()}
                          </span>
                          <span className="text-sm text-emerald-500/60 font-display font-black uppercase italic tracking-widest">{selectedCurrency}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.04]">
                    {PAYMENT_CURRENCIES.map(c => (
                      <button key={c} onClick={() => setSelectedCurrency(c)}
                        className={cn(
                          "flex-1 text-[10px] font-bold py-3.5 rounded-[14px] transition-all tracking-widest",
                          selectedCurrency === c 
                            ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 shadow-[0_0_20px_rgba(79,70,229,0.2)]" 
                            : "bg-transparent border border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Escrow Protocol Notice */}
              <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-[2rem] p-6 mb-10 flex gap-4 relative z-10 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-[10px] text-emerald-200/60 leading-relaxed font-bold uppercase tracking-widest mt-1">
                  Funds strictly secured in <span className="text-emerald-400 font-black">Soroban Smart Escrow</span>. 
                  Final settlement occurs post-verification.
                </div>
              </div>

               <Button onClick={checkProfileAndBuy} className="w-full rounded-[1.5rem] h-16 text-sm font-bold bg-white text-black hover:bg-indigo-50 transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] relative z-10 group/btn">
                <span className="flex items-center gap-2">Initiate Purchase <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" /></span>
              </Button>
            </div>

            {/* Provider Module */}
            <Link href={`/supplier/${product.supplier?.id}`} className="block">
              <div className="glass-premium border border-white/[0.06] hover:border-indigo-500/30 rounded-[3rem] p-8 transition-all group overflow-hidden relative">
                <div className="absolute inset-0 bg-indigo-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center font-display font-black text-3xl text-white shadow-2xl group-hover:scale-110 transition-transform italic shrink-0">
                    {String(product.supplier?.name?.[0] || "S").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Seller</div>
                    <h4 className="font-bold text-xl text-white group-hover:text-indigo-400 transition-colors tracking-tight truncate">
                      {String(product.supplier?.name || "Verified Supplier")}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                       <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                          <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{String(product.supplier?.trustScore || 85)}% Trust</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/[0.02] px-3 py-1.5 rounded-xl border border-white/[0.04]">
                          <MapPin className="w-3 h-3" /> <span className="truncate max-w-[100px] sm:max-w-none">{String(product.supplier?.location || "Global")}</span>
                       </div>
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
