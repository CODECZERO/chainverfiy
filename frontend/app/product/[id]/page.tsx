"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { useParams } from "next/navigation"
import type { RootState } from "@/lib/redux/store"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CheckCircle2, XCircle, Clock, MapPin, ExternalLink, MessageCircle, ShieldCheck, Package, Lightbulb, Coins, ArrowLeft, Star, QrCode, ArrowRight, Lock, Loader2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { PaymentModal } from "@/components/payment-modal"
import { BountyModal } from "@/components/bounty-modal"
import { SubmitProofModal } from "@/components/submit-proof-modal"
import { BuyerProfileModal } from "@/components/buyer-profile-modal"
import { convertInrToUsdc, getUSDCInrRate } from "@/lib/exchange-rates"
import { getBountiesByProduct } from "@/lib/api-service"
import { useToast } from "@/components/ui/use-toast"
import { getIPFSUrl } from "@/lib/image-utils"

const PAYMENT_CURRENCIES = ["USDC", "USDT", "XLM"]

export default function ProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState("USDC")
  const [showPayment, setShowPayment] = useState(false)
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`)
      const data = await res.json()
      setProduct(data.data)

      const bountyRes = await getBountiesByProduct(id as string)
      if (bountyRes.success) setBounties(bountyRes.data)

      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {}
      const walletQuery = publicKey ? `&wallet=${publicKey}` : ''

      const vRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/status?productId=${id}${walletQuery}`, {
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-8">
        <div className="h-8 bg-muted rounded w-32" />
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-[4/3] bg-muted rounded-3xl" />
            <div className="h-10 bg-muted rounded w-3/4" />
          </div>
          <div className="h-96 bg-muted rounded-3xl" />
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
    <div className="min-h-screen bg-[#05060B] text-foreground pb-24 selection:bg-blue-500/30 selection:text-blue-200">
      <Header />
      
      {/* ── Dynamic Atmospheric Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      {/* ── Breadcrumb ── */}
      <div className="border-b border-white/[0.04] bg-[#0A0D14]/80 backdrop-blur-3xl sticky top-16 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/marketplace" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all italic">
            <ArrowLeft className="w-4 h-4 mr-3" /> Back to Market Index
          </Link>
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic ${
              isVerified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
            }`}>
              {isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              {isVerified ? "Oracle Verified" : "Analysis Pending"}
            </span>
            {isVerifiedUserForThisProduct && (
              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 italic">
                <ShieldCheck className="w-3.5 h-3.5" /> Licensed Auditor
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-16 relative z-10">
        <div className="grid lg:grid-cols-12 gap-16">

          {/* ── Left Column: Media & Details (8 columns) ── */}
          <div className="lg:col-span-8 space-y-16">
            
            {/* 1. Header & Title */}
            <div>
              <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-6 italic flex items-center gap-3">
                 <div className="w-8 h-[1px] bg-blue-500/30" />
                 Product Identity Node
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-10 text-white uppercase italic">
                {String(product.title || "")}
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed max-w-3xl font-medium italic border-l-2 border-white/5 pl-8">
                {String(product.description || "")}
              </p>
            </div>

            {/* 2. Media Gallery */}
            <div className="space-y-6">
              <div className="aspect-[16/10] bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] overflow-hidden relative group shadow-2xl">
                <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay pointer-events-none" />
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
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">No Visual Evidence Synchronized</span>
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              {product.proofMediaUrls?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {product.proofMediaUrls.map((_: string, i: number) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                        i === activeImg ? "border-orange-500 shadow-[0_0_15px_rgba(232,119,46,0.3)] scale-100" : "border-transparent opacity-60 hover:opacity-100 scale-95"
                      }`}
                    >
                      <Image src={getIPFSUrl(product.proofMediaUrls[i])} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Verification Trust Block */}
            <div className="bg-[#0A0D14]/80 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/[0.08] shadow-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
                <div>
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-3 italic">Consensus Protocol v2.4</div>
                  <h3 className="text-3xl font-black flex items-center gap-4 text-white uppercase italic">
                    <ShieldCheck className="w-8 h-8 text-blue-400" /> Community Audit
                  </h3>
                </div>
                <Button 
                  onClick={() => setShowBountyModal(true)}
                  className="rounded-2xl h-14 px-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_20px_40px_rgba(37,99,235,0.2)] border-none text-[10px] font-black uppercase tracking-[0.2em] italic transition-all active:scale-95"
                >
                  <Coins className="w-5 h-5 mr-3" /> Request Deep Audit
                </Button>
              </div>

              <div className="grid sm:grid-cols-3 gap-8 mb-12">
                <div className="bg-[#0C0F17]/50 border border-white/[0.04] rounded-[2rem] p-8 text-center group-hover:border-blue-500/20 transition-all">
                  <div className="text-5xl font-black text-blue-400 mb-3 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)] italic">{String(realPct)}%</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Trust Index</div>
                </div>
                <div className="bg-[#0C0F17]/50 border border-white/[0.04] rounded-[2rem] p-8 text-center">
                  <div className="text-5xl font-black text-white mb-3 italic">{String(total)}</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Node Validations</div>
                </div>
                <div className="bg-[#0C0F17]/50 border border-white/[0.04] rounded-[2rem] p-8 flex items-center justify-center gap-10">
                  <div className="text-center">
                    <div className="text-2xl font-black text-emerald-400 mb-1 flex items-center justify-center gap-2 italic">{String(product.voteReal)}</div>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Valid</div>
                  </div>
                  <div className="w-px h-12 bg-white/5" />
                  <div className="text-center">
                    <div className="text-2xl font-black text-red-500 mb-1 flex items-center justify-center gap-2 italic">{String(product.voteFake)}</div>
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Void</div>
                  </div>
                </div>
              </div>

              <div className="h-4 bg-[#0C0F17] rounded-full overflow-hidden p-1 border border-white/[0.04] shadow-inner mb-2 text-white">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${realPct}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)]" 
                />
              </div>

              {/* ── Verified Buyer Governance ── */}
              {isVerifiedUserForThisProduct && (
                <div className="mt-8 pt-8 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-400" /> Buyer Governance
                      </h4>
                      <p className="text-sm text-slate-500">As a confirmed buyer, your assessment is critical to the trust economy.</p>
                    </div>
                    {hasVoted && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Consensus Contribution Recorded
                      </span>
                    )}
                  </div>

                  {!hasVoted && (
                    <div className="bg-[#0C0F17] border border-white/[0.04] rounded-2xl p-6">
                      <p className="text-sm font-semibold text-slate-300 mb-4">Did you receive the product as described? Cast your verdict:</p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Button 
                          onClick={() => handleVote('REAL')}
                          disabled={isVoting}
                          className="h-14 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold transition-all"
                        >
                          {isVoting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                          It's Authentic
                        </Button>
                        <Button 
                          onClick={() => handleVote('FAKE')}
                          disabled={isVoting}
                          className="h-14 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-bold transition-all"
                        >
                          {isVoting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                          It's Counterfeit
                        </Button>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-4 text-center">
                        Note: Voting rewards you with 1 Trust Token and contributes to the product's final verification status.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Active Bounties Loop */}
            {bounties?.filter(b => b.status === "ACTIVE").length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <Coins className="w-6 h-6 text-amber-500" /> Active Open Bounties
                </h3>
                <div className="grid gap-4">
                  {bounties.filter(b => b.status === "ACTIVE").map((b) => (
                    <div key={b.id} className="premium-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-amber-500/20">
                      <div className="flex-1">
                        <p className="text-base font-medium text-slate-200">{String(b.description || "")}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Reward: ₹{Number(b.amount || 0).toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            By {b.issuer?.email || (b.issuerWallet ? `${b.issuerWallet.slice(0, 6)}...` : "Anon")}
                          </span>
                        </div>
                      </div>
                      {isVerifiedUserForThisProduct && (
                        <Button 
                          onClick={() => { setSelectedBounty(b); setShowProofModal(true) }}
                          className="shrink-0 w-full sm:w-auto rounded-xl h-11 bg-accent text-accent-foreground hover:bg-white hover:text-black font-semibold transition-all"
                        >
                          Submit Proof
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Production Journey Timeline */}
            {product.stageUpdates?.length > 0 && (
              <div className="pt-12">
                 <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-6 italic flex items-center gap-3">
                    <div className="w-8 h-[1px] bg-blue-500/30" />
                    Immutable Origin Ledger
                 </div>
                <h3 className="text-4xl font-black mb-12 text-white uppercase italic">Audit Trail</h3>
                <div className="pl-12 border-l border-white/[0.08] space-y-16 relative">
                   <div className="absolute top-0 left-[-1px] w-[1px] h-full bg-gradient-to-b from-blue-500/50 via-white/5 to-transparent" />
                  {product.stageUpdates.map((s: any, i: number) => (
                    <div key={s.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[57px] top-2 w-10 h-10 rounded-2xl bg-[#05060B] border border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.2)] group-hover:scale-110 transition-transform">
                         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      </div>
                      
                      <div className="bg-[#0A0D14]/60 backdrop-blur-3xl border border-white/[0.06] rounded-[2.5rem] p-10 hover:border-blue-500/20 transition-all group/trail">
                        <div className="flex flex-wrap items-center justify-between gap-6 mb-6">
                          <h4 className="text-2xl font-black text-white uppercase italic">{String(s.stageName || "Data Point")}</h4>
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-white/[0.02] px-4 py-2 rounded-xl border border-white/[0.04] italic">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                        
                        {s.note && <p className="text-lg text-slate-400 mb-8 leading-relaxed italic font-medium">"{String(s.note)}"</p>}
                        
                        <div className="flex flex-wrap items-center gap-4">
                          {(s.gpsLat && s.gpsLng) && (
                            <a href={`https://www.google.com/maps?q=${encodeURIComponent(`${s.gpsLat},${s.gpsLng}`)}`}
                               target="_blank" rel="noopener noreferrer"
                               className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-6 py-3 rounded-2xl hover:bg-blue-500/20 transition-all italic">
                              <MapPin className="w-4 h-4" />
                              {String(s.gpsAddress ? s.gpsAddress : "Verified Coordinates")}
                            </a>
                          )}
                          {s.stellarTxId && (
                            <a href={`https://stellar.expert/explorer/testnet/tx/${s.stellarTxId}`} 
                               target="_blank" rel="noopener noreferrer" 
                               className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-6 py-3 rounded-2xl hover:bg-indigo-500/20 transition-all italic">
                              <ExternalLink className="w-4 h-4" /> Soroban Record
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Column: Payment & Supplier (4 columns) ── */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 space-y-6">

              {/* Checkout Box */}
              <div className="bg-[#0A0D14]/80 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/[0.08] shadow-3xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="mb-10">
                  <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6 italic">Strategic Acquisition</div>
                  <div className="flex flex-col gap-8">
                    <div className="flex items-center justify-between bg-black/40 border border-white/[0.04] p-8 rounded-[2.5rem] shadow-inner">
                      <div>
                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Local Value</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black text-white tracking-tighter italic">₹{Number(product.priceInr || 0).toLocaleString()}</span>
                          <span className="text-slate-500 font-black text-[10px] uppercase italic">INR</span>
                        </div>
                      </div>
                      <div className="h-12 w-px bg-white/[0.06]" />
                      <div className="text-right">
                        <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 italic">Settlement</div>
                        <div className="text-3xl font-black text-blue-400 font-mono tracking-tight italic">
                          {(() => {
                            const price = Number(product.priceInr || 0)
                            if (selectedCurrency === 'USDC') return (price / (allRates?.USDC?.inr || 83.33)).toFixed(2)
                            if (selectedCurrency === 'USDT') return (price / (allRates?.USDT?.inr || 83.33)).toFixed(2)
                            if (selectedCurrency === 'XLM') return (price / (allRates?.XLM?.inr || 28.6)).toFixed(1)
                            return price.toLocaleString()
                          })()}
                          <span className="ml-2 text-[10px] text-blue-500/50 uppercase italic">{selectedCurrency}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3 bg-white/[0.02] p-2 rounded-2xl border border-white/[0.04]">
                      {PAYMENT_CURRENCIES.map(c => (
                        <button 
                          key={c}
                          onClick={() => setSelectedCurrency(c)}
                          className={`flex-1 text-[10px] font-black py-4 rounded-xl transition-all border italic ${selectedCurrency === c ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-transparent border-transparent text-slate-600 hover:text-slate-300'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Escrow Notice */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-10 flex gap-4">
                  <Lock className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-100/70 leading-relaxed font-black uppercase tracking-wider italic">
                    Funds strictly secured in <span className="text-blue-400">Soroban Smart Escrow</span>. 
                    Settlement occurs post-verification.
                  </div>
                </div>

                <Button onClick={checkProfileAndBuy} className="w-full rounded-[1.5rem] h-20 text-[11px] font-black uppercase tracking-[0.3em] bg-white text-black hover:bg-slate-200 shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all transform active:scale-95 italic">
                  Initiate Secure Transaction <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
              </div>

              {/* Supplier Box */}
              <Link href={`/supplier/${product.supplier?.id}`} className="block">
                <div className="bg-[#111827] border border-white/[0.04] hover:border-white/[0.1] rounded-[2rem] p-6 transition-all group">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Verified Supplier</div>
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                      {String(product.supplier?.name?.[0] || "S")}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">
                        {String(product.supplier?.name || "Supplier")}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                        <span className="text-sm font-bold text-orange-400">{String(product.supplier?.trustScore || 0)}% Trust</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5" /> {String(product.supplier?.location || "Location")}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

            </div>
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
