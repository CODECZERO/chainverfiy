"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, HelpCircle, Trophy, Star, Clock, ShieldCheck, Package, ExternalLink, Activity, Zap, TrendingUp, Sparkles, Scale, ArrowRight, Globe } from "lucide-react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import Image from "next/image"
import { getIPFSUrl } from "@/lib/image-utils"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getCommunityQueue, getCommunityHistory, getTokenBalance, voteProduct } from "@/lib/api-service"
import { Outfit } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })

interface PendingProduct {
  id: string
  title: string
  description?: string
  category: string
  priceInr: number
  priceUsdc: number
  proofMediaUrls: string[]
  voteReal: number
  voteFake: number
  voteNeedsProof: number
  createdAt: string
  supplier: { name: string; location: string; trustScore: number }
  _count: { votes: number }
}

export default function VerifyPage() {
  const [queue, setQueue] = useState<PendingProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [votes, setVotes] = useState<Record<string, string>>({})
  const [tokensEarned, setTokensEarned] = useState(0)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [tab, setTab] = useState<"queue" | "history">("queue")
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const { user, isAuthenticated } = useSelector((s: RootState) => s.userAuth)
  const wallet = useSelector((s: RootState) => s.wallet)
  const isAuth = isAuthenticated || wallet.isConnected
  
  useEffect(() => {
    const init = async () => {
      await loadQueue();
      const identifier = user?.id || wallet.publicKey;
      if (identifier) {
        await Promise.all([loadTokens(identifier), loadHistory(identifier)]);
      }
    };
    init();
  }, [user?.id, wallet.publicKey])

  const loadTokens = async (identifier: string) => {
    try {
      const data = await getTokenBalance(identifier)
      if (data?.balance !== undefined) setTokenBalance(data.balance);
    } catch { }
  }

  const loadHistory = async (identifier: string) => {
    setHistoryLoading(true);
    try {
      const data = await getCommunityHistory(identifier)
      setHistory(data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  const loadQueue = async () => {
    try {
      const data = await getCommunityQueue(user?.id)
      setQueue(data || [])
    } catch {
      setQueue([])
    } finally {
      setLoading(false)
    }
  }

  const castVoteAction = async (productId: string, voteType: "REAL" | "FAKE" | "NEEDS_MORE_PROOF") => {
    try {
      const identifier = user?.id || wallet.publicKey;
      if (!identifier) return

      await voteProduct(productId, { 
        userId: user?.id, 
        stellarWallet: wallet.publicKey,
        voteType, 
        reason: "" 
      })

      // Refresh token balance + queue + history after successful vote
      await Promise.all([
        loadTokens(identifier),
        loadQueue(),
        loadHistory(identifier),
      ]);
      
      setVotes(prev => ({ ...prev, [productId]: voteType }))
      setTokensEarned(t => t + 1)
    } catch (e: any) { 
      alert(e.message || "Vote failed. You may have already voted on this product or lack sufficient trust tokens.");
    }
  }

  const remaining = queue.filter(p => !votes[p.id])

  return (
    <div className="min-h-screen bg-[#050608] text-slate-200 pb-24 selection:bg-indigo-500/30 overflow-hidden relative">
      <Header />

      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="glow-orb w-[600px] h-[600px] bg-indigo-600/[0.04] top-[-15%] right-[-10%]" />
        <div className="glow-orb w-[500px] h-[500px] bg-blue-600/[0.03] bottom-[-10%] left-[-10%]" />
      </div>

      {/* Header Section */}
      <div className="relative pt-28 md:pt-32 pb-12 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-3xl">
              <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="h-px w-8 bg-indigo-500/30" />
                  <span className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">Community Verification</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className={`${outfit.className} text-4xl md:text-6xl font-semibold tracking-tight mb-6 text-white leading-[1.05]`}
              >
                Trust <span className="text-indigo-400">Verify</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mb-8 border-l-2 border-indigo-500/20 pl-5"
              >
                Help verify genuine products and earn rewards. Use your experience to identify authentic items and earn Community Reward Tokens (CRT).
              </motion.p>

              {/* CRT Balance — compact horizontal bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl px-6 py-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Zap className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Reward Balance</p>
                  <div className={`${outfit.className} text-3xl font-semibold text-white tracking-tight tabular-nums`}>
                    {tokenBalance.toLocaleString()} <span className="text-xs font-medium text-indigo-400 ml-0.5">CRT</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {tokensEarned > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-white/[0.02] border border-white/[0.06] px-8 py-6 text-center rounded-2xl shrink-0 min-w-[200px]"
              >
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">This Session</p>
                <div className={`${outfit.className} text-5xl font-semibold text-indigo-400 tracking-tighter`}>+{tokensEarned}</div>
                <p className="text-[11px] text-indigo-400 mt-3 font-medium flex items-center justify-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Active
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 relative z-10">
        {/* Tabs */}
        <div className="flex gap-1.5 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl w-fit mb-12 mx-auto lg:mx-0">
          {(["queue", "history"] as const).map((t) => (
            <button
              key={t} onClick={() => setTab(t)}
              className={cn(
                "px-5 py-2.5 rounded-lg text-xs font-medium transition-all relative overflow-hidden",
                tab === t ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {tab === t && (
                <motion.div layoutId="active-tab-verify" className="absolute inset-0 bg-indigo-600 rounded-lg" style={{ zIndex: 0 }} />
              )}
              <span className="relative z-10">
                {t === "queue" ? `New Requests (${remaining.length})` : "My History"}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "queue" ? (
            <motion.div
              key="queue" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-8 h-64 animate-pulse" />
                ))
              ) : remaining.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-24 bg-white/[0.01] rounded-2xl border border-white/[0.05]"
                >
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/15">
                    <ShieldCheck className="w-10 h-10 text-indigo-500" />
                  </div>
                  <h3 className={`${outfit.className} text-2xl font-semibold text-white tracking-tight mb-3`}>All Caught Up!</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">No new products waiting for your review. Check back later!</p>
                </motion.div>
              ) : (
                remaining.map((p, idx) => {
                  const total = p.voteReal + p.voteFake + p.voteNeedsProof
                  const realPct = total > 0 ? Math.round((p.voteReal / total) * 100) : 0
                  const priceInr = p.priceInr || 0
                  const required = priceInr >= 20000 ? 2 : priceInr >= 5000 ? 1 : 0
                  const disabled = tokenBalance < required

                  return (
                    <motion.div
                      key={p.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                      className="group relative bg-white/[0.015] rounded-2xl overflow-hidden border border-white/[0.06] hover:border-indigo-500/25 transition-all duration-500"
                    >
                      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-8">
                        {/* Product Image */}
                        <div className="w-full lg:w-72 h-64 bg-[#050608]/60 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative border border-white/[0.03] group-hover:border-indigo-500/20 transition-all duration-500">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#050608] to-transparent z-10 opacity-50" />
                          {p.proofMediaUrls?.[0] ? (
                            <Image src={getIPFSUrl(p.proofMediaUrls[0])} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          ) : <Package className="w-16 h-16 text-slate-800" strokeWidth={1} />}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5 mb-6">
                            <div>
                              <div className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <div className="w-6 h-px bg-indigo-500/30" /> Verification Required
                              </div>
                              <h3 className={`${outfit.className} text-2xl md:text-3xl font-semibold text-white tracking-tight mb-3 group-hover:text-indigo-400 transition-colors leading-tight`}>{p.title}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
                                <span className="text-slate-400 bg-white/[0.02] px-3 py-1 rounded-lg border border-white/[0.04]">{p.id.slice(0, 8)}</span>
                                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" /> Trust {p.supplier?.trustScore || 85}%</span>
                              </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-xl min-w-[180px] text-right">
                              <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wider mb-1">Product Value</p>
                              <div className={`${outfit.className} text-2xl font-semibold text-white tracking-tight tabular-nums`}>{(p.priceUsdc || 0).toFixed(2)} USDC</div>
                            </div>
                          </div>

                          {p.description && (
                            <div className="bg-white/[0.01] border-l-2 border-indigo-500/15 p-5 rounded-r-xl mb-6">
                              <p className="text-slate-400 text-sm leading-relaxed">{p.description}</p>
                            </div>
                          )}

                          {/* Community Confidence */}
                          <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-xl flex items-center gap-6">
                            <div className="shrink-0">
                              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-0.5">Confidence ({p._count.votes} votes)</p>
                              <p className="text-base font-semibold text-white">{realPct}% Genuine</p>
                            </div>
                            <div className="flex-1 h-2 bg-white/[0.02] rounded-full overflow-hidden border border-white/[0.03]">
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: realPct + "%" }} transition={{ duration: 1.2, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Vote Actions */}
                      <div className="bg-white/[0.015] border-t border-white/[0.06] px-6 lg:px-8 py-5 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/15 flex items-center justify-center">
                            <Scale className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <span className="block text-[11px] font-medium text-slate-600 uppercase tracking-wider mb-0.5">Requirement</span>
                            {required > 0 ? (
                               <span className="text-sm font-medium text-indigo-400 flex items-center gap-1.5">
                                 <Zap className="w-3.5 h-3.5" /> {required} XP Required
                               </span>
                            ) : (
                               <span className="text-sm font-medium text-emerald-400">Community Member</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {[
                            { id: "REAL", label: "Genuine", icon: CheckCircle2, cls: "bg-emerald-500/[0.08] border-emerald-500/15 text-emerald-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500" },
                            { id: "FAKE", label: "Counterfeit", icon: XCircle, cls: "bg-red-500/[0.08] border-red-500/15 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-500" },
                            { id: "NEEDS_MORE_PROOF", label: "Needs Proof", icon: HelpCircle, cls: "bg-amber-500/[0.08] border-amber-500/15 text-amber-400 hover:bg-amber-600 hover:text-white hover:border-amber-500" },
                          ].map((vote) => (
                            <button
                              key={vote.id} disabled={disabled}
                              onClick={() => castVoteAction(p.id, vote.id as any)}
                              className={cn(
                                "flex-1 md:flex-none flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-xs font-medium transition-all min-w-[140px] border",
                                disabled ? "opacity-20 cursor-not-allowed bg-white/[0.02] border-white/[0.05] text-slate-600" : vote.cls
                              )}
                            >
                              <vote.icon className="w-4 h-4" />
                              {vote.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          ) : (
            <motion.div
              key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className="space-y-4 max-w-5xl mx-auto"
            >
              {!isAuth ? (
                <div className="text-center py-24 bg-white/[0.01] rounded-2xl border border-white/[0.05]">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/15">
                    <TrendingUp className="w-10 h-10 text-indigo-400" />
                  </div>
                  <h3 className={`${outfit.className} text-2xl font-semibold text-white tracking-tight mb-3`}>Sign In Required</h3>
                  <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">Sign in to view your verification history and earn rewards.</p>
                  <Button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                    className="h-12 px-8 rounded-xl text-xs font-semibold bg-white text-black hover:bg-slate-200 transition-all active:scale-[0.98]"
                  >
                    Sign In to Verify <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : historyLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-6 h-20 animate-pulse" />
                ))
              ) : history.length === 0 ? (
                <div className="text-center py-24 bg-white/[0.01] rounded-2xl border border-white/[0.05]">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/[0.02] flex items-center justify-center border border-white/[0.05]">
                    <Clock className="w-10 h-10 text-slate-700" />
                  </div>
                  <h3 className={`${outfit.className} text-xl font-semibold text-white tracking-tight`}>History is Empty</h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item: any, idx) => (
                    <motion.div
                      key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                      className="bg-white/[0.015] rounded-xl p-5 flex flex-col md:flex-row items-center justify-between group hover:border-indigo-500/20 transition-all border border-white/[0.05]"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/[0.02] rounded-xl flex items-center justify-center border border-white/[0.05] relative overflow-hidden shrink-0">
                          {item.product?.proofMediaUrls?.[0] ? (
                            <Image src={getIPFSUrl(item.product.proofMediaUrls[0])} alt="" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          ) : <Package className="w-6 h-6 text-slate-700" />}
                        </div>
                        <div>
                          <h4 className={`${outfit.className} text-base font-semibold text-white tracking-tight mb-1 group-hover:text-indigo-400 transition-colors`}>{item.product?.title || "Unknown Product"}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-600">{new Date(item.createdAt).toLocaleDateString()}</span>
                            <span className="text-[11px] text-indigo-500 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> Confirmed
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 mt-4 md:mt-0">
                        <div className={cn(
                          "px-3 py-1.5 rounded-lg text-[11px] font-medium border",
                          item.voteType === 'REAL' ? 'bg-emerald-500/[0.08] text-emerald-400 border-emerald-500/15' :
                            item.voteType === 'FAKE' ? 'bg-red-500/[0.08] text-red-500 border-red-500/15' :
                              'bg-amber-500/[0.08] text-amber-400 border-amber-500/15'
                        )}>
                          {item.voteType === 'REAL' ? 'Genuine' : item.voteType === 'FAKE' ? 'Counterfeit' : 'Needs Proof'}
                        </div>
                        <div className="hidden xl:block text-right">
                          <p className="text-[10px] text-slate-600 mb-0.5">Reward</p>
                          <p className="text-xs font-semibold text-indigo-400">+1 CRT</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
