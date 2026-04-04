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

interface PendingProduct {
  id: string
  title: string
  description?: string
  category: string
  priceInr: number
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
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "") + "/products/tokens/" + identifier, {
        headers: {
          "Authorization": "Bearer " + (localStorage.getItem("accessToken") || "")
        },
        credentials: "include"
      });
      const data = await res.json();
      if (data.data?.balance !== undefined) setTokenBalance(data.data.balance);
    } catch { }
  }

  const loadHistory = async (identifier: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "") + "/community/history/" + identifier, {
        headers: {
          "Authorization": "Bearer " + (localStorage.getItem("accessToken") || "")
        },
        credentials: "include"
      });
      const data = await res.json();
      setHistory(data.data || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  const loadQueue = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const url = new URL(baseUrl + "/community/queue");
      if (user?.id) url.searchParams.append("userId", user.id);

      const res = await fetch(url.toString())
      const data = await res.json()
      setQueue(data.data || [])
    } catch {
      setQueue([])
    } finally {
      setLoading(false)
    }
  }

  const castVote = async (productId: string, voteType: "REAL" | "FAKE" | "NEEDS_MORE_PROOF") => {
    try {
      const identifier = user?.id || wallet.publicKey;
      if (!identifier) return

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "") + "/products/" + productId + "/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + (localStorage.getItem("accessToken") || "")
        },
        body: JSON.stringify({ 
          userId: user?.id, 
          stellarWallet: wallet.publicKey,
          voteType, 
          reason: "" 
        }),
        credentials: "include"
      })
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Protocol rejection: Insufficient authorization or stake.");
        return;
      }

      await loadTokens(identifier);
    } catch { }
    setVotes(prev => ({ ...prev, [productId]: voteType }))
    setTokensEarned(t => t + 1)
  }

  const remaining = queue.filter(p => !votes[p.id])

  return (
    <div className="min-h-screen bg-[#030408] text-slate-200 pb-32 selection:bg-indigo-500/30 overflow-hidden relative">
      <Header />

      {/* ── Atmospheric Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="glow-orb w-[800px] h-[800px] bg-indigo-600/5 top-[-20%] right-[-10%] animate-float-slow" />
        <div className="glow-orb w-[600px] h-[600px] bg-blue-600/5 bottom-[-10%] left-[-10%] animate-float-fast" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
      </div>

      {/* ── Strategic Terminal Header ── */}
      <div className="relative pt-24 pb-20 overflow-hidden border-b border-white/[0.04]">
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            <div className="max-w-4xl">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-px w-10 bg-indigo-500/40" />
                  <span className="text-[10px] font-display font-black text-indigo-400 uppercase tracking-[0.5em] italic">Consensus Protocol v2.5</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-5xl sm:text-7xl md:text-9xl font-display font-black tracking-tighter mb-10 text-white uppercase italic leading-[0.85]"
              >
                ORACLE <span className="text-indigo-500">AUDIT</span>.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-3xl italic mb-14 border-l-2 border-indigo-500/20 pl-8"
              >
                Decentralized verification engine for high-fidelity assets. Leverage node reputation to validate data streams and mine trust tokens.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-6 md:gap-10 glass-premium rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-3xl relative group overflow-hidden w-full lg:w-auto"
              >
                <div className="absolute inset-0 bg-indigo-500/5 pulse-subtle pointer-events-none" />
                <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform duration-700">
                  <Zap className="w-10 h-10 text-indigo-400" />
                </div>
                <div>
                  <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-[0.4em] mb-2 italic">Network Stake Balance</div>
                  <div className="text-5xl font-display font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(79,70,229,0.3)] italic">
                    {tokenBalance.toLocaleString()} <span className="text-[11px] font-display font-black text-indigo-400 uppercase tracking-widest ml-1 not-italic">TRT</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {tokensEarned > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                className="glass-premium px-10 md:px-14 py-12 md:py-16 text-center shadow-3xl rounded-[3rem] md:rounded-[4rem] border-indigo-500/20 shrink-0 min-w-full sm:min-w-[360px] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none" />
                <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-[0.5em] mb-6 italic">Session Payout Alpha</div>
                <div className="text-9xl font-display font-black text-indigo-400 drop-shadow-[0_0_40px_rgba(79,70,229,0.5)] italic tracking-tighter">+{tokensEarned}</div>
                <div className="text-[11px] text-indigo-400 mt-8 font-display font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 italic">
                  <Activity className="w-5 h-5 animate-pulse" /> Node Consensus Active
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-20 relative z-10">

        {/* Terminal Switcher */}
        <div className="flex gap-4 p-2 bg-white/[0.02] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] w-fit mb-20 shadow-2xl mx-auto lg:mx-0">
          {(["queue", "history"] as const).map((t) => (
            <button
              key={t} onClick={() => setTab(t)}
              className={cn(
                "px-8 md:px-14 py-4 md:py-6 rounded-2xl md:rounded-3xl text-[10px] md:text-[11px] font-display font-black uppercase tracking-[0.4em] transition-all relative overflow-hidden italic",
                tab === t ? "text-white" : "text-slate-500 hover:text-slate-200"
              )}
            >
              {tab === t && (
                <motion.div layoutId="active-tab-verify" className="absolute inset-0 bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)]" style={{ zIndex: 0 }} />
              )}
              <span className="relative z-10">
                {t === "queue" ? "Live Buffer (" + remaining.length + ")" : "Consensus Ledger"}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "queue" ? (
            <motion.div
              key="queue" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="glass-premium rounded-[3rem] p-12 h-80 animate-pulse" />
                ))
              ) : remaining.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-48 glass-premium rounded-[4rem] border border-white/[0.06] shadow-3xl"
                >
                  <div className="w-32 h-32 mx-auto mb-10 rounded-[3rem] bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                    <ShieldCheck className="w-14 h-14 text-indigo-500" />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-display font-black text-white tracking-tighter uppercase mb-6 italic">Full Buffer Synchronized</h3>
                  <p className="text-xl text-slate-500 max-w-sm mx-auto font-display font-bold italic tracking-wide uppercase">All decentralized units verified for your node signature.</p>
                </motion.div>
              ) : (
                remaining.map((p, idx) => {
                  const total = p.voteReal + p.voteFake + p.voteNeedsProof
                  const realPct = total > 0 ? Math.round((p.voteReal / total) * 100) : 0
                  const required = p.priceInr >= 20000 ? 2 : p.priceInr >= 5000 ? 1 : 0
                  const disabled = tokenBalance < required

                  return (
                    <motion.div
                      key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                      className="group relative glass-premium rounded-[3.5rem] overflow-hidden border border-white/[0.08] hover:border-indigo-500/40 transition-all duration-700 shadow-3xl"
                    >
                      <div className="flex flex-col lg:flex-row gap-16 p-10 lg:p-14">
                        {/* Interactive Data Block */}
                        <div className="w-full lg:w-96 h-96 bg-[#030408]/60 rounded-[3rem] flex items-center justify-center shrink-0 overflow-hidden relative border border-white/[0.03] shadow-inner group-hover:border-indigo-500/30 transition-all duration-700">
                          <div className="absolute inset-0 bg-gradient-to-t from-[#030408] to-transparent z-10 opacity-60" />
                          {p.proofMediaUrls?.[0] ? (
                            <Image src={getIPFSUrl(p.proofMediaUrls[0])} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                          ) : <Package className="w-24 h-24 text-slate-800" strokeWidth={1} />}
                        </div>

                        {/* Node Intelligence */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 mb-10">
                            <div>
                              <div className="text-[10px] font-display font-black text-indigo-400 uppercase tracking-[0.6em] mb-6 italic flex items-center gap-3">
                                <div className="w-8 h-px bg-indigo-500/40" /> Consensus Buffer Target
                              </div>
                              <h3 className="text-4xl md:text-6xl font-display font-black text-white tracking-tighter uppercase mb-6 group-hover:text-indigo-400 transition-colors italic leading-[0.9]">{p.title}</h3>
                              <div className="flex flex-wrap items-center gap-6 text-[10px] font-display font-black uppercase tracking-[0.3em] text-slate-500 italic">
                                <span className="text-slate-400 bg-white/[0.02] px-4 py-2 rounded-xl border border-white/[0.04]">NODE_ID/{p.id.slice(0, 8)}</span>
                                <span className="flex items-center gap-2"><Star className="w-4 h-4 text-emerald-500 fill-emerald-500" /> Trust Rank {p.supplier?.trustScore || 85}%</span>
                              </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/[0.06] p-10 rounded-[2.5rem] min-w-[240px] text-right flex flex-col justify-center transition-all group-hover:bg-indigo-600/[0.02]">
                              <div className="text-[10px] font-display font-black text-slate-600 uppercase tracking-[0.4em] mb-3 italic">Capital Valuation</div>
                              <div className="text-5xl font-display font-black text-white tracking-tighter tabular-nums italic">₹{p.priceInr.toLocaleString()}</div>
                            </div>
                          </div>

                          {p.description && (
                            <div className="bg-white/[0.01] border-l-2 border-indigo-500/20 p-8 rounded-r-3xl backdrop-blur-xl mb-12">
                              <p className="text-slate-400 text-lg md:text-xl leading-relaxed italic font-medium">{p.description}</p>
                            </div>
                          )}

                          {/* Network Integrity Matrix */}
                          <div className="bg-[#030408]/40 border border-white/[0.06] p-8 rounded-[2.5rem] flex items-center gap-10 shadow-2xl relative overflow-hidden group/meter">
                            <div className="absolute inset-0 bg-indigo-600/[0.01] opacity-0 group-hover/meter:opacity-100 transition-opacity" />
                            <div className="shrink-0 flex flex-col gap-1">
                              <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-widest italic">Node Consensus (n={p._count.votes})</div>
                              <div className="text-xl font-display font-black text-white italic">{realPct}% Authentic Probability</div>
                            </div>
                            <div className="flex-1 h-3 bg-white/[0.02] rounded-full overflow-hidden relative border border-white/[0.04] shadow-inner">
                              <motion.div
                                initial={{ width: 0 }} animate={{ width: realPct + "%" }} transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-400 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cryptographic Execution */}
                      <div className="bg-white/[0.02] border-t border-white/[0.08] px-10 md:px-14 py-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-600/[0.01] pointer-events-none" />

                        <div className="flex items-center gap-6 relative z-10">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                            <Scale className="w-7 h-7 text-indigo-400" />
                          </div>
                          <div>
                            <span className="block text-[10px] font-display font-black text-slate-600 uppercase tracking-[0.4em] mb-1 italic">Protocol Stake Threshold</span>
                            {required > 0 ? (
                              <span className="text-lg font-display font-black text-indigo-400 flex items-center gap-2 italic tracking-tight">
                                <Zap className="w-4 h-4 animate-pulse" /> {required} CHV_STAKE_ACTIVE
                              </span>
                            ) : (
                              <span className="text-lg font-display font-black text-emerald-400 tracking-widest uppercase italic">Node Authorized / Global Tier</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 relative z-10">
                          {[
                            { id: "REAL", label: "Validated", icon: CheckCircle2, cls: "bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white" },
                            { id: "FAKE", label: "Voided", icon: XCircle, cls: "bg-red-600/10 border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white" },
                            { id: "NEEDS_MORE_PROOF", label: "Trace Missing", icon: HelpCircle, cls: "bg-amber-600/10 border-amber-500/20 text-amber-400 hover:bg-amber-600 hover:text-white" },
                          ].map((vote) => (
                            <button
                              key={vote.id} disabled={disabled}
                              onClick={() => castVote(p.id, vote.id as any)}
                              className={cn(
                                "flex-1 md:flex-none flex items-center justify-center gap-4 rounded-[1.75rem] px-6 md:px-10 py-5 md:py-6 text-[10px] font-display font-black uppercase tracking-[0.3em] transition-all h-16 md:h-20 min-w-full sm:min-w-[200px] border shadow-2xl italic",
                                disabled ? "opacity-20 cursor-not-allowed bg-white/5 border-white/10 text-slate-600" : vote.cls
                              )}
                            >
                              <vote.icon className="w-5 h-5" />
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
              key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-8 max-w-6xl mx-auto"
            >
              {!isAuth ? (
                <div className="text-center py-48 glass-premium rounded-[4rem] border border-white/[0.06] shadow-3xl">
                  <div className="w-32 h-32 mx-auto mb-10 rounded-[3rem] bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20">
                    <TrendingUp className="w-14 h-14 text-indigo-400" />
                  </div>
                  <h3 className="text-4xl font-display font-black text-white tracking-tighter uppercase mb-6 italic">Identity Key Required</h3>
                  <p className="text-xl text-slate-500 mb-14 max-w-sm mx-auto font-display font-bold italic uppercase tracking-widest leading-relaxed">Connect your cryptographic key to retrieve historical consensus records.</p>
                  <Button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                    className="h-20 px-16 rounded-[2rem] text-[11px] font-display font-black uppercase tracking-[0.4em] bg-white text-black hover:bg-slate-200 transition-all shadow-[0_20px_60px_rgba(255,255,255,0.08)] active:scale-[0.98] italic"
                  >
                    Authorize Node Access <ArrowRight className="w-5 h-5 ml-4" />
                  </Button>
                </div>
              ) : historyLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="glass-premium rounded-[2.5rem] p-10 h-32 animate-pulse" />
                ))
              ) : history.length === 0 ? (
                <div className="text-center py-48 glass-premium rounded-[4rem] border border-white/[0.06] shadow-3xl">
                  <div className="w-32 h-32 mx-auto mb-10 rounded-[3rem] bg-white/[0.02] flex items-center justify-center border border-white/[0.06]">
                    <Clock className="w-14 h-14 text-slate-700" />
                  </div>
                  <h3 className="text-3xl font-display font-black text-white tracking-tighter uppercase italic">Ledger Empty</h3>
                </div>
              ) : (
                <div className="space-y-6">
                  {history.map((item: any, idx) => (
                    <motion.div
                      key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                      className="glass-premium rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between group hover:border-indigo-500/30 transition-all border border-white/[0.06] shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex items-center gap-10 relative z-10">
                        <div className="w-20 h-20 bg-white/[0.03] rounded-[1.75rem] flex items-center justify-center border border-white/[0.06] shadow-inner relative overflow-hidden">
                          {item.product?.proofMediaUrls?.[0] ? (
                            <Image src={getIPFSUrl(item.product.proofMediaUrls[0])} alt="" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                          ) : <Package className="w-8 h-8 text-slate-700" />}
                        </div>
                        <div>
                          <h4 className="text-2xl font-display font-black text-white tracking-tight mb-2 group-hover:text-indigo-400 transition-colors uppercase italic">{item.product?.title || "Unknown Terminal"}</h4>
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-display font-black text-slate-600 uppercase tracking-widest italic">{new Date(item.createdAt).toLocaleDateString()}</span>
                            <div className="w-2 h-2 rounded-full bg-white/[0.06]" />
                            <span className="text-[10px] font-display font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 italic">
                              <ShieldCheck className="w-3.5 h-3.5" /> Consensus Locked
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 text-right mt-8 md:mt-0 relative z-10 w-full md:w-auto justify-end">
                        <div className={cn(
                          "px-6 py-2.5 rounded-xl text-[10px] font-display font-black uppercase tracking-[0.2em] italic border",
                          item.voteType === 'REAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            item.voteType === 'FAKE' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        )}>
                          {item.voteType.replace(/_/g, ' ')}
                        </div>
                        <div className="hidden xl:flex flex-col items-end">
                          <div className="text-[9px] font-display font-black text-slate-600 uppercase tracking-widest mb-1 italic">Reward Settled</div>
                          <div className="text-sm font-display font-black text-indigo-400 italic font-mono">+1 TRT</div>
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
