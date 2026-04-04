"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  ShieldCheck, MessageCircle, ArrowRight, ArrowUpRight,
  Users, CheckCircle2, Globe, Lock, Sparkles, Eye, Activity, Zap
} from "lucide-react"
import { getStats } from "@/lib/api-service"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

const TRUST_SIGNALS = [
  { icon: <Lock className="w-4 h-4 text-emerald-400" />, text: "Soroban Escrow" },
  { icon: <Eye className="w-4 h-4 text-cyan-400" />, text: "Community Truth" },
  { icon: <Globe className="w-4 h-4 text-indigo-400" />, text: "Stellar Ledger" },
]

const STATS_CONFIG = [
  { key: "verifiedProducts", label: "Verified Assets", defaultValue: 0, suffix: "+", icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
  { key: "totalSuppliers", label: "Global Suppliers", defaultValue: 0, suffix: "+", icon: <Users className="w-5 h-5 text-blue-400" /> },
  { key: "totalUsdcTransacted", label: "USDC Volume", defaultValue: 0, prefix: "$", suffix: "+", icon: <Activity className="w-5 h-5 text-purple-400" /> },
  { key: "avgVerifyTime", label: "Network Latency", defaultValue: 0, suffix: "h", icon: <Zap className="w-5 h-5 text-amber-400" /> },
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
  }, [end, started])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString(undefined, { maximumFractionDigits: 1 })}{suffix}
    </span>
  )
}

export default function LandingPage() {
  const [stats, setStats] = useState<Record<string, number>>({})
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  useEffect(() => {
    getStats().then(setStats).catch(console.error)
  }, [])

  return (
    <div className={`min-h-screen bg-[#05060A] text-slate-200 overflow-hidden selection:bg-indigo-500/30 ${inter.className}`}>
      {/* ── Abstract Dynamic Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-[-10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]"
          animate={{ x: [0, -70, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]"
          animate={{ x: [0, 40, 0], y: [0, -50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-24">
        
        {/* ── HERO SECTION ── */}
        <section className="relative px-6 pt-16 pb-24 md:pt-32 md:pb-32 overflow-hidden max-w-7xl mx-auto flex flex-col items-center text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {/* Live Data Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Stellar Mainnet Active
            </div>

            <h1 className={`${outfit.className} text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 leading-[1.1] mb-8`}>
              The Architecture of<br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Absolute Trust.
              </span>
            </h1>

            <p className="max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed font-light mb-12">
              ChainVerify anchors physical assets to the Stellar blockchain. Decentralized communities verify authenticity, while smart contracts hold payments securely in escrow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 w-full max-w-md sm:max-w-none justify-center items-center">
              <Link href="/marketplace" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:scale-105 active:scale-95 border border-indigo-400/20">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Enter Marketplace
                </Button>
              </Link>
              <Link href="/verify" className="w-full sm:w-auto mt-4 sm:mt-0">
                <Button variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] backdrop-blur-md border-white/[0.1] text-white font-semibold text-lg transition-all hover:scale-105 active:scale-95">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-400" />
                  Verify & Earn
                </Button>
              </Link>
            </div>

            {/* Micro Trust Signals */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
              {TRUST_SIGNALS.map((signal, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + (i * 0.1) }}
                  className="flex items-center gap-2 text-sm font-medium text-slate-400 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/5"
                >
                  {signal.icon}
                  {signal.text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── METRICS GRID ── */}
        <section className="relative px-6 py-20 border-y border-white/[0.05] bg-gradient-to-b from-transparent to-[#0A0C14]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8">
              {STATS_CONFIG.map((config, index) => (
                <motion.div
                  key={config.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative group p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                      {config.icon}
                    </div>
                  </div>
                  <div className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-1">
                    <AnimatedCounter 
                      end={stats[config.key] || config.defaultValue} 
                      prefix={config.prefix} 
                      suffix={config.suffix} 
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-500">{config.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES GRID ── */}
        <section className="relative px-6 py-32 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className={`${outfit.className} text-4xl md:text-5xl font-bold tracking-tight text-white mb-6`}>
              Verified Quality. <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Trustless Settlement.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
              By distributing verification across independent community nodes, ChainVerify eliminates single points of failure in the supply chain ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] overflow-hidden group hover:bg-white/[0.04] transition-all"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                
                <div className="mb-6 inline-block p-4 rounded-2xl bg-white/5 backdrop-blur-md shadow-xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 font-light leading-relaxed">{feature.desc}</p>
                
                <div className="mt-8 flex items-center text-sm font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors cursor-pointer">
                  Learn more <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
        
        {/* ── FOOTER CTA ── */}
        <section className="relative px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-900/40 to-blue-900/20 border border-white/10 p-12 md:p-20 text-center flex flex-col items-center">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl h-full bg-blue-500/20 blur-[100px] pointer-events-none" />
              
              <Sparkles className="w-12 h-12 text-blue-400 mb-6" />
              <h2 className={`${outfit.className} text-3xl md:text-5xl font-bold text-white mb-6 relative z-10`}>Ready to embrace transparency?</h2>
              <p className="text-indigo-200/70 text-lg mb-10 max-w-xl relative z-10 font-light">
                Join thousands of suppliers and verifiers building the future of authenticated commerce.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full sm:w-auto">
                <Link href="/seller-dashboard">
                  <Button className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white text-indigo-900 hover:bg-slate-100 font-bold text-lg shadow-xl hover:scale-105 transition-all">
                    Register as Supplier
                  </Button>
                </Link>
                <Link href="/community">
                  <Button variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-transparent hover:bg-white/10 border-white/20 text-white font-semibold text-lg transition-all hover:scale-105 hover:border-white/40">
                    Join the Community
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
