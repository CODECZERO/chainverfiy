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
    label: "Verified",
    variant: "default",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  PENDING_VERIFICATION: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="w-3 h-3" />,
  },
  FLAGGED: {
    label: "Flagged",
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
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -6 }}
      className="group flex flex-col bg-white/[0.015] rounded-2xl overflow-hidden transition-all duration-400 shadow-[0_4px_20px_rgb(0,0,0,0.1)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.1)] relative border border-white/[0.04] hover:border-indigo-500/20"
    >
      {/* Product Image Section */}
      <div className="relative aspect-[4/3] rounded-xl m-2.5 overflow-hidden bg-[#0A0D14] border border-white/[0.02]">
        {image && !imgError ? (
          <>
            <Image 
              src={getIPFSUrl(image)} 
              alt={String(title)} 
              fill 
              className="object-cover group-hover:scale-103 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />
            
            <button 
              onClick={(e) => { e.preventDefault(); setShowFullImg(true); }}
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <div className="bg-white/10 p-2.5 rounded-full border border-white/15">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-25 group-hover:opacity-40 transition-opacity">
            <Package className="w-10 h-10 text-slate-400" />
            <span className="text-[10px] font-medium text-slate-500">No Photo</span>
          </div>
        )}
        
        <div className="absolute top-3 right-3 z-20">
          <Badge className="gap-1 h-6 px-2.5 text-[10px] font-medium rounded-md bg-black/40 backdrop-blur-md border border-white/[0.08] text-white">
            <span className={status === "VERIFIED" ? "text-emerald-400" : status === "FLAGGED" ? "text-red-400" : "text-indigo-400"}>
               {config.icon}
            </span>
            {config.label}
          </Badge>
        </div>

        {task.category && (
          <div className="absolute top-3 left-3 bg-indigo-600/10 backdrop-blur-md text-indigo-300 border border-indigo-500/15 rounded-md px-2.5 py-0.5 text-[10px] font-medium z-20">
            {String(task.category)}
          </div>
        )}

        {qrCodeUrl && (
          <button 
            onClick={(e) => { e.preventDefault(); setShowQR(true); }}
            className="absolute bottom-3 right-3 p-1.5 bg-white/[0.04] backdrop-blur-md rounded-lg border border-white/[0.08] text-white hover:bg-indigo-600 hover:scale-105 transition-all z-20 opacity-0 group-hover:opacity-100"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="px-5 pb-5 pt-2 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-3 mb-3">
          <h3 className={`${outfit.className} text-base font-semibold text-white tracking-tight leading-tight group-hover:text-indigo-400 transition-all line-clamp-1`}>
            {String(title || "Generic Product")}
          </h3>
          <div className="flex flex-col items-end shrink-0">
             <span className="text-[10px] text-slate-500 mb-0.5">Trust</span>
             <span className="text-xs font-semibold text-emerald-400">
               {task.supplier?.trustScore || 85}%
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/15">
             <Globe className="w-3 h-3 text-indigo-400" />
          </div>
          <span className="text-[11px] text-slate-400 truncate">
            {task.supplier?.name || "Independent"} · {task.supplier?.location || "Global"}
          </span>
        </div>

        {/* Price Section */}
         <div className="mt-auto relative bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 mb-4 group-hover:border-indigo-500/15 transition-all duration-300">
           <div className="relative z-10 flex items-center justify-between">
              <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Price</span>
                  <span className={`${outfit.className} text-lg font-semibold text-white`}>
                    {Number(usdcPrice).toFixed(2)} USDC
                  </span>
              </div>
              <div className="h-8 w-px bg-white/[0.06]" />
              <div className="flex flex-col items-end">
                 <span className="text-[10px] font-medium text-indigo-400 mb-0.5">Stablecoin</span>
                 <span className="text-sm font-mono font-medium text-indigo-300 bg-indigo-500/[0.06] px-2 py-0.5 rounded-md border border-indigo-500/15">
                    ${Number(usdcPrice).toFixed(2)}
                 </span>
              </div>
           </div>
        </div>

        {/* Community Trust Section */}
         <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[10px] font-medium">
               <span className="text-emerald-500">{voteReal} OK</span>
               <span className="text-slate-600">{voteFake} Disputed</span>
            </div>
            <div className="relative h-1 bg-white/[0.03] rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${realPct}%` }}
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
               />
            </div>
         </div>

        <Link href={`/product/${id}`} className="block">
          <Button className={`${outfit.className} w-full h-10 rounded-xl bg-white text-black hover:bg-indigo-50 hover:text-indigo-900 font-medium text-xs transition-all active:scale-[0.98]`}>
             View Details
          </Button>
        </Link>
      </div>

      {/* Full Image Modal */}
      <Dialog open={showFullImg} onOpenChange={setShowFullImg}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 backdrop-blur-2xl border-none rounded-2xl shadow-2xl">
          <div className="relative aspect-video w-full">
            {image && <Image src={getIPFSUrl(image)} alt={String(title)} fill className="object-contain p-6" />}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="max-w-sm bg-[#050608] border border-white/[0.08] rounded-2xl p-8 flex flex-col items-center">
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-6">Authenticity ID</p>
            <div className="relative w-48 h-48 bg-white p-4 rounded-xl shadow-xl mb-6 overflow-hidden">
              {qrCodeUrl && <Image src={qrCodeUrl} alt="Product QR" fill className="object-contain p-3" />}
            </div>
            <p className="text-xs text-slate-400 text-center leading-relaxed mb-8">
              Cryptographic proof secured on the <span className="text-indigo-400 font-medium">Stellar Network</span>.
            </p>
            <Button 
               className={`${outfit.className} w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all`}
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
