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

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: ReactNode }> = {
  VERIFIED: {
    label: "Verified Unit",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  PENDING_VERIFICATION: {
    label: "Audit Pending",
    variant: "secondary",
    icon: <Clock className="w-3 h-3" />,
  },
  FLAGGED: {
    label: "Security Risk",
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group flex flex-col bg-[#0A0D14]/80 backdrop-blur-3xl border border-white/[0.06] hover:border-blue-500/40 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl"
    >
      {/* ── Asset Visual ── */}
      <div className="relative aspect-video rounded-2xl m-3 overflow-hidden bg-black/40 border border-white/[0.03]">
        {image && !imgError ? (
          <>
            <Image 
              src={getIPFSUrl(image)} 
              alt={String(title)} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
            
            <button 
              onClick={(e) => { e.preventDefault(); setShowFullImg(true); }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[1px]"
            >
              <div className="bg-white/10 p-3 rounded-xl border border-white/20">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20 group-hover:opacity-40 transition-opacity">
            <Package className="w-12 h-12 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">No Media Link</span>
          </div>
        )}
        
        <div className="absolute top-3 right-3 z-20">
          <Badge variant={config.variant} className="gap-1.5 h-7 px-3 text-[9px] font-black uppercase tracking-widest italic rounded-lg">
            {config.icon} {config.label}
          </Badge>
        </div>

        {task.category && (
          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-xl text-slate-400 border border-white/[0.08] rounded-lg px-3 py-1.5 text-[9px] font-black uppercase tracking-widest italic z-20">
            {String(task.category)}
          </div>
        )}

        {qrCodeUrl && (
          <button 
            onClick={(e) => { e.preventDefault(); setShowQR(true); }}
            className="absolute bottom-3 right-3 p-2 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 text-white hover:bg-blue-600 transition-all z-20 shadow-xl opacity-0 group-hover:opacity-100"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Data Layer ── */}
      <div className="px-6 pb-6 pt-2 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-tight group-hover:text-blue-400 transition-colors line-clamp-1">
            {String(title || "UNALLOCATED ASSET")}
          </h3>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">TRUST INDEX</span>
             <span className="text-xs font-black text-emerald-400 italic">
               {task.supplier?.trustScore || 0}%
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-3 h-3 text-blue-500/60" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
            {task.supplier?.name || "Independent"} · {task.supplier?.location || "Global"}
          </span>
        </div>

        {/* Financial Valuation */}
        <div className="mt-auto bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 mb-6 group-hover:border-blue-500/20 transition-colors">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic mb-0.5">Valuation (INR)</span>
                 <span className="text-xl font-black text-white tracking-tighter italic">
                   ₹{Number(priceInr).toLocaleString()}
                 </span>
              </div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col items-end">
                 <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest italic mb-0.5">Stable (USDC)</span>
                 <span className="text-[11px] font-mono font-black text-blue-400 italic">
                   {Number(usdcPrice).toFixed(2)}
                 </span>
              </div>
           </div>
        </div>

        {/* Consensus Meter */}
        <div className="space-y-2 mb-6">
           <div className="flex justify-between text-[8px] font-black uppercase tracking-widest italic">
              <span className="text-emerald-500">{voteReal} YES</span>
              <span className="text-red-500">{voteFake} NO</span>
           </div>
           <div className="relative h-1 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${realPct}%` }}
                className="absolute inset-y-0 left-0 bg-blue-600 rounded-full"
              />
           </div>
        </div>

        <Link href={`/product/${id}`} className="block">
          <Button className="w-full h-11 rounded-xl bg-white text-black hover:bg-slate-200 font-black uppercase tracking-widest italic text-[9px] shadow-lg transition-all active:scale-[0.98]">
            <Search className="w-3.5 h-3.5 mr-2" /> Inspect Asset
          </Button>
        </Link>
      </div>

      {/* ── Asset Visualizer ── */}
      <Dialog open={showFullImg} onOpenChange={setShowFullImg}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 backdrop-blur-3xl border-white/10 rounded-2xl border-none">
          <div className="relative aspect-video w-full">
            {image && <Image src={getIPFSUrl(image)} alt={String(title)} fill className="object-contain p-8" />}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Node Access Point ── */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md bg-[#0A0D14]/98 backdrop-blur-3xl border-white/10 rounded-3xl p-10 flex flex-col items-center">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 italic">On-Chain Identifier</div>
            <div className="relative w-64 h-64 bg-white p-6 rounded-2xl shadow-2xl mb-8">
              {qrCodeUrl && <Image src={qrCodeUrl} alt="Node ID" fill className="object-contain p-4" />}
            </div>
            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest leading-relaxed italic mb-10 px-4">
              Cryptographic proof of authenticity secured on the Stellar Ledger.
            </p>
            <Button 
               className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest text-[10px] italic shadow-2xl"
               onClick={() => {
                 if (qrCodeUrl) {
                   const link = document.createElement('a');
                   link.href = qrCodeUrl;
                   link.download = `prm-node-${id}.png`;
                   link.click();
                 }
               }}
            >
              Export Certificate
            </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
