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
  MessageSquare, LayoutGrid, Activity
} from "lucide-react"
import { getStats } from "@/lib/api-service"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"

const TRUST_SIGNALS = [
  { icon: <Lock className="w-4 h-4" />, text: "Soroban Escrow" },
  { icon: <Eye className="w-4 h-4" />, text: "Community Truth" },
  { icon: <Globe className="w-4 h-4" />, text: "Stellar Ledger" },
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
    icon: <ShieldCheck className="w-6 h-6" />,
    color: "from-blue-600 to-cyan-500"
  },
  {
    title: "Truth Consensus",
    desc: "Verification is distributed. The community provides collective proof of authenticity before releases.",
    icon: <Users className="w-6 h-6" />,
    color: "from-emerald-600 to-green-400"
  },
  {
    title: "Atomic Settlement",
    desc: "Payments are held in Soroban smart contracts and settled instantly in USDC upon proof of delivery.",
    icon: <Zap className="w-6 h-6" />,
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
    <div className="min-h-screen bg-[#020408] text-slate-100 selection:bg-blue-500/30">
      <Header />

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 px-4 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            style={{ y: y1, opacity }}
            className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full" 
          />
          <motion.div 
            style={{ y: y1, opacity }}
            className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full" 
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center gap-3 mb-8"
          >
            {TRUST_SIGNALS.map((s, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-400 backdrop-blur-md">
                {s.icon} {s.text}
              </span>
            ))}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-8 leading-[0.95]"
          >
            The Protocol of <br/>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">Absolute Truth.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            Pramanik anchors physical commerce to the Stellar blockchain. Decentralized verification meets atomic settlement.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button size="lg" className="w-full px-10 h-16 rounded-2xl text-lg font-bold bg-white text-black hover:bg-slate-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                Access Marketplace <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/seller-dashboard" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full px-10 h-16 rounded-2xl text-lg font-bold border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all">
                For Suppliers
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-y border-white/5 bg-[#05070a]/50 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {STATS_CONFIG.map((s, i) => (
              <div key={i} className="text-center group">
                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-semibold uppercase tracking-tighter mb-2 group-hover:text-slate-300 transition-colors">
                  {s.icon} {s.label}
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white tabular-nums">
                  <AnimatedCounter end={stats[s.key] || s.defaultValue} prefix={s.prefix} suffix={s.suffix} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section className="py-32 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Designed for Trust.</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
              We replace middlemen with mathematical proof and community consensus.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative group p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${f.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed font-light">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Community Preview ─── */}
      <section className="py-32 px-4 bg-gradient-to-b from-transparent to-blue-950/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
            <div className="max-w-xl">
              <Badge variant="outline" className="mb-6 border-blue-500/30 text-blue-400 bg-blue-500/5 px-4 py-1.5 uppercase font-black tracking-widest text-[0.65rem]">
                Community Network
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 italic leading-tight">Where Truth is <br/> Negotiated.</h2>
              <p className="text-slate-400 text-lg font-light leading-relaxed">
                Join thousands of verifiers and suppliers in the decentralized discourse. Audit proofs, share feedback, and earn rewards.
              </p>
            </div>
            <Link href="/community">
              <Button size="lg" className="rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 h-14">
                Enter Community Hub <MessageSquare className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((_, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-[#0c121e] border border-white/5 flex gap-6 items-start group hover:border-blue-500/30 transition-all cursor-default">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-slate-100">Anonymous Verifier</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5 bg-white/5 rounded-md">8.2 Trust</span>
                  </div>
                  <h4 className="text-lg font-semibold mb-3 group-hover:text-blue-400 transition-colors">
                    {i === 0 ? "Analyzing GPS drift on organic matcha verification batch #402" : "Supplier proposal: Real-time temperature logs for dairy transit"}
                  </h4>
                  <div className="flex items-center gap-4 text-slate-500 text-xs">
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> 24 Replies</span>
                    <span>2 hours ago</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3 font-black text-2xl tracking-tighter">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            Pramanik
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <Link href="/verify" className="hover:text-white transition-colors">Verify</Link>
            <Link href="/transparency" className="hover:text-white transition-colors">Transparency</Link>
            <Link href="/community" className="hover:text-white transition-colors">Community</Link>
          </div>
          <div className="text-xs text-slate-600 font-mono tracking-widest uppercase">
            Built on Stellar • © 2024
          </div>
        </div>
      </footer>
    </div>
  )
}
