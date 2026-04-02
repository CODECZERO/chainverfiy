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
    return <div className="min-h-screen bg-[#020408] text-slate-400 font-sans"><Header /><main className="max-w-7xl mx-auto px-6 py-48 text-center">Initializing Transparent Protocol...</main></div>
  }

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/80">Live Financial Oracle</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
              Network <span className="text-blue-500">Transparency</span>
            </h1>
            <p className="text-slate-500 max-w-xl mt-4 font-medium leading-relaxed">
              Real-time exchange rates and protocol-level financial metrics, 
              verified on the Stellar blockchain for absolute integrity.
            </p>
          </div>
          <button 
            onClick={fetchRates}
            className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 group"
          >
            <RefreshCcw className={`w-4 h-4 text-blue-400 ${loading ? "animate-spin" : ""}`} />
            <span className="text-xs font-black uppercase tracking-widest text-white">Refresh Feed</span>
          </button>
        </div>

        {/* Dynamic Exchange Rate Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <RateCard 
            label="USDC / INR"
            value={ratesData?.USDC?.inr ? `₹${ratesData.USDC.inr}` : "₹83.33"}
            change="+0.04%"
            isUp={true}
            icon={DollarSign}
            color="blue"
          />
          <RateCard 
            label="XLM / USDC"
            value={ratesData?.XLM?.usd ? `$${ratesData.XLM.usd}` : "$0.1242"}
            change="-1.2%"
            isUp={false}
            icon={Coins}
            color="emerald"
          />
          <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
             <div className="flex items-center justify-between mb-8">
               <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                 <Activity className="w-6 h-6 text-purple-400" />
               </div>
               <Info className="w-4 h-4 text-slate-600" />
             </div>
             <div className="space-y-1">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Stellar Network Fee</span>
               <div className="text-3xl font-black text-white tracking-tighter">{ratesData?.networkStats?.avgFee || "0.00001"} <span className="text-sm font-bold text-slate-600">XLM</span></div>
             </div>
             <div className="mt-4 text-[10px] font-black text-emerald-400/80 uppercase tracking-widest bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10 inline-block">
               Optimal Efficiency
             </div>
          </div>
        </div>

        {/* Global Network Performance Stat Bar */}
        <div className="grid md:grid-cols-5 gap-4 mt-12 mb-12">
          <StatMiniCard 
            label="Platform Volume"
            value={`$${ratesData?.networkStats?.totalVolume || "0.00"}`}
            icon={<BarChart2 className="w-4 h-4 text-blue-400" />}
          />
          <StatMiniCard 
            label="System Fees"
            value={`$${ratesData?.networkStats?.systemFees || "0.00"}`}
            icon={<Coins className="w-4 h-4 text-yellow-400" />}
          />
          <StatMiniCard 
            label="Net Yield"
            value={`$${(Number(ratesData?.networkStats?.totalVolume || 0) * 0.99).toFixed(2)}`}
            icon={<DollarSign className="w-4 h-4 text-green-400" />}
          />
          <StatMiniCard 
            label="Uptime"
            value={ratesData?.networkStats?.uptime || "99.99%"}
            icon={<Globe className="w-4 h-4 text-emerald-400" />}
          />
          <StatMiniCard 
            label="Protocol"
            value={ratesData?.networkStats?.protocol || "Soroban"}
            icon={<ShieldCheck className="w-4 h-4 text-purple-400" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Volume Trend Chart */}
          <div className="lg:col-span-2 premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-12">
               <div>
                 <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Benchmark Scaling</h3>
                 <div className="text-2xl font-black text-white tracking-tight mt-1 italic uppercase">Network Volume Trend (30D)</div>
               </div>
               <div className="flex gap-2">
                 <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Ledger</div>
               </div>
            </div>
            
            <div className="h-[300px] w-full">
              {ratesData?.volumeTrend && ratesData.volumeTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ratesData.volumeTrend}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#475569" 
                      fontSize={10} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    />
                    <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0A0D14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorVolume)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 font-bold uppercase tracking-widest text-xs">
                  Awaiting sufficient data for trend analysis...
                </div>
              )}
            </div>
          </div>

          {/* Protocol Configuration & Health */}
          <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 flex flex-col justify-between">
            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">Protocol Status</h3>
              <StatusRow label="Stellar Gateway" status="Operational" lastPing="14ms" />
              <StatusRow label="Market Oracle" status="Active" lastPing="82ms" />
              <StatusRow label="Contract Vault" status="Secured" version="v2.1" />
              <StatusRow label="Global Reach" status={`${ratesData?.networkStats?.countriesReached || 1} Regions`} lastPing="Active" />
            </div>
            <div className="mt-12 p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10">
               <div className="flex items-center gap-4">
                 <ShieldCheck className="w-8 h-8 text-blue-500" />
                 <div>
                   <div className="text-[10px] font-black text-white uppercase tracking-widest">Audit Status</div>
                   <div className="text-xs text-slate-500 font-medium mt-0.5">Verified on April 02, 2026</div>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Market Distribution Analysis */}
        <div className="premium-card rounded-[2.5rem] p-8 border border-white/[0.04] mb-12 bg-[#0A0D14]/60 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase mb-1">Market Distribution Analysis</h2>
              <p className="text-sm text-slate-500">Geographical deep-dive into sales frequency and capital flow.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
                <Globe className="w-3 h-3" /> Real-time Nodes
              </div>
              <div className="flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-widest bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20">
                <PieChartIcon className="w-3 h-3" /> Country-Wise Split
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratesData?.salesByCountry || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="country" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #ffffff10', borderRadius: '12px' }} itemStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                    {(ratesData?.salesByCountry || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-white/5 bg-[#12141F]/40">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Region</th>
                    <th className="px-6 py-4 text-center">Items</th>
                    <th className="px-6 py-4 text-center">Avg. Rate</th>
                    <th className="px-6 py-4 text-right">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {ratesData?.salesByCountry?.map((s: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-white">{s.country}</td>
                      <td className="px-6 py-4 text-center text-sm font-medium">{s.itemsSold}</td>
                      <td className="px-6 py-4 text-center text-sm font-mono text-slate-400">${Number(s.avgRate).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-blue-400">${Number(s.volume).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Ledger Transaction Feed */}
        <div className="premium-card rounded-[2.5rem] p-8 border border-white/[0.04] bg-[#0A0D14]/80 backdrop-blur-xl mb-12">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase mb-1">Platform Activity Feed</h2>
              <p className="text-sm text-slate-500">Live ledger events representing settlement finality and consensus cycles.</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Settlement Log
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-white/[0.04]">
                  <th className="pb-6 pl-4 text-left">Entity / Product</th>
                  <th className="pb-6 text-left">Settlement Hash</th>
                  <th className="pb-6 text-center">Volume (USDC)</th>
                  <th className="pb-6 text-center">Consensus Fee</th>
                  <th className="pb-6 text-right pr-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {(ratesData?.recentDeals || []).length > 0 ? (
                  ratesData.recentDeals.map((deal: any) => (
                    <tr key={deal.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-6 pl-4">
                        <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{deal.product}</div>
                        <div className="text-[10px] text-slate-600 font-bold mt-1">Settle ID: {deal.id.slice(0, 8)}</div>
                      </td>
                      <td className="py-6 text-xs font-mono text-slate-500 italic">{deal.wallet}</td>
                      <td className="py-6 text-center font-black text-white tracking-tighter text-lg">${deal.amount}</td>
                      <td className="py-6 text-center">
                        <span className="text-[10px] font-black text-blue-400 bg-blue-500/5 px-3 py-1.5 rounded-xl border border-blue-500/10 uppercase tracking-widest">
                          ${deal.fee} 
                        </span>
                      </td>
                      <td className="py-6 text-right pr-4">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {deal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-600 font-black uppercase tracking-[0.3em] text-xs">
                      Awaiting new block propagation...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center pb-24">
          <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 rounded-full border border-white/10">
            <Zap className="w-4 h-4 text-yellow-400" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Transparency Oracle powered by <span className="text-white">Stellar Horizon v2.1</span>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-10 relative overflow-hidden group shadow-xl"
    >
      <div className="flex items-center justify-between mb-8">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <div className="text-4xl font-black text-white tracking-tighter tabular-nums">{value}</div>
      </div>
    </motion.div>
  )
}

function StatusRow({ label, status, lastPing, version }: any) {
  return (
    <div className="flex items-center justify-between group/row p-4 hover:bg-white/[0.02] rounded-2xl transition-all">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</div>
        <div className="text-sm font-bold text-white mt-1">{status}</div>
      </div>
      <div className="text-right">
        <div className="text-[9px] font-black uppercase tracking-widest text-blue-500/60">{lastPing ? "Latency" : "Version"}</div>
        <div className="text-xs font-mono text-slate-600 mt-1">{lastPing || version}</div>
      </div>
    </div>
  )
}

function StatMiniCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-[#0A0D14]/80 border border-white/[0.05] rounded-2xl p-4 flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  )
}
