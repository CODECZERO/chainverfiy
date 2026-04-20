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
    return <div className="min-h-screen bg-[#030408] text-slate-400"><Header /><main className="max-w-7xl mx-auto px-6 py-48 text-center uppercase tracking-widest text-[10px] font-bold opacity-50">Loading Transparency Data...</main></div>
  }

  return (
    <div className={`min-h-screen bg-[#030408] text-slate-400 ${inter.className} selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden`}>
      {/* ── Deep Space Atmospheric Effects ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 pt-28 md:pt-32 pb-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 px-5 py-2 rounded-2xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-6 md:mb-10 shadow-2xl backdrop-blur-xl"
            >
              <Activity className="w-4 h-4" /> Real-time Platform Activity
            </motion.div>
            <h1 className={`${outfit.className} text-4xl md:text-6xl font-bold text-white tracking-tight uppercase leading-[0.95] md:leading-[0.85] mb-6 md:mb-10`}>
              Platform <span className="text-blue-500 drop-shadow-[0_0_30px_rgba(37,99,235,0.4)]">Transparency.</span>
            </h1>
            <p className="text-sm md:text-lg text-slate-500 font-bold uppercase tracking-widest opacity-70 leading-relaxed max-w-2xl">
              Monitor live platform activity and product verifications. View global listings, community trust, and system performance.
            </p>
          </div>
          <button 
            onClick={() => fetchRates()}
            className="flex items-center gap-4 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group backdrop-blur-xl shadow-2xl"
          >
            <RefreshCcw className={`w-4 h-4 text-blue-400 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Refresh Feed</span>
          </button>
        </div>

        {/* Dynamic Exchange Rate Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 mb-16 md:mb-24">
          <RateCard 
            label="USDC Market Rate" 
            value={ratesData?.USDC?.inr ? `₹${ratesData.USDC.inr}` : "₹83.33"} 
            trend="+0.02%" 
            icon={Globe} 
            color="text-blue-500" 
            chartData={[40, 55, 45, 60, 50, 75, 65]}
          />
          <RateCard 
            label="XLM Market Rate" 
            value={ratesData?.XLM?.usd ? `$${ratesData.XLM.usd}` : "$0.1242"} 
            trend="-0.15%" 
            icon={Zap} 
            color="text-amber-500" 
            chartData={[30, 45, 35, 50, 40, 65, 55]}
          />
          <RateCard 
            label="Community Trust Index" 
            value="1.082" 
            trend="+1.24%" 
            icon={ShieldCheck} 
            color="text-emerald-500" 
            chartData={[20, 35, 25, 40, 30, 55, 45]}
          />
        </div>

        {/* ── Network Vital Nodes ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-16 md:mb-24">
          <StatMiniCard label="Active Users" value="4,102" sub="Verified Members" />
          <StatMiniCard label="System Env" value="Mainnet-Beta" sub="Global Network" />
          <StatMiniCard label="24h Reliability" value="99.98%" sub="Uptime" />
          <StatMiniCard label="Items Verified" value="1.2M+" sub="Product Units" />
          <StatMiniCard label="Sync Latency" value="240ms" sub="Real-time Updates" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 mb-16 md:mb-24">
          {/* Main Volume Trend Chart */}
          <div className="lg:col-span-8 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] group-hover:bg-blue-500/10 transition-all duration-1000" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Growth Analytics</h3>
                <div className={`${outfit.className} text-3xl md:text-4xl font-bold text-white tracking-tight uppercase leading-none`}>Monthly Volume</div>
              </div>
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1.5 shadow-inner">
                <button className="px-6 py-2 text-[9px] font-bold uppercase tracking-widest text-blue-500 bg-blue-500/10 rounded-lg transition-all">Daily Data</button>
                <button className="px-6 py-2 text-[9px] font-bold uppercase tracking-widest text-slate-700 hover:text-slate-500 rounded-lg">Historical</button>
              </div>
            </div>
            
            <div className="h-[300px] md:h-[400px] w-full">
              {ratesData?.volumeTrend && ratesData.volumeTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratesData.volumeTrend}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={9} 
                      fontWeight="900"
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                      dy={10}
                      className="uppercase tracking-widest"
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="#475569" 
                      fontSize={9} 
                      fontWeight="bold"
                      axisLine={false} 
                      tickLine={false} 
                      dx={-10}
                      className="font-mono"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={5} fillOpacity={1} fill="url(#colorVolume)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-700 font-bold uppercase tracking-widest text-[10px]">
                  Waiting for data...
                </div>
              )}
            </div>
          </div>

          {/* Regional Distribution */}
          <div className="lg:col-span-4 glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 shadow-3xl relative overflow-hidden flex flex-col group">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-10">Regional Activity</h3>
            <div className="flex-1 w-full overflow-hidden">
              <div className="space-y-6">
                {(ratesData?.salesByCountry || [{region: 'North America', volume: 0, count: 0}, {region: 'Europe', volume: 0, count: 0}, {region: 'Asia-Pacific', volume: 0, count: 0}]).map((reg: any, i: number) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">{reg.region || reg.country}</span>
                    <span className="text-[10px] font-mono font-bold text-blue-500 text-right">{reg.count || reg.volume || 0} Orders</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-10 py-6 border-t border-white/[0.05] flex items-center justify-between">
               <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">Total Verified Transactions</span>
               <span className="text-[14px] font-bold text-white uppercase">{ratesData?.recentDeals?.length || 0} Records</span>
            </div>
          </div>
        </div>

        {/* Active Transaction Stream */}
        <div className="mb-16 md:mb-24 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
            <div className="text-center sm:text-left">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Live Activity Stream</h3>
               <div className={`${outfit.className} text-3xl font-bold text-white tracking-tight uppercase`}>Recent Verified Activity</div>
            </div>
            <button className="px-8 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-all shadow-2xl">Export Activity Log</button>
          </div>
          
          <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] overflow-hidden shadow-3xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-bold text-slate-700 uppercase tracking-widest border-b border-white/[0.06]">
                  <th className="pb-8 pl-8 text-left">Product Name</th>
                  <th className="pb-8 text-left">Stellar Record</th>
                  <th className="pb-8 text-center">Order Value</th>
                  <th className="pb-8 text-center">System Fee</th>
                  <th className="pb-8 text-right pr-8">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(ratesData?.recentDeals || []).length > 0 ? (
                  ratesData.recentDeals.map((deal: any) => (
                    <tr key={deal.id} className="group hover:bg-white/[0.04] transition-all duration-300 cursor-pointer" onClick={() => window.location.href = `/order/${deal.id}/journey`}>
                      <td className="py-8 pl-8">
                        <div className="font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight text-md leading-none">{deal.product}</div>
                        <div className="text-[8px] text-slate-600 font-bold mt-2 uppercase tracking-widest opacity-60 font-mono">ID: {deal.id.slice(0, 16)}</div>
                      </td>
                      <td className="py-8 text-[10px] font-mono text-slate-500 lowercase tracking-tight opacity-60 group-hover:opacity-100 transition-opacity">{deal.wallet}</td>
                      <td className={`${outfit.className} py-8 text-center font-bold text-white tracking-tighter text-xl drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>${deal.amount}</td>
                      <td className="py-8 text-center">
                        <span className="text-[8px] font-bold text-blue-400 bg-blue-500/5 px-3 py-1.5 rounded-xl border border-blue-500/10 uppercase tracking-widest shadow-inner">
                          {deal.fee} XLM
                        </span>
                      </td>
                      <td className="py-8 text-right pr-8">
                        <span className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest shadow-xl transition-all ${deal.status === 'DISPUTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/5 group-hover:shadow-emerald-500/10'}`}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> {deal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center text-slate-700 font-bold uppercase tracking-widest text-[10px]">
                      Scanning Network for Recent Activity...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 text-center pb-32">
          <div className="inline-flex items-center gap-6 px-10 py-4 bg-white/5 rounded-full border border-white/10 shadow-3xl backdrop-blur-3xl group cursor-help">
            <Zap className="w-5 h-5 text-yellow-400 group-hover:scale-125 transition-transform duration-500" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Data Synchronized via <span className="text-white group-hover:text-blue-400 transition-colors">Stellar Network</span>
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
      whileHover={{ y: -8, scale: 1.01 }}
      className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[2.5rem] p-6 md:p-10 shadow-3xl relative overflow-hidden group hover:border-blue-500/40 transition-all duration-700"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('text', 'bg').replace('500', '600')}/10 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
      
      <div className="flex items-center justify-between mb-8 md:mb-12 relative z-10">
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[2rem] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
           <Icon className={`w-6 h-6 md:w-8 md:h-8 ${color} drop-shadow-[0_0_15px_currentColor]`} />
        </div>
        <div className="flex flex-col items-end">
           <div className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded-lg bg-white/[0.02] border border-white/[0.05] ${trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'} animate-pulse`}>
             {trend}
           </div>
           <div className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-2 opacity-60">Market Shift</div>
        </div>
      </div>

      <div className="space-y-2 md:space-y-4 mb-8 md:mb-10 relative z-10">
        <h3 className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">{label}</h3>
        <div className={`${outfit.className} text-3xl md:text-5xl font-bold text-white tracking-tight tabular-nums transition-transform duration-700 group-hover:scale-105 origin-left`}>
          {value}
        </div>
      </div>
    </motion.div>
  )
}

function StatMiniCard({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <div className="glass-premium bg-[#0A0D14]/60 border border-white/[0.06] rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 hover:border-white/20 transition-all duration-500 shadow-3xl shadow-black/40">
      <div className="text-[8px] md:text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2 md:mb-3">{label}</div>
      <div className={`${outfit.className} text-xl md:text-2xl font-bold text-white mb-1 md:mb-1.5 tracking-tight`}>{value}</div>
      <div className="text-[7px] md:text-[8px] font-medium text-slate-800 uppercase tracking-widest font-mono opacity-60">{sub}</div>
    </div>
  )
}
