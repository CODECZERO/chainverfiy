"use client"

import * as React from "react"
import { 
  Filter, 
  Search, 
  ChevronRight, 
  MapPin, 
  Tag, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  Zap,
  BarChart4
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export function MarketplaceSidebar({ 
  categories, 
  selectedCategory, 
  setCategory,
  selectedStatus,
  setStatus,
  priceRange,
  setPriceRange
}: any) {
  return (
    <Sidebar className="border-r border-white/[0.06] bg-[#0A0B14]/60 backdrop-blur-3xl pt-16">
      <SidebarHeader className="px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20">
              <Filter className="w-4 h-4 text-blue-500" />
           </div>
           <span className="text-sm font-black uppercase tracking-widest text-white italic">Filter Hub</span>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <SidebarInput 
            placeholder="Search terminal..." 
            className="pl-9 bg-white/[0.03] border-white/[0.08] h-10 text-xs font-medium placeholder:text-slate-600"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 pb-12">
        
        {/* Verification Status */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic mb-4">
            Security Status
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-4 px-2">
              {[
                { id: "VERIFIED", label: "Verified Protocol", icon: ShieldCheck, color: "text-emerald-500" },
                { id: "PENDING_VERIFICATION", label: "Pending Audit", icon: Clock, color: "text-amber-500" },
                { id: "FLAGGED", label: "Warning/Flagged", icon: AlertCircle, color: "text-red-500" },
              ].map((status) => (
                <div key={status.id} className="flex items-center space-x-3 cursor-pointer group">
                  <Checkbox 
                    id={status.id} 
                    checked={selectedStatus.includes(status.id)}
                    onCheckedChange={(checked) => {
                       if (checked) setStatus([...selectedStatus, status.id])
                       else setStatus(selectedStatus.filter((s: string) => s !== status.id))
                    }}
                    className="border-white/10 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" 
                  />
                  <Label 
                    htmlFor={status.id} 
                    className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <status.icon className={`w-3.5 h-3.5 ${status.color}`} /> {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-6 bg-white/[0.04]" />

        {/* Global Categories */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic mb-4">
            Data Segments
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={selectedCategory === "ALL"} 
                  onClick={() => setCategory("ALL")}
                  className="px-3 h-10 rounded-xl hover:bg-white/[0.04] transition-all group"
                >
                   <BarChart4 className="w-3.5 h-3.5 text-blue-500/70" />
                   <span className="text-xs font-bold text-slate-400 group-hover:text-white italic uppercase tracking-widest">Master Catalog</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {categories.map((cat: string) => (
                <SidebarMenuItem key={cat}>
                  <SidebarMenuButton 
                    isActive={selectedCategory === cat} 
                    onClick={() => setCategory(cat)}
                    className="px-3 h-10 rounded-xl hover:bg-white/[0.04] transition-all group"
                  >
                     <Tag className="w-3.5 h-3.5 text-blue-500/70" />
                     <span className="text-xs font-bold text-slate-400 group-hover:text-white italic uppercase tracking-widest">{cat}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-6 bg-white/[0.04]" />

        {/* Dynamic Valuation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic mb-4">
            Valuation Range (USDC)
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-3 pt-2">
            <Slider 
              defaultValue={[0, 1000]} 
              max={1000} 
              step={10} 
              className="mb-6"
              onValueChange={setPriceRange}
            />
            <div className="flex justify-between text-[10px] font-mono font-black text-blue-400 uppercase italic">
              <span>0.00 USDC</span>
              <span>{priceRange[1]}.00 USDC</span>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}
