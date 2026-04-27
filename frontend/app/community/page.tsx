"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Loader2, Plus, Wallet, Award, User as UserIcon, ArrowUpRight, Activity, Globe, Zap, Clock, Package, Search, ShieldCheck, MessageSquare, Lock, Sparkles } from "lucide-react"
import { createDiscussion } from "@/lib/api-service"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Outfit, Inter } from "next/font/google"
import { useDiscussions, useJoinedCommunities } from "@/hooks/use-api-queries"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

export default function CommunityPage() {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.userAuth)
  const { isConnected, publicKey } = useSelector((s: RootState) => s.wallet)
  
  const [q, setQ] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTopic, setNewTopic] = useState({ title: "", content: "", tags: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 🪄 Centralized Data Fetching
  const { data: discussions = [], isLoading: discussionsLoading, refetch: discussionsRefetch } = useDiscussions()
  const { data: joinedNodes = [], isLoading: nodesLoading } = useJoinedCommunities({
    userId: user?.id,
    stellarWallet: publicKey || undefined,
  })

  const loading = discussionsLoading || nodesLoading

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return discussions
    return discussions.filter((p: any) => 
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
        // Refresh discussions via hook reference
        discussionsRefetch()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`min-h-screen bg-[#050608] text-slate-400 ${inter.className} selection:bg-blue-500/30 overflow-x-hidden relative`}>
      {/* ── Subtle Atmospheric ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-blue-600/[0.04] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600/[0.03] rounded-full blur-[110px] pointer-events-none" />
      
      <Header />
      
      {/* ── Page Header ── */}
      <section className="relative pt-28 pb-14 border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 bg-blue-500/[0.08] border border-blue-500/15 text-blue-400 px-4 py-1.5 rounded-full text-[11px] font-medium uppercase tracking-wider mb-5"
              >
                <Globe className="w-3.5 h-3.5" /> Community Hub
              </motion.div>
              <h1 className={`${outfit.className} text-3xl md:text-5xl font-semibold tracking-tight text-white mb-4 leading-[1.1]`}>
                Join the <span className="text-blue-400">Conversation</span>
              </h1>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl">
                Connect with members, verify product authenticity together, and help build a more transparent supply chain.
              </p>
            </div>

            {/* Profile Identity Module */}
            <motion.div 
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full max-w-xs bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 border border-white/15">
                  {isAuthenticated ? <UserIcon className="w-7 h-7 text-white" /> : <Wallet className="w-7 h-7 text-white" />}
                </div>
                
                {isAuthenticated ? (
                  <div className="w-full">
                    <h3 className={`${outfit.className} text-lg font-semibold text-white mb-1.5`}>{user.email?.split('@')[0]}</h3>
                     <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                        <span className="px-2.5 py-0.5 bg-blue-500/[0.08] border border-blue-500/15 text-blue-400 font-medium text-[10px] rounded-md">Member</span>
                        {user.role === 'SUPPLIER' && <span className="px-2.5 py-0.5 bg-emerald-500/[0.08] border border-emerald-500/15 text-emerald-400 font-medium text-[10px] rounded-md">Verified Maker</span>}
                     </div>
                    <Button onClick={() => setShowCreateModal(true)} className={`${outfit.className} w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all active:scale-95`}>
                      <Plus className="w-4 h-4 mr-2" /> Start a Topic
                    </Button>
                  </div>
                ) : isConnected ? (
                  <div className="w-full text-center">
                    <h3 className="font-semibold text-white text-sm mb-0.5">
                      {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-4">Stellar Wallet Connected</p>
                    <Button onClick={() => setShowCreateModal(true)} className={`${outfit.className} w-full h-10 rounded-xl bg-white text-black hover:bg-slate-200 font-medium text-sm transition-all active:scale-95 mb-2`}>
                      <Plus className="w-4 h-4 mr-2" /> New Discussion
                    </Button>
                    <p className="text-[10px] text-blue-400 font-medium">Identity Linked</p>
                  </div>
                ) : (
                  <div className="w-full">
                    <h3 className={`${outfit.className} text-lg font-semibold text-white mb-2`}>Welcome!</h3>
                    <p className="text-slate-500 text-sm mb-5 leading-relaxed">Connect your wallet to join discussions and verify products.</p>
                    <Button className={`${outfit.className} w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all active:scale-95`}>
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-14 relative z-10">
        {/* Search Bar */}
        <div className="relative mb-12 max-w-xl mx-auto">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 transition-colors" />
           <Input 
             value={q} 
             onChange={(e) => setQ(e.target.value)} 
             placeholder="Search discussions, tags, or members..." 
             className={`${outfit.className} pl-11 h-12 rounded-xl text-sm bg-white/[0.02] border-white/[0.05] focus-visible:ring-blue-500/20 text-white placeholder:text-slate-600`} 
           />
        </div>

        {/* Discussions List */}
        <div className="space-y-6">
          {joinedNodes.length > 0 && (
            <div className="mb-12">
               <h3 className="text-[11px] font-medium text-slate-500 flex items-center gap-2 mb-5 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> My Joined Groups
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {joinedNodes.map((node: any) => (
                    <div key={node.id} className="bg-white/[0.015] border border-white/[0.05] rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.025] transition-all">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/[0.08] flex items-center justify-center border border-emerald-500/15">
                             <Package className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                             <p className="text-sm font-medium text-white">{node.supplier?.name}</p>
                             <p className="text-[11px] text-slate-500">{node.supplier?.category} Group</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
             <h3 className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-blue-500" /> Latest Activity
             </h3>
             <div className="flex gap-1">
                <Button variant="ghost" className="text-xs font-medium text-blue-400 px-3 hover:bg-blue-600/10 h-8">Recent</Button>
                <Button variant="ghost" className="text-xs font-medium text-slate-500 px-3 h-8">Trending</Button>
             </div>
          </div>

          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="w-12 h-12 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-5" />
                <p className="text-xs font-medium text-slate-600">Loading Discussions...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.99 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link 
                      href={`/community/${p.id}`} 
                      className="group block bg-white/[0.015] border border-white/[0.05] rounded-xl p-5 flex flex-col md:flex-row items-center gap-5 hover:border-blue-500/25 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                        <div className="w-12 h-12 bg-white/[0.02] rounded-xl flex items-center justify-center border border-white/[0.05] shrink-0 group-hover:bg-blue-600/10 transition-all">
                           {p.author?.supplierProfile ? <Award className="w-6 h-6 text-emerald-400" /> : <MessageCircle className="w-6 h-6 text-blue-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                             <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                               <UserIcon className="w-3 h-3" /> {p.author?.supplierProfile?.name || p.author?.email?.split('@')[0] || (p.authorWallet ? `${p.authorWallet.slice(0, 6)}...${p.authorWallet.slice(-4)}` : "Member")}
                            </span>
                            {joinedNodes.some(n => n.supplierId === p.author?.supplierProfile?.id) && (
                               <Badge className="bg-emerald-500/[0.08] text-emerald-400 border-none text-[9px] font-medium">Verified</Badge>
                            )}
                          </div>
                          <h3 className={`${outfit.className} text-base font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors tracking-tight`}>{p.title}</h3>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {p.tags?.map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 bg-white/[0.02] border border-white/[0.04] rounded-md text-[11px] text-slate-500">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/[0.05] md:pl-6">
                         <div className="text-left md:text-right">
                            <p className="text-[11px] text-slate-600 mb-0.5">Messages</p>
                            <p className={`${outfit.className} text-xl font-semibold text-white tracking-tight`}>{p._count?.comments || 0}</p>
                         </div>
                         <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-blue-600 transition-all">
                            <ArrowUpRight className="w-4 h-4" />
                         </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                 <MessageSquare className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                 <h3 className={`${outfit.className} text-lg font-semibold text-white`}>No Discussions Yet</h3>
                 <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">Be the first to share your thoughts or request verification.</p>
                 <Button onClick={() => setShowCreateModal(true)} className={`${outfit.className} mt-6 bg-blue-600 hover:bg-blue-500 text-white font-medium h-10 px-6 rounded-xl transition-all active:scale-95`}>Start Discussion</Button>
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
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
            />
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 15 }} 
              className="relative w-full max-w-xl bg-[#0A0D14] border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="relative z-10 w-full">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/15">
                       <Plus className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                       <h2 className={`${outfit.className} text-xl font-semibold text-white`}>New Discussion</h2>
                       <p className="text-sm text-slate-500 mt-0.5">Share your thoughts with the community.</p>
                    </div>
                 </div>
                
                <form onSubmit={handleCreate} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 ml-1">Topic Title</label>
                    <Input 
                      required value={newTopic.title} onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                      placeholder="e.g. Sourcing question for Batch #409" 
                      className={`${outfit.className} h-12 rounded-xl bg-white/[0.02] border-white/[0.06] text-white placeholder:text-slate-700 font-medium`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 ml-1">Message Content</label>
                    <textarea 
                      required value={newTopic.content} onChange={e => setNewTopic({...newTopic, content: e.target.value})}
                      className={`${outfit.className} w-full h-36 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white p-4 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-slate-700 transition-all resize-none text-sm`}
                      placeholder="Describe your topic details here..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 ml-1">Tags (Comma separated)</label>
                    <Input 
                      value={newTopic.tags} onChange={e => setNewTopic({...newTopic, tags: e.target.value})}
                      placeholder="e.g. shipping, quality, audit" 
                      className={`${outfit.className} h-12 rounded-xl bg-white/[0.02] border-white/[0.06] text-white placeholder:text-slate-700`}
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-3">
                    <Button type="button" disabled={isSubmitting} onClick={() => setShowCreateModal(false)} variant="ghost" className="flex-1 h-12 rounded-xl text-slate-400 font-medium hover:bg-white/[0.04] transition-all">Cancel</Button>
                    <Button type="submit" disabled={isSubmitting} className={`${outfit.className} flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium border border-white/[0.08]`}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Discussion"}
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
