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
    label: "Verified Authentic",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  PENDING_VERIFICATION: {
    label: "Checking Quality",
    variant: "secondary",
    icon: <Clock className="w-3 h-3" />,
  },
  FLAGGED: {
    label: "Warning Issued",
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -10, scale: 1.02 }}
      className="group flex flex-col bg-[#080B12]/80 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_40px_rgba(79,70,229,0.15)] relative border border-white/[0.04] hover:border-indigo-500/30"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Product Image Section */}
      <div className="relative aspect-[4/3] rounded-[2rem] m-3 overflow-hidden bg-[#0A0D14] border border-white/[0.02]">
        {image && !imgError ? (
          <>
            <Image 
              src={getIPFSUrl(image)} 
              alt={String(title)} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
            
            <button 
              onClick={(e) => { e.preventDefault(); setShowFullImg(true); }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[1px]"
            >
              <div className="bg-white/10 p-3 rounded-full border border-white/20 shadow-2xl">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30 group-hover:opacity-50 transition-opacity">
            <Package className="w-12 h-12 text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">No Photo</span>
          </div>
        )}
        
        <div className="absolute top-4 right-4 z-20">
          <Badge className="gap-1.5 h-7 px-3 text-[9px] font-semibold rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
            <span className={status === "VERIFIED" ? "text-emerald-400" : status === "FLAGGED" ? "text-red-400" : "text-indigo-400"}>
               {config.icon}
            </span>
            {config.label}
          </Badge>
        </div>

        {task.category && (
          <div className="absolute top-4 left-4 bg-indigo-600/10 backdrop-blur-md text-indigo-300 border border-indigo-500/20 rounded-full px-3 py-1 text-[9px] font-bold z-20">
            {String(task.category)}
          </div>
        )}

        {qrCodeUrl && (
          <button 
            onClick={(e) => { e.preventDefault(); setShowQR(true); }}
            className="absolute bottom-4 right-4 p-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-white hover:bg-indigo-600 hover:scale-110 transition-all z-20 shadow-2xl opacity-0 group-hover:opacity-100"
          >
            <QrCode className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="px-7 pb-8 pt-3 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-4">
          <h3 className={`${outfit.className} text-lg font-bold text-white tracking-tight leading-tight group-hover:text-indigo-400 transition-all line-clamp-1`}>
            {String(title || "Generic Product")}
          </h3>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Trust Score</span>
             <span className="text-sm font-bold text-emerald-400">
               {task.supplier?.trustScore || 85}%
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
             <Globe className="w-3 h-3 text-indigo-400" />
          </div>
          <span className="text-xs font-medium text-slate-400 truncate">
            {task.supplier?.name || "Independent"} · {task.supplier?.location || "Global Network"}
          </span>
        </div>

        {/* Price/Digital Dollar Section */}
         <div className="mt-auto relative bg-[#0C0F1A] border border-white/[0.04] rounded-2xl p-4 mb-6 group-hover:border-indigo-500/20 transition-all duration-500 shadow-inner">
           <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Local Price</span>
                  <span className={`${outfit.className} text-xl font-bold text-white`}>
                    ₹{Number(priceInr).toLocaleString()}
                  </span>
              </div>
              <div className="h-10 w-px bg-white/[0.08] mx-2" />
              <div className="flex flex-col items-end">
                 <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">USDC Stablecoin</span>
                 <span className="text-[14px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                    ${Number(usdcPrice).toFixed(2)}
                 </span>
              </div>
           </div>
        </div>

        {/* Community Trust Section */}
         <div className="space-y-1.5 mb-6">
            <div className="flex justify-between text-[8px] font-bold tracking-wider">
               <span className="text-emerald-500 uppercase">{voteReal} COMMUNITY OK</span>
               <span className="text-slate-600 uppercase">{voteFake} DISPUTED</span>
            </div>
            <div className="relative h-1 bg-white/[0.05] rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${realPct}%` }}
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
               />
            </div>
         </div>

        <Link href={`/product/${id}`} className="block">
          <Button className={`${outfit.className} w-full h-12 rounded-xl bg-white text-black hover:bg-indigo-50 hover:text-indigo-900 font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] group/btn overflow-hidden relative`}>
             <span className="relative z-10">View Product Details</span>
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-indigo-500/0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
          </Button>
        </Link>
      </div>

      {/* Full Image Modal */}
      <Dialog open={showFullImg} onOpenChange={setShowFullImg}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 backdrop-blur-3xl border-none rounded-3xl shadow-2xl">
          <div className="relative aspect-video w-full">
            {image && <Image src={getIPFSUrl(image)} alt={String(title)} fill className="object-contain p-8" />}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-md bg-[#05060A] border border-white/10 rounded-[3rem] p-12 flex flex-col items-center">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-10">Authenticity ID</div>
            <div className="relative w-64 h-64 bg-white p-6 rounded-[2rem] shadow-2xl mb-10 overflow-hidden">
              {qrCodeUrl && <Image src={qrCodeUrl} alt="Product QR" fill className="object-contain p-4" />}
            </div>
            <p className="text-xs text-slate-400 text-center leading-relaxed mb-12">
              This cryptographic proof confirms the product origin and is secured on the <span className="text-indigo-400 font-bold">Stellar Network</span>.
            </p>
            <Button 
               className={`${outfit.className} w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl transition-all`}
               onClick={() => {
                 if (qrCodeUrl) {
                   const link = document.createElement('a');
                   link.href = qrCodeUrl;
                   link.download = `verified-product-${id}.png`;
                   link.click();
                 }
               }}
            >
              Download Certificate
            </Button>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
