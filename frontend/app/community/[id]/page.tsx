"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, MessageCircle, Loader2, Send, 
  User as UserIcon, Award, Calendar, Share2, ShieldCheck, Clock, Lock as LockIcon, Activity, Zap, Globe
} from "lucide-react"
import { getDiscussion, addDiscussionComment } from "@/lib/api-service"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Outfit, Inter } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })
const inter = Inter({ subsets: ["latin"] })

export default function DiscussionDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { isAuthenticated, user } = useSelector((s: RootState) => s.userAuth)
  const { isConnected, publicKey } = useSelector((s: RootState) => s.wallet)
  
  const [discussion, setDiscussion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [commentContent, setCommentContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getDiscussion(id as string)
      if (res) setDiscussion(res)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!isAuthenticated && !isConnected) || !commentContent.trim()) return
    
    setIsSubmitting(true)
    try {
      const res = await addDiscussionComment({
        discussionId: id as string,
        authorId: user?.id,
        authorWallet: !isAuthenticated ? publicKey || undefined : undefined,
        content: commentContent
      })
      if (res) {
        setCommentContent("")
        fetchData()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-[#030408] text-white ${inter.className}`}>
        <Header />
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin shadow-[0_0_30px_rgba(37,99,235,0.3)] mb-8" />
          <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-600 italic animate-pulse">Accessing Truth Node Vector...</p>
        </div>
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className={`min-h-screen bg-[#030408] text-white ${inter.className}`}>
        <Header />
        <div className="max-w-2xl mx-auto px-8 py-40 text-center">
          <div className="w-20 h-20 bg-red-600/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-red-500/20 shadow-2xl">
              <LockIcon className="w-10 h-10 text-red-500" />
          </div>
          <h1 className={`${outfit.className} text-4xl font-black uppercase italic tracking-tighter mb-4`}>Node Not Identified</h1>
          <p className="text-slate-500 text-sm font-black uppercase tracking-[0.2em] mb-12 italic opacity-70">This discussion thread has been purged or never existed in the current ledger state.</p>
          <Button onClick={() => router.push('/community')} className={`${outfit.className} bg-white text-black font-black h-16 px-12 rounded-2xl uppercase tracking-widest text-xs italic active:scale-95 transition-all`}>
            Return to Hub
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#030408] text-slate-400 ${inter.className} selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden relative pb-40`}>
      {/* ── Deep Space Atmospheric Effects ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header />
      
      <div className="max-w-5xl mx-auto px-8 pt-28 md:pt-32 relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/community')}
          className="mb-16 text-slate-600 hover:text-white font-black uppercase tracking-[0.4em] text-[10px] gap-4 -ml-4 italic hover:bg-white/5 px-6 rounded-xl transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Discourse Matrix
        </Button>

        {/* ── Main Truth Node Card ── */}
        <motion.article 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-premium bg-[#0A0D14]/80 border border-white/[0.08] rounded-[4rem] p-12 md:p-16 shadow-3xl relative overflow-hidden mb-20 group"
        >
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 mb-16 pb-12 border-b border-white/[0.06]">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_15px_40px_rgba(37,99,235,0.3)] border border-white/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                  {discussion.author?.supplierProfile ? <Award className="w-10 h-10 text-white" /> : <UserIcon className="w-10 h-10 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`${outfit.className} font-black text-white text-2xl uppercase italic tracking-tight`}>
                      {discussion.author?.supplierProfile?.name || discussion.author?.email?.split('@')[0] || "Auth_Node"}
                    </span>
                    {discussion.author?.role === 'SUPPLIER' && (
                      <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-widest text-[9px] rounded-lg italic">Verified Node</div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] italic">
                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(discussion.createdAt).toLocaleDateString()}</span>
                    <span className="text-slate-800 opacity-30">/</span>
                    <span className="flex items-center gap-2 font-mono tracking-widest">{new Date(discussion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="rounded-2xl border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] h-14 w-14 p-0 shadow-2xl transition-all">
                  <Share2 className="w-6 h-6 text-slate-500" />
                </Button>
                <div className="h-14 px-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-blue-400 italic shadow-2xl">
                   <ShieldCheck className="w-4 h-4" /> Immutable Thread
                </div>
              </div>
            </div>

            <h1 className={`${outfit.className} text-4xl md:text-6xl font-black text-white mb-10 leading-[0.95] uppercase italic tracking-[-0.04em] drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]`}>
              {discussion.title}
            </h1>
            
            <div className="text-xl text-slate-400 font-medium leading-relaxed mb-12 whitespace-pre-wrap selection:bg-blue-500/30 selection:text-blue-100 opacity-80 italic">
              {discussion.content}
            </div>

            <div className="flex flex-wrap gap-3">
              {discussion.tags?.map((tag: string) => (
                <span key={tag} className="px-5 py-2 rounded-xl bg-white/[0.03] text-[10px] font-black uppercase tracking-[0.3em] border border-white/[0.06] text-slate-500 group-hover:text-slate-200 transition-colors italic">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </motion.article>

        {/* ── Discourse Interaction Feed ── */}
        <div className="flex items-center gap-8 mb-16">
          <h2 className={`${outfit.className} text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-6`}>
             Discourse <span className="text-slate-800 font-mono tracking-[0.2em] italic text-xl">[{discussion.comments?.length || 0}]</span>
          </h2>
          <div className="h-px grow bg-gradient-to-r from-white/[0.08] to-transparent" />
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-700 uppercase tracking-[0.4em] italic">
             <Activity className="w-4 h-4 text-emerald-500 animate-pulse" /> Real-time Feed
          </div>
        </div>

        {/* ── Comment Command Terminal ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-24"
        >
          {isAuthenticated || isConnected ? (
            <form onSubmit={handleComment} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-5 group-focus-within:opacity-20 transition-opacity" />
              <div className="relative">
                <textarea 
                  value={commentContent}
                  onChange={e => setCommentContent(e.target.value)}
                  placeholder={isAuthenticated ? "Submit your technical insights to the truth layer..." : "Stellar Contributor - Anchor your insights to this secure thread..."}
                  className={`${outfit.className} w-full h-48 rounded-[2.5rem] bg-[#0A0D14]/90 border border-white/[0.08] text-white p-10 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-slate-800 font-black uppercase tracking-[0.15em] italic transition-all shadow-3xl resize-none selection:bg-blue-500/40`}
                />
                <div className="absolute bottom-8 right-8">
                  <Button 
                    disabled={isSubmitting || !commentContent.trim()}
                    className={`${outfit.className} h-16 px-12 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.25em] text-[11px] transition-all shadow-[0_20px_50px_rgba(37,99,235,0.3)] italic border border-white/10 active:scale-95`}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5 mr-3" /> Post Insight</>}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="glass-premium bg-[#0A0D14]/80 border border-amber-500/20 rounded-[3rem] p-12 flex flex-col items-center text-center shadow-3xl relative overflow-hidden">
               <div className="absolute inset-0 bg-amber-500/[0.02] animate-pulse" />
               <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl">
                 <LockIcon className="w-10 h-10 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
               </div>
               <h4 className={`${outfit.className} text-3xl font-black text-white mb-4 uppercase italic tracking-tighter`}>Access Restricted</h4>
               <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] mb-12 italic opacity-70 leading-relaxed max-w-md mx-auto">You must establish a verified identity session to participate in the decentralized discourse layer.</p>
               <Button onClick={() => router.push('/marketplace')} className={`${outfit.className} bg-amber-500 hover:bg-amber-400 text-black font-black h-16 px-12 rounded-2xl uppercase tracking-widest text-[11px] italic shadow-[0_20px_50px_rgba(245,158,11,0.2)] active:scale-95 transition-all`}>
                 Sign In to Protocol
               </Button>
            </div>
          )}
        </motion.div>

        {/* ── Discourse Stream ── */}
        <div className="space-y-12">
          <AnimatePresence mode="popLayout">
            {discussion.comments?.map((comment: any, i: number) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-10 relative group"
              >
                <div className="shrink-0 relative">
                   <div className="absolute -top-4 bottom-0 left-1/2 w-px bg-white/[0.03] group-last:bg-transparent" />
                   <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-2xl relative z-10 border border-white/10 group-hover:scale-110 transition-transform duration-500 ${
                     comment.author?.role === 'SUPPLIER' 
                     ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20' 
                     : 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-black'
                   }`}>
                     {comment.author?.role === 'SUPPLIER' ? <Award className="w-8 h-8 text-white" /> : <UserIcon className="w-8 h-8 text-white" />}
                   </div>
                </div>
                
                <div className="flex-1 pb-16 border-b border-white/[0.03] group-last:border-none">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                       <span className={`${outfit.className} font-black text-slate-100 text-xl uppercase italic tracking-tight`}>
                        {comment.author?.supplierProfile?.name || 
                         comment.author?.email?.split('@')[0] || 
                         (comment.authorWallet ? `${comment.authorWallet.slice(0,8)}...${comment.authorWallet.slice(-8)}` : "Auth_Node")}
                      </span>
                      {comment.author?.role === 'SUPPLIER' && (
                        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-widest text-[8px] rounded-md italic">Node_Auth</div>
                      )}
                      {!comment.author && comment.authorWallet && (
                        <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black uppercase tracking-widest text-[8px] rounded-md italic">Stellar_ID</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] italic font-mono opacity-60">
                       <Clock className="w-3.5 h-3.5" /> {new Date(comment.createdAt).toLocaleDateString()}
                       <span className="text-slate-800">/</span>
                       {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-lg text-slate-500 font-medium leading-relaxed selection:bg-blue-500/20 italic opacity-80 max-w-4xl">
                    {comment.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {(!discussion.comments || discussion.comments.length === 0) && (
            <div className="text-center py-32 glass-premium bg-[#0A0D14]/40 border-2 border-dashed border-white/[0.06] rounded-[3rem] shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/[0.01] animate-pulse" />
              <MessageCircle className="w-16 h-16 text-slate-800 mx-auto mb-8 opacity-20 group-hover:scale-110 transition-transform duration-1000" />
              <p className={`${outfit.className} text-xl font-black uppercase tracking-[0.5em] text-slate-700 italic opacity-50`}>No Discourse Detected</p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800 mt-4 italic">Signal void at current trace coordinates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
