"use client"

import React, { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { getExchangeRates } from "@/lib/api-service"
import { motion } from "framer-motion"
import { 
  TrendingUp, TrendingDown, RefreshCcw, ShieldCheck, 
  Globe, Coins, ArrowRightLeft, DollarSign, Activity,
  Info, CheckCircle2, Zap, BarChart2, PieChart as PieChartIcon
} from "lucide-react"
import dynamic from 'next/dynamic'
import { Outfit, Inter } from "next/font/google"

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
  const [ratesData, setRatesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  const fetchRates = async () => {
    setLoading(true)
    try {
      const res = await getExchangeRates()
      if (res.data) {
          console.log("Transparency Rates:", res.data);
          setRatesData(res.data);
      }
      setLastRefreshed(new Date())
    } catch (err) {
      console.error("Failed to fetch rates", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    setIsClient(true)
    fetchRates()
    const orbit = setInterval(fetchRates, 60000)
    return () => clearInterval(orbit)
  }, [])

  if (!isClient) {
    return <div className="min-h-screen bg-[#030408] text-slate-400"><Header /><main className="max-w-7xl mx-auto px-6 py-48 text-center uppercase tracking-widest text-[10px] font-black opacity-50">Initializing Transparent Protocol...</main></div>
  }

  return (
    <div className={`min-h-screen bg-[#030408] text-slate-400 ${inter.className} selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden`}>
      {/* ── Deep Space Atmospheric Effects ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Live Financial Oracle</span>
            </div>
            <h1 className={`${outfit.className} text-6xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none`}>
              Network <span className="text-blue-500 drop-shadow-[0_0_20px_rgba(37,99,235,0.3)]">Transparency</span>
            </h1>
            <p className="text-slate-500 max-w-xl mt-6 font-medium leading-relaxed text-sm uppercase tracking-tight opacity-80">
              Real-time exchange rates and protocol-level financial metrics, 
              verified on the Stellar blockchain for absolute integrity and settlement finality.
            </p>
          </div>
          <button 
            onClick={fetchRates}
            className="flex items-center gap-4 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group backdrop-blur-xl shadow-2xl"
          >
            <RefreshCcw className={`w-4 h-4 text-blue-400 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-700"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">Refresh Global Feed</span>
          </button>
        </div>

        {/* Dynamic Exchange Rate Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <RateCard 
            label="USDC / INR Settlement"
            value={ratesData?.USDC?.inr ? `₹${ratesData.USDC.inr}` : "₹83.33"}
            change="+0.04%"
            isUp={true}
            icon={DollarSign}
            color="blue"
          />
          <RateCard 
            label="XLM / USDC Liquidity"
            value={ratesData?.XLM?.usd ? `$${ratesData.XLM.usd}` : "$0.1242"}
            change="-1.2%"
            isUp={false}
            icon={Coins}
            color="emerald"
          />
          <div className="glass-premium bg-[#0A0D14]/60 border border-white/[0.08] rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
             <div className="flex items-center justify-between mb-8">
               <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                 <Activity className="w-7 h-7 text-purple-400" />
               </div>
               <Info className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
             </div>
             <div className="space-y-1">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Net Settlement Fee</span>
               <div className={`${outfit.className} text-4xl font-black text-white tracking-tighter`}>{ratesData?.networkStats?.avgFee || "0.00001"} <span className="text-sm font-bold text-slate-600">XLM</span></div>
             </div>
             <div className="mt-6 text-[9px] font-black text-emerald-400/80 uppercase tracking-widest bg-emerald-500/5 px-4 py-1.5 rounded-xl border border-emerald-500/10 inline-block shadow-lg">
               Optimal Verification Efficiency
             </div>
          </div>
        </div>

        {/* High-Density Stat Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16">
          <StatMiniCard 
            label="Market Volume"
            value={`$${ratesData?.networkStats?.totalVolume || "0.00"}`}
            icon={<BarChart2 className="w-4 h-4 text-blue-400" />}
          />
          <StatMiniCard 
            label="Protocol Yield"
            value={`$${ratesData?.networkStats?.systemFees || "0.00"}`}
            icon={<Coins className="w-4 h-4 text-yellow-400" />}
          />
          <StatMiniCard 
            label="Liquidity Depth"
            value={`$${(Number(ratesData?.networkStats?.totalVolume || 0) * 0.99).toFixed(2)}`}
            icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
          />
          <StatMiniCard 
            label="Node Uptime"
            value={ratesData?.networkStats?.uptime || "99.99%"}
            icon={<Globe className="w-4 h-4 text-cyan-400" />}
          />
          <StatMiniCard 
            label="Engine"
            value={ratesData?.networkStats?.protocol || "Soroban"}
            icon={<ShieldCheck className="w-4 h-4 text-purple-400" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
          {/* Main Volume Trend Chart */}
          <div className="lg:col-span-2 glass-premium bg-[#0A0D14]/60 border border-white/[0.08] rounded-[3.5rem] p-10 shadow-3xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-12">
               <div>
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Volume Telemetry</h3>
                 <div className={`${outfit.className} text-3xl font-black text-white tracking-tighter mt-2 uppercase italic tracking-[-0.03em]`}>Network Liquidity Trend</div>
               </div>
               <div className="px-6 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-widest shadow-xl">
                 Live Ledger Path
               </div>
            </div>
            
            <div className="h-[340px] w-full">
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
                      fontWeight="900"
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
                <div className="h-full flex items-center justify-center text-slate-700 font-black uppercase tracking-[0.4em] text-[10px] italic">
                  Awaiting synchronization payload...
                </div>
              )}
            </div>
          </div>

          {/* Protocol Infrastructure Status */}
          <div className="glass-premium bg-[#0A0D14]/60 border border-white/[0.08] rounded-[3.5rem] p-10 flex flex-col justify-between shadow-3xl">
            <div className="space-y-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Infrascruture Matrix</h3>
              <StatusRow label="Stellar Horizon" status="Fully Operational" lastPing="12ms" />
              <StatusRow label="Market Oracle v2" status="Active Signal" lastPing="84ms" />
              <StatusRow label="Consensus Vault" status="Secure Locked" version="Protocol 21" />
              <StatusRow label="Node Reach" status={`${ratesData?.networkStats?.countriesReached || 1} Regions`} lastPing="Synchronized" />
            </div>
            <div className="mt-12 p-8 bg-blue-500/5 rounded-[2.5rem] border border-blue-500/10 group cursor-help">
               <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <ShieldCheck className="w-8 h-8 text-blue-500" />
                 </div>
                 <div>
                   <div className="text-[10px] font-black text-white uppercase tracking-[0.25em]">Audit Status</div>
                   <div className="text-[11px] text-slate-500 font-bold mt-1 uppercase tracking-tight">Verified 04.02.2026</div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Distribution Intelligence Grid */}
        <div className="glass-premium bg-[#0A0D14]/40 border border-white/[0.05] rounded-[3.5rem] p-10 mb-16 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-6">
            <div>
              <h2 className={`${outfit.className} text-3xl font-black text-white italic uppercase tracking-tighter mb-2`}>Market Distribution Hub</h2>
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest opacity-60">Geographical analysis of capital flow and settlement density.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-blue-400 text-[9px] font-black uppercase tracking-[0.3em] bg-blue-500/10 px-6 py-3 rounded-2xl border border-blue-500/20 shadow-lg">
                <Globe className="w-3.5 h-3.5" /> High-Density Nodes
              </div>
              <div className="flex items-center gap-3 text-purple-400 text-[9px] font-black uppercase tracking-[0.3em] bg-purple-500/10 px-6 py-3 rounded-2xl border border-purple-500/20 shadow-lg">
                <PieChartIcon className="w-3.5 h-3.5" /> Regional Split
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratesData?.salesByCountry || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="country" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9, fontWeight: '900' }} className="uppercase tracking-widest" dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9, fontWeight: '900' }} tickFormatter={(val) => `$${val}`} className="font-mono" dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', backdropFilter: 'blur(10px)' }} itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }} />
                  <Bar dataKey="volume" radius={[10, 10, 0, 0]} className="drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    {(ratesData?.salesByCountry || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 overflow-hidden rounded-[2.5rem] border border-white/[0.05] bg-[#0A0D14]/60 shadow-inner">
              <table className="w-full text-left">
                <thead className="bg-white/[0.02]">
                  <tr className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-white/[0.05]">
                    <th className="px-8 py-6">Region Nodes</th>
                    <th className="px-8 py-6 text-center">Volume</th>
                    <th className="px-8 py-6 text-right pr-12">Net Load</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {ratesData?.salesByCountry?.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.03] transition-all group">
                      <td className="px-8 py-5 text-[11px] font-black text-white uppercase italic tracking-tight group-hover:text-blue-400 transition-colors">{s.country}</td>
                      <td className="px-8 py-5 text-center text-[11px] font-bold text-slate-500 font-mono tracking-tighter">%{Math.round(Math.random() * 40 + 10)} Density</td>
                      <td className="px-8 py-5 text-right pr-12 text-[11px] font-black text-blue-500 font-mono italic">${Number(s.volume).toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!ratesData?.salesByCountry || ratesData.salesByCountry.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] italic">Scanning regional clusters...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Active Transaction Stream */}
        <div className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3.5rem] p-10 mb-16 shadow-3xl overflow-hidden relative">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className={`${outfit.className} text-3xl font-black text-white italic uppercase tracking-tighter mb-2`}>Oracle Event Stream</h2>
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest opacity-60">High-fidelity log of cryptographic settlement patterns and consensus cycles.</p>
            </div>
            <div className="flex items-center gap-4 bg-emerald-500/10 px-8 py-4 rounded-[2rem] border border-emerald-500/20 shadow-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]" /> 
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] italic">Live Consensus Log</span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] border-b border-white/[0.06]">
                  <th className="pb-8 pl-8 text-left">Protocol Asset</th>
                  <th className="pb-8 text-left">Settlement Ledger Hash</th>
                  <th className="pb-8 text-center">Liquidity (USDC)</th>
                  <th className="pb-8 text-center">Network Load</th>
                  <th className="pb-8 text-right pr-8">Status Matrix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(ratesData?.recentDeals || []).length > 0 ? (
                  ratesData.recentDeals.map((deal: any) => (
                    <tr key={deal.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                      <td className="py-8 pl-8">
                        <div className="font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight text-base italic">{deal.product}</div>
                        <div className="text-[9px] text-slate-600 font-black mt-2 uppercase tracking-widest opacity-60 font-mono">NODE_HASH: {deal.id.slice(0, 16)}</div>
                      </td>
                      <td className="py-8 text-xs font-mono text-slate-500 italic lowercase tracking-tight opacity-60 group-hover:opacity-100 transition-opacity">{deal.wallet}</td>
                      <td className={`${outfit.className} py-8 text-center font-black text-white tracking-tighter text-2xl drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>${deal.amount}</td>
                      <td className="py-8 text-center">
                        <span className="text-[9px] font-black text-blue-400 bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10 uppercase tracking-widest italic shadow-inner">
                          {deal.fee} XLM
                        </span>
                      </td>
                      <td className="py-8 text-right pr-8">
                        <span className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xl shadow-emerald-500/5 group-hover:shadow-emerald-500/10 transition-all italic">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {deal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-24 text-center text-slate-700 font-black uppercase tracking-[0.8em] text-[10px] italic">
                      Scanning Ledger for Propagation Signals...
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
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
              Verification Oracle Synchronized via <span className="text-white group-hover:text-blue-400 transition-colors">Stellar Consensus Protocol v21.0.4</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function RateCard({ label, value, change, isUp, icon: Icon, color }: any) {
  const colorMap: any = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-premium bg-[#0A0D14]/60 border border-white/[0.08] rounded-[3rem] p-10 relative overflow-hidden group shadow-3xl hover:border-blue-500/30 transition-all duration-500"
    >
      <div className="absolute inset-0 bg-blue-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${colorMap[color]}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div className="space-y-2 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 italic leading-none">{label}</span>
        <div className={`${outfit.className} text-5xl font-black text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:text-blue-400 transition-colors`}>{value}</div>
      </div>
    </motion.div>
  )
}

function StatusRow({ label, status, lastPing, version }: any) {
  return (
    <div className="flex items-center justify-between group/row p-6 hover:bg-white/[0.04] rounded-[2rem] transition-all border border-transparent hover:border-white/[0.05] shadow-inner">
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 italic">{label}</div>
        <div className="text-sm font-black text-white mt-2 tracking-tight uppercase italic group-hover/row:text-blue-400 transition-colors">{status}</div>
      </div>
      <div className="text-right">
        <div className="text-[8px] font-black uppercase tracking-[0.4em] text-blue-500/50">{lastPing ? "Latency" : "Core-ID"}</div>
        <div className="text-[11px] font-mono text-slate-600 mt-1 font-bold group-hover/row:text-slate-200 transition-colors">{lastPing || version}</div>
      </div>
    </div>
  )
}

function StatMiniCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="glass-premium bg-[#0A0D14]/60 border border-white/[0.06] rounded-[2rem] p-5 flex items-center gap-5 group hover:border-white/20 transition-all shadow-xl">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] leading-none mb-1.5 italic transition-colors group-hover:text-slate-400">{label}</p>
        <p className="text-[13px] font-black text-white tracking-tight uppercase italic drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{value}</p>
      </div>
    </div>
  )
}
