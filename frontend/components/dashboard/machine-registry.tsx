"use client"

import React, { useState } from "react"
import { Cpu, Plus, Radio, ShieldCheck, Trash2, Smartphone, Monitor, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { registerMachine } from "@/lib/api-service"

export function MachineRegistry({ sid }: { sid: string }) {
  const [machines, setMachines] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "SCANNER",
    location: ""
  })
  const [registering, setRegistering] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegistering(true)
    try {
      const res = await registerMachine({ ...formData, supplierId: sid })
      if (res.success) {
        setMachines([...machines, res.data])
        setShowAdd(false)
        setFormData({ name: "", type: "SCANNER", location: "" })
      }
    } catch (err) {
      console.error("Machine registration failed", err)
    }
    setRegistering(false)
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Machine <span className="text-blue-500">Registry</span></h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Authorized Scanning Infrastructure</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-500 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Authorized Machine
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleRegister} className="premium-card bg-[#0A0D14] border border-blue-500/20 rounded-[2.5rem] p-10 mb-8 shadow-2xl space-y-6">
               <h3 className="text-sm font-black text-white uppercase tracking-widest italic">New Node Configuration</h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Node Identifier</label>
                   <input 
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                     placeholder="e.g. Warehouse A Scanner"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Machine Type</label>
                   <select 
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 appearance-none"
                     value={formData.type}
                     onChange={e => setFormData({...formData, type: e.target.value})}
                   >
                     <option value="SCANNER" className="bg-[#0A0D14]">Handheld Scanner</option>
                     <option value="IOT_GATEWAY" className="bg-[#0A0D14]">IoT Gateway</option>
                     <option value="MOBILE_APP" className="bg-[#0A0D14]">Mobile Client</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Facility Location</label>
                   <input 
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                     placeholder="e.g. Mumbai Sector 4"
                     value={formData.location}
                     onChange={e => setFormData({...formData, location: e.target.value})}
                     required
                   />
                 </div>
               </div>
               <div className="flex justify-end gap-3 mt-4">
                 <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                 <button type="submit" disabled={registering} className="px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all active:scale-95">
                   {registering ? "Transmitting..." : "Initialize Node"}
                 </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.length === 0 ? (
           <div className="col-span-full py-24 text-center border-2 border-dashed border-white/[0.04] rounded-[2.5rem]">
              <Cpu className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-20" />
              <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">No Registered Nodes Detected</p>
              <p className="text-slate-700 text-xs mt-2 italic px-10">Authorize machines to enable product tracking and journey validation.</p>
           </div>
        ) : (
          machines.map((m, idx) => (
            <motion.div 
               key={idx}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="premium-card bg-[#0A0D14]/80 backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-8 group relative overflow-hidden shadow-xl"
            >
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-700 pointer-events-none" />
               <div className="flex items-center justify-between mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                   {m.type === "SCANNER" ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                   <Radio className="w-3 h-3 animate-pulse" /> Active
                 </div>
               </div>
               <div className="space-y-1 mb-8">
                 <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.type}</div>
                 <div className="text-xl font-black text-white tracking-tight italic">{m.name}</div>
                 <div className="text-[10px] text-slate-500 font-medium">{m.location}</div>
               </div>
               <div className="pt-6 border-t border-white/[0.04] flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Encrypted Hub</span>
                 </div>
                 <button className="p-3 text-slate-700 hover:text-red-400 transition-colors rounded-xl hover:bg-red-400/5">
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
            </motion.div>
          ))
        )}
      </div>
      
      {/* Network Notice */}
      <div className="premium-card bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6 flex items-start gap-4">
         <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
         <div>
           <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Security Protocol</div>
           <p className="text-xs text-slate-500 font-medium leading-relaxed">Authorized machines undergo periodic cryptographic challenges. Ensure nodes stay online for continuous journey tracking.</p>
         </div>
      </div>
    </div>
  )
}
