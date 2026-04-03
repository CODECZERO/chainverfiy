"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useParams } from "next/navigation"
import type { RootState } from "@/lib/redux/store"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CheckCircle2, XCircle, Clock, MapPin, ExternalLink, MessageCircle, ShieldCheck, Package, Lightbulb, Coins, ArrowLeft, Star, QrCode, ArrowRight, Lock, Loader2, Globe, Activity, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { PaymentModal } from "@/components/payment-modal"
import { BountyModal } from "@/components/bounty-modal"
import { SubmitProofModal } from "@/components/submit-proof-modal"
import { BuyerProfileModal } from "@/components/buyer-profile-modal"
import { convertInrToUsdc, getUsdcInrRate } from "@/lib/exchange-rates"
import { getBountiesByProduct } from "@/lib/api-service"
import { useToast } from "@/components/ui/use-toast"
import { getIPFSUrl } from "@/lib/image-utils"
import { cn } from "@/lib/utils"

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

  useEffect(() => { loadProduct() }, [id])
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
      const productWalletQuery = publicKey ? `?wallet=${publicKey}` : ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}${productWalletQuery}`)
      const data = await res.json()
      setProduct(data.data)

      const bountyRes = await getBountiesByProduct(id as string)
      if (bountyRes.success) setBounties(bountyRes.data)

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
      const statusWalletQuery = publicKey ? `&wallet=${publicKey}` : ''

      const vRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/status?productId=${id}${statusWalletQuery}`, {
        headers: authHeader
      })
      const vData = await vRes.json()
      if (vData.success) {
        setIsVerifiedUserForThisProduct(vData.data.isVerified)
      }

      if (data.data.userHasVoted) setHasVoted(true)
    } catch (e) {
      console.error(e)
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
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/buyer`)
      if (publicKey) url.searchParams.append('stellarWallet', publicKey)
      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
      })
      const data = await res.json()
      if (data.success && data.data) {
        setBuyerProfile(data.data)
        setShowModal(true)
      } else {
        setShowProfileModal(true)
      }
    } catch (e) {
      setShowProfileModal(true)
    }
  }

  const handleProfileSave = async (data: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/buyer`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` 
        },
        body: JSON.stringify({ ...data, stellarWallet: publicKey })
      })
      const json = await res.json()
      if (json.success) {
        setBuyerProfile(json.data)
        setShowProfileModal(false)
        setShowModal(true)
      } else throw new Error(json.message)
    } catch (e: any) {
      toast({ title: "Save Failed", description: e.message || "Failed to save profile", variant: "destructive" })
    }
  }
  
  const handleVote = async (voteType: 'REAL' | 'FAKE' | 'NEEDS_MORE_PROOF') => {
    if (isVoting) return
    setIsVoting(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}/vote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` 
        },
        body: JSON.stringify({ userId: user?.id, stellarWallet: publicKey, voteType })
      })
      const data = await res.json()
      if (data.success) {
        setHasVoted(true)
        toast({ title: "Vote Cast Successfully", description: "Your contribution has been recorded on-chain." })
        loadProduct()
      } else {
        toast({ title: "Voting Failed", description: data.message, variant: "destructive" })
      }
    } catch (e: any) {
      toast({ title: "Error", description: "Network error occurred while voting.", variant: "destructive" })
    } finally {
      setIsVoting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#030408] text-foreground">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-24 animate-pulse space-y-12">
        <div className="h-4 bg-white/5 rounded-full w-48" />
        <div className="grid lg:grid-cols-12 gap-16">
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
    <div className="min-h-screen bg-[#030408] text-slate-200 pb-24 selection:bg-indigo-500/30 overflow-hidden relative">
      <Header />
      
      {/* ── Atmospheric Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="glow-orb w-[800px] h-[800px] bg-indigo-600/5 top-[-20%] right-[-10%] animate-float-slow" />
        <div className="glow-orb w-[600px] h-[600px] bg-blue-600/5 bottom-[-10%] left-[-10%] animate-float-fast" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
      </div>

      {/* ── Breadcrumb & Global ID ── */}
      <div className="glass-premium border-y border-white/[0.04] sticky top-14 md:top-16 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-8 relative z-10 flex items-center justify-between">
          <Link href="/marketplace" className="inline-flex items-center text-[10px] font-display font-black uppercase tracking-[0.4em] text-slate-500 hover:text-indigo-400 transition-all italic">
            <ArrowLeft className="w-4 h-4 mr-3" /> Market Exit
          </Link>
          <div className="flex items-center gap-4">
             <div className="px-5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[10px] font-display font-black text-slate-400 uppercase tracking-widest italic hidden sm:block">
                NODE_REF / {id?.slice(0, 8)}
             </div>
             <span className={cn(
               "inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-display font-black uppercase tracking-[0.2em] italic",
               isVerified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
             )}>
               {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
               {isVerified ? "Protocol Verified" : "Verification Pending"}
             </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 md:py-20 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">

          {/* ── Left Column: Media & Data (8 columns) ── */}
          <div className="lg:col-span-8 space-y-20">
            
            {/* 1. Brand & Title */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-indigo-500/40" />
                <span className="text-[10px] font-display font-black text-indigo-400 uppercase tracking-[0.5em] italic">Cryptographic Asset</span>
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tighter leading-[0.9] mb-8 text-white uppercase italic">
                {String(product.title || "")}
              </h1>
              <div className="bg-white/[0.02] border-l-4 border-indigo-500/30 rounded-r-3xl p-8 backdrop-blur-xl">
                 <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-4xl italic font-medium">
                   {String(product.description || "No localized description available for this unit identity.")}
                 </p>
              </div>
            </motion.div>

            {/* 2. Media visualizer */}
            <div className="space-y-6">
              <div className="aspect-[16/10] glass-premium rounded-[3rem] overflow-hidden relative group shadow-2xl">
                <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay pointer-events-none" />
                {product.proofMediaUrls?.[activeImg] ? (
                  <Image 
                    src={getIPFSUrl(product.proofMediaUrls[activeImg])} 
                    alt={product.title} 
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-1000"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700">
                    <Package className="w-24 h-24 mb-6 stroke-[1]" />
                    <span className="text-[10px] font-display font-black uppercase tracking-[0.3em] italic">Visual Evidence Unsynchronized</span>
                  </div>
                )}
              </div>
              
              {/* Floating Thumbnails */}
              {product.proofMediaUrls?.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 px-2">
                  {product.proofMediaUrls.map((_: string, i: number) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={cn(
                        "relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all duration-300",
                        i === activeImg 
                          ? "border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.4)] scale-110 z-10" 
                          : "border-transparent opacity-40 hover:opacity-100 scale-100"
                      )}
                    >
                      <Image src={getIPFSUrl(product.proofMediaUrls[i])} alt="" fill className="object-cover" />
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
                  <div className="text-[10px] font-display font-black text-indigo-400 uppercase tracking-[0.5em] mb-3 italic">Consensus Protocol v2.5</div>
                  <h3 className="text-3xl md:text-4xl font-display font-black flex items-center gap-4 text-white uppercase italic">
                    <ShieldCheck className="w-10 h-10 text-indigo-400" /> Decentralized Audit
                  </h3>
                </div>
                <Button 
                  onClick={() => setShowBountyModal(true)}
                  className="rounded-2xl h-14 px-10 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_20px_40px_rgba(79,70,229,0.3)] border-none text-[10px] font-display font-black uppercase tracking-[0.3em] italic transition-all active:scale-95"
                >
                  <Coins className="w-5 h-5 mr-3" /> Initiate Audit Bounty
                </Button>
              </div>

              <div className="grid sm:grid-cols-3 gap-8 mb-14">
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] p-10 text-center group-hover:border-indigo-500/30 transition-all backdrop-blur-xl">
                  <div className="text-6xl font-display font-black text-indigo-400 mb-2 italic tracking-tighter">{String(realPct)}%</div>
                  <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-[0.4em] italic">Trust Index</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] p-10 text-center backdrop-blur-xl">
                  <div className="text-6xl font-display font-black text-white mb-2 italic tracking-tighter">{String(total)}</div>
                  <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-[0.4em] italic">Total Signals</div>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] p-10 flex items-center justify-center gap-12 backdrop-blur-xl">
                  <div className="text-center">
                    <div className="text-3xl font-display font-black text-emerald-400 mb-1 italic">{String(product.voteReal)}</div>
                    <div className="text-[9px] font-display font-bold text-slate-600 uppercase tracking-widest italic">Verified</div>
                  </div>
                  <div className="w-px h-16 bg-white/5" />
                  <div className="text-center">
                    <div className="text-3xl font-display font-black text-red-500 mb-1 italic">{String(product.voteFake)}</div>
                    <div className="text-[9px] font-display font-bold text-slate-600 uppercase tracking-widest italic">Voided</div>
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
                      <h4 className="text-xl font-display font-black text-white uppercase italic flex items-center gap-3">
                        <Activity className="w-6 h-6 text-indigo-400" /> Buyer Governance
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">As a confirmed buyer, your assessment is critical to the trust economy.</p>
                    </div>
                  </div>

                  {!hasVoted && (
                    <div className="bg-indigo-600/[0.03] border border-indigo-500/10 rounded-3xl p-8">
                      <div className="space-y-4 mb-8">
                        <p className="text-lg font-display font-bold text-slate-300 uppercase tracking-widest italic">Did you receive the product as described? Cast your verdict:</p>
                        <p className="text-xs text-slate-500 italic">Note: Voting rewards you with 1 Trust Token and contributes to the product's final verification status. Each user can only vote once per product entry.</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => handleVote('REAL')}
                          disabled={isVoting}
                          className="h-16 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 font-display font-black uppercase tracking-widest italic transition-all"
                        >
                          {isVoting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-3" />}
                          Validate Unit
                        </Button>
                        <Button 
                          onClick={() => handleVote('FAKE')}
                          disabled={isVoting}
                          className="h-16 rounded-2xl bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 font-display font-black uppercase tracking-widest italic transition-all"
                        >
                          {isVoting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <XCircle className="w-5 h-5 mr-3" />}
                          Void Identity
                        </Button>
                      </div>
                    </div>
                  )}
                  {hasVoted && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-3xl flex items-center justify-center gap-3">
                       <Sparkles className="w-6 h-6 text-emerald-400" />
                       <span className="text-sm font-display font-black text-emerald-400 uppercase tracking-widest italic">Governance Contribution Synchronized</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Traceability Ledger */}
            {product.stageUpdates?.length > 0 && (
              <div className="pt-8">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="h-px w-10 bg-indigo-500/40" />
                    <span className="text-[10px] font-display font-black text-indigo-400 uppercase tracking-[0.5em] italic">Origin Timeline</span>
                 </div>
                <h3 className="text-3xl font-display font-black mb-12 text-white uppercase italic flex items-center gap-4">
                  <Globe className="w-8 h-8 text-indigo-400" /> Traceability Ledger
                </h3>
                
                <div className="pl-8 md:pl-12 border-l-2 border-white/[0.08] space-y-12 md:space-y-16 relative">
                  {product.stageUpdates.map((s: any, i: number) => (
                    <div key={s.id} className="relative">
                      {/* Timeline Hub */}
                      <div className="absolute -left-[42px] md:-left-[64px] top-4 w-8 md:w-12 h-8 md:h-12 rounded-lg md:rounded-[1.25rem] bg-[#030408] border border-indigo-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] z-10">
                         <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-indigo-500 animate-pulse" />
                      </div>
                      
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="glass-premium rounded-[2.5rem] p-10 hover:border-indigo-500/30 transition-all group/trail"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                          <h4 className="text-2xl font-display font-black text-white uppercase italic tracking-tight">{String(s.stageName || "LOG_ENTRY")}</h4>
                          <span className="text-[10px] text-slate-500 font-display font-black uppercase tracking-[0.3em] bg-white/[0.03] px-5 py-2.5 rounded-xl border border-white/[0.06] italic">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TIMESTAMP_MISSING'}
                          </span>
                        </div>
                        
                        {s.note && <p className="text-xl text-slate-400 mb-10 leading-relaxed italic font-medium border-l-2 border-indigo-500/20 pl-6">"{String(s.note)}"</p>}
                        
                        <div className="flex flex-wrap items-center gap-4">
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
                               className="inline-flex items-center gap-3 text-[10px] font-display font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-6 py-4 rounded-2xl hover:bg-blue-500/20 transition-all italic">
                              <ExternalLink className="w-4 h-4" /> Ledger Verified
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
            <div className="glass-premium rounded-[3rem] p-10 border border-white/[0.08] shadow-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
              
              <div className="mb-12">
                <div className="text-[10px] font-display font-black text-indigo-400 uppercase tracking-[0.5em] mb-8 italic">Strategic Acquisition</div>
                <div className="flex flex-col gap-10">
                  <div className="flex flex-col bg-[#030408]/60 border border-white/[0.06] p-10 rounded-[3rem] shadow-inner relative group/price">
                    <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover/price:opacity-100 transition-opacity pointer-events-none" />
                    <div className="text-[10px] font-display font-black text-slate-600 uppercase tracking-[0.3em] mb-4 italic">Settlement Evaluation</div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-5xl font-display font-black text-white tracking-tighter italic">₹{Number(product.priceInr || 0).toLocaleString()}</span>
                        <span className="text-slate-500 font-display font-black text-xs uppercase italic tracking-widest text-slate-600">INR</span>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="h-px flex-1 bg-white/[0.06]" />
                         <span className="text-[9px] font-display font-black text-indigo-500 uppercase italic">Convert Pulse</span>
                         <div className="h-px flex-1 bg-white/[0.06]" />
                      </div>
                      <div className="mt-4 flex items-baseline justify-end gap-3">
                        <span className="text-[10px] text-slate-500 font-display font-black uppercase tracking-widest italic">Equivalent</span>
                        <span className="text-4xl font-display font-black text-indigo-400 tracking-tighter italic font-mono">
                          {(() => {
                            const price = Number(product.priceInr || 0)
                            if (selectedCurrency === 'USDC') return (price / (allRates?.USDC?.inr || 83.33)).toFixed(2)
                            if (selectedCurrency === 'USDT') return (price / (allRates?.USDT?.inr || 83.33)).toFixed(2)
                            if (selectedCurrency === 'XLM') return (price / (allRates?.XLM?.inr || 28.6)).toFixed(1)
                            return price.toLocaleString()
                          })()}
                        </span>
                        <span className="text-sm text-indigo-500/60 font-display font-black uppercase italic tracking-widest">{selectedCurrency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 bg-white/[0.02] p-2 rounded-2xl border border-white/[0.04]">
                    {PAYMENT_CURRENCIES.map(c => (
                      <button key={c} onClick={() => setSelectedCurrency(c)}
                        className={cn(
                          "flex-1 text-[10px] font-display font-black py-4 rounded-xl transition-all border italic",
                          selectedCurrency === c 
                            ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_25px_rgba(79,70,229,0.4)]" 
                            : "bg-transparent border-transparent text-slate-600 hover:text-slate-300"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Escrow Protocol Notice */}
              <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 mb-12 flex gap-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-[10px] text-indigo-200/60 leading-relaxed font-display font-bold uppercase tracking-[0.15em] italic">
                  Funds strictly secured in <span className="text-indigo-400 font-black">Soroban Smart Escrow</span>. 
                  Final settlement occurs post-consensus verification.
                </div>
              </div>

              <Button onClick={checkProfileAndBuy} className="w-full rounded-[2rem] h-20 text-[11px] font-display font-black uppercase tracking-[0.4em] bg-white text-black hover:bg-slate-200 shadow-[0_25px_70px_rgba(255,255,255,0.08)] transition-all transform active:scale-[0.98] italic">
                Initiate Acquisition <ArrowRight className="w-5 h-5 ml-4" />
              </Button>
            </div>

            {/* Provider Module */}
            <Link href={`/supplier/${product.supplier?.id}`} className="block">
              <div className="glass-premium border border-white/[0.06] hover:border-indigo-500/30 rounded-[3rem] p-8 transition-all group overflow-hidden relative">
                <div className="absolute inset-0 bg-indigo-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center font-display font-black text-3xl text-white shadow-2xl group-hover:scale-110 transition-transform italic">
                    {String(product.supplier?.name?.[0] || "S")}
                  </div>
                  <div>
                    <div className="text-[9px] font-display font-black text-slate-600 uppercase tracking-widest mb-1 italic">Identity Provider</div>
                    <h4 className="font-display font-black text-xl text-white group-hover:text-indigo-400 transition-colors uppercase italic tracking-tight">
                      {String(product.supplier?.name || "Protocol Supplier")}
                    </h4>
                    <div className="flex items-center gap-4 mt-2">
                       <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                          <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                          <span className="text-[10px] font-display font-black text-emerald-400 italic">{String(product.supplier?.trustScore || 85)}%</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
                          <MapPin className="w-3.5 h-3.5" /> {String(product.supplier?.location || "GLOBAL_NODE")}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>

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
