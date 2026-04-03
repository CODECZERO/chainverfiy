"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { logoutUser } from "@/lib/redux/slices/user-auth-slice"
import { disconnectWallet } from "@/lib/redux/slices/wallet-slice"
import { Button } from "@/components/ui/button"
import { 
  Menu, X, ShieldCheck, MessageCircle, LogOut, User, 
  ChevronDown, Lock, LayoutGrid, ShoppingBag, Bell, 
  Wallet, Zap, Globe, Shield, Activity
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"

const StellarWalletSelector = dynamic(() => import("./stellar/wallet-selector").then(m => m.StellarWalletSelector), { ssr: false })
const AuthModal = dynamic(() => import("./auth-modal").then(m => m.AuthModal), { ssr: false })
const NotificationBell = dynamic(() => import("./notification-bell").then(m => m.NotificationBell), { ssr: false })
const USDCPriceTicker = dynamic(() => import("./usdc-price-ticker").then(m => m.USDCPriceTicker), { ssr: false })

export function Header() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [walletSelectorOpen, setWalletSelectorOpen] = React.useState(false)
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()

  const { isConnected, publicKey } = useSelector((state: RootState) => state.wallet)
  const { isAuthenticated, user } = useSelector((state: RootState) => state.userAuth)

  const isUserActive = isAuthenticated || isConnected
  const isSupplier = isAuthenticated && user?.role === "SUPPLIER"

  const NAV = [
    { href: "/marketplace", label: "MARKET" },
    { href: "/transparency", label: "TRANS" },
    { href: "/community", label: "INTEL" },
    { href: "/leaderboard", label: "RANK" },
    { href: "/bounty-board", label: "BOUNTY" },
    { href: "/verify", label: "VERIFY" },
  ]

  if (isSupplier) NAV.push({ href: "/seller-dashboard", label: "CORE" })
  else if (user?.role === "BUYER" || isConnected) NAV.push({ href: "/buyer-dashboard", label: "CORE" })

  const handleLogout = () => {
    dispatch(logoutUser())
    dispatch(disconnectWallet())
    setUserMenuOpen(false)
    router.push('/')
  }

  return (
    <>
      <USDCPriceTicker />
      
      <header className="sticky top-0 z-[100] w-full border-b border-white/[0.06] bg-black/40 backdrop-blur-3xl">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
          
          {/* ── Principal Identity ── */}
          <Link href="/" className="flex items-center gap-4 group shrink-0">
            <div className="relative w-11 h-11">
              <div className="absolute inset-0 bg-blue-600/30 rounded-xl blur-xl group-hover:bg-blue-600/50 transition-colors" />
              <div className="relative h-full w-full rounded-xl bg-[#0A0D14] border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-blue-500/50 transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 opacity-20 group-hover:opacity-40 transition-opacity" />
                <ShieldCheck className="w-5 h-5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tighter uppercase italic leading-none group-hover:tracking-wider transition-all duration-500">PRAMANIK</span>
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.4em] italic mt-1.5 opacity-60 group-hover:opacity-100">Verified Protocol</span>
            </div>
          </Link>

          {/* ── Strategic Matrix Nav ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => {
              const active = pathname === n.href
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`group relative px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.25em] italic transition-all ${
                    active ? "text-white" : "text-slate-500 hover:text-slate-200"
                  }`}
                >
                  <span className="relative z-10">{n.label}</span>
                  {active && (
                    <motion.div 
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-white/[0.04] border border-white/[0.08] rounded-2xl shadow-inner"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {active && (
                    <motion.div 
                      layoutId="nav-line"
                      className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.8)] rounded-full"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* ── Operations Cluster ── */}
          <div className="hidden lg:flex items-center gap-5">
            
            {/* Network Signals */}
            <div className="flex items-center gap-4 px-4 h-10 rounded-2xl bg-white/[0.02] border border-white/[0.04] shadow-inner">
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic leading-none">Mainnet</span>
               </div>
               <div className="w-px h-3 bg-white/5" />
               <Activity className="w-3.5 h-3.5 text-blue-500 opacity-60" />
            </div>

            {isUserActive && <NotificationBell />}

            {/* Principal Access */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button 
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-3 bg-[#0A0D14]/80 border border-white/[0.08] hover:border-blue-500/30 rounded-2xl px-4 py-2 text-sm transition-all shadow-2xl group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg border border-white/20 group-hover:scale-105 transition-transform">
                      {String(user.email?.[0] || "U").toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black text-white max-w-[100px] truncate uppercase tracking-widest italic">{String(user.email || "").split("@")[0]}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-14 w-60 bg-[#0A0D14]/95 backdrop-blur-2xl border border-white/[0.1] rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] p-2 z-[110] overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
                        
                        <Link href="/profile/buyer-settings" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3.5 text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/[0.03] rounded-2xl transition-all uppercase tracking-widest italic group">
                          <User className="w-4 h-4 text-slate-700 group-hover:text-blue-500 transition-colors" /> Settings
                        </Link>
                        
                        {isSupplier && (
                          <Link href="/seller-dashboard" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3.5 text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/[0.03] rounded-2xl transition-all uppercase tracking-widest italic group">
                            <LayoutGrid className="w-4 h-4 text-slate-700 group-hover:text-blue-500 transition-colors" /> Command
                          </Link>
                        )}
                        
                        {(isConnected || !isSupplier) && (
                          <Link href="/buyer-dashboard" onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3.5 text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/[0.03] rounded-2xl transition-all uppercase tracking-widest italic group">
                            <ShoppingBag className="w-4 h-4 text-slate-700 group-hover:text-blue-500 transition-colors" /> Operations
                          </Link>
                        )}

                        <div className="h-px bg-white/5 my-2 mx-3" />
                        
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-3.5 text-[10px] font-black text-red-500/70 hover:text-red-500 hover:bg-red-500/5 w-full text-left rounded-2xl transition-all uppercase tracking-widest italic group">
                          <LogOut className="w-4 h-4 text-red-900 group-hover:text-red-500 transition-colors" /> Termination
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}

              {isConnected && publicKey ? (
                <div className="flex items-center gap-2 bg-blue-600/5 border border-blue-500/20 rounded-2xl px-3 py-2 shadow-inner group">
                  <Wallet className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] font-mono font-black text-blue-400 tracking-tighter uppercase">
                    {publicKey.slice(0, 6)}…{publicKey.slice(-4)}
                  </span>
                  <button 
                    onClick={() => dispatch(disconnectWallet())}
                    className="ml-2 w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                    title="Disconnect Node"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : !isAuthenticated ? (
                <Button 
                  onClick={() => setWalletSelectorOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[10px] italic rounded-2xl h-11 px-8 shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:scale-95 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 mr-2" /> Connect Node
                </Button>
              ) : (
                isSupplier && (
                  <Button 
                    variant="outline" 
                    className="border-white/[0.1] bg-white text-black hover:bg-slate-200 font-black uppercase tracking-[0.2em] text-[10px] italic rounded-2xl h-11 px-6 shadow-2xl active:scale-95 transition-all"
                    onClick={() => window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`, "_blank")}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp P2P
                  </Button>
                )
              )}
            </div>
          </div>

          {/* ── Mobile Tactical Interlink ── */}
          <button className="lg:hidden p-3 bg-white/5 rounded-xl border border-white/10 text-slate-400 active:scale-90 transition-all" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* ── Mobile Operations Deck ── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-white/[0.06] bg-[#0A0D14]/98 backdrop-blur-2xl overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-8 space-y-2">
                {NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-6 py-4 text-[11px] font-black text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all uppercase tracking-[0.3em] italic border border-transparent hover:border-white/5"
                  >
                    {n.label}
                  </Link>
                ))}
                <div className="pt-6 mt-6 border-t border-white/5 flex flex-col gap-4">
                  {isUserActive ? (
                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl h-14 border-white/10 bg-[#0A0D14] text-white font-black uppercase tracking-widest text-[11px] italic"
                      onClick={() => handleLogout()}
                    >
                      Protocol Exit
                    </Button>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={() => { setAuthModalOpen(true); setMobileOpen(false) }}
                        variant="outline" className="rounded-2xl h-14 border-white/10 bg-[#0A0D14] text-white font-black uppercase tracking-widest text-[10px] italic">
                        Supplier
                      </Button>
                      <Button onClick={() => { setWalletSelectorOpen(true); setMobileOpen(false) }}
                        className="bg-blue-600 hover:bg-blue-500 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] italic">
                        Node
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <StellarWalletSelector isOpen={walletSelectorOpen} onClose={() => setWalletSelectorOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  )
}
