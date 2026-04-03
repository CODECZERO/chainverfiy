"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  MessageSquare, Search, ShieldCheck, Lock, Sparkles, 
  MessageCircle, Loader2, Plus, Wallet, Award, User, ArrowUpRight, Activity, Globe, Zap, Clock
} from "lucide-react"
import { getDiscussions, createDiscussion } from "@/lib/api-service"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

export default function CommunityPage() {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.userAuth)
  const { isConnected, publicKey } = useSelector((s: RootState) => s.wallet)
  
  const [discussions, setDiscussions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const [newTopic, setNewTopic] = useState({ title: "", content: "", tags: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchDiscussions = async () => {
    setLoading(true)
    try {
      const res = await getDiscussions()
      if (res.success) setDiscussions(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscussions()
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return discussions
    return discussions.filter((p) => 
      `${p.title} ${p.content} ${p.tags?.join(" ")}`.toLowerCase().includes(needle)
    )
  }, [q, discussions])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated && !isConnected) return
    
    setIsSubmitting(true)
    try {
      const res = await createDiscussion({
        title: newTopic.title,
        content: newTopic.content,
        authorId: user?.id,
        authorWallet: !isAuthenticated ? publicKey || undefined : undefined,
        tags: newTopic.tags.split(",").map(t => t.trim()).filter(Boolean)
      })
      if (res.success) {
        setNewTopic({ title: "", content: "", tags: "" })
        setShowCreateModal(false)
        fetchDiscussions()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen bg-[#030408] text-slate-400 ${inter.className} selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden relative`}>
      {/* ── Deep Space Atmospheric Effects ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header />
      
      {/* ── page Header ── */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/[0.04] bg-[#0A0D14]/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
            <div className="max-w-3xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] mb-8 italic shadow-2xl"
              >
                <Globe className="w-4 h-4 animate-spin-slow" /> Decentralized Truth Protocol
              </motion.div>
              <h1 className={`${outfit.className} text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.85] uppercase italic tracking-[-0.05em]`}>
                Consensus <span className="text-blue-500 drop-shadow-[0_0_30px_rgba(37,99,235,0.4)]">Discourse.</span>
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed max-w-2xl font-black uppercase tracking-[0.1em] italic opacity-70">
                The community-driven layer of truth. Audit proof, discuss performance, and earn verification rewards across the Stellar ledger.
              </p>
            </div>

            {/* Profile Identity Node */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full max-w-sm glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3rem] p-10 shadow-3xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full group-hover:bg-blue-500/10 transition-all duration-1000" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center mb-8 shadow-[0_15px_40px_rgba(37,99,235,0.3)] border border-white/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                  {isAuthenticated ? <User className="w-12 h-12 text-white" /> : <Wallet className="w-12 h-12 text-white" />}
                </div>
                
                {isAuthenticated ? (
                  <div className="w-full">
                    <h3 className={`${outfit.className} text-3xl font-black text-white mb-2 uppercase italic tracking-tighter`}>{user.email?.split('@')[0]}</h3>
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                       <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black uppercase tracking-widest text-[9px] rounded-lg italic">Protocol Member</div>
                       {user.role === 'SUPPLIER' && <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-widest text-[9px] rounded-lg italic">Verified Node</div>}
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className={`${outfit.className} w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.2em] uppercase text-[11px] shadow-2xl transition-all active:scale-95 italic border border-white/10`}>
                      <Plus className="w-5 h-5 mr-3" /> Anchor Discussion
                    </Button>
                  </div>
                ) : isConnected ? (
                  <div className="w-full text-center">
                    <h3 className="font-mono text-xl font-black text-white mb-2 tracking-tighter">
                      {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                    </h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 italic">Stellar Asset Holder</p>
                    <Button onClick={() => setShowCreateModal(true)} className={`${outfit.className} w-full h-16 rounded-2xl bg-white text-black hover:bg-slate-200 font-black tracking-[0.2em] uppercase text-[11px] shadow-2xl transition-all active:scale-95 italic mb-4`}>
                      <Plus className="w-5 h-5 mr-3" /> Anchor Discussion
                    </Button>
                    <div className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] italic opacity-60">Verified via Distributed Ledger</div>
                  </div>
                ) : (
                  <div className="w-full">
                    <h3 className={`${outfit.className} text-2xl font-black text-white mb-4 uppercase italic tracking-tight`}>Initialize Identity</h3>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mb-8 leading-relaxed italic">Connect your Stellar vault to participate in the Truth Layer.</p>
                    <Button className={`${outfit.className} w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.2em] uppercase text-[11px] shadow-2xl transition-all active:scale-95 italic border border-white/10`}>
                      Connect Global Vault
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-8 py-24 relative z-10">
        {/* Search Matrix */}
        <div className="relative mb-24 max-w-3xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-10 group-focus-within:opacity-30 transition-opacity" />
          <div className="relative">
             <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
             <Input 
               value={q} 
               onChange={(e) => setQ(e.target.value)} 
               placeholder="IDENTIFY DISCUSSION NODES, TAGS, OR TRUTH SIGNALS..." 
               className={`${outfit.className} pl-20 h-20 rounded-[2rem] text-sm bg-[#0C121E] border-white/5 focus-visible:ring-blue-500/20 shadow-3xl text-white placeholder:text-slate-800 font-black uppercase tracking-[0.3em] italic selection:bg-blue-500/40`} 
             />
          </div>
        </div>

        {/* Discourse Ledger */}
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-12">
             <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-500 flex items-center gap-4 italic">
                <Activity className="w-4 h-4 text-blue-500 animate-pulse" /> Live Truth Ledger
             </h3>
             <div className="flex gap-4">
                <Button variant="ghost" className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 italic px-6 hover:bg-blue-600/10">Latest Data</Button>
                <Button variant="ghost" className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700 italic px-6">Trending Signals</Button>
             </div>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-8" />
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 italic animate-pulse">Synchronizing Consensus State...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link 
                      href={`/community/${p.id}`} 
                      className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[3.5rem] p-10 flex flex-col xl:flex-row items-center gap-12 group hover:border-blue-500/40 transition-all duration-700 relative overflow-hidden shadow-3xl"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                      
                      <div className="flex items-center gap-10 flex-1 min-w-0">
                        <div className="w-24 h-24 bg-white/[0.02] rounded-[2.5rem] flex items-center justify-center border border-white/[0.08] shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000 relative shadow-2xl overflow-hidden">
                           <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 animate-pulse" />
                           {p.author?.supplierProfile ? <Award className="w-10 h-10 text-emerald-400" /> : <MessageCircle className="w-10 h-10 text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-5 mb-4">
                            <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                               <User className="w-3 h-3" /> {p.author?.supplierProfile?.name || p.author?.email?.split('@')[0] || "Auth_Node"}
                            </div>
                            <span className="text-slate-800 font-black text-xs opacity-50">/</span>
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic font-mono opacity-60">ID-{String(p.id).slice(0, 8)}</span>
                          </div>
                          <h3 className={`${outfit.className} text-4xl font-black text-white mb-4 group-hover:text-blue-400 transition-colors uppercase italic tracking-[-0.03em] leading-none`}>{p.title}</h3>
                          <div className="flex flex-wrap gap-3">
                            {p.tags?.map((tag: string) => (
                              <span key={tag} className="px-3 py-1 bg-white/[0.02] border border-white/[0.05] rounded-lg text-[9px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-slate-400 transition-colors">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-12 w-full xl:w-auto shrink-0 pt-10 xl:pt-0 border-t xl:border-t-0 xl:border-l border-white/[0.06] xl:pl-12">
                         <div className="text-right">
                            <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic leading-none mb-3">Discourse Vol</div>
                            <div className={`${outfit.className} text-4xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] italic tabular-nums`}>{p._count?.comments || 0}</div>
                         </div>
                         <div className="w-18 h-18 rounded-[2rem] bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-blue-600/30 transition-all active:scale-95 shadow-2xl group-hover:scale-110 duration-500">
                            <ArrowUpRight className="w-8 h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                         </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 rounded-[4rem] border-2 border-dashed border-white/[0.08] bg-white/[0.01] shadow-inner relative overflow-hidden group">
                 <div className="absolute inset-0 bg-blue-600/[0.01] animate-pulse" />
                 <MessageSquare className="w-24 h-24 text-slate-800 mx-auto mb-10 opacity-20 group-hover:scale-110 transition-transform duration-1000" />
                 <h3 className={`${outfit.className} text-4xl font-black text-white uppercase italic tracking-widest opacity-80`}>Discourse Void</h3>
                 <p className="text-slate-600 text-[13px] font-black uppercase tracking-[0.4em] mt-5 italic opacity-60">The network is silent. Be the first to anchor a topic to the truth layer.</p>
                 <Button onClick={() => setShowCreateModal(true)} className={`${outfit.className} mt-16 bg-blue-600 hover:bg-blue-500 text-white font-black tracking-[0.3em] uppercase text-[12px] h-18 px-16 rounded-[2rem] shadow-3xl italic border border-white/10 active:scale-95 transition-all`}>Broadcast Signal</Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Create Topic Node Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-[#030408]/90 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 30 }} 
              className="relative w-full max-w-3xl glass-premium bg-[#0A0D14]/95 border border-white/[0.08] rounded-[4rem] p-16 shadow-3xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/[0.03] rounded-full blur-[120px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-12">
                   <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center border border-blue-500/20 shadow-2xl">
                      <Zap className="w-10 h-10 text-blue-500 drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                   </div>
                   <div>
                      <h2 className={`${outfit.className} text-5xl font-black text-white leading-[0.95] uppercase italic tracking-tighter`}>Anchor Signal</h2>
                      <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 mt-2 italic">Synchronizing discourse with the truth layer</p>
                   </div>
                </div>
                
                <form onSubmit={handleCreate} className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 ml-2 italic">Discussion Target / Title</label>
                    <Input 
                      required
                      value={newTopic.title}
                      onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                      placeholder="AUDIT REQUEST: BATCH #409 SOURCING ANOMALIES..." 
                      className={`${outfit.className} h-18 rounded-3xl bg-black/60 border-white/[0.06] text-white focus-visible:ring-blue-500/20 placeholder:text-slate-900 font-black uppercase tracking-[0.2em] italic shadow-inner`}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 ml-2 italic">Context / Log Body</label>
                    <textarea 
                      required
                      value={newTopic.content}
                      onChange={e => setNewTopic({...newTopic, content: e.target.value})}
                      className={`${outfit.className} w-full h-52 rounded-3xl bg-black/60 border-white/[0.06] text-white p-8 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-slate-900 font-black uppercase tracking-[0.15em] italic shadow-inner transition-all resize-none`}
                      placeholder="PROVIDE GRANULAR EVIDENCE OR PROTOCOL LOGS FOR DISCOURSE..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 ml-2 italic">Signal Tags (Comma Separated)</label>
                    <Input 
                      value={newTopic.tags}
                      onChange={e => setNewTopic({...newTopic, tags: e.target.value})}
                      placeholder="AUDIT, MATCHA, SUPPLYCHAIN..." 
                      className={`${outfit.className} h-18 rounded-3xl bg-black/60 border-white/[0.06] text-white focus-visible:ring-blue-500/20 placeholder:text-slate-900 font-black uppercase tracking-[0.2em] italic shadow-inner`}
                    />
                  </div>
                  
                  <div className="flex gap-6 pt-10">
                    <Button 
                      type="button" 
                      disabled={isSubmitting}
                      onClick={() => setShowCreateModal(false)}
                      variant="ghost" 
                      className="flex-1 h-20 rounded-3xl text-slate-600 font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all italic"
                    >
                      Abort Signal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className={`${outfit.className} flex-1 h-20 rounded-3xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.3em] transition-all shadow-[0_20px_50px_rgba(37,99,235,0.3)] italic border border-white/10`}
                    >
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Broadcast Signal"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
