"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, Loader2, AlertCircle, Camera, Link as LinkIcon } from "lucide-react"
import { submitBountyProof, uploadToIpfs } from "@/lib/api-service"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/redux/store"
import Image from "next/image"
import { getIPFSUrl } from "@/lib/image-utils"

interface SubmitProofModalProps {
  isOpen: boolean
  onClose: () => void
  bounty: any
  onSuccess: () => void
}

export function SubmitProofModal({ isOpen, onClose, bounty, onSuccess }: SubmitProofModalProps) {
  const { user } = useSelector((s: RootState) => s.userAuth)
  const wallet = useSelector((s: RootState) => s.wallet)
  
  const [step, setStep] = useState<"input" | "processing" | "success" | "error">("input")
  const [proofMediaUrl, setProofMediaUrl] = useState("")
  const [note, setNote] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadToIpfs(formData);
      if (res && res.cid) {
        setProofMediaUrl(res.cid);
      } else {
        throw new Error("Failed to upload to IPFS");
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }

  const handleSubmit = async () => {
    const identifier = user?.id || wallet.publicKey;
    if (!bounty?.id || !identifier) {
      setError("Missing information (Bounty or Login)")
      setStep("error")
      return
    }

    if (!proofMediaUrl) {
      setError("Please provide a photo or video URL as proof")
      setStep("error")
      return
    }

    setIsProcessing(true)
    setStep("processing")
    setError("")

    try {
      const payload: any = {
        bountyId: bounty.id,
        proofCid: proofMediaUrl
      };
      
      if (user?.id) {
        payload.solverId = user.id;
      } else if (wallet.publicKey) {
        payload.stellarWallet = wallet.publicKey;
      }

      const res = await submitBountyProof(payload)

      if (!res) {
        throw new Error("Failed to submit proof")
      }


      setStep("success")
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed"
      setError(message)
      setStep("error")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (isProcessing) return
    setStep("input")
    setProofMediaUrl("")
    setNote("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-[#111827] border-[#1F2D40] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Camera className="text-blue-500 w-6 h-6" />
            {step === "input" && "Submit Proof"}
            {step === "processing" && "Submitting..."}
            {step === "success" && "Proof Submitted!"}
            {step === "error" && "Action Failed"}
          </DialogTitle>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4 pt-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
              <p className="text-xs text-blue-400 uppercase tracking-widest font-bold mb-1">Bounty Task</p>
              <p className="text-sm text-slate-300 italic">"{String(bounty?.description || "")}"</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2"><LinkIcon className="w-4 h-4 text-slate-400" /> Proof Media URL (Photo/Video)</span>
                <div className="relative">
                   <Button variant="outline" size="sm" className="h-8 text-xs bg-[#1C2333] border-[#1F2D40] text-slate-300 hover:bg-slate-800" disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Camera className="w-3 h-3 mr-2" />}
                      {isUploading ? "Uploading..." : "Upload File"}
                   </Button>
                   <input type="file" accept="image/*,video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} disabled={isUploading} />
                </div>
              </label>
              <Input
                placeholder="https://example.com/check-proof.jpg"
                value={proofMediaUrl}
                onChange={(e) => setProofMediaUrl(e.target.value)}
                className="bg-[#1C2333] border-[#1F2D40] text-white rounded-xl"
              />
              {proofMediaUrl && (
                 <div className="mt-2 w-24 h-24 rounded-xl overflow-hidden relative border border-[#1F2D40]">
                    <Image src={getIPFSUrl(proofMediaUrl)} alt="Preview" fill className="object-cover" />
                 </div>
              )}
              <p className="text-[10px] text-slate-500 mt-1">Upload a file or paste an IPFS CID / URL</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Additional Note (Optional)</label>
              <Textarea
                placeholder="Provide any additional context for the issuer..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="bg-[#1C2333] border-[#1F2D40] text-white rounded-xl placeholder:text-slate-500"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!proofMediaUrl}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-xl mt-4"
            >
              Submit Proof to Issuer
            </Button>
          </div>
        )}

        {step === "processing" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <div>
              <p className="text-lg font-bold">Anchoring Proof</p>
              <p className="text-slate-400 text-sm">Verifying your account and recording proof...</p>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Proof Submitted — Awaiting Review</p>
              <p className="text-slate-400 text-sm">Your proof has been submitted and is now in the issuer's review queue. Once they verify and approve your submission, the bounty reward will be released to you.</p>
            </div>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-6 pt-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-6 w-6 text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-red-400">Submission Error</p>
                <p className="text-sm text-red-300/70 mt-1">{String(error || "Unknown Error")}</p>
              </div>
            </div>

            <Button onClick={() => setStep("input")} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl">
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
