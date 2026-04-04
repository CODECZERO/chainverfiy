"use client"

import React, { useState, ReactNode } from "react"
import Link from "next/link"
import { 
  CheckCircle2, XCircle, Clock, Maximize2, 
  Package, Search, Globe, QrCode 
} from "lucide-react"
import { convertInrToUsdc } from "@/lib/exchange-rates"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { getIPFSUrl } from "@/lib/image-utils"
import { motion } from "framer-motion"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Outfit } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: ReactNode }> = {
  VERIFIED: {
    label: "Protocol Verified",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  PENDING_VERIFICATION: {
    label: "Trace Pending",
    variant: "secondary",
    icon: <Clock className="w-3 h-3" />,
  },
  FLAGGED: {
    label: "Security Alert",
    variant: "destructive",
    icon: <XCircle className="w-3 h-3" />,
  },
}

export function ProductCard({ task, index = 0, usdcInr = 83.33 }: { task: any; index?: number; usdcInr?: number }) {
  const [imgError, setImgError] = useState(false)
  const [showFullImg, setShowFullImg] = useState(false)
  const [showQR, setShowQR] = useState(false)
  
  const id = task.id || task._id
  const title = task.title || task.name
  const status = task.status || task.missionStatus || "PENDING_VERIFICATION"
  const mediaUrls = task.proofMediaUrls || task.mediaUrls || []
  const image = mediaUrls[0] || null
  const qrCodeUrl = task.qrCodeUrl
  
  const voteReal = task.voteReal || 0
  const voteFake = task.voteFake || 0
  const totalVotes = voteReal + voteFake
  const realPct = totalVotes > 0 ? (voteReal / totalVotes) * 100 : 0
  
  const priceInr = task.priceInr || 0
  const usdcPrice = typeof task.priceUsdc === "number" && task.priceUsdc > 0 ? task.priceUsdc : convertInrToUsdc(priceInr, usdcInr)

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING_VERIFICATION

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="group flex flex-col glass-card rounded-[2rem] overflow-hidden transition-all duration-500 shadow-2xl relative"
    >
      {/* ── Asset Visual ── */}
      <div className="relative aspect-video rounded-2xl m-4 overflow-hidden bg-black/60 border border-white/[0.04]">
        {image && !imgError ? (
          <>
            <Image 
              src={getIPFSUrl(image)} 
              alt={String(title)} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform duration-1000"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            
            <button 
              onClick={(e) => { e.preventDefault(); setShowFullImg(true); }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[2px]"
            >
              <div className="bg-white/10 p-3 rounded-2xl border border-white/20 shadow-2xl">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20 group-hover:opacity-40 transition-opacity">
            <Package className="w-12 h-12 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">No Media</span>
          </div>
        )}
        
        <div className="absolute top-4 right-4 z-20">
          <Badge className="gap-1.5 h-7 px-3 text-[8px] font-bold uppercase tracking-wider rounded-lg bg-black/60 backdrop-blur-md border-white/10 text-white">
            <span className={status === "VERIFIED" ? "text-emerald-400" : status === "FLAGGED" ? "text-red-400" : "text-indigo-400"}>
               {config.icon}
            </span>
            {config.label}
          </Badge>
        </div>

        {task.category && (
          <div className="absolute top-4 left-4 bg-indigo-600/10 backdrop-blur-md text-indigo-400 border border-indigo-500/20 rounded-lg px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider z-20">
            {String(task.category)}
          </div>
        )}

        {qrCodeUrl && (
          <button 
            onClick={(e) => { e.preventDefault(); setShowQR(true); }}
            className="absolute bottom-4 right-4 p-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-white hover:bg-indigo-600 hover:scale-110 transition-all z-20 shadow-2xl opacity-0 group-hover:opacity-100"
          >
            <QrCode className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Data Layer ── */}
      <div className="px-7 pb-8 pt-2 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className={`${outfit.className} text-xl font-bold text-white tracking-tight leading-tight group-hover:text-indigo-400 transition-colors line-clamp-1`}>
            {String(title || "Unallocated Asset")}
          </h3>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Trust Score</span>
             <span className="text-xs font-bold text-emerald-400 font-mono">
               {task.supplier?.trustScore || 85}%
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-3.5 h-3.5 text-indigo-500/60" />
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
            {task.supplier?.name || "Independent"} · {task.supplier?.location || "Global Network"}
          </span>
        </div>

        {/* Financial Valuation Overlay */}
        <div className="mt-auto relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-8 group-hover:border-indigo-500/30 group-hover:bg-indigo-600/[0.02] transition-all overflow-hidden">
           <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Asset Value (INR)</span>
                 <span className={`${outfit.className} text-2xl font-bold text-white tracking-tight`}>
                   ₹{Number(priceInr).toLocaleString()}
                 </span>
              </div>
              <div className="h-10 w-px bg-white/5 mx-2" />
              <div className="flex flex-col items-end">
                 <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Stable (USDC)</span>
                 <span className="text-[13px] font-mono font-medium text-indigo-400">
                    {Number(usdcPrice).toFixed(2)}
                 </span>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-2xl rounded-full translate-x-12 -translate-y-12" />
        </div>

        {/* Consensus Meter */}
        <div className="space-y-2 mb-8">
           <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider">
              <span className="text-emerald-500">{voteReal} VALIDATED</span>
              <span className="text-slate-600">{voteFake} DISPUTED</span>
           </div>
           <div className="relative h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${realPct}%` }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full"
              />
           </div>
        </div>

        <Link href={`/product/${id}`} className="block">
          <Button className={`${outfit.className} w-full h-12 rounded-xl bg-white text-black hover:bg-slate-200 font-bold uppercase tracking-wider text-[10px] shadow-2xl transition-all active:scale-[0.98] group/btn`}>
            <Search className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" /> Access Data Stream
          </Button>
        </Link>
      </div>

      {/* ── Asset Visualizer ── */}
      <Dialog open={showFullImg} onOpenChange={setShowFullImg}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 backdrop-blur-3xl border-white/10 rounded-3xl border-none shadow-[0_0_100px_rgba(0,0,0,0.9)]">
          <div className="relative aspect-video w-full">
            {image && <Image src={getIPFSUrl(image)} alt={String(title)} fill className="object-contain p-12" />}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Node Access Point ── */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md bg-[#030408]/98 backdrop-blur-3xl border border-white/[0.1] rounded-[2.5rem] p-12 flex flex-col items-center">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-10">On-Chain Identifier</div>
            <div className="relative w-72 h-72 bg-white p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] mb-10 group/qr overflow-hidden">
              {qrCodeUrl && <Image src={qrCodeUrl} alt="Node ID" fill className="object-contain p-6 group-hover/qr:scale-105 transition-transform duration-700" />}
            </div>
            <p className="text-[10px] font-medium text-slate-400 text-center uppercase tracking-widest leading-relaxed mb-12 px-6">
              Cryptographic proof of authenticity secured on the <span className="text-indigo-400">Stellar Ledger Protocol</span>.
            </p>
            <Button 
               className={`${outfit.className} w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider text-[10px] shadow-2xl transition-all hover:translate-y-[-2px] active:translate-y-0`}
               onClick={() => {
                 if (qrCodeUrl) {
                   const link = document.createElement('a');
                   link.href = qrCodeUrl;
                   link.download = `chv-node-${id}.png`;
                   link.click();
                 }
               }}
            >
              Export Crypto-Certificate
            </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
