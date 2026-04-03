"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Trophy, Star, ShieldCheck, TrendingUp, Medal, Sparkles, ArrowRight, Activity, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-500/10 border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.1)]",
  2: "bg-slate-300/10 border-slate-300/30 shadow-[0_0_40px_rgba(203,213,225,0.1)]",
  3: "bg-orange-600/10 border-orange-600/30 shadow-[0_0_40px_rgba(234,88,12,0.1)]",
}

const RANK_ICON: Record<number, React.ReactNode> = {
  1: <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" />,
  2: <Medal className="w-8 h-8 text-slate-300 drop-shadow-[0_0_15px_rgba(203,213,225,0.6)]" />,
  3: <Medal className="w-8 h-8 text-orange-500 drop-shadow-[0_0_15px_rgba(234,88,12,0.6)]" />,
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

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ verifiers: "0", products: "0", tokens: "0" })

  useEffect(() => {
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/community/leaderboard`)
      .then(r => {
        if (!r.ok || r.status === 204) return { data: [] }
        return r.json()
      })
      .then(res => {
        if (res.data?.length) {
          const mapped = res.data.map((l: any, i: number) => ({
            rank: i + 1,
            name: l.user?.name || `Verifier ${i+1}`,
            tokens: l.tokens,
            votes: l.votes,
            accuracy: l.accuracy,
            badge: l.tokens > 200 ? "Elite Vanguard" : l.tokens > 100 ? "Top Auditor" : "Verified Auditor"
          }))
          setLeaders(mapped)
        } else {
          setLeaders([])
        }
      })
      .catch(() => setLeaders([]))
      .finally(() => setLoading(false))

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`)
      .then(r => {
        if (!r.ok || r.status === 204) return { data: null }
        return r.json()
      })
      .then(res => {
        if (res.data) {
          setStats({
            verifiers: res.data.totalSuppliers || 0,
            products: res.data.verifiedProducts || 0,
            tokens: `${res.data.totalTrustTokens || 0}`
          })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#020408] text-foreground pb-32 selection:bg-blue-500/30 selection:text-blue-200">
      <Header />
      
      {/* ── Dynamic Hero Section ── */}
      <div className="relative border-b border-white/[0.04] bg-[#0A0D14]/50 overflow-hidden pt-12">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center justify-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 shadow-2xl backdrop-blur-md">
              <Zap className="w-3.5 h-3.5" /> High-Reputation Guardians
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-8 text-white uppercase italic tracking-[-0.04em]"
          >
            Network <span className="text-[#2775CA] drop-shadow-[0_0_30px_rgba(39,117,202,0.3)]">Consensus</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Real-time standings of the world's leading product verifiers. Securing physical supply chains through decentralized proof audits.
          </motion.p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* ── Staggered Global Stats ── */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-24"
        >
          {[
            { label: "Active Guardians", value: stats.verifiers, icon: ShieldCheck, color: "text-blue-400", bg: "from-blue-600/10" },
            { label: "Assets Verified", value: stats.products, icon: Activity, color: "text-emerald-400", bg: "from-emerald-500/10" },
            { label: "Consensus Points", value: stats.tokens, icon: TrendingUp, color: "text-amber-400", bg: "from-amber-600/10" },
          ].map((s, i) => (
            <motion.div 
              key={s.label}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-10 text-center relative overflow-hidden group shadow-2xl"
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} to-transparent opacity-30 pointer-events-none`} />
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/[0.03] rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-8 border border-white/[0.06] shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <s.icon className={`w-6 h-6 md:w-8 md:h-8 ${s.color}`} />
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-2 tabular-nums">{s.value}</div>
                <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Leaderboard Table Redesign ── */}
        <div className="space-y-6">
          <div className="flex items-center gap-6 px-6 md:px-10 pb-4 text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">
            <div className="w-12 md:w-20 text-center">Rank</div>
            <div className="flex-1">Guardian Identity</div>
            <div className="text-right w-48 hidden md:block">Consensus Weight</div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="premium-card rounded-[2.5rem] bg-[#0A0D14]/40 border border-white/[0.04] p-8 h-32 animate-pulse" />
              ))
            ) : leaders.map((l, i) => {
              const rank = l.rank || i + 1
              const rowStyle = RANK_STYLES[rank] || "bg-[#0A0D14]/40 border-white/[0.04] hover:bg-white/[0.02]"
              const isTop3 = rank <= 3

              return (
                <motion.div 
                  key={rank}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className={`flex flex-col md:flex-row items-center gap-6 md:gap-10 rounded-[2.5rem] md:rounded-[3rem] px-6 md:px-10 py-6 md:py-8 transition-all group relative overflow-hidden backdrop-blur-3xl border ${rowStyle}`}
                >
                  {isTop3 && (
                    <motion.div 
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute inset-0 bg-blue-500/5" 
                    />
                  )}

                  {/* Rank Node */}
                  <div className="w-20 flex justify-center shrink-0 relative">
                    {RANK_ICON[rank] ? (
                      <motion.div 
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      >
                        {RANK_ICON[rank]}
                      </motion.div>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center font-black text-slate-500 text-sm border border-white/5 shadow-inner">
                        #{rank}
                      </div>
                    )}
                  </div>

                  {/* Guardian Identity */}
                  <div className="flex-1 min-w-0 flex items-center gap-8">
                    <div className="relative group-hover:scale-110 transition-transform duration-500 shrink-0">
                      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex items-center justify-center font-black text-xl md:text-2xl shadow-2xl shrink-0 ${
                        isTop3 ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border border-white/20' : 'bg-[#1F2D40] text-slate-400 border border-white/5'
                      }`}>
                        {(l.name || "U")[0]}
                      </div>
                      {isTop3 && (
                        <div className="absolute -top-2 -right-2 bg-[#2775CA] p-1.5 rounded-xl border-4 border-[#0A0D14] shadow-xl">
                          <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-xl md:text-2xl font-black tracking-tight truncate ${isTop3 ? 'text-white' : 'text-slate-300 group-hover:text-blue-400 transition-colors'}`}>
                        {l.name || `Verifier ${rank}`}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1.5">
                        <div className={`flex items-center gap-1 px-2 md:gap-1.5 md:px-3 py-1 rounded-full border text-[7px] md:text-[9px] font-black uppercase tracking-widest ${
                          isTop3 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-white/[0.02] text-slate-500 border-white/[0.06]'
                        }`}>
                          <ShieldCheck className={`w-2 h-2 md:w-3 md:h-3 ${isTop3 ? "text-amber-400" : "text-slate-600"}`} /> {l.badge || "Verified Auditor"}
                        </div>
                        <span className="hidden md:inline text-slate-700 text-xs font-black uppercase tracking-tighter">•</span>
                        <span className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{l.accuracy || "High"} Accuracy Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Weight Data */}
                  <div className="text-center md:text-right shrink-0 w-full md:w-auto mt-6 md:mt-0 pt-6 md:pt-0 border-t md:border-0 border-white/[0.04]">
                    <div className="text-3xl md:text-4xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(39,117,202,0.4)]">
                      {l.tokens.toLocaleString()} <span className="text-[10px] md:text-xs text-blue-500 uppercase tracking-widest ml-1">Tokens</span>
                    </div>
                    <div className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1.5 flex items-center justify-center md:justify-end gap-2">
                       {l.votes} SUCCESSFUL AUDITS <ArrowRight className="w-3 h-3 text-emerald-500" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Global Call to Action */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="premium-card bg-gradient-to-br from-[#0A141A] to-[#020408] rounded-[3.5rem] p-16 mt-32 text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/[0.06] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-blue-600/[0.02] pointer-events-none" />
          <div className="w-24 h-24 bg-white/[0.03] rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-white/[0.06] shadow-inner group-hover:scale-110 transition-transform duration-700">
             <ShieldCheck className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-4xl font-black text-white tracking-tighter uppercase mb-6 drop-shadow-2xl">Join the Protocol Vanguard</h3>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed font-medium mb-12">
            Secure the global network through cryptographic consensus. Connect your Stellar wallet and start auditing proof to climb the global rankings.
          </p>
          <button 
             onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
             className="bg-white text-black hover:bg-slate-200 h-16 px-12 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-95"
          >
             Initialize Auditor Node
          </button>
        </motion.div>
      </div>
    </div>
  )
}
