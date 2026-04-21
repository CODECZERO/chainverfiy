"use client"

import * as React from "react"
import { 
  CheckCircle2, Clock, XCircle, 
  Search, SlidersHorizontal, ChevronRight,
  ShieldCheck, Package, Info, Tag, 
  DollarSign, Filter
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"

export function MarketplaceSidebar({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  const [status, setStatus] = React.useState("ALL")
  const [category, setCategory] = React.useState("ALL")
  const [priceRange, setPriceRange] = React.useState([0, 5000])

  const handleFilterChange = (updates: any) => {
    const newFilters = { status, category, priceRange, ...updates }
    onFilterChange(newFilters)
  }

  return (
    <Sidebar className="w-80 border-r border-white/[0.06] bg-transparent pt-24 md:pt-28 select-none">
      <SidebarHeader className="px-6 py-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Filter className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xs font-display font-black text-white uppercase tracking-[0.2em] italic">Parametric Filter</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Community Consensus Layer</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-6 space-y-8">
        
        {/* Verification Status */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-0 text-[10px] font-display font-black text-slate-400 uppercase tracking-widest mb-4">
             Verification Protocol
          </SidebarGroupLabel>
          <SidebarGroupContent>
             <div className="space-y-1.5">
               {[
                 { id: "ALL", label: "Global Network", icon: Globe, count: null },
                 { id: "VERIFIED", label: "Verified Units", icon: CheckCircle2, count: "SECURED" },
                 { id: "PENDING_VERIFICATION", label: "Audit Trailing", icon: Clock, count: "SYNCING" },
                 { id: "FLAGGED", label: "System Alerts", icon: XCircle, count: "BLOCKED" },
               ].map((item) => (
                 <SidebarItem 
                   key={item.id}
                   active={status === item.id}
                   onClick={() => { setStatus(item.id); handleFilterChange({ status: item.id }); }}
                   label={item.label}
                   icon={item.icon}
                   badge={item.count}
                 />
               ))}
             </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/5" />

        {/* Categories */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-0 text-[10px] font-display font-black text-slate-400 uppercase tracking-widest mb-4">
            Asset Modules
          </SidebarGroupLabel>
          <SidebarGroupContent>
             <div className="space-y-1.5">
                {[
                  { id: "ALL", label: "Full Repository" },
                  { id: "Electronics", label: "High-Freq Electronics" },
                  { id: "Automotive", label: "Kinetic Modules" },
                  { id: "Apparel", label: "Synthetic Armor" },
                  { id: "Grocery", label: "Bio-Provisions" },
                ].map((item) => (
                  <SidebarItem 
                    key={item.id}
                    active={category === item.id}
                    onClick={() => { setCategory(item.id); handleFilterChange({ category: item.id }); }}
                    label={item.label}
                  />
                ))}
             </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-white/5" />

        {/* Price Range */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-0 text-[10px] font-display font-black text-slate-400 uppercase tracking-widest mb-6">
            Valuation Range (USDC)
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
             <Slider 
               defaultValue={[0, 5000]} 
               max={5000} 
               step={50}
               className="mb-6"
               onValueChange={(val) => { setPriceRange(val); handleFilterChange({ priceRange: val }); }}
             />
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Min Baseline</span>
                  <span className="text-[10px] font-mono font-black text-white italic">{priceRange[0].toLocaleString()} USDC</span>
                </div>
                <div className="w-8 h-px bg-white/5" />
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Max Threshold</span>
                  <span className="text-[10px] font-mono font-black text-indigo-400 italic">{priceRange[1].toLocaleString()} USDC</span>
                </div>
             </div>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}

function Globe({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20"/><path d="M2 12h20"/><path d="M12 2a14.5 14.5 0 0 1 0 20"/>
    </svg>
  )
}

export function SidebarItem({ label, icon: Icon, active, onClick, badge }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300
        ${active ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.2)] text-white' : 'hover:bg-white/[0.04] text-slate-400'}
      `}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'} transition-colors`} />}
        <span className="text-[10px] font-display font-black uppercase tracking-widest italic">{label}</span>
      </div>
      {badge && (
        <span className={`text-[8px] font-mono font-black italic px-1.5 py-0.5 rounded border ${active ? 'border-indigo-400 bg-white/10 text-white' : 'border-white/5 text-slate-600'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}
