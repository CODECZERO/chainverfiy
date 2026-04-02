"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, MessageCircle, Loader2, Send, 
  User, Award, Calendar, Share2, ShieldCheck, Clock, Lock as LockIcon
} from "lucide-react"
import { getDiscussion, addDiscussionComment } from "@/lib/api-service"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"

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
      if (res.success) setDiscussion(res.data)
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
      if (res.success) {
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
      <div className="min-h-screen bg-[#020408] text-white">
        <Header />
        <div className="flex flex-col items-center justify-center py-40">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Accessing Truth Node...</p>
        </div>
      </div>
    )
  }

  if (!discussion) {
    return (
      <div className="min-h-screen bg-[#020408] text-white">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-40 text-center">
          <h1 className="text-3xl font-bold mb-4">Node Not Identified</h1>
          <p className="text-slate-400 mb-8">This discussion thread has been purged or never existed in the current ledger state.</p>
          <Button onClick={() => router.push('/community')} className="bg-white text-black font-bold h-12 rounded-xl">
            Return to Hub
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020408] text-slate-100 pb-32">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 pt-12">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/community')}
          className="mb-10 text-slate-500 hover:text-white font-bold gap-2 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discourse
        </Button>

        {/* Main Discussion Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-10 rounded-[2.5rem] bg-[#0C121E] border border-white/5 shadow-2xl relative overflow-hidden mb-12"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  {discussion.author?.supplierProfile ? <Award className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white text-lg">
                      {discussion.author?.supplierProfile?.name || discussion.author?.email?.split('@')[0] || "Anonymous"}
                    </span>
                    {discussion.author?.role === 'SUPPLIER' && (
                      <Badge className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-bold uppercase text-[9px]">Verified Supplier</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(discussion.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(discussion.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 h-10 w-10 p-0">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight tracking-tight">
              {discussion.title}
            </h1>
            
            <div className="text-lg text-slate-400 font-light leading-relaxed mb-8 whitespace-pre-wrap">
              {discussion.content}
            </div>

            <div className="flex flex-wrap gap-2">
              {discussion.tags?.map((tag: string) => (
                <span key={tag} className="px-4 py-1.5 rounded-full bg-white/5 text-[11px] font-bold uppercase tracking-widest border border-white/5 text-slate-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Interaction Section */}
        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Discourse <span className="text-slate-600 font-black tracking-tighter ml-1">({discussion.comments?.length || 0})</span>
          </h2>
          <div className="h-0.5 grow bg-white/5" />
        </div>

        {/* Comment Form */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-12"
        >
          {isAuthenticated || isConnected ? (
            <form onSubmit={handleComment} className="relative">
              <textarea 
                value={commentContent}
                onChange={e => setCommentContent(e.target.value)}
                placeholder={isAuthenticated ? "Submit your insights to the thread..." : "Stellar Contributor - Anchor your insights to this thread..."}
                className="w-full h-32 rounded-[1.5rem] bg-[#0C121E] border border-white/5 text-white p-6 focus:ring-2 focus:ring-blue-500/40 focus:outline-none placeholder:text-slate-600 font-light transition-all shadow-inner"
              />
              <div className="absolute bottom-4 right-4">
                <Button 
                  disabled={isSubmitting || !commentContent.trim()}
                  className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-500/20"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Post</>}
                </Button>
              </div>
            </form>
          ) : (
            <div className="p-8 rounded-[1.5rem] bg-amber-500/5 border border-amber-500/10 flex flex-col items-center text-center">
              <div className="bg-amber-500/10 p-3 rounded-full mb-4">
                <LockIcon className="w-6 h-6 text-amber-500" />
              </div>
              <h4 className="text-white font-bold text-lg mb-2 italic">Access Restricted</h4>
              <p className="text-slate-500 text-sm font-medium mb-6">You must establish a verified identity session to participate in discourse.</p>
              <Button onClick={() => router.push('/marketplace')} variant="outline" className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 font-bold h-11 px-8 rounded-xl">
                Sign In to Post
              </Button>
            </div>
          )}
        </motion.div>

        {/* Comments List */}
        <div className="space-y-8">
          <AnimatePresence>
            {discussion.comments?.map((comment: any, i: number) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 relative"
              >
                <div className="shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                    comment.author?.role === 'SUPPLIER' 
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                    : 'bg-gradient-to-br from-slate-700 to-slate-800'
                  }`}>
                    {comment.author?.role === 'SUPPLIER' ? <Award className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-white" />}
                  </div>
                </div>
                
                <div className="flex-1 pb-8 border-b border-white/[0.03]">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-slate-200">
                        {comment.author?.supplierProfile?.name || 
                         comment.author?.email?.split('@')[0] || 
                         (comment.authorWallet ? `${comment.authorWallet.slice(0,6)}...${comment.authorWallet.slice(-4)}` : "Anonymous")}
                      </span>
                      {comment.author?.role === 'SUPPLIER' && (
                        <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold uppercase text-[8px] h-4">Supplier</Badge>
                      )}
                      {!comment.author && comment.authorWallet && (
                        <Badge className="bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold uppercase text-[8px] h-4">Stellar ID</Badge>
                      )}
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-slate-400 font-light leading-relaxed">
                    {comment.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {(!discussion.comments || discussion.comments.length === 0) && (
            <div className="text-center py-20 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
              <MessageCircle className="w-10 h-10 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-600 font-bold uppercase tracking-widest text-[10px]">No Discourse Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
