"use client"

import { TrendingUp, Globe } from "lucide-react"
import { useUSDCRates } from "@/hooks/use-api-queries"

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "NGN", symbol: "₦" },
  { code: "BRL", symbol: "R$" },
]

export function USDCPriceTicker() {
  const { data: rates = {}, isLoading } = useUSDCRates()

  if (isLoading && Object.keys(rates).length === 0) {
    return (
      <div className="h-8 bg-[#05060B] border-b border-white/[0.04] flex items-center px-6 gap-4 overflow-hidden">
        <div className="w-20 h-4 bg-white/5 rounded animate-pulse" />
        <div className="flex gap-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-24 h-4 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div role="region" aria-label="Live Market Rates" className="h-8 bg-[#05060B] border-b border-white/[0.04] flex items-center overflow-hidden relative z-40">
      <div className="flex items-center gap-2 px-6 h-full border-r border-white/[0.06] bg-black/40 z-10 shrink-0">
        <div aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.6)] animate-pulse" />
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 italic">Market Pulse</span>
      </div>
      
      <div className="flex items-center whitespace-nowrap animate-scroll py-2 hover:[animation-play-state:paused] cursor-default">
        {/* Continuous loop for tickers */}
        {[...CURRENCIES, ...CURRENCIES].map((c, idx) => (
          <div key={`${c.code}-${idx}`} className="flex items-center gap-2 px-8 group">
            <span className="text-[9px] font-bold text-slate-500 group-hover:text-blue-400 transition-colors">{c.code}</span>
            <span className="text-[10px] font-mono font-black text-white/90">
              {c.symbol}{rates[c.code.toLowerCase()] ? Number(rates[c.code.toLowerCase()]).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : "1.000"}
            </span>
            <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
               <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
               <span className="text-[8px] font-bold text-emerald-500">+0.01%</span>
            </div>
            <div className="ml-8 w-px h-3 bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
