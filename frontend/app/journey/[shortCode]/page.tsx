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
import { Outfit } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })

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
    <div className="min-h-screen bg-[#050608] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-xs font-medium">Accessing Ledger...</p>
      </div>
    </div>
  )

  if (error || !journey) return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center p-6">
      <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-8 text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
        <h2 className={`${outfit.className} text-xl font-semibold text-white tracking-tight`}>Tracking Error</h2>
        <p className="text-slate-500 mt-3 text-sm">{error || "Product not found"}</p>
        <button onClick={() => window.location.reload()} className="mt-6 text-blue-400 font-medium text-xs hover:text-blue-300 transition-colors">Retry</button>
      </div>
    </div>
  )

  const { qrCode, scans, product, supplier } = journey

  return (
    <div className="min-h-screen bg-[#050608] text-slate-400 font-sans">
      <Header />
      
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-12">
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-start">
          
          {/* Left Column: Product Info & Timeline (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Product Hero */}
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 md:p-8 relative overflow-hidden group"
            >
              <div className="flex flex-col md:flex-row gap-6 relative z-10">
                <div className="w-full md:w-40 h-40 bg-white/[0.02] rounded-xl border border-white/[0.05] shrink-0 overflow-hidden relative flex items-center justify-center">
                   <Box className="w-10 h-10 text-slate-700" />
                   {/* In a real app, product image would be here */}
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                   <div className="flex items-center gap-2.5 mb-3">
                     <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-medium rounded-md">Verified Asset</span>
                     <span className="text-[11px] font-medium text-slate-500">ID: {qrCode.shortCode}</span>
                   </div>
                   <h1 className={`${outfit.className} text-2xl md:text-3xl font-semibold text-white tracking-tight`}>{product.title}</h1>
                   <p className="text-slate-500 mt-2 text-sm line-clamp-2">{product.description}</p>
                   
                   <div className="mt-5 flex items-center gap-5">
                     <div className="flex items-center gap-1.5">
                       <Zap className="w-3.5 h-3.5 text-amber-500" />
                       <span className="text-[11px] font-medium text-white">Stellar Secured</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                       <Globe className="w-3.5 h-3.5 text-blue-500" />
                       <span className="text-[11px] font-medium text-white">{scans.length} Checkpoints</span>
                     </div>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className={`${outfit.className} text-sm font-semibold text-white`}>Chain of Custody</h3>
                <span className="text-[11px] font-medium text-slate-600">Live Updates</span>
              </div>
              
              <div className="space-y-1.5 relative before:absolute before:left-[1.4rem] before:top-4 before:bottom-4 before:w-px before:bg-white/[0.04]">
                {scans.map((scan: any, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex gap-4 group hover:translate-x-1 transition-transform duration-200 p-3 rounded-xl hover:bg-white/[0.015]"
                  >
                    <div className="relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold border ${idx === 0 ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]" : "bg-[#0A0D14] border-white/[0.08] text-slate-500"}`}>
                        {scans.length - idx}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-white text-sm">{scan.resolvedLocation || "Secure Facility"}</span>
                        {scan.ipCountry && <span>{countryToFlag(scan.ipCountry)}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(scan.serverTimestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-blue-500/70">{scan.scanSource} Verified</span>
                      </div>
                    </div>
                    
                    {scan.anchoredOnChain && (
                       <a href={`https://stellar.expert/explorer/testnet/tx/${scan.anchorTxId}`} target="_blank" className="self-center">
                         <div className="p-2 bg-white/[0.02] border border-white/[0.05] rounded-lg hover:bg-blue-500/10 hover:border-blue-500/20 transition-all">
                           <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                         </div>
                       </a>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Supplier & Summary (4 cols) */}
          <aside className="lg:col-span-4 space-y-5">
            
            {/* Map Placeholder */}
            <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 h-56 relative overflow-hidden flex items-center justify-center group">
               <div className="absolute inset-0 bg-blue-500/[0.02] opacity-50 group-hover:opacity-100 transition-opacity" />
               <div className="text-center relative z-10">
                 <Globe className="w-16 h-16 text-slate-800 mx-auto mb-3" />
                 <p className="text-[11px] font-medium text-blue-400">Global Routing Map</p>
                 <p className="text-[11px] text-slate-600">Distributed Nodes</p>
               </div>
            </div>

            {/* Supplier Info */}
            <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6">
               <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-5 border-b border-white/[0.04] pb-3">Origin Entity</h3>
               <div className="flex items-center gap-3 mb-5">
                 <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-base font-semibold text-white">
                   {supplier?.name?.[0]?.toUpperCase() || "O"}
                 </div>
                 <div>
                   <p className="font-semibold text-white text-sm">{supplier?.name || "Official Origin"}</p>
                   <p className="text-[11px] text-blue-500 mt-0.5">{supplier?.location || "Primary Facility"}</p>
                 </div>
               </div>
               
               <div className="space-y-3">
                  <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                    <p className="text-[10px] text-slate-600 mb-1">Reputation Score</p>
                    <div className="flex items-center gap-2.5">
                       <div className="flex-1 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500 rounded-full" style={{ width: `${supplier?.trustScore || 85}%` }} />
                       </div>
                       <span className="text-xs font-semibold text-white">{supplier?.trustScore || 85}%</span>
                    </div>
                  </div>
                  
                  <button className="w-full py-3 bg-white text-black rounded-xl font-semibold text-xs hover:bg-slate-200 transition-all active:scale-95">
                    View Profile
                  </button>
               </div>
            </div>

            {/* Ledger Links */}
            <div className="px-2 space-y-3">
               <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                 <span>Ledger Details</span>
                 <ExternalLink className="w-3 h-3" />
               </div>
               {qrCode.genesisAnchorTx && (
                 <a href={`https://stellar.expert/explorer/testnet/tx/${qrCode.genesisAnchorTx}`} target="_blank" className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl group hover:border-blue-500/20 transition-all">
                    <span className="text-[11px] font-medium text-slate-400 group-hover:text-white transition-colors">Genesis TX</span>
                    <span className="text-[11px] font-mono text-blue-500 truncate ml-3 max-w-[110px]">{qrCode.genesisAnchorTx}</span>
                 </a>
               )}
            </div>
          </aside>

        </div>
      </main>
    </div>
  )
}
