"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  ShieldCheck, MessageCircle, Wallet, ArrowRight, ArrowUpRight,
  Star, Users, Package, Zap, CheckCircle2, XCircle,
  Globe, Lock, TrendingUp, Sparkles, Eye, Award,
  MessageSquare, LayoutGrid, Activity, Clock
} from "lucide-react"
import { getStats } from "@/lib/api-service"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

const TRUST_SIGNALS = [
  { icon: <Lock className="w-4 h-4 text-blue-500" />, text: "Soroban Escrow" },
  { icon: <Eye className="w-4 h-4 text-emerald-500" />, text: "Community Truth" },
  { icon: <Globe className="w-4 h-4 text-purple-500" />, text: "Stellar Ledger" },
]

const STATS_CONFIG = [
  { key: "verifiedProducts", label: "Verified Assets", defaultValue: 0, suffix: "+", icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
  { key: "totalSuppliers", label: "Global Suppliers", defaultValue: 0, suffix: "+", icon: <Users className="w-5 h-5 text-blue-400" /> },
  { key: "totalUsdcTransacted", label: "USDC Volume", defaultValue: 0, prefix: "$", suffix: "+", icon: <Activity className="w-5 h-5 text-purple-400" /> },
  { key: "avgVerifyTime", label: "Verification Latency", defaultValue: 0, suffix: "h", icon: <Zap className="w-5 h-5 text-amber-400" /> },
]

const FEATURES = [
  {
    title: "Immutable Identity",
    desc: "Every supplier is anchored on-chain with a cryptographic trust score that cannot be falsified.",
    icon: <ShieldCheck className="w-8 h-8 text-blue-400" />,
    color: "from-blue-600 to-cyan-500"
  },
  {
    title: "Truth Consensus",
    desc: "Verification is distributed. The community provides collective proof of authenticity before releases.",
    icon: <Users className="w-8 h-8 text-emerald-400" />,
    color: "from-emerald-600 to-green-400"
  },
  {
    title: "Atomic Settlement",
    desc: "Payments are held in Soroban smart contracts and settled instantly in USDC upon proof of delivery.",
    icon: <Zap className="w-8 h-8 text-purple-400" />,
    color: "from-purple-600 to-indigo-500"
  }
]

function AnimatedCounter({ end, prefix = "", suffix = "" }: { end: number, prefix?: string, suffix?: string }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setStarted(true)
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let start = 0
    const duration = 2000
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [started, end])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

export default function Home() {
  const [stats, setStats] = useState<any>({})
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, -100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    getStats().then(res => res.success && setStats(res.data)).catch(console.error)
  }, [])

  return (
    <div className={`min-h-screen bg-[#030408] text-slate-400 ${inter.className} selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden relative`}>
      {/* ── Deep Space Atmospheric Effects ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header />

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-8 overflow-hidden">
        {/* Institutional Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
          <motion.div style={{ opacity }} className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.02] to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center gap-4 mb-12"
          >
            {TRUST_SIGNALS.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5 bg-[#0A0D14]/60 border border-white/5 rounded-2xl text-[10px] font-bold text-slate-500 backdrop-blur-3xl shadow-2xl">
                {s.icon} {s.text}
              </div>
            ))}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${outfit.className} text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-tight`}
          >
            The Standard for <br/>
            <span className="text-blue-500">Verified Commerce.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          >
            ChainVerify brings transparency to global trade using the Stellar blockchain. Secure verification and instant settlement for a modern economy.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button className={`${outfit.className} w-full px-10 h-16 rounded-2xl text-[13px] font-semibold bg-white text-black hover:bg-slate-200 transition-all shadow-xl active:scale-95`}>
                Browse Marketplace <ArrowRight className="w-4 h-4 ml-3" />
              </Button>
            </Link>
            <Link href="/seller-dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className={`${outfit.className} w-full px-10 h-16 rounded-2xl text-[13px] font-semibold border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:text-white transition-all active:scale-95`}>
                Supplier Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Institutional Stats Ledger ─── */}
      <section className="relative border-y border-white/[0.04] bg-[#0A0D14]/40 backdrop-blur-xl z-20">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-20">
            {STATS_CONFIG.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="flex items-center justify-center gap-3 text-slate-500 text-xs font-semibold mb-3 group-hover:text-blue-400 transition-colors">
                  {s.icon} {s.label}
                </div>
                <div className={`${outfit.className} text-3xl md:text-4xl font-bold text-white tabular-nums tracking-tight`}>
                  <AnimatedCounter end={stats[s.key] || s.defaultValue} prefix={s.prefix} suffix={s.suffix} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Protocol Features ─── */}
      <section className="py-40 px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
             <div className="inline-block px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-lg mb-6 shadow-2xl">
                System Architecture
             </div>
            <h2 className={`${outfit.className} text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight`}>Built for <span className="text-blue-500">Certainty.</span></h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium opacity-80">
              We empower trade with digital proof and community verification.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3.5rem] p-12 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-700 shadow-3xl"
              >
                <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
                <div className="mb-10 p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/[0.04] w-fit group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl">
                  {f.icon}
                </div>
                <h3 className={`${outfit.className} text-2xl font-bold text-white mb-4 tracking-tight`}>{f.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium text-sm opacity-80">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Truth Layer Preview ─── */}
      <section className="py-40 px-8 relative overflow-hidden bg-[#0A0D14]/20 border-t border-white/[0.04]">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-blue-600/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-16 mb-24">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-500" />
                 </div>
                 <span className="text-[10px] font-bold text-blue-500">Truth Protocol</span>
              </div>
              <h2 className={`${outfit.className} text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight leading-tight`}>Where Trust is <br/> <span className="text-blue-500">Verified.</span></h2>
              <p className="text-xl text-slate-500 font-bold opacity-60 leading-relaxed">
                Join the community of verifiers. Help audit products, track origins, and earn rewards for your contributions.
              </p>
            </div>
            <Link href="/community">
              <Button className={`${outfit.className} h-16 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[13px] shadow-xl transition-all active:scale-95`}>
                Join Community <MessageSquare className="ml-3 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {[
              { author: "Protocol_Verifier", trust: "9.8 Trust", msg: "Analyzing geospatial drift on organic matcha batch #402. Origin verified.", icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
              { author: "Verified_Supplier", trust: "8.2 Trust", msg: "Updating status for cold-chain transit of organic dairy batch.", icon: <Activity className="w-5 h-5 text-blue-400" /> }
            ].map((d, i) => (
              <div key={i} className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3.5rem] p-10 flex gap-10 items-start group hover:border-blue-500/30 transition-all duration-700 shadow-3xl cursor-default">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex-shrink-0 shadow-lg border border-white/20 group-hover:rotate-6 transition-transform" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-[10px] font-bold text-white tracking-widest">{d.author}</span>
                    <span className="text-[9px] font-bold text-slate-400 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2 py-1">{d.trust}</span>
                  </div>
                  <h4 className={`${outfit.className} text-2xl font-bold text-slate-200 mb-6 group-hover:text-blue-400 transition-colors tracking-tight leading-snug`}>
                    {d.msg}
                  </h4>
                  <div className="flex items-center gap-6 text-[10px] font-semibold text-slate-500 tracking-wide">
                    <span className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] rounded-lg"><MessageCircle className="w-3.5 h-3.5" /> Community Discussions</span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] rounded-lg"><Clock className="w-3.5 h-3.5" /> Active now</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Institutional Footer ─── */}
      <footer className="py-32 border-t border-white/[0.04] bg-[#030408] relative z-30">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-20">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-[0_10px_30px_rgba(37,99,235,0.3)] border border-white/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <span className={`${outfit.className} text-2xl font-bold text-white tracking-tight`}>ChainVerify</span>
          </div>
          <div className="flex flex-wrap justify-center gap-10 text-xs font-semibold text-slate-600">
            <Link href="/marketplace" className="hover:text-blue-500 transition-colors">Marketplace</Link>
            <Link href="/verify" className="hover:text-blue-500 transition-colors">Verification</Link>
            <Link href="/transparency" className="hover:text-blue-500 transition-colors">Transparency</Link>
            <Link href="/community" className="hover:text-blue-500 transition-colors">Community</Link>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2">
             <div className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em] font-mono italic">Protocol Latency: 1.2ms</div>
             <div className="text-[9px] text-slate-800 font-mono tracking-widest uppercase italic">STR_NETWORK_LINK_ACTIVE • © 2024</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
