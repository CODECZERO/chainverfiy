"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { getQRJourney, getQRMapData } from "@/lib/api-service"
import { 
  MapPin, Clock, ShieldCheck, Box, 
  ChevronRight, AlertCircle, ExternalLink, 
  History, Globe, Zap
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { countryToFlag } from "@/lib/qr-utils"

export default function JourneyPage() {
  const params = useParams()
  const shortCode = params.shortCode as string
  const [journey, setJourney] = useState<any>(null)
  const [mapData, setMapData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shortCode) return

    const fetchData = async () => {
      try {
        const [jData, mData] = await Promise.all([
          getQRJourney(shortCode),
          getQRMapData(shortCode)
        ])
        
        if (jData.success) setJourney(jData.data)
        else setError("Invalid or expired tracking code")
        
        if (mData.success) setMapData(mData.data)
      } catch (err) {
        setError("Failed to connect to the verification network")
      }
      setLoading(false)
    }

    fetchData()
  }, [shortCode])

  if (loading) return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Accessing Distributed Ledger...</p>
      </div>
    </div>
  )

  if (error || !journey) return (
    <div className="min-h-screen bg-[#020408] flex items-center justify-center p-6">
      <div className="premium-card bg-[#0A0D14] border border-white/10 rounded-[2.5rem] p-12 text-center max-w-sm">
        <AlertCircle className="w-16 h-16 text-red-500/50 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white tracking-tight italic uppercase">Tracking Error</h2>
        <p className="text-slate-500 mt-4 font-medium">{error || "Product not found"}</p>
        <button onClick={() => window.location.reload()} className="mt-8 text-blue-400 font-black uppercase tracking-widest text-[10px] hover:text-blue-300">Retry Synchronization</button>
      </div>
    </div>
  )

  const { qrCode, scans, product, supplier } = journey

  return (
    <div className="min-h-screen bg-[#020408] text-slate-400 font-sans">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
          
          {/* Left Column: Product Info & Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Product Hero */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row gap-8 relative z-10">
                <div className="w-full md:w-48 h-48 bg-white/[0.03] rounded-[2rem] border border-white/[0.08] shrink-0 overflow-hidden relative">
                   <Box className="absolute inset-0 m-auto w-12 h-12 text-slate-700" />
                   {/* In a real app, product image would be here */}
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                   <div className="flex items-center gap-3 mb-4">
                     <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Verified Asset</span>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID: {qrCode.shortCode}</span>
                   </div>
                   <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">{product.title}</h1>
                   <p className="text-slate-500 mt-4 font-medium line-clamp-2">{product.description}</p>
                   
                   <div className="mt-8 flex items-center gap-6">
                     <div className="flex items-center gap-2">
                       <Zap className="w-4 h-4 text-amber-500" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">Stellar Secured</span>
                     </div>
                     <div className="flex items-center gap-2">
                       <Globe className="w-4 h-4 text-blue-500" />
                       <span className="text-[10px] font-black text-white uppercase tracking-widest">{scans.length} Checkpoints</span>
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Chain of Custody</h3>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Live Updates</span>
              </div>
              
              <div className="space-y-2 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-[2px] before:bg-white/[0.03]">
                {scans.map((scan: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-6 group hover:translate-x-2 transition-transform duration-300 p-4 rounded-[1.5rem] hover:bg-white/[0.02]"
                  >
                    <div className="relative z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border-2 ${idx === 0 ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]" : "bg-[#0A0D14] border-white/10 text-slate-500"}`}>
                        {scans.length - idx}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-2">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-white tracking-tight">{scan.resolvedLocation || "Secure Facility"}</span>
                        {scan.ipCountry && <span>{countryToFlag(scan.ipCountry)}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(scan.serverTimestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-blue-500/80">{scan.scanSource} Verified</span>
                      </div>
                    </div>
                    
                    {scan.anchoredOnChain && (
                       <a href={`https://stellar.expert/explorer/testnet/tx/${scan.anchorTxId}`} target="_blank" className="self-center">
                         <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-blue-500/10 hover:border-blue-500/30 transition-all">
                           <ShieldCheck className="w-4 h-4 text-blue-400" />
                         </div>
                       </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Supplier & Summary (4 cols) */}
          <aside className="lg:col-span-4 space-y-8">
            
            {/* Map-Data Mock Visualizer */}
            <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 h-80 relative overflow-hidden flex items-center justify-center group">
               <div className="absolute inset-0 bg-blue-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
               <Globe className="w-24 h-24 text-slate-800 animate-pulse" />
               <div className="absolute bottom-6 left-8 right-8 text-center">
                 <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Global Routing Map</div>
                 <div className="text-xs text-slate-500 font-medium">Distributed Nodes Visualizer</div>
               </div>
            </div>

            {/* Supplier Info */}
            <div className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2.5rem] p-8 shadow-xl">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-8 border-b border-white/5 pb-4">Origin Entity</h3>
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg">
                   {supplier?.name?.[0]?.toUpperCase() || "O"}
                 </div>
                 <div>
                   <div className="font-black text-white tracking-tight text-lg">{supplier?.name || "Official Origin"}</div>
                   <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-0.5">{supplier?.location || "Primary Facility"}</div>
                 </div>
               </div>
               
               <div className="space-y-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Reputation Score</div>
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500" style={{ width: `${supplier?.trustScore || 85}%` }} />
                       </div>
                       <span className="text-xs font-black text-white">{supplier?.trustScore || 85}%</span>
                    </div>
                  </div>
                  
                  <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all shadow-lg active:scale-95">
                    View Verification Profile
                  </button>
               </div>
            </div>

            {/* Smart Contact Links */}
            <div className="px-4 space-y-4">
               <div className="flex items-center justify-between text-[9px] font-black text-slate-600 uppercase tracking-widest">
                 <span>Ledger Details</span>
                 <ExternalLink className="w-3 h-3" />
               </div>
               {qrCode.genesisAnchorTx && (
                 <a href={`https://stellar.expert/explorer/testnet/tx/${qrCode.genesisAnchorTx}`} target="_blank" className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-blue-500/30 transition-all">
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">Genesis TX</span>
                    <span className="text-[10px] font-mono text-blue-500 truncate ml-4 max-w-[120px]">{qrCode.genesisAnchorTx}</span>
                 </a>
               )}
            </div>
          </aside>

        </div>
      </main>
    </div>
  )
}
