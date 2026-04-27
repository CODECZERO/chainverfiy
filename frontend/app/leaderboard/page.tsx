"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Trophy, Star, ShieldCheck, TrendingUp, Medal, Sparkles, ArrowRight, Activity, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getLeaderboard, getStats } from "@/lib/api-service"
import { Outfit } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-500/[0.06] border-amber-500/20",
  2: "bg-slate-300/[0.04] border-slate-300/15",
  3: "bg-orange-600/[0.04] border-orange-600/15",
}

const RANK_ICON: Record<number, React.ReactNode> = {
  1: <Trophy className="w-6 h-6 text-amber-400" />,
  2: <Medal className="w-6 h-6 text-slate-300" />,
  3: <Medal className="w-6 h-6 text-orange-500" />,
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ verifiers: "0", products: "0", tokens: "0" })

  useEffect(() => {
    setLoading(true)
    getLeaderboard()
      .then(data => {
        if (data?.length) {
          const mapped = data.map((l: any, i: number) => ({
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

    getStats()
      .then(data => {
        if (data) {
          setStats({
            verifiers: data.totalSuppliers || 0,
            products: data.verifiedProducts || 0,
            tokens: `${data.totalTrustTokens || 0}`
          })
        }
      })
      .catch(() => {})
  }, [])


  return (
    <div className="min-h-screen bg-[#050608] text-foreground pb-24 selection:bg-blue-500/30">
      <Header />
      
      {/* ── Hero Section ── */}
      <div className="relative border-b border-white/[0.04] overflow-hidden pt-28 md:pt-32">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.06] blur-[140px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="max-w-6xl mx-auto px-4 py-14 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 bg-blue-500/[0.08] border border-blue-500/15 text-blue-400 px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider mb-6">
              <Zap className="w-3.5 h-3.5" /> Top Guardians
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className={`${outfit.className} text-4xl md:text-6xl font-semibold tracking-tight mb-5 text-white`}
          >
            Network <span className="text-blue-400">Consensus</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed"
          >
            Real-time standings of the world's leading product verifiers. Securing supply chains through decentralized audits.
          </motion.p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* ── Global Stats ── */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16"
        >
          {[
            { label: "Active Guardians", value: stats.verifiers, icon: ShieldCheck, color: "text-blue-400" },
            { label: "Assets Verified", value: stats.products, icon: Activity, color: "text-emerald-400" },
            { label: "Consensus Points", value: stats.tokens, icon: TrendingUp, color: "text-amber-400" },
          ].map((s, i) => (
            <motion.div 
              key={s.label}
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 text-center relative overflow-hidden group hover:border-white/[0.1] transition-all duration-300"
            >
                <div className="w-11 h-11 bg-white/[0.03] rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/[0.05] group-hover:scale-105 transition-transform duration-300">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className={`${outfit.className} text-2xl md:text-3xl font-semibold text-white tracking-tight mb-1 tabular-nums`}>{s.value}</div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Leaderboard Table ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-6 px-5 pb-2 text-[11px] font-medium text-slate-600 uppercase tracking-wider">
            <div className="w-14 text-center">Rank</div>
            <div className="flex-1">Guardian</div>
            <div className="text-right w-40 hidden md:block">Consensus Weight</div>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-2.5"
          >
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl bg-white/[0.015] border border-white/[0.04] p-6 h-20 animate-pulse" />
              ))
            ) : leaders.map((l, i) => {
              const rank = l.rank || i + 1
              const rowStyle = RANK_STYLES[rank] || "bg-white/[0.015] border-white/[0.04] hover:bg-white/[0.025]"
              const isTop3 = rank <= 3

              return (
                <motion.div 
                  key={rank}
                  variants={itemVariants}
                  whileHover={{ x: 3 }}
                  className={`flex flex-col md:flex-row items-center gap-5 rounded-xl px-5 py-5 transition-all group relative overflow-hidden border ${rowStyle}`}
                >
                  {/* Rank */}
                  <div className="w-14 flex justify-center shrink-0">
                    {RANK_ICON[rank] ? (
                      <div>{RANK_ICON[rank]}</div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/[0.02] flex items-center justify-center font-semibold text-slate-500 text-sm border border-white/[0.04]">
                        #{rank}
                      </div>
                    )}
                  </div>

                  {/* Guardian Identity */}
                  <div className="flex-1 min-w-0 flex items-center gap-5">
                    <div className="shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-lg shrink-0 ${
                        isTop3 ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border border-white/15' : 'bg-white/[0.03] text-slate-400 border border-white/[0.05]'
                      }`}>
                        {(l.name || "U")[0]}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className={`text-base font-semibold tracking-tight truncate ${isTop3 ? 'text-white' : 'text-slate-300 group-hover:text-blue-400 transition-colors'}`}>
                        {l.name || `Verifier ${rank}`}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${
                          isTop3 ? 'bg-blue-500/[0.08] text-blue-400 border-blue-500/15' : 'bg-white/[0.02] text-slate-500 border-white/[0.05]'
                        }`}>
                          {l.badge || "Verified Auditor"}
                        </span>
                        <span className="text-[11px] text-slate-600">{l.accuracy || "High"} Accuracy</span>
                      </div>
                    </div>
                  </div>

                  {/* Weight Data */}
                  <div className="text-center md:text-right shrink-0 w-full md:w-auto mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-white/[0.04]">
                    <div className={`${outfit.className} text-xl md:text-2xl font-semibold text-white tracking-tight tabular-nums`}>
                      {l.tokens.toLocaleString()} <span className="text-xs text-blue-400 ml-0.5">Tokens</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 flex items-center justify-center md:justify-end gap-1">
                       {l.votes} Audits <ArrowRight className="w-3 h-3 text-emerald-500" />
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-10 mt-20 text-center relative overflow-hidden group hover:border-white/[0.1] transition-all"
        >
          <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/[0.05] group-hover:scale-105 transition-transform duration-300">
             <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className={`${outfit.className} text-2xl font-semibold text-white tracking-tight mb-4`}>Join the Protocol Vanguard</h3>
          <p className="text-slate-500 text-sm max-w-lg mx-auto leading-relaxed mb-8">
            Secure the global network through cryptographic consensus. Connect your wallet and start auditing.
          </p>
          <button 
             onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
             className="bg-white text-black hover:bg-slate-200 h-12 px-8 rounded-xl font-semibold text-xs transition-all active:scale-95"
          >
             Start Auditing
          </button>
        </motion.div>
      </div>
    </div>
  )
}
