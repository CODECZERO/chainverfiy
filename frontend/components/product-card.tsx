"use client"

import React, { useState, ReactNode } from "react"
import Link from "next/link"
import { CheckCircle2, ShieldAlert, Clock, ArrowRight, Award, Package, XCircle, Maximize2, QrCode, ShoppingCart, Eye, Zap, Shield, Globe } from "lucide-react"
import { convertInrToUsdc } from "@/lib/exchange-rates"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { getIPFSUrl } from "@/lib/image-utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const STATUS_BADGE: Record<string, { label: string; class: string; icon: ReactNode; glow: string }> = {
  VERIFIED: {
    label: "VERIFIED",
    class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  PENDING_VERIFICATION: {
    label: "PENDING",
    class: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
    icon: <Clock className="w-3 h-3" />,
  },
  FLAGGED: {
    label: "FLAGGED",
    class: "bg-red-500/10 text-red-400 border-red-500/20",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.3)]",
    icon: <XCircle className="w-3 h-3" />,
  },
}

export function ProductCard({ task, index = 0, usdcInr = 83.33 }: { task: any; index?: number; usdcInr?: number; key?: React.Key }) {
  const [imgError, setImgError] = useState(false)
  const [showFullImg, setShowFullImg] = useState(false)
  const [showQR, setShowQR] = useState(false)
  
  const id = task.id || task._id
  const title = task.title || task.name
  const description = task.description
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

  const badge = STATUS_BADGE[status] || STATUS_BADGE.PENDING_VERIFICATION

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
      className="group relative flex flex-col bg-[#0A0B10]/60 backdrop-blur-3xl border border-white/[0.05] hover:border-blue-500/40 rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-2xl"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full group-hover:bg-blue-600/15 transition-colors pointer-events-none" />
      
      {/* ── Media Engine ── */}
      <div className="relative aspect-[4/3] m-3 rounded-[2rem] overflow-hidden bg-[#0F1219] border border-white/[0.03]">
        {image && !imgError ? (
          <>
            <Image 
              src={getIPFSUrl(image)} 
              alt={title} 
              fill 
              className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B10] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            
            {/* Tactical View Trigger */}
            <button 
              onClick={(e) => { e.preventDefault(); setShowFullImg(true); }}
              className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center z-10 backdrop-blur-[2px]"
            >
              <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <Maximize2 className="w-5 h-5 text-white" />
              </div>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
            <Package className="w-16 h-16 text-white" strokeWidth={1} />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] italic text-white">No Asset Loaded</span>
          </div>
        )}
        
        {/* Unit Status */}
        <div className={`absolute top-4 right-4 flex items-center gap-2 border rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-widest italic ${badge.class} ${badge.glow} backdrop-blur-xl z-20 transition-all duration-500`}>
          {badge.icon} {badge.label}
        </div>

        {/* Global Catalog Label */}
        {task.category && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-2xl text-slate-400 border border-white/[0.08] rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-widest italic z-20">
            {String(task.category)}
          </div>
        )}

        {/* Node Access Point (QR) */}
        {showQR && (
          <button 
            onClick={(e) => { e.preventDefault(); setShowQR(true); }}
            className="absolute bottom-4 right-4 p-3 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 text-white hover:bg-blue-600 transition-all z-20 shadow-2xl group/qr"
          >
            <QrCode className="w-4 h-4 group-hover/qr:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* ── Intel Layer ── */}
      <div className="px-7 pb-8 pt-3 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-2">
          <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-tight group-hover:text-blue-400 transition-colors duration-500 line-clamp-1">
            {String(title || "UNIDENTIFIED UNIT")}
          </h3>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">TRUST</span>
             <span className="text-sm font-black text-emerald-400 italic">
               {task.supplier?.trustScore ? `${task.supplier.trustScore}%` : "0%"}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-3 h-3 text-blue-500/60" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic truncate">
            {task.supplier?.name || "Independent"} · {task.supplier?.location || "Unknown"}
          </span>
          {task.supplier?.isVerified && (
            <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          )}
        </div>

        {/* Market Valuation */}
        <div className="mt-auto bg-white/[0.02] border border-white/[0.04] rounded-3xl p-5 mb-6 group-hover:border-blue-500/20 transition-colors duration-500">
           <div className="flex items-end justify-between">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic mb-1">Valuation (INR)</span>
                 <span className="text-2xl font-black text-white tracking-tighter italic">
                   ₹{Number(priceInr).toLocaleString()}
                 </span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">STABLE (USDC)</span>
                 <span className="text-xs font-mono font-black text-blue-400 italic">
                   {Number(usdcPrice).toFixed(2)}
                 </span>
              </div>
           </div>
        </div>

        {/* Community Consensus Bar */}
        <div className="space-y-3 mb-6">
           <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] italic">
              <span className="text-emerald-500/80">{voteReal} GENUINE</span>
              <span className="text-red-500/80">{voteFake} FRAUDULENT</span>
           </div>
           <div className="relative h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.05]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${realPct}%` }}
                transition={{ duration: 1.5, delay: 0.5 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"
              />
           </div>
        </div>

        {/* Strategic Interface */}
        <Link href={`/product/${id}`} className="block">
          <Button className="w-full h-14 rounded-2xl bg-white text-black hover:bg-slate-200 font-black uppercase tracking-[0.3em] italic text-[10px] shadow-2xl transition-all active:scale-[0.98]">
            <Eye className="w-4 h-4 mr-2" /> Inspect Unit
          </Button>
        </Link>
      </div>

      {/* ── Asset Visualizer ── */}
      <Dialog open={showFullImg} onOpenChange={setShowFullImg}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-[#0A0B10]/95 backdrop-blur-3xl border-white/10 rounded-[3rem]">
          <div className="relative aspect-video w-full">
            <Image 
              src={getIPFSUrl(image)} 
              alt={title} 
              fill 
              className="object-contain p-8"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Node Access Point ── */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md bg-[#0A0B10]/98 backdrop-blur-3xl border-white/10 rounded-[3rem] p-0 overflow-hidden">
          <div className="p-10 flex flex-col items-center">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 italic">On-Chain Identifier</div>
            <div className="relative w-64 h-64 bg-white p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] mb-8">
              <Image src={qrCodeUrl} alt="Node ID" fill className="object-contain p-4" />
            </div>
            <p className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest leading-relaxed italic mb-10 px-4">
              Cryptographic proof of authenticity secured on the Stellar Ledger.
            </p>
            <Button 
               className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest text-[10px] italic shadow-2xl"
               onClick={() => {
                 const link = document.createElement('a');
                 link.href = qrCodeUrl;
                 link.download = `prm-node-${id}.png`;
                 link.click();
               }}
            >
              Export Certificate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
