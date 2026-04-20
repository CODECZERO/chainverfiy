"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getPublicDispute, voteOnDispute } from "@/lib/api-service"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/redux/store"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { ShieldAlert, Gavel, ArrowLeft, Loader2, CheckCircle2, User as UserIcon, Lock, Unlock } from "lucide-react"
import Link from "next/link"
import { Inter, Outfit } from "next/font/google"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })
const outfit = Outfit({ subsets: ["latin"] })

export default function DisputeResolutionPage() {
  const { orderId } = useParams()
  const { toast } = useToast()
  
  const { isAuthenticated, user } = useSelector((s: RootState) => s.userAuth)
  const wallet = useSelector((s: RootState) => s.wallet)
  
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState("")

  const loadData = async () => {
    try {
      const res = await getPublicDispute(orderId as string)
      if (res) {
        setData(res)
      }
    } catch (e: any) {
      setError(e.message || "Failed to load dispute details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [orderId])

  const handleVote = async (decision: 'REFUND_BUYER' | 'RELEASE_FUNDS') => {
    if (!isAuthenticated && !wallet.isConnected) {
      toast({ title: "Authentication Required", description: "Connect your wallet or login to vote.", variant: "destructive" })
      return
    }

    setVoting(true)
    try {
      const res = await voteOnDispute(orderId as string, {
        decision,
        userId: user?.id,
        stellarWallet: wallet.publicKey || undefined
      })
      if (res) {
        toast({ title: "Vote Cast", description: "Your vote has been securely recorded on the DAO ledger." })
        loadData() // Refresh counts
      }
    } catch (e: any) {
      toast({ title: "Voting Error", description: e.message || "Failed to submit vote", variant: "destructive" })
    } finally {
      setVoting(false)
    }
  }

  if (loading) return (
    <div className={cn("min-h-screen bg-[#05060A] text-slate-200", inter.className)}>
      <Header />
      <div className="flex flex-col items-center justify-center pt-40">
        <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Evidence Ledger...</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className={cn("min-h-screen bg-[#05060A] text-slate-200", inter.className)}>
      <Header />
      <div className="max-w-2xl mx-auto px-6 py-40 text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className={`${outfit.className} text-4xl font-bold text-white mb-4`}>Dispute Not Found</h1>
        <p className="text-slate-400 mb-8">{error || "This dispute may have been resolved or does not exist."}</p>
        <Link href="/bounty-board">
          <Button variant="outline" className="border-rose-500/20 text-rose-400 hover:bg-rose-500/10">Return to Bounty Board</Button>
        </Link>
      </div>
    </div>
  )

  const isResolved = data.votes.total >= 3
  const isRefunded = isResolved && data.votes.refund > data.votes.release
  const isReleased = isResolved && data.votes.release >= data.votes.refund

  return (
    <div className={cn("min-h-screen bg-[#05060A] text-slate-200 selection:bg-rose-500/30", inter.className)}>
      <Header />
      
      <div className="max-w-5xl mx-auto px-6 py-24 md:py-32">
        <Link href="/bounty-board" className="inline-flex items-center text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest mb-12 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-2" /> Back to Bounties
        </Link>

        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge className={cn("border-none text-[10px] font-black uppercase tracking-widest px-3 py-1", isResolved ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                {isResolved ? "Resolved Dispute" : "Active Audit"}
              </Badge>
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Order #{data.orderId.split('-')[0]}</span>
            </div>
            <h1 className={`${outfit.className} text-4xl md:text-6xl font-bold text-white tracking-tighter`}>
              Decentralized <span className="text-rose-500">Validation</span>
            </h1>
          </div>
          
          <div className="glass-premium bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 min-w-[240px] text-center shadow-2xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Consensus Progress</div>
            <div className={`${outfit.className} text-4xl font-bold text-white tracking-tighter mb-1`}>
              {data.votes.total} <span className="text-lg text-slate-500">/ 3</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${(data.votes.total / 3) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Evidence Card */}
          <Card className="glass-premium bg-[#0A0C14]/50 border-white/[0.05] p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-rose-500/5 blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <Gavel className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Buyer's Claim</h3>
                  <p className="text-xs text-slate-500 font-medium">Cryptographic Evidence Log</p>
                </div>
              </div>
              
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 mb-6">
                <p className="text-white text-lg italic leading-relaxed">"{data.buyerDisputeReason}"</p>
              </div>
              
              {data.buyerProofCid && (
                <a href={`https://gateway.pinata.cloud/ipfs/${data.buyerProofCid}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-rose-400 text-sm font-bold hover:text-rose-300 transition-colors">
                  View IPFS Evidence <ArrowLeft className="w-4 h-4 rotate-135" />
                </a>
              )}
            </div>
          </Card>

          {/* Supplier/Product Card */}
          <Card className="glass-premium bg-[#0A0C14]/50 border-white/[0.05] p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Contested Asset</div>
                <h3 className={`${outfit.className} text-2xl font-bold text-white mb-6`}>{data.product.title}</h3>
                
                <div className="flex items-center gap-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      {data.product.supplier.name}
                      {data.product.supplier.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Supplier</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-8 border-t border-white/[0.05]">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Escrow Status</div>
                <div className="text-amber-500 font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Locked pending DAO consensus
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Voting Section */}
        {!isResolved ? (
          <div className="glass-premium bg-[#020305]/60 border border-white/[0.05] rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
            <h3 className={`${outfit.className} text-3xl font-bold text-white mb-4`}>Cast Your Vote</h3>
            <p className="text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">Review the evidence and decide the outcome. Your vote will trigger the smart contract to either refund the buyer or release the funds to the supplier.</p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                disabled={voting}
                onClick={() => handleVote('REFUND_BUYER')}
                className="h-16 px-10 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-lg active:scale-95 transition-all"
              >
                {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Refund Buyer"}
              </Button>
              <Button 
                disabled={voting}
                onClick={() => handleVote('RELEASE_FUNDS')}
                className="h-16 px-10 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-lg active:scale-95 transition-all"
              >
                {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Release to Supplier"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="glass-premium bg-emerald-500/5 border border-emerald-500/20 rounded-[3rem] p-10 md:p-16 text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              {isRefunded ? <Lock className="w-10 h-10 text-emerald-400" /> : <Unlock className="w-10 h-10 text-emerald-400" />}
            </div>
            <h3 className={`${outfit.className} text-3xl font-bold text-white mb-4`}>Consensus Reached</h3>
            <p className="text-emerald-400 font-medium text-lg">
              {isRefunded 
                ? "The DAO has voted to refund the buyer. The smart contract has executed the return transfer." 
                : "The DAO has voted to release funds. The smart contract has executed the payout to the supplier."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
