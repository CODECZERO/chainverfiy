"use client"

import { useState, useEffect, useRef, useMemo, Suspense } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { CheckCircle2, Package, MapPin, ExternalLink, ShieldCheck, Clock, ArrowLeft, Loader2, Wallet, AlertTriangle, Lock, Unlock, ArrowRightLeft, Banknote } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/redux/store"
import dynamic from 'next/dynamic'
import { JourneyTimelineRow } from '@/components/journey-timeline-row'
import { detectDeviceType, detectOS, detectBrowser } from '@/lib/qr-utils'
import { getOrder, registerQRScan, updateQRLocation } from "@/lib/api-service"
import { useWallet } from "@/lib/wallet-context"
import { Outfit } from "next/font/google"

const outfit = Outfit({ subsets: ["latin"] })

const JourneyMap = dynamic(() => import('@/components/journey-map'), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-white/[0.015] rounded-xl flex flex-col items-center justify-center border border-white/[0.04]">
      <Loader2 className="w-6 h-6 animate-spin text-slate-500 mb-3" />
      <span className="text-xs font-medium text-slate-500">Initializing Map...</span>
    </div>
  ),
})

export default function OrderJourneyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050608] text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse text-center space-y-4">
          <div className="w-16 h-16 bg-white/[0.03] rounded-2xl mx-auto" />
          <div className="h-6 bg-white/[0.03] rounded-lg w-1/2 mx-auto" />
          <div className="h-4 bg-white/[0.03] rounded-lg w-1/3 mx-auto" />
        </div>
      </div>
    }>
      <OrderJourneyContent />
    </Suspense>
  )
}

function OrderJourneyContent() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sharingLocation, setSharingLocation] = useState(false)
  const [locationShared, setLocationShared] = useState(false)
  const { user } = useSelector((s: RootState) => s.userAuth)
  const { publicKey } = useWallet()
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

  const scanFired = useRef(false)
  const lastFetchedRef = useRef<string | null>(null)

  // UUID validation — prevent crash on malformed IDs
  const isValidId = typeof id === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!isValidId) { setLoading(false); return; }
      if (lastFetchedRef.current === id) return
      lastFetchedRef.current = id as string
      try {
        const data = await getOrder(id as string)
        if (data) {
          setOrder(data)
        }
      } catch (e) {
        console.error("Failed to fetch order", e)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()


    // Fire telemetry event on load (non-blocking, non-critical)
    if (scanFired.current) return
    scanFired.current = true

    ;(async () => {
      try {
        const result = await registerQRScan({
          shortCode: id,
          clientTimestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          deviceType: detectDeviceType(navigator.userAgent),
          os: detectOS(navigator.userAgent),
          browser: detectBrowser(navigator.userAgent),
          screenResolution: `${screen.width}x${screen.height}`,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          connectionType: (navigator as any).connection?.effectiveType || 'unknown',
          referrer: document.referrer || 'direct',
          isOnline: navigator.onLine,
          locationPermission: 'unavailable',
          walletConnected: false,
          viewType: 'public_journey',
        })
        if (result?._success && result?.scanId) {
           const scanId = result.scanId
           // Auto-trigger only if user previously consented in this session
           if (localStorage.getItem('qr_location_consent') === 'true') {
             performGeolocation(scanId)
           }
        }
      } catch { /* telemetry is non-critical */ }
    })()

  }, [id, api])

  // Verification Logic
  const connectedWallet = user?.stellarWallet || publicKey
  const buyerWallet = order?.buyer?.stellarWallet
  const supplierWallet = order?.product?.supplier?.stellarWallet
  
  const hasValidToken = token && (token === order?.qrBuyerToken || token === order?.qrSupplierToken)
  const isAuthorized = hasValidToken || (connectedWallet && (connectedWallet === buyerWallet || connectedWallet === supplierWallet))

  // IMPORTANT: useMemo MUST be called before any conditional returns to satisfy React Rules of Hooks
  const product = order?.product
  const displayScans = useMemo(() => {
    if (!order) return []
    const stageScans = (product?.stageUpdates || []).map((s: any, idx: number) => ({
      scanNumber: idx,
      serverTimestamp: s.createdAt,
      scanSource: 'SYSTEM',
      resolvedLat: s.gpsLat,
      resolvedLng: s.gpsLng,
      resolvedLocation: s.gpsAddress || s.stageName,
      scannerRole: 'supplier',
      machineEventType: s.stageName,
      ipCountryName: 'Origin'
    }))

    const realScans = order?.qrCode?.scans || []
    let scans = [...stageScans, ...realScans]

    if (scans.length === 0) {
      scans = [{
        scanNumber: 0,
        serverTimestamp: order.createdAt,
        scanSource: 'SYSTEM',
        resolvedLocation: product?.supplier?.location || 'Supplier Facility',
        resolvedLat: product?.stageUpdates?.[0]?.gpsLat || null,
        resolvedLng: product?.stageUpdates?.[0]?.gpsLng || null,
        scannerRole: 'supplier',
        machineEventType: 'Package Prepared',
        ipCountryName: 'Origin'
      }]
    }
    return scans
  }, [order, product])

  // ── Conditional Returns (AFTER all hooks) ──

  if (!isValidId) return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col items-center justify-center p-4">
      <h1 className={`${outfit.className} text-xl font-semibold mb-3`}>Invalid Order ID</h1>
      <p className="text-slate-400 mb-6 text-sm">The order ID in the URL is malformed.</p>
      <Link href="/marketplace">
        <Button variant="outline" className="rounded-xl border-white/[0.06]">Back to Marketplace</Button>
      </Link>
    </div>
  )

  const performGeolocation = (scanId: string) => {
    if (!("geolocation" in navigator)) return
    setSharingLocation(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        updateQRLocation(scanId, {
          gpsLat: pos.coords.latitude,
          gpsLng: pos.coords.longitude,
          gpsAccuracy: pos.coords.accuracy,
          gpsAltitude: pos.coords.altitude,
        }).then(() => {
          setLocationShared(true)
          setSharingLocation(false)
          localStorage.setItem('qr_location_consent', 'true')
        })
      },
      () => setSharingLocation(false),
      { timeout: 15000, maximumAge: 60000, enableHighAccuracy: true }
    )
  }

  if (loading) return (
    <div className="min-h-screen bg-[#050608] text-white">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse text-center space-y-4">
        <div className="w-16 h-16 bg-white/[0.03] rounded-2xl mx-auto" />
        <div className="h-6 bg-white/[0.03] rounded-lg w-1/2 mx-auto" />
        <div className="h-4 bg-white/[0.03] rounded-lg w-1/3 mx-auto" />
      </div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col items-center justify-center p-4">
      <h1 className={`${outfit.className} text-xl font-semibold mb-3`}>Journey Not Found</h1>
      <Link href="/marketplace">
        <Button variant="outline" className="rounded-xl border-white/[0.06]">Back to Marketplace</Button>
      </Link>
    </div>
  )

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050608] text-white selection:bg-primary/30">
        <Header />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 bg-amber-500/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/15">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className={`${outfit.className} text-xl font-semibold mb-3`}>Verification Required</h1>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            This is a private verified journey. Connect the wallet address used for this purchase.
          </p>
          
          {!connectedWallet ? (
            <Button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl"
            >
              Connect Wallet
            </Button>
          ) : (
            <div className="p-4 bg-red-500/[0.06] border border-red-500/10 rounded-xl">
                <p className="text-red-400 text-sm font-medium">Unauthorized Wallet</p>
                <p className="text-[11px] text-red-400/50 font-mono mt-1 break-all">{connectedWallet}</p>
                <Button 
                    variant="ghost" 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}
                    className="mt-3 text-xs text-slate-400 hover:text-white"
                >
                    Switch Wallet
                </Button>
            </div>
          )}
          
          <Link href="/marketplace" className="block mt-5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-primary/30">
      <Header />
      
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-12">
        <Link href="/buyer-dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>

        {/* Header Card */}
        <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6">
            <ShieldCheck className="w-10 h-10 text-primary opacity-10 group-hover:opacity-25 transition-opacity" />
          </div>
          
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/[0.08] border border-primary/15 text-primary text-[11px] font-medium uppercase tracking-wider">
              Verified Journey
            </div>
            <h1 className={`${outfit.className} text-2xl md:text-3xl font-semibold tracking-tight`}>{product?.title}</h1>
            <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
              This product has been tracked from origin to your purchase. 
              The timeline below is anchored on the Stellar blockchain.
            </p>
            
            <div className="pt-3 flex flex-wrap gap-3 items-center">
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-2.5 text-center flex-1 sm:flex-none min-w-[110px]">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">Status</p>
                <div className="text-emerald-400 font-medium text-sm flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {order.status}
                </div>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-2.5 text-center flex-1 sm:flex-none min-w-[110px]">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-0.5">Verification</p>
                <div className="text-primary font-medium text-sm">100% On-Chain</div>
              </div>
              
              {!locationShared && (
                <button 
                  onClick={() => performGeolocation(id as string)}
                  disabled={sharingLocation}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 w-full sm:w-auto sm:ml-auto"
                >
                  {sharingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                  {sharingLocation ? "Verifying..." : "Verify Location"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timeline & Map Grid */}
        <div className="grid md:grid-cols-2 gap-5 mb-6 mt-8">
          <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-5 flex flex-col relative overflow-hidden h-[360px]">
            <div className="flex justify-between items-center mb-4 z-10">
              <h3 className={`${outfit.className} text-base font-semibold flex items-center gap-2`}>
                <MapPin className="w-4 h-4 text-amber-500" /> Verification Nodes
              </h3>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-white/[0.04] relative z-0">
              {displayScans.some((s: any) => s.resolvedLat != null && s.resolvedLng != null) ? (
                 <JourneyMap scans={displayScans} />
              ) : displayScans.length > 0 ? (
                 <JourneyMap scans={[{ ...displayScans[0], resolvedLat: 28.6139, resolvedLng: 77.2090, resolvedLocation: 'Supplier Origin (Estimated)' }, ...displayScans.slice(1)]} />
              ) : (
                 <div className="w-full h-full bg-white/[0.01] flex flex-col items-center justify-center space-y-3">
                    <span className="text-xs font-medium text-slate-500 text-center px-4">
                      Awaiting Geographic Scan
                      <p className="text-[11px] text-slate-600 mt-1.5 font-normal">GPS coordinates will appear once the package is registered at a transit hub.</p>
                    </span>
                 </div>
              )}
            </div>
          </div>
          
          <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-5 flex flex-col h-[360px]">
             <h3 className={`${outfit.className} text-base font-semibold mb-4 flex items-center gap-2`}>
               <Clock className="w-4 h-4 text-blue-500" /> Event Log
             </h3>
             <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-0 relative">
                {displayScans.length > 0 ? (
                  displayScans.map((scan: any, i: number) => (
                    <JourneyTimelineRow key={i} scan={scan} isLast={i === displayScans.length - 1} />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <p className="text-slate-500 text-sm">Timeline will populate once supplier dispatches.</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Financial Escrow Status Section */}
        {order && (
          <div className="mb-6 bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 md:p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <Banknote className="w-24 h-24 text-slate-500" />
             </div>
             
             <div className="relative z-10">
                <h3 className={`${outfit.className} text-base font-semibold flex items-center gap-2 mb-6`}>
                   <Wallet className="w-4 h-4 text-emerald-400" /> Financial & Escrow Status
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                   {/* Amount Locked */}
                   <div className="bg-white/[0.02] rounded-xl p-5 border border-white/[0.04]">
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Original Payment</p>
                      <div className={`${outfit.className} text-xl font-semibold text-white`}>
                         {order.sourceAmount ? Number(order.sourceAmount).toFixed(2) : order.product?.priceUsdc} <span className="text-xs text-slate-400">{order.sourceCurrency || 'USDC'}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                         <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Payment Processed
                      </div>
                   </div>

                   {/* Current Escrow State */}
                   <div className="bg-white/[0.02] rounded-xl p-5 border border-white/[0.04]">
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Contract State</p>
                      
                      {order.status === 'REFUNDED' ? (
                        <>
                          <div className={`${outfit.className} text-base font-semibold text-slate-300`}>Refunded</div>
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-white/[0.02] px-2.5 py-1.5 rounded-lg">
                             <ArrowRightLeft className="w-3 h-3" /> Funds Returned
                          </div>
                        </>
                      ) : order.status === 'COMPLETED' ? (
                        <>
                          <div className={`${outfit.className} text-base font-semibold text-emerald-400`}>Released</div>
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-emerald-500/70 bg-emerald-500/[0.06] px-2.5 py-1.5 rounded-lg">
                             <Unlock className="w-3 h-3" /> Settled to Supplier
                          </div>
                        </>
                      ) : order.status === 'DISPUTED' ? (
                        <>
                          <div className={`${outfit.className} text-base font-semibold text-red-400`}>Frozen</div>
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-red-400/80 bg-red-500/[0.06] px-2.5 py-1.5 rounded-lg">
                             <AlertTriangle className="w-3 h-3" /> Pending Resolution
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`${outfit.className} text-base font-semibold text-blue-400`}>Locked</div>
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-blue-400/80 bg-blue-500/[0.06] px-2.5 py-1.5 rounded-lg">
                             <Lock className="w-3 h-3" /> Secured until Delivery
                          </div>
                        </>
                      )}
                   </div>

                   {/* Transaction Reference */}
                   <div className="bg-white/[0.02] rounded-xl p-5 border border-white/[0.04] flex flex-col justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">Blockchain Proof</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Funds are held in a Soroban smart contract. The supplier cannot access them until you confirm receipt.
                        </p>
                      </div>
                      
                      {order.escrowTxId && (
                        <a 
                          href={`https://stellar.expert/explorer/testnet/tx/${order.escrowTxId}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] p-2.5 rounded-lg transition-colors"
                        >
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[110px]">{order.escrowTxId}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 shrink-0 ml-2" />
                        </a>
                      )}
                   </div>
                </div>
                
                {order.status === 'DISPUTED' && (
                   <div className="mt-5 bg-red-500/[0.06] border border-red-500/15 rounded-xl p-4 flex items-start gap-3">
                      <div className="p-1.5 bg-red-500/15 rounded-lg shrink-0"><AlertTriangle className="w-4 h-4 text-red-400" /></div>
                      <div>
                         <h4 className="text-sm font-medium text-red-400 mb-1">Dispute Active</h4>
                         <p className="text-[11px] text-red-300/70 leading-relaxed">
                           An issue was flagged for this order. The smart contract has frozen the escrow balance. Support will review the evidence and initiate a refund if the supplier is at fault.
                         </p>
                      </div>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/[0.04] text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/[0.05] text-[11px] text-slate-500 font-medium">
            Scan Token: <span className="font-mono text-primary">{token?.slice(0, 8)}...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
