"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, HelpCircle, Trophy, Clock, ShieldCheck, Package, ExternalLink, Activity, Zap, TrendingUp, Sparkles, Scale, ArrowRight } from "lucide-react"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import Image from "next/image"
import { getIPFSUrl } from "@/lib/image-utils"
import { motion, AnimatePresence } from "framer-motion"

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
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
  const { user } = useSelector((s: RootState) => s.userAuth)

  useEffect(() => { 
    loadQueue();
    if (user?.id) {
      loadTokens();
      loadHistory();
    }
  }, [user?.id])

  const loadTokens = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(\`${process.env.NEXT_PUBLIC_API_URL}/products/tokens/\${user.id}\`, {
        headers: {
          "Authorization": \`Bearer \${localStorage.getItem("token")}\`
        },
        credentials: "include"
      });
      const data = await res.json();
      if (data.data?.balance !== undefined) setTokenBalance(data.data.balance);
    } catch {}
  }

  const loadHistory = async () => {
    if (!user?.id) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(\`${process.env.NEXT_PUBLIC_API_URL}/community/history/\${user.id}\`, {
        headers: {
          "Authorization": \`Bearer \${localStorage.getItem("token")}\`
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
      const url = new URL(\`${process.env.NEXT_PUBLIC_API_URL}/community/queue\`);
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
      if (!user?.id) return
      const res = await fetch(\`${process.env.NEXT_PUBLIC_API_URL}/products/\${productId}/vote\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, voteType, reason: "" }),
        credentials: "include"
      })
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "Failed to vote due to insufficient stakes.");
        return;
      }
      
      const required = queue.find(p => p.id === productId)?.priceInr || 0;
      const deduction = required >= 20000 ? 50 : required >= 5000 ? 10 : 0;
      setTokenBalance(b => b - deduction);
    } catch {}
    setVotes(prev => ({ ...prev, [productId]: voteType }))
    setTokensEarned(t => t + 1)
  }

  const remaining = queue.filter(p => !votes[p.id])

  return (
    <div className="min-h-screen bg-[#020408] text-foreground pb-32 selection:bg-blue-500/30 selection:text-blue-200">
      <Header />
      
      {/* ── Page Header Redesign ── */}
      <div className="relative border-b border-white/[0.04] bg-[#0A0D14]/50 overflow-hidden pt-12">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 -translate-x-1/2" />
        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-2xl backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4" /> Consensus Protocol v2.4
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-white uppercase italic tracking-[-0.04em]"
              >
                Oracle <span className="text-emerald-500 drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">Verification</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl font-medium"
              >
                Architecting truth through decentralized consensus. Audit physical assets, settle disputes, and mine Trust Tokens.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="inline-flex items-center gap-6 bg-[#0C0F17]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-6 shadow-2xl relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-orange-500/5 pulse-subtle pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.06] shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Activity className="w-8 h-8 text-orange-400" />
                  </motion.div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Available Stake Energy</div>
                  <div className="text-4xl font-black font-mono text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(251,146,60,0.3)]">
                    {tokenBalance.toLocaleString()} <span className="text-[10px] font-sans text-orange-400 uppercase tracking-widest ml-1">Tokens</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {tokensEarned > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="premium-card bg-[#0A0D14]/80 backdrop-blur-2xl px-10 py-12 text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] rounded-[3rem] border border-emerald-500/30 shrink-0 min-w-[280px] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Session Payout</div>
                <div className="text-7xl font-black font-mono text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.6)]">+{tokensEarned}</div>
                <div className="text-[10px] text-emerald-400/90 mt-4 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                   <Zap className="w-3.5 h-3.5" /> Stellar Consensus Settled
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        
        {/* Modern Tab System */}
        <div className="flex gap-4 p-2 bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] w-fit mb-16 shadow-2xl mx-auto lg:mx-0">
          {(["queue", "history"] as const).map((t) => (
            <button 
              key={t} 
              onClick={() => setTab(t)}
              className={\`px-10 py-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden \${
                tab === t ? "text-white" : "text-slate-500 hover:text-slate-200"
              }\`}
            >
              {tab === t && (
                <motion.div 
                   layoutId="active-tab-glow-verify" 
                   className="absolute inset-0 bg-[#1F2D40] shadow-[0_0_20px_rgba(31,45,64,0.5)] border border-white/10" 
                   style={{ zIndex: 0 }}
                />
              )}
              <span className="relative z-10">
                {t === "queue" ? \`Live Queue (\${remaining.length})\` : "Event Ledger"}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "queue" ? (
            <motion.div 
              key="queue"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 10 }}
              className="space-y-8"
            >
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="premium-card bg-[#0A0D14]/40 border border-white/[0.04] rounded-[2.5rem] p-10 h-72 animate-pulse" />
                ))
              ) : remaining.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-40 premium-card bg-gradient-to-br from-[#0A141A] to-[#020408] rounded-[4rem] border border-white/[0.06] shadow-3xl"
                >
                  <div className="w-28 h-28 mx-auto mb-8 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)] group hover:scale-110 transition-transform duration-700">
                    <ShieldCheck className="w-14 h-14 text-emerald-500" />
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">Consensus Reached</h3>
                  <p className="text-lg text-slate-500 max-w-sm mx-auto font-medium">Global queue fully audited from your node. Intelligence sync pending.</p>
                </motion.div>
              ) : (
                remaining.map((p) => {
                  const total = p.voteReal + p.voteFake + p.voteNeedsProof
                  const realPct = total > 0 ? Math.round((p.voteReal / total) * 100) : 0
                  const required = p.priceInr >= 20000 ? 50 : p.priceInr >= 5000 ? 10 : 0
                  const disabled = tokenBalance < required

                  return (
                    <motion.div 
                      key={p.id} 
                      variants={itemVariants}
                      whileHover={{ scale: 1.005, y: -2 }}
                      className="premium-card bg-[#0A0D14]/60 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] overflow-hidden group shadow-2xl"
                    >
                      <div className="flex flex-col lg:flex-row gap-12 p-10">
                        {/* Interactive Hardware Image */}
                        <div className="w-full lg:w-64 h-64 bg-[#0C121E] rounded-[2.5rem] flex items-center justify-center shrink-0 overflow-hidden relative border border-white/[0.06] shadow-inner group-hover:border-emerald-500/30 transition-all duration-500">
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {p.proofMediaUrls?.[0] ? (
                            <Image src={getIPFSUrl(p.proofMediaUrls[0])} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-1000" />
                          ) : <Package className="w-20 h-20 text-slate-700" />}
                        </div>

                        {/* Node Intelligence */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-start justify-between gap-6 mb-6">
                            <div>
                               <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Pending Consensus Analysis</div>
                               <h3 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 group-hover:text-emerald-400 transition-colors">{p.title}</h3>
                               <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                  <span className="text-slate-400">{p.supplier?.name || "Verified Merchant"}</span>
                                  <span className="text-slate-800">•</span>
                                  <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-500"/> Trust Score 96%</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-3xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">₹{p.priceInr.toLocaleString()}</div>
                               <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Market Evaluation</div>
                            </div>
                          </div>

                          {p.description && (
                            <p className="text-slate-500 text-lg leading-relaxed mt-4 line-clamp-2 italic font-medium">"{p.description}"</p>
                          )}

                          {/* Network Drift Meter */}
                          <div className="mt-10 bg-[#0C121E]/80 border border-white/[0.04] p-6 rounded-[2rem] flex items-center gap-8 shadow-inner">
                            <div className="shrink-0 flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/[0.06]">
                                  <Activity className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                   <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Network Consensus</div>
                                   <div className="text-xs font-black text-white">{p._count.votes} Nodes Voted</div>
                                </div>
                            </div>
                            <div className="flex-1 h-3 bg-[#1A2235] rounded-full overflow-hidden relative border border-white/5 shadow-inner">
                              <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: \`\${realPct}%\` }}
                                 className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                              />
                            </div>
                            <div className="text-right shrink-0">
                               <span className="text-2xl font-black text-emerald-400 tabular-nums">{realPct}%</span>
                               <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Authentic Probability</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cryptographic Execution Buttons */}
                      <div className="bg-[#0A0D14]/80 border-t border-white/[0.06] px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                        
                        <div className="flex items-center gap-4">
                          <Scale className="w-6 h-6 text-slate-600" />
                          <div>
                             <span className="block text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-0.5">Staking Requirement</span>
                             {required > 0 ? (
                               <span className="text-sm font-black text-amber-500 flex items-center gap-2">
                                  <Zap className="w-3.5 h-3.5" /> {required} TRUST TOKENS
                               </span>
                             ) : (
                               <span className="text-sm font-black text-emerald-500 tracking-widest uppercase">Zero Stakes Required</span>
                             )}
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          {[
                            { id: "REAL", label: "Authentic", icon: CheckCircle2, cls: "hover:bg-emerald-500 text-emerald-400 border-emerald-500/30 hover:shadow-emerald-500/20" },
                            { id: "FAKE", label: "Counterfeit", icon: XCircle, cls: "hover:bg-red-500 text-red-400 border-red-500/30 hover:shadow-red-500/20" },
                            { id: "NEEDS_MORE_PROOF", label: "Insuff. Proof", icon: HelpCircle, cls: "hover:bg-amber-500 text-amber-400 border-amber-500/30 hover:shadow-amber-500/20" },
                          ].map((vote) => (
                            <motion.button
                              key={vote.id}
                              disabled={disabled}
                              whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
                              whileTap={!disabled ? { scale: 0.95 } : {}}
                              onClick={() => castVote(p.id, vote.id as any)}
                              className={\`flex items-center justify-center gap-3 border-2 rounded-[1.5rem] px-8 py-5 text-[11px] font-black uppercase tracking-[0.1em] transition-all h-20 min-w-[180px] shadow-2xl relative overflow-hidden group/btn \${
                                disabled 
                                  ? 'opacity-30 cursor-not-allowed bg-[#0C0F17] border-white/5 text-slate-500' 
                                  : \`bg-white/[0.02] hover:text-white border-white/[0.08] \${vote.cls}\`
                              }\`}
                            >
                               {tab === "queue" && (
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                               )}
                              <vote.icon className="w-5 h-5 relative z-10" />
                              <span className="relative z-10">{vote.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}

              {/* Session Ledger Overlay */}
              {Object.keys(votes).length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-24"
                >
                  <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                    <div className="w-8 h-[1px] bg-white/10" />
                    Live Auditor Logs (Hash: {Math.random().toString(36).substring(7).toUpperCase()})
                    <div className="flex-1 h-[1px] bg-white/10" />
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(votes).map(([id, vote]) => {
                      const product = queue.find(p => p.id === id)
                      if (!product) return null
                      return (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={id} 
                          className="flex items-center justify-between premium-card bg-[#0A0D14]/40 backdrop-blur-xl rounded-[2rem] px-10 py-6 border-l-[6px] border-l-emerald-500/50 shadow-xl group hover:border-[#2775CA]/20 transition-all"
                        >
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/5">
                                <Package className="w-6 h-6 text-slate-600" />
                             </div>
                             <div>
                                <span className="text-xl font-black text-white tracking-tight">{product.title}</span>
                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1 italic">Node Tx Recorded at {new Date().toLocaleTimeString()}</div>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                            {vote === "REAL" && <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-500/20 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]"><CheckCircle2 className="w-4 h-4" /> Validated Authentic</span>}
                            {vote === "FAKE" && <span className="text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-5 py-2.5 rounded-full border border-red-500/20 flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.1)]"><XCircle className="w-4 h-4" /> Flaged Counterfeit</span>}
                            {vote === "NEEDS_MORE_PROOF" && <span className="text-amber-400 text-[10px] font-black uppercase tracking-widest bg-amber-500/10 px-5 py-2.5 rounded-full border border-emerald-500/20 flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.1)]"><HelpCircle className="w-4 h-4" /> Requested Proof</span>}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 10 }}
              className="space-y-8"
            >
              {!user?.id ? (
                <div className="text-center py-40 premium-card bg-gradient-to-br from-[#0A141A] to-[#020408] rounded-[4rem] border border-white/[0.06] shadow-3xl">
                  <div className="w-32 h-32 mx-auto mb-10 rounded-[3rem] bg-[#0C0F17] flex items-center justify-center border border-white/[0.06] shadow-inner group-hover:scale-110 transition-transform duration-700">
                    <TrendingUp className="w-14 h-14 text-slate-700" />
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tighter uppercase mb-6">Ledger Initialization Required</h3>
                  <p className="text-xl text-slate-500 mb-12 max-w-sm mx-auto font-medium leading-relaxed">Connect your Stellar Auditor key to retrieve decentralized voting records and claim token rewards.</p>
                  <Button 
                     onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                     className="h-20 px-14 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] bg-white text-black hover:bg-slate-200 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95"
                  >
                    Connect Auditor Key
                  </Button>
                </div>
              ) : historyLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="premium-card bg-[#0A0D14]/40 border border-white/[0.04] rounded-[2.5rem] p-10 h-32 animate-pulse" />
                ))
              ) : history.length === 0 ? (
                <div className="text-center py-40 premium-card bg-gradient-to-br from-[#0A141A] to-[#020408] rounded-[4rem] border border-white/[0.06] shadow-3xl">
                  <div className="w-28 h-28 mx-auto mb-8 rounded-[2.5rem] bg-[#0C0F17] flex items-center justify-center border border-white/[0.06] shadow-inner">
                    <Clock className="w-12 h-12 text-slate-700" />
                  </div>
                  <h3 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">Historical Void</h3>
                  <p className="text-xl text-slate-500 mb-8 max-w-sm mx-auto font-medium">Your node has zero historical consensus interactions. Participation yields reputation tokens.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {history.map((item: any) => (
                    <motion.div 
                      key={item.id} 
                      variants={itemVariants}
                      whileHover={{ scale: 1.01, x: 5 }}
                      className="premium-card bg-[#0A0D14]/60 backdrop-blur-3xl rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between group hover:border-emerald-500/20 transition-all border border-white/[0.08] shadow-2xl"
                    >
                      <div className="flex items-center gap-10">
                        <div className="w-20 h-20 bg-white/[0.03] rounded-[1.75rem] flex items-center justify-center border border-white/[0.06] shadow-inner group-hover:scale-110 transition-transform duration-500 relative">
                          {item.product?.proofMediaUrls?.[0] ? (
                            <Image src={getIPFSUrl(item.product.proofMediaUrls[0])} alt="" fill className="object-cover rounded-[1.75rem] p-2 opacity-60 group-hover:opacity-100" />
                          ) : <Package className="w-10 h-10 text-slate-700" />}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white tracking-tight mb-2 group-hover:text-blue-400 transition-colors">{item.product?.title || "Unknown Product"}</h4>
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-slate-600 font-mono uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <span className="text-slate-800 text-xs font-black">•</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 italic">
                              <Sparkles className="w-3.5 h-3.5 text-blue-500" /> {item.product?.supplier?.name || "Global Store"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-12 text-right mt-8 md:mt-0 pt-8 md:pt-0 border-t md:border-0 border-white/[0.04] w-full md:w-auto">
                        <div className="hidden lg:block">
                          <div className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1.5">Node Reputation Data</div>
                          <div className="text-sm font-black text-white font-mono flex items-center justify-end gap-2 text-emerald-500">
                             +1 AUDITOR TOKEN <Zap className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className={\`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-flex items-center gap-2 border \${
                            item.voteType === 'REAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' :
                            item.voteType === 'FAKE' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10' :
                            'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10'
                          }\`}>
                            {item.voteType === 'REAL' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {item.voteType === 'FAKE' && <XCircle className="w-3.5 h-3.5" />}
                            {item.voteType === 'NEEDS_MORE_PROOF' && <HelpCircle className="w-3.5 h-3.5" />}
                            {item.voteType.replace(/_/g, ' ')}
                          </span>
                          <div className={\`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-lg border-white/[0.06] border flex items-center gap-2 \${
                            item.product?.status === 'VERIFIED' ? 'text-emerald-500' :
                            item.product?.status === 'FLAGGED' ? 'text-red-500' :
                            'text-slate-600 bg-white/[0.01]'
                          }\`}>
                            Consensus State: {item.product?.status || 'DECIDING'}
                          </div>
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
