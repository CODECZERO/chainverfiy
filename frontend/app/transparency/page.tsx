"use client"

import React, { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  TrendingUp, TrendingDown, RefreshCcw, ShieldCheck, 
  Globe, Coins, ArrowRightLeft, DollarSign, Activity,
  Info, CheckCircle2, Zap, BarChart2, PieChart as PieChartIcon
} from "lucide-react"
import dynamic from 'next/dynamic'
import { Outfit, Inter } from "next/font/google"
import { useExchangeRates } from "@/hooks/use-api-queries"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(m => m.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })

export default function TransparencyPage() {
  const [isClient, setIsClient] = useState(false)
  
  // 🪄 Centralized Data Fetching with auto-refresh every 60s
  const { data: ratesData, isLoading: loading, refetch: fetchRates } = useExchangeRates()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div className="min-h-screen bg-[#050608] text-slate-400"><Header /><main className="max-w-7xl mx-auto px-6 py-48 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">Loading Transparency Data...</main></div>
  }

  return (
    <div className={`min-h-screen bg-[#050608] text-slate-400 ${inter.className} selection:bg-blue-500/30 relative overflow-hidden`}>
      {/* ── Subtle Atmospheric Effects ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-blue-600/[0.05] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600/[0.04] rounded-full blur-[120px] pointer-events-none" />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 pt-28 md:pt-32 pb-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-blue-500/[0.08] border border-blue-500/15 text-blue-400 px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider mb-6"
            >
              <Activity className="w-3.5 h-3.5" /> Real-time Platform Activity
            </motion.div>
            <h1 className={`${outfit.className} text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4`}>
              Platform <span className="text-blue-400">Transparency</span>
            </h1>
            <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-2xl">
              Monitor live platform activity, product verifications, global listings, and system performance.
            </p>
          </div>
          <button 
            onClick={() => fetchRates()}
            className="flex items-center gap-3 px-5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] transition-all active:scale-95 group"
          >
            <RefreshCcw className={`w-3.5 h-3.5 text-blue-400 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            <span className="text-xs font-medium text-slate-300">Refresh</span>
          </button>
        </div>

        {/* Exchange Rate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          <RateCard 
            label="USDC / USD Rate" 
            value={ratesData?.USDC?.usd ? `$${ratesData.USDC.usd}` : "$1.00"} 
            trend="+0.02%" 
            icon={Globe} 
            color="text-blue-400" 
          />
          <RateCard 
            label="XLM Market Rate" 
            value={ratesData?.XLM?.usd ? `$${ratesData.XLM.usd}` : "$0.1242"} 
            trend="-0.15%" 
            icon={Zap} 
            color="text-amber-400" 
          />
          <RateCard 
            label="Community Trust Index" 
            value="1.082" 
            trend="+1.24%" 
            icon={ShieldCheck} 
            color="text-emerald-400" 
          />
        </div>

        {/* ── Network Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-12">
          <StatMiniCard label="Active Users" value="4,102" sub="Verified Members" />
          <StatMiniCard label="System Env" value="Mainnet-Beta" sub="Global Network" />
          <StatMiniCard label="24h Reliability" value="99.98%" sub="Uptime" />
          <StatMiniCard label="Items Verified" value="1.2M+" sub="Product Units" />
          <StatMiniCard label="Sync Latency" value="240ms" sub="Real-time Updates" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-12">
          {/* Main Volume Trend Chart */}
          <div className="lg:col-span-8 bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 md:p-8 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Growth Analytics</p>
                <h3 className={`${outfit.className} text-xl md:text-2xl font-semibold text-white tracking-tight`}>Monthly Volume</h3>
              </div>
              <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
                <button className="px-4 py-1.5 text-[11px] font-medium text-blue-400 bg-blue-500/10 rounded-md transition-all">Daily</button>
                <button className="px-4 py-1.5 text-[11px] font-medium text-slate-600 hover:text-slate-400 rounded-md">Historical</button>
              </div>
            </div>
            
            <div className="h-[280px] md:h-[340px] w-full">
              {ratesData?.volumeTrend && ratesData.volumeTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratesData.volumeTrend}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#334155" 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                      dy={8}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="#334155" 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false} 
                      dx={-8}
                      className="font-mono"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVolume)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 text-xs font-medium">
                  Waiting for data...
                </div>
              )}
            </div>
          </div>

          {/* Regional Distribution */}
          <div className="lg:col-span-4 bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 md:p-8 flex flex-col">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-6">Regional Activity</p>
            <div className="flex-1 w-full overflow-hidden">
              <div className="space-y-4">
                {(ratesData?.salesByCountry || [{region: 'North America', volume: 0, count: 0}, {region: 'Europe', volume: 0, count: 0}, {region: 'Asia-Pacific', volume: 0, count: 0}]).map((reg: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                    <span className="text-xs font-medium text-slate-400">{reg.region || reg.country}</span>
                    <span className="text-xs font-mono font-semibold text-blue-400">{reg.count || reg.volume || 0} Orders</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between">
               <span className="text-[11px] font-medium text-slate-600">Total Verified</span>
               <span className="text-sm font-semibold text-white">{ratesData?.recentDeals?.length || 0} Records</span>
            </div>
          </div>
        </div>

        {/* Active Transaction Stream */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
               <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Live Activity Stream</p>
               <h3 className={`${outfit.className} text-xl font-semibold text-white tracking-tight`}>Recent Verified Activity</h3>
            </div>
            <button className="px-5 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs font-medium text-slate-500 hover:text-white transition-all">Export Log</button>
          </div>
          
          <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-medium text-slate-600 uppercase tracking-wider border-b border-white/[0.05]">
                  <th className="py-4 pl-6 text-left">Product</th>
                  <th className="py-4 text-left">Stellar Record</th>
                  <th className="py-4 text-center">Value</th>
                  <th className="py-4 text-center">Fee</th>
                  <th className="py-4 text-right pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(ratesData?.recentDeals || []).length > 0 ? (
                  ratesData.recentDeals.map((deal: any) => (
                    <tr key={deal.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => window.location.href = `/order/${deal.id}/journey`}>
                      <td className="py-4 pl-6">
                        <div className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">{deal.product}</div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">{deal.id.slice(0, 16)}</div>
                      </td>
                      <td className="py-4 text-[11px] font-mono text-slate-500 opacity-70 group-hover:opacity-100 transition-opacity">{deal.wallet}</td>
                      <td className={`${outfit.className} py-4 text-center font-semibold text-white text-base`}>{deal.amount} USDC</td>
                      <td className="py-4 text-center">
                        <span className="text-[11px] font-medium text-blue-400 bg-blue-500/[0.06] px-2.5 py-1 rounded-lg border border-blue-500/10">
                          {deal.fee} XLM
                        </span>
                      </td>
                      <td className="py-4 text-right pr-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium ${deal.status === 'DISPUTED' ? 'bg-red-500/[0.08] text-red-400 border border-red-500/15' : 'bg-emerald-500/[0.08] text-emerald-400 border border-emerald-500/15'}`}>
                          <CheckCircle2 className="w-3 h-3" /> {deal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-600 text-xs font-medium">
                      Scanning for recent activity...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center pb-16">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/[0.02] rounded-full border border-white/[0.05]">
            <Zap className="w-4 h-4 text-yellow-400" />
            <p className="text-[11px] font-medium text-slate-500">
              Synchronized via <span className="text-slate-300">Stellar Network</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function RateCard({ label, value, trend, icon: Icon, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden group hover:border-white/[0.12] transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="w-11 h-11 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
           <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="flex flex-col items-end">
           <div className={`text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/[0.04] ${trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
             {trend}
           </div>
        </div>
      </div>

      <div className="space-y-1.5 relative z-10">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`${outfit.className} text-2xl md:text-3xl font-semibold text-white tracking-tight tabular-nums`}>
          {value}
        </div>
      </div>
    </motion.div>
  )
}

function StatMiniCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-4 hover:border-white/[0.1] transition-all duration-300">
      <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wider mb-1.5">{label}</p>
      <div className={`${outfit.className} text-lg font-semibold text-white mb-0.5 tracking-tight`}>{value}</div>
      <p className="text-[10px] text-slate-600 font-mono">{sub}</p>
    </div>
  )
}
