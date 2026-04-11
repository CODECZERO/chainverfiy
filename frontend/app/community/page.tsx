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
  MessageCircle, Loader2, Plus, Wallet, Award, User as UserIcon, ArrowUpRight, Activity, Globe, Zap, Clock, Package
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
  const [joinedNodes, setJoinedNodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const [newTopic, setNewTopic] = useState({ title: "", content: "", tags: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchDiscussions = async () => {
    try {
      const res = await getDiscussions()
      if (res) setDiscussions(res)
    } catch (error) {
      console.error(error)
    }
  }

  const fetchJoinedNodes = async () => {
    if (!isAuthenticated && !isConnected) return
    try {
      const { getJoinedCommunities } = await import("@/lib/api-service")
      const res = await getJoinedCommunities()
      if (res) setJoinedNodes(res)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchDiscussions(), fetchJoinedNodes()]).finally(() => setLoading(false))
  }, [isAuthenticated, isConnected])

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
      if (res) {
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
      {/* ── Space Atmospheric Effects ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header />
      
      {/* ── Page Header ── */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/[0.04] bg-[#07090F]/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="max-w-3xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 bg-blue-600/10 border border-blue-500/20 text-blue-400 px-5 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest mb-8 shadow-xl"
              >
                <Globe className="w-4 h-4" /> Global Community Hub
              </motion.div>
              <h1 className={`${outfit.className} text-5xl md:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.1]`}>
                Join the <span className="text-blue-500">Conversation.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl font-light">
                Connect with other members, verify product authenticity together, and help build a more transparent supply chain for everyone.
              </p>
            </div>

            {/* Profile Identity Module */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full max-w-sm glass-premium bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 shadow-3xl relative overflow-hidden group mt-12 lg:mt-0"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-2xl border border-white/20">
                  {isAuthenticated ? <UserIcon className="w-10 h-10 text-white" /> : <Wallet className="w-10 h-10 text-white" />}
                </div>
                
                {isAuthenticated ? (
                  <div className="w-full">
                    <h3 className={`${outfit.className} text-2xl font-bold text-white mb-2`}>{user.email?.split('@')[0]}</h3>
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                       <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase tracking-widest text-[9px] rounded-lg">Community Member</div>
                       {user.role === 'SUPPLIER' && <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest text-[9px] rounded-lg">Verified Maker</div>}
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className={`${outfit.className} w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl transition-all active:scale-95`}>
                      <Plus className="w-5 h-5 mr-3" /> Start a Topic
                    </Button>
                  </div>
                ) : isConnected ? (
                  <div className="w-full text-center">
                    <h3 className="font-bold text-white text-lg mb-1">
                      {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                    </h3>
                    <p className="text-xs text-slate-500 mb-6">Stellar Wallet Connected</p>
                    <Button onClick={() => setShowCreateModal(true)} className={`${outfit.className} w-full h-14 rounded-2xl bg-white text-black hover:bg-slate-200 font-bold transition-all active:scale-95 mb-4 shadow-xl`}>
                      <Plus className="w-5 h-5 mr-3" /> New Discussion
                    </Button>
                    <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Digital Identity Linked</div>
                  </div>
                ) : (
                  <div className="w-full">
                    <h3 className={`${outfit.className} text-2xl font-bold text-white mb-3`}>Welcome!</h3>
                    <p className="text-slate-500 text-sm mb-8 leading-relaxed">Connect your wallet to join discussions and verify products.</p>
                    <Button className={`${outfit.className} w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl transition-all active:scale-95`}>
                      Connect My Wallet
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        {/* Search Bar */}
        <div className="relative mb-20 max-w-2xl mx-auto group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-5 group-focus-within:opacity-20 transition-opacity" />
          <div className="relative">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
             <Input 
               value={q} 
               onChange={(e) => setQ(e.target.value)} 
               placeholder="Search discussions, tags, or members..." 
               className={`${outfit.className} pl-16 h-18 rounded-[2rem] text-sm bg-white/[0.02] border-white/5 focus-visible:ring-blue-500/20 shadow-inner text-white placeholder:text-slate-600`} 
             />
          </div>
        </div>

        {/* Discussions List */}
        <div className="space-y-8">
          {joinedNodes.length > 0 && (
            <div className="mb-20">
               <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-4 mb-8">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> My Joined Groups
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {joinedNodes.map((node: any) => (
                    <div key={node.id} className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 flex items-center justify-between hover:bg-white/[0.04] transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                             <Package className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                             <div className="text-sm font-bold text-white">{node.supplier?.name}</div>
                             <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{node.supplier?.category} Group</div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-10">
             <h3 className="text-sm font-bold text-slate-500 flex items-center gap-3">
                <Activity className="w-4 h-4 text-blue-500" /> Latest Activity
             </h3>
             <div className="flex gap-2">
                <Button variant="ghost" className="text-xs font-bold text-blue-500 px-4 hover:bg-blue-600/10">Recent</Button>
                <Button variant="ghost" className="text-xs font-bold text-slate-500 px-4">Trending</Button>
             </div>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40">
                <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-8" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-600">Loading Discussions...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link 
                      href={`/community/${p.id}`} 
                      className="group block bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 hover:border-blue-500/40 transition-all duration-500 shadow-xl"
                    >
                      <div className="flex items-center gap-6 flex-1 min-w-0 w-full">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-white/[0.03] rounded-2xl flex items-center justify-center border border-white/[0.08] shrink-0 group-hover:bg-blue-600/10 group-hover:scale-105 transition-all">
                           {p.author?.supplierProfile ? <Award className="w-8 h-8 text-emerald-400" /> : <MessageCircle className="w-8 h-8 text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                             <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                               <UserIcon className="w-3 h-3" /> {p.author?.supplierProfile?.name || p.author?.email?.split('@')[0] || "Member"}
                            </div>
                            {joinedNodes.some(n => n.supplierId === p.author?.supplierProfile?.id) && (
                               <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[9px] font-bold">Verified Maker</Badge>
                            )}
                          </div>
                          <h3 className={`${outfit.className} text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors tracking-tight`}>{p.title}</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            {p.tags?.map((tag: string) => (
                              <span key={tag} className="px-3 py-1 bg-white/[0.02] border border-white/[0.05] rounded-lg text-xs font-bold text-slate-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto shrink-0 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-white/[0.08] md:pl-10">
                         <div className="text-left md:text-right">
                            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Messages</div>
                            <div className={`${outfit.className} text-3xl font-bold text-white tracking-tighter`}>{p._count?.comments || 0}</div>
                         </div>
                         <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-blue-600 transition-all">
                            <ArrowUpRight className="w-6 h-6" />
                         </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 rounded-[3rem] border border-dashed border-white/[0.1] bg-white/[0.01]">
                 <MessageSquare className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                 <h3 className={`${outfit.className} text-2xl font-bold text-white`}>No Discussions Yet</h3>
                 <p className="text-slate-500 text-sm mt-3 max-w-sm mx-auto">Be the first to share your thoughts or request verification from the community.</p>
                 <Button onClick={() => setShowCreateModal(true)} className={`${outfit.className} mt-10 bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 px-10 rounded-2xl shadow-xl transition-all active:scale-95`}>Start Discussion</Button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-2xl bg-[#0A0D14] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="relative z-10 w-full">
                 <div className="flex items-center gap-6 mb-10">
                    <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                       <Plus className="w-7 h-7 text-blue-500" />
                    </div>
                    <div>
                       <h2 className={`${outfit.className} text-3xl font-bold text-white`}>New Discussion</h2>
                       <p className="text-sm text-slate-500 mt-1">Share your thoughts with the community.</p>
                    </div>
                 </div>
                
                <form onSubmit={handleCreate} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 ml-1">Topic Title</label>
                    <Input 
                      required value={newTopic.title} onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                      placeholder="e.g. Sourcing question for Batch #409" 
                      className={`${outfit.className} h-16 rounded-2xl bg-white/[0.03] border-white/10 text-white placeholder:text-slate-700 font-bold text-lg`}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 ml-1">Message Content</label>
                    <textarea 
                      required value={newTopic.content} onChange={e => setNewTopic({...newTopic, content: e.target.value})}
                      className={`${outfit.className} w-full h-48 rounded-2xl bg-white/[0.03] border-white/10 text-white p-6 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-slate-700 font-medium transition-all resize-none shadow-inner`}
                      placeholder="Describe your topic details here..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 ml-1">Tags (Comma separated)</label>
                    <Input 
                      value={newTopic.tags} onChange={e => setNewTopic({...newTopic, tags: e.target.value})}
                      placeholder="e.g. shipping, quality, audit" 
                      className={`${outfit.className} h-16 rounded-2xl bg-white/[0.03] border-white/10 text-white placeholder:text-slate-700`}
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <Button type="button" disabled={isSubmitting} onClick={() => setShowCreateModal(false)} variant="ghost" className="flex-1 h-16 rounded-2xl text-slate-400 font-bold hover:bg-white/5 transition-all">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className={`${outfit.className} flex-1 h-16 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xl border border-white/10`}>
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Discussion"}
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
