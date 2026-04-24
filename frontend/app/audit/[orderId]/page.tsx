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
import { ShieldAlert, Gavel, ArrowLeft, Loader2, CheckCircle2, User as UserIcon, Lock, Unlock, FileText, Search, AlertTriangle, ExternalLink, ShieldCheck, Clock } from "lucide-react"
import Link from "next/link"
import { Inter, Outfit, Fira_Code } from "next/font/google"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })
const outfit = Outfit({ subsets: ["latin"] })
const firaCode = Fira_Code({ subsets: ["latin"] })

export default function DisputeAuditPage() {
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
      setError(e.message || "Failed to load audit case details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [orderId])

  const handleVote = async (decision: 'REFUND_BUYER' | 'RELEASE_FUNDS') => {
    if (!isAuthenticated && !wallet.isConnected) {
      toast({ title: "Authentication Required", description: "Connect your wallet or login to cast an audit vote.", variant: "destructive" })
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
        toast({ title: "Audit Vote Cast", description: "Your forensic decision has been securely recorded on the DAO ledger." })
        loadData() // Refresh counts
      }
    } catch (e: any) {
      toast({ title: "Voting Error", description: e.message || "Failed to submit vote", variant: "destructive" })
    } finally {
      setVoting(false)
    }
  }

  if (loading) return (
    <div className={cn("min-h-screen bg-[#02040A] text-slate-200", inter.className)}>
      <Header />
      <div className="flex flex-col items-center justify-center pt-40">
        <div className="relative">
            <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-6 relative z-10" />
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
        </div>
        <p className={cn("text-amber-500 font-bold uppercase tracking-widest text-[11px]", firaCode.className)}>Initializing Forensic Ledger...</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className={cn("min-h-screen bg-[#02040A] text-slate-200", inter.className)}>
      <Header />
      <div className="max-w-2xl mx-auto px-6 py-40 text-center">
        <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.15)]">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className={`${outfit.className} text-4xl font-bold text-white mb-4`}>Case File Not Found</h1>
        <p className="text-slate-400 mb-10 leading-relaxed">{error || "This case may have been archived, resolved, or the ID is incorrect."}</p>
        <Link href="/bounty-board">
          <Button className="h-12 px-8 bg-white/[0.05] border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Audit Board
          </Button>
        </Link>
      </div>
    </div>
  )

  const isResolved = (data?.votes?.total || 0) >= 3
  const isRefunded = isResolved && (data?.votes?.refund || 0) > (data?.votes?.release || 0)
  const isReleased = isResolved && (data?.votes?.release || 0) >= (data?.votes?.refund || 0)

  return (
    <div className={cn("min-h-screen bg-[#02040A] text-slate-200 selection:bg-amber-500/30 overflow-x-hidden", inter.className)}>
      {/* ── Background Cyber-Grid ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-rose-500/5 blur-[150px] rounded-full" />
      </div>

      <Header />
      
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32 relative z-10">
        <Link href="/bounty-board" className="inline-flex items-center text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest mb-10 transition-colors">
          <ArrowLeft className="w-3 h-3 mr-2" /> Audit Board
        </Link>

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row gap-10 items-start justify-between mb-12">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Badge className={cn("border border-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-md", isResolved ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]")}>
                {isResolved ? "Case Closed" : "Active Audit"}
              </Badge>
              <span className={cn("text-[11px] text-slate-500 font-bold tracking-widest", firaCode.className)}>CASE-ID: {data?.orderId?.split('-')?.[0]}</span>
            </div>
            <h1 className={`${outfit.className} text-5xl md:text-7xl font-bold text-white tracking-tighter uppercase leading-[0.9]`}>
              Forensic <span className={cn("text-transparent bg-clip-text bg-gradient-to-r", isResolved ? "from-emerald-400 to-emerald-600" : "from-amber-400 to-orange-500")}>Review</span>
            </h1>
            <p className="text-slate-400 mt-6 max-w-xl text-sm leading-relaxed">
              Examine the cryptographic evidence provided below. Your decision will directly influence the resolution of this smart contract dispute.
            </p>
          </div>
          
          <div className="bg-[#050812]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 min-w-[280px] shadow-2xl shrink-0">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span>Auditor Consensus</span>
              <span className={cn("text-amber-500 font-mono", firaCode.className)}>{data?.votes?.total || 0}/3 Required</span>
            </div>
            <div className="flex gap-2 h-4 mb-4">
               {[0, 1, 2].map((i) => (
                 <div key={i} className={cn("flex-1 rounded-sm border border-white/5", i < (data?.votes?.total || 0) ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "bg-white/[0.02]")} />
               ))}
            </div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
               <span className="flex items-center gap-1.5"><Gavel className="w-3.5 h-3.5 text-rose-400" /> {data?.votes?.refund || 0} Refund</span>
               <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> {data?.votes?.release || 0} Release</span>
            </div>
          </div>
        </div>

        {/* ── Evidence & Assets Grid ── */}
        <div className="grid lg:grid-cols-5 gap-8 mb-12">
          {/* Claim & Evidence File (Span 3) */}
          <Card className="lg:col-span-3 bg-[#0A0D18]/80 backdrop-blur-xl border-white/[0.05] rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="p-8 md:p-10 border-b border-white/[0.05]">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.05]">
                        <FileText className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Buyer's Dispute Claim</h3>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3" /> FILED: {data?.disputeCreatedAt ? new Date(data.disputeCreatedAt).toLocaleString() : 'Unknown'}
                        </div>
                    </div>
                </div>
                
                <div className="bg-[#050812] border border-white/[0.04] rounded-2xl p-6 relative">
                    <div className="absolute top-4 left-4 text-white/5 font-serif text-6xl leading-none">"</div>
                    <p className="text-slate-300 text-lg leading-relaxed relative z-10 pl-6 pr-4 italic">
                        {data?.buyerDisputeReason || "No reason provided."}
                    </p>
                </div>
            </div>

            <div className="p-8 md:p-10 bg-black/20">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5" /> Attached Evidence Logs
                </h4>
                {data?.buyerProofCid ? (
                    <a href={`https://gateway.pinata.cloud/ipfs/${data?.buyerProofCid}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-amber-500/30 rounded-xl transition-all group/link">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#050812] flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white mb-0.5">Cryptographic Proof (IPFS)</div>
                                <div className={cn("text-[9px] text-slate-500 truncate max-w-[200px] sm:max-w-[300px]", firaCode.className)}>{data?.buyerProofCid}</div>
                            </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-600 group-hover/link:text-amber-500 transition-colors mr-2" />
                    </a>
                ) : (
                    <div className="p-6 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No additional file evidence provided.</p>
                    </div>
                )}
            </div>
          </Card>

          {/* Supplier & Asset Details (Span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-8">
              <Card className="bg-[#0A0D18]/80 backdrop-blur-xl border-white/[0.05] rounded-[2.5rem] p-8 relative overflow-hidden flex-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Lock className="w-3 h-3 text-indigo-400" /> Escrow Asset Details
                  </div>
                  
                  <div className="mb-8">
                      <h3 className={`${outfit.className} text-2xl font-bold text-white leading-tight mb-2`}>{data?.product?.title || "Unknown Product"}</h3>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-md text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Product Under Review
                      </div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/[0.05]">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Supplier Profile</div>
                      <div className="flex items-center gap-4 bg-[#050812] border border-white/[0.04] rounded-2xl p-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                          <UserIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                            {data?.product?.supplier?.name || "Unknown Supplier"}
                            {data?.product?.supplier?.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                              Trust Score: {data?.product?.supplier?.trustScore || 0}%
                          </div>
                        </div>
                      </div>
                  </div>
              </Card>

              {/* Security Warning Box */}
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-[2rem] p-6 text-sm text-rose-400/80 leading-relaxed font-medium">
                  <strong className="text-rose-400 font-bold block mb-2 text-[10px] uppercase tracking-widest">Audit Notice</strong>
                  Funds are cryptographically frozen in the escrow contract pending DAO validation. As an auditor, review the evidence impartially. False auditing may result in a loss of trust score and token slashing.
              </div>
          </div>
        </div>

        {/* ── Voting Terminal ── */}
        {!isResolved ? (
          <div className="bg-[#050812]/90 backdrop-blur-3xl border border-white/[0.08] rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />
            
            <h3 className={`${outfit.className} text-3xl font-bold text-white mb-3 relative z-10`}>Final Decision Terminal</h3>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mb-10 relative z-10 leading-relaxed">
                Determine the outcome of this case. Your cryptographic signature will be added to the DAO ledger to trigger the smart contract execution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
              <Button 
                disabled={voting}
                onClick={() => handleVote('REFUND_BUYER')}
                className="h-16 px-10 rounded-2xl bg-rose-500/5 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/50 font-bold text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(244,63,94,0.05)]"
              >
                {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Refund (Buyer)"}
              </Button>
              <Button 
                disabled={voting}
                onClick={() => handleVote('RELEASE_FUNDS')}
                className="h-16 px-10 rounded-2xl bg-indigo-500/5 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/50 font-bold text-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.05)]"
              >
                {voting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Release Escrow (Supplier)"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/[0.03] backdrop-blur-3xl border border-emerald-500/20 rounded-[3rem] p-10 md:p-16 text-center shadow-[0_0_50px_rgba(16,185,129,0.05)] relative overflow-hidden">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
              {isRefunded ? <Lock className="w-8 h-8 text-emerald-400" /> : <Unlock className="w-8 h-8 text-emerald-400" />}
            </div>
            <h3 className={`${outfit.className} text-3xl font-bold text-white mb-4`}>Verdict Finalized</h3>
            <p className="text-emerald-400 font-medium text-sm leading-relaxed max-w-2xl mx-auto">
              {isRefunded 
                ? "The DAO consensus determined the buyer's claim was valid. The smart contract has executed the return transfer from escrow to the buyer's wallet." 
                : "The DAO consensus favored the supplier. The smart contract has executed the payout transfer from escrow to the supplier's vault."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
