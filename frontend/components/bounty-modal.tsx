"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Loader2, AlertCircle, Coins, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react"
import { submitBountyTransaction } from "@/lib/stellar-utils"
import { useWallet } from "@/lib/wallet-context"
import { getExchangeRate, convertRsToXlm } from "@/lib/exchange-rates"
import { createBounty, verifyBountyPayment, initiateUPI } from "@/lib/api-service"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/redux/store"

interface BountyModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
}

export function BountyModal({ isOpen, onClose, product }: BountyModalProps) {
  const { isConnected, publicKey, signTransaction } = useWallet()
  const { user } = useSelector((s: RootState) => s.userAuth)
  
  const [step, setStep] = useState<"input" | "confirm" | "processing" | "success" | "error">("input")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [error, setError] = useState("")
  const [exchangeRate, setExchangeRate] = useState(15)
  const [isLoadingRate, setIsLoadingRate] = useState(false)
  const [bountyId, setBountyId] = useState("")
  const [isVerified, setIsVerified] = useState(false)
  const [verifReason, setVerifReason] = useState("")
  const [checkingVerif, setCheckingVerif] = useState(false)

  const stellarAmount = amount ? convertRsToXlm(Number.parseFloat(amount), exchangeRate) : 0

  useEffect(() => {
    const fetchRate = async () => {
      setIsLoadingRate(true)
      const rate = await getExchangeRate()
      setExchangeRate(rate)
      setIsLoadingRate(false)
    }
    fetchRate()
    const interval = setInterval(fetchRate, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen && product?.id) {
      checkVerification()
    }
  }, [isOpen, product?.id])

  const checkVerification = async () => {
    // Verification check disabled for bounty creation as per user request: anyone can create bounties.
    setIsVerified(true);
    setVerifReason("Anyone can issue bounties on ChainVerify");
  }

  const handleCreateAndPay = async () => {
    if (!product?.id || !publicKey) {
      setError("Missing information (Product or Wallet connection)")
      setStep("error")
      return
    }

    setIsProcessing(true)
    setStep("processing")
    setError("")

    try {
      // 1. Create Bounty in Backend (PENDING)
      const createData: any = {
        productId: product.id,
        amount: Number.parseFloat(amount),
        description: description
      }
      if (user?.id) createData.issuerId = user.id
      else createData.stellarWallet = publicKey

      const bountyRes = await createBounty(createData)

      if (!bountyRes) {
        throw new Error("Failed to initialize bounty")
      }

      const newBountyId = bountyRes.id
      setBountyId(newBountyId)


      // 2. Submit Stellar Transaction
      const receiverAddress = product.supplier?.stellarWallet || ""
      if (!receiverAddress) throw new Error("Supplier's wallet address not found")

      const result = await submitBountyTransaction(
        publicKey,
        receiverAddress,
        stellarAmount.toFixed(7),
        newBountyId,
        signTransaction
      )

      if (!result.success) {
        throw new Error("Transaction failed or was not verified")
      }

      setTxHash(result.hash)

      // 3. Verify Payment with Backend to Activate Bounty
      await verifyBountyPayment({
        bountyId: newBountyId,
        transactionHash: result.hash
      })

      setStep("success")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Process failed"
      setError(message)
      setStep("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManagedWalletBounty = async () => {
    if (!product?.id || !user?.id) {
      setError("Please log in to issue a bounty")
      setStep("error")
      return
    }

    // Restriction removed: anyone can create a bounty for any product

    setIsProcessing(true)
    setStep("processing")
    setError("")

    try {
      // 1. Create Bounty with MANAGED_WALLET Payment Method
      const bountyRes = await createBounty({
        productId: product.id,
        issuerId: user.id,
        amount: Number.parseFloat(amount),
        description: description,
        // @ts-ignore
        paymentMethod: "INTERNAL" // Backend maps INTERNAL/MANAGED_WALLET to server-side signing
      })

      if (!bountyRes) throw new Error("Failed to initialize bounty")
      const newBountyId = bountyRes.id


      // 2. Verify Payment (Backend handles the actual deduction/signing for INTERNAL)
      // @ts-ignore
      const res = await verifyBountyPayment({
        bountyId: newBountyId,
        transactionHash: "managed_wallet_auth", // Signal to backend to use managed secret
        paymentMethod: "INTERNAL"
      })

      if (!res) throw new Error("Managed wallet payment failed")

      setTxHash(res.transactionHash || "internal_ledger_settled")

      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Managed wallet process failed")
      setStep("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpiBounty = async () => {
    if (!product?.id || !user?.id) {
      setError("Please log in to issue a bounty")
      setStep("error")
      return
    }

    setIsProcessing(true)
    setStep("processing")
    setError("")

    try {
      // 1. Initiate UPI Payment
      const initRes = await initiateUPI({
        amount: Number.parseFloat(amount),
        currency: "INR",
        type: "BOUNTY",
        productId: product.id
      })

      if (!initRes) throw new Error("UPI initialization failed")


      // 2. Create Bounty with UPI Payment Method
      const bountyRes = await createBounty({
        productId: product.id,
        issuerId: user.id,
        amount: Number.parseFloat(amount),
        description: description,
        // @ts-ignore
        paymentMethod: "UPI"
      })

      if (!bountyRes) throw new Error("Failed to initialize bounty")
      const newBountyId = bountyRes.id


      // 3. Verify Payment
      const mockHash = `upi_bounty_${initRes.data?.razorpayOrderId || Math.random().toString(36).slice(2)}`
      await verifyBountyPayment({
        bountyId: newBountyId,
        transactionHash: mockHash,
        // @ts-ignore
        paymentMethod: "UPI"
      })

      setTxHash(mockHash)
      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "UPI process failed")
      setStep("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setStep("input")
    setAmount("")
    setDescription("")
    setTxHash("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl bg-[#0A0D14]/90 backdrop-blur-3xl border border-white/[0.1] text-white rounded-[3rem] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-3xl font-black flex items-center gap-4 text-white uppercase italic tracking-tighter">
            <Coins className="text-blue-500 w-8 h-8 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            {step === "input" && "Initialize Bounty"}
            {step === "confirm" && "Audit Confirmation"}
            {step === "processing" && "Network Sync"}
            {step === "success" && "Bounty Deployed"}
            {step === "error" && "Protocol Failure"}
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-6">
            {!isConnected && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                <AlertCircle className="h-6 w-6 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest italic">Authorization Required: Link Auditor Signature</p>
              </div>
            )}

            {(isConnected || user?.id) && (
              <div className="rounded-2xl p-5 border bg-white/[0.02] border-white/[0.08] relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
                <div className="flex items-center gap-4">
                  <ShieldCheck className="w-6 h-6 text-blue-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Permission Level: Global Auditor Access Enabled</p>
                </div>
              </div>
            )}

            {checkingVerif && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking verification status...
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Analysis Requirement</label>
              <Textarea
                placeholder="Ex: Verify genetic lineage of biological batch #4402..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-black/40 border-white/[0.08] text-white rounded-2xl placeholder:text-slate-700 min-h-[120px] focus:border-blue-500/40 transition-all italic text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Consensus Bounty (INR)</label>
              <Input
                type="number"
                placeholder="5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-black/40 border-white/[0.08] text-white rounded-2xl h-16 text-2xl font-black italic focus:border-blue-500/40 transition-all"
                disabled={!isConnected}
              />
              {amount && (
                <div className="mt-4 p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20 space-y-3 relative overflow-hidden">
                   <div className="absolute inset-0 bg-blue-500/[0.02] animate-pulse" />
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-blue-400 font-black italic relative z-10">
                    <span>Stellar Settlement Index</span>
                    <span>{isLoadingRate ? "Syncing..." : "Oracle Rate Active"}</span>
                  </div>
                  <p className="text-4xl font-black text-white font-mono tracking-tighter italic relative z-10">
                    {stellarAmount.toFixed(2)} <span className="text-[10px] uppercase text-blue-500 ml-1">XLM</span>
                  </p>
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest italic relative z-10">1 XLM ≈ ₹{exchangeRate.toFixed(2)} Base Index</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 mt-8">
              <Button
                onClick={() => setStep("confirm")}
                disabled={!amount || !description || !isConnected}
                className="w-full bg-white text-black hover:bg-slate-200 font-black h-20 rounded-[1.5rem] text-[11px] uppercase tracking-[0.3em] italic shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all active:scale-95"
              >
                Deploy via Stellar Wallet
              </Button>
              <div className="flex gap-4">
                {user?.id && (
                  <>
                    <Button
                      onClick={() => handleUpiBounty()}
                      disabled={!amount || !description}
                      className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-black h-20 rounded-[1.5rem] text-[10px] uppercase tracking-[0.3em] italic transition-all"
                    >
                      UPI Bridge
                    </Button>
                    {user?.role === 'SUPPLIER' && (
                      <Button
                        onClick={() => handleManagedWalletBounty()}
                      disabled={!amount || !description}
                        className="flex-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 font-black h-20 rounded-[1.5rem] text-[10px] uppercase tracking-[0.3em] italic transition-all"
                      >
                        Internal Node
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-6">
            <div className="bg-black/40 rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden group">
               <div className="absolute inset-0 bg-blue-500/[0.01] pointer-events-none" />
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black mb-3 italic">Audit Objective</p>
              <p className="text-xl font-black text-white italic tracking-tight">{String(product?.title || "")}</p>
            </div>

            <div className="bg-black/40 rounded-2xl p-6 border border-white/[0.08] relative overflow-hidden">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black mb-3 italic">Protocol Mandate</p>
              <p className="text-sm text-slate-400 leading-relaxed italic font-medium">"{String(description || "")}"</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-2xl p-6 border border-white/[0.08]">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black mb-2 italic">Flat Reserve</p>
                <p className="text-2xl font-black text-white italic tracking-tighter">₹{String(amount || 0)}</p>
              </div>
              <div className="bg-blue-500/10 rounded-2xl p-6 border border-blue-500/20">
                <p className="text-[9px] text-blue-400/70 uppercase tracking-widest font-black mb-2 italic">Crypto Settlement</p>
                <p className="text-2xl font-black text-blue-400 font-mono tracking-tighter italic">{stellarAmount.toFixed(2)} XLM</p>
              </div>
            </div>

            <div className="pt-6 space-y-4">
              <Button onClick={handleCreateAndPay} className="w-full bg-white text-black hover:bg-slate-200 font-black h-20 rounded-[1.5rem] text-[11px] uppercase tracking-[0.3em] italic shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all">
                Authorize & Deploy <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
              <Button onClick={() => setStep("input")} variant="ghost" className="w-full text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] italic">
                Revise Parameters
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-8">
            <div className="relative">
               <div className="absolute inset-0 bg-blue-500/20 blur-[40px] rounded-full animate-pulse" />
               <Loader2 className="h-20 w-20 text-blue-500 animate-spin relative z-10 stroke-[1]" />
            </div>
            <div>
              <p className="text-2xl font-black text-white uppercase italic tracking-tighter mb-3">Syncing with Oracle</p>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic">Awaiting Cryptographic Signature...</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-10">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-3">Bounty Active</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic">Consensus mandate broadcast to global auditor network.</p>
            </div>

            <div className="bg-black/40 rounded-2xl p-8 border border-white/[0.08] relative overflow-hidden">
               <div className="absolute inset-0 bg-blue-500/[0.02] pointer-events-none" />
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-black mb-3 italic">Transaction Hash</p>
              <p className="font-mono text-xs text-blue-400/70 break-all leading-relaxed mb-6">{String(txHash || "")}</p>
              <a href={`https://stellar.expert/explorer/testnet/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white bg-blue-600/20 border border-blue-500/30 px-6 py-3 rounded-xl hover:bg-blue-600/30 transition-all italic">
                <ExternalLink className="w-4 h-4" /> Stellar Explorer
              </a>
            </div>

            <Button onClick={handleClose} className="w-full bg-white text-black hover:bg-slate-200 font-black h-20 rounded-[1.5rem] text-[11px] uppercase tracking-[0.3em] italic shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all">
              Finalize Sequence
            </Button>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-6 pt-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-red-400">Action Failed</p>
                <p className="text-sm text-red-300/70 mt-1">{String(error || "Unknown Error")}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep("input")} className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold h-11 rounded-xl">
                Try Again
              </Button>
              <Button onClick={handleClose} variant="outline" className="flex-1 border-[#1F2D40] text-slate-300 hover:bg-slate-800 rounded-xl h-11">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
