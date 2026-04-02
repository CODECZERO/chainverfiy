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
  MessageCircle, Loader2, Plus, Wallet, Award, User
} from "lucide-react"
import { getDiscussions, createDiscussion } from "@/lib/api-service"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export default function CommunityPage() {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.userAuth)
  const { isConnected, publicKey } = useSelector((s: RootState) => s.wallet)
  
  const [discussions, setDiscussions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Create form state
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

  const isWalletOnly = !isAuthenticated && isConnected

  return (
    <div className="min-h-screen bg-[#020408] text-slate-100 pb-24">
      <Header />
      
      {/* ── Page Header ── */}
      <div className="relative border-b border-white/[0.04] bg-[#05070A] overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-4 py-20 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-2xl text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Consensus Protocol
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-[0.9]">
                Decentralized Discourse.
              </h1>
              <p className="text-xl text-slate-400 leading-relaxed font-light">
                The community-driven layer of truth. Audit proof, discuss supplier performance, and earn verification rewards.
              </p>
            </div>

            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full max-w-sm shrink-0 p-8 rounded-[2.5rem] bg-[#0C121E] border border-white/5 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full group-hover:bg-blue-500/10 transition-all" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
                  {isAuthenticated ? <User className="w-10 h-10 text-white" /> : <Wallet className="w-10 h-10 text-white" />}
                </div>
                
                {isAuthenticated ? (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-1 truncate w-full">{user.email?.split('@')[0]}</h3>
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold uppercase text-[10px]">Active Member</Badge>
                      {user.role === 'SUPPLIER' && <Badge className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-bold uppercase text-[10px]">Verified Supplier</Badge>}
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="w-full h-12 rounded-xl bg-white text-black hover:bg-slate-200 font-bold">
                      <Plus className="w-4 h-4 mr-2" /> Start Discussion
                    </Button>
                  </>
                ) : isWalletOnly ? (
                  <>
                    <h3 className="text-xl font-bold text-white mb-1 font-mono tracking-tighter">
                      {publicKey?.slice(0, 8)}...{publicKey?.slice(-8)}
                    </h3>
                    <p className="text-sm text-slate-500 mb-6 font-medium">Wallet-Authenticated Session</p>
                    <Button onClick={() => setShowCreateModal(true)} className="w-full h-12 rounded-xl bg-white text-black hover:bg-slate-200 font-bold mb-3">
                      <Plus className="w-4 h-4 mr-2" /> Start Discussion
                    </Button>
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest text-center leading-relaxed">
                      Identity verified via Stellar Network
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">Join the truth layer</h3>
                    <p className="text-sm text-slate-400 mb-6 font-light">Connect your wallet to earn verification tokens and participate.</p>
                    <div className="flex flex-col gap-3 w-full">
                      <Button variant="outline" className="h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold transition-all">
                        Connect Stellar Wallet
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Search Bar */}
        <div className="relative mb-16 max-w-2xl mx-auto">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            placeholder="Search discussions, tags, or truth nodes..." 
            className="pl-16 h-16 rounded-[1.5rem] text-lg bg-[#0C121E] border-white/5 focus-visible:ring-blue-500/40 shadow-inner text-white placeholder:text-slate-600 font-light" 
          />
        </div>

        {/* Discussions List */}
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500/50" />
                <p className="font-medium tracking-widest uppercase text-xs">Querying Distributed Consensus...</p>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link 
                    href={`/community/${p.id}`} 
                    className="p-8 rounded-[2rem] bg-[#080C14] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all hover:border-blue-500/30 group relative overflow-hidden"
                  >
                    <div className="flex-1 relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {p.author?.supplierProfile ? <Award className="w-3 h-3 text-emerald-400" /> : <User className="w-3 h-3 text-blue-400" />}
                          {p.author?.supplierProfile?.name || p.author?.email?.split('@')[0] || "Anonymous"}
                        </div>
                        <span className="text-[10px] text-slate-600 font-black">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors leading-tight">{p.title}</h3>
                      <p className="text-slate-400 text-base leading-relaxed line-clamp-2 font-light">{p.content}</p>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-6 relative z-10">
                      <div className="flex gap-2">
                        {p.tags?.map((tag: string) => (
                          <span key={tag} className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest border border-white/5 text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <MessageCircle className="w-4 h-4" /> {p._count?.comments || 0}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-32 rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01]">
                <MessageSquare className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No discussions identified</h3>
                <p className="text-slate-500 text-lg font-light">The network is silent. Be the first to anchor a topic.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Create Topic Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-2xl bg-[#0C121E] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-3xl font-black text-white mb-2 leading-none">Anchor New Discussion</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium italic">Shared discourse strengthens the network layer.</p>
                
                <form onSubmit={handleCreate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Discussion Title</label>
                    <Input 
                      required
                      value={newTopic.title}
                      onChange={e => setNewTopic({...newTopic, title: e.target.value})}
                      placeholder="e.g. Audit request: Batch #409 sourcing anomalies" 
                      className="h-14 rounded-xl bg-black border-white/5 text-white focus-visible:ring-blue-500/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Context / Body</label>
                    <textarea 
                      required
                      value={newTopic.content}
                      onChange={e => setNewTopic({...newTopic, content: e.target.value})}
                      className="w-full h-40 rounded-xl bg-black border-white/5 text-white p-4 focus-visible:ring-blue-500/40 focus:outline-none focus:ring-2"
                      placeholder="Provide granular details or evidence for discourse..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Tags (comma separated)</label>
                    <Input 
                      value={newTopic.tags}
                      onChange={e => setNewTopic({...newTopic, tags: e.target.value})}
                      placeholder="Audit, Matcha, SupplyChain" 
                      className="h-14 rounded-xl bg-black border-white/5 text-white focus-visible:ring-blue-500/40"
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button 
                      type="button" 
                      disabled={isSubmitting}
                      onClick={() => setShowCreateModal(false)}
                      variant="ghost" 
                      className="flex-1 h-14 rounded-xl text-slate-500 font-bold hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 h-14 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-xl shadow-blue-500/20"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Broadcast Topic"}
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
