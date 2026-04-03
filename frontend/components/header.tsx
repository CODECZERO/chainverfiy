"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import type { RootState, AppDispatch } from "@/lib/redux/store"
import { logoutUser } from "@/lib/redux/slices/user-auth-slice"
import { disconnectWallet } from "@/lib/redux/slices/wallet-slice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ShieldCheck, LogOut, User as UserIcon, 
  ChevronDown, Lock, LayoutGrid, ShoppingBag, 
  Wallet, Zap, Globe, Shield, Activity, Search,
  Menu, X
} from "lucide-react"
import { 
  NavigationMenu, 
  NavigationMenuContent, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList, 
  NavigationMenuTrigger 
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const StellarWalletSelector = dynamic(() => import("./stellar/wallet-selector").then(m => m.StellarWalletSelector), { ssr: false })
const AuthModal = dynamic(() => import("./auth-modal").then(m => m.AuthModal), { ssr: false })
const NotificationBell = dynamic(() => import("./notification-bell").then(m => m.NotificationBell), { ssr: false })
const USDCPriceTicker = dynamic(() => import("./usdc-price-ticker").then(m => m.USDCPriceTicker), { ssr: false })

export function Header() {
  const [walletSelectorOpen, setWalletSelectorOpen] = React.useState(false)
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()

  const { isConnected, publicKey } = useSelector((state: RootState) => state.wallet)
  const { isAuthenticated, user } = useSelector((state: RootState) => state.userAuth)

  const isUserActive = isAuthenticated || isConnected
  const isSupplier = isAuthenticated && user?.role === "SUPPLIER"

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    dispatch(logoutUser())
    dispatch(disconnectWallet())
    router.push('/')
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[110] pointer-events-none">
         <USDCPriceTicker />
      </div>

      <header className="fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-4 pointer-events-none transition-all duration-500">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "mx-auto max-w-7xl h-14 md:h-16 glass-premium rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-between px-4 md:px-8 pointer-events-auto transition-all duration-500",
            isScrolled ? "scale-95 translate-y-2 opacity-95" : "scale-100"
          )}
        >
          {/* ── Brand ── */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)] group-hover:scale-110 transition-all">
               <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm md:text-base font-display font-black text-white tracking-[0.15em] uppercase italic group-hover:text-indigo-400 transition-colors">CHAINVERIFY</span>
          </Link>

          {/* ── Navigation ── */}
          <div className="hidden lg:flex items-center flex-1 justify-center px-4">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-slate-400 hover:text-white text-[10px] uppercase font-display font-bold tracking-widest h-9 px-4 rounded-xl">
                    Markets
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-[#0A0C14]/95 backdrop-blur-3xl border border-white/[0.08] shadow-2xl rounded-2xl">
                      <NavigationMenuLink asChild>
                        <Link href="/marketplace" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/[0.04]">
                          <div className="text-[10px] font-display font-black uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5" /> Terminal Marketplace
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">
                            Access decentralized repository of authenticated premium units.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/transparency" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/[0.04]">
                          <div className="text-[10px] font-display font-black uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> Flow Transparency
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">
                            Real-time exchange rates and network volume metrics.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-slate-400 hover:text-white text-[10px] uppercase font-display font-bold tracking-widest h-9 px-4 rounded-xl">
                    Network
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-2 p-4 bg-[#0A0C14]/95 backdrop-blur-3xl border border-white/[0.08] rounded-2xl">
                      {[
                        { href: "/community", label: "Intel Hub", icon: Globe, desc: "Decentralized discourse and node intelligence." },
                        { href: "/leaderboard", label: "Consensus Rank", icon: Zap, desc: "Top performing verification nodes." },
                        { href: "/bounty-board", label: "Bounty Layer", icon: Lock, desc: "Strategic fund allocation for verification." },
                        { href: "/verify", label: "Oracle Audit", icon: Shield, desc: "Mine Trust Tokens through consensus." },
                      ].map((item) => (
                        <NavigationMenuLink key={item.href} asChild>
                          <Link href={item.href} className="flex items-center gap-4 rounded-xl p-3 hover:bg-white/[0.04] transition-all group">
                             <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:border-indigo-500/30 transition-colors">
                               <item.icon className="w-4 h-4 text-indigo-500/70" />
                             </div>
                             <div>
                               <div className="text-[10px] font-display font-black uppercase tracking-widest text-white">{item.label}</div>
                               <div className="text-[9px] text-slate-500 mt-0.5">{item.desc}</div>
                             </div>
                          </Link>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {isUserActive && (
                  <NavigationMenuItem>
                    <Link href={isSupplier ? "/seller-dashboard" : "/buyer-dashboard"} legacyBehavior passHref>
                      <NavigationMenuLink className="bg-transparent text-indigo-400 hover:text-indigo-300 text-[10px] uppercase font-display font-bold tracking-widest h-9 px-4 flex items-center gap-2 cursor-pointer transition-colors">
                        <LayoutGrid className="w-3.5 h-3.5" /> Command
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}

              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* ── Operations Hub ── */}
          <div className="flex items-center gap-3">
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Search Toggle (Optimized for Mobile) */}
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 transition-colors group-focus-within:text-indigo-500" />
              <Input 
                placeholder="PROBE..." 
                className="w-32 bg-white/[0.03] border-white/[0.06] rounded-xl h-9 pl-9 text-[9px] font-display font-black uppercase tracking-widest focus-visible:w-48 transition-all focus:bg-white/[0.05]"
              />
            </div>

            {isUserActive && <NotificationBell />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/30 rounded-xl h-9 px-2.5 transition-all group outline-none">
                  {isAuthenticated && user ? (
                    <>
                      <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white italic">
                        {String(user.email?.[0] || "U").toUpperCase()}
                      </div>
                      <span className="text-[9px] font-display font-bold text-white uppercase tracking-widest hidden sm:block">
                        {String(user.email || "").split("@")[0]}
                      </span>
                    </>
                  ) : isConnected ? (
                    <>
                      <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center">
                        <Wallet className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[9px] font-display font-bold text-white uppercase tracking-widest hidden sm:block">
                        {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
                      </span>
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-[9px] font-display font-bold text-white uppercase tracking-widest">ID</span>
                    </>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#0A0C14]/98 backdrop-blur-3xl border border-white/[0.1] rounded-2xl p-1 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] mt-2">
                <div className="px-3 py-3 mb-1">
                   <div className="text-[8px] font-display font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Node Status</div>
                   <div className="text-[10px] font-display font-bold text-white uppercase tracking-widest truncate">{user?.email || publicKey || "GUEST_PROTOCOL"}</div>
                </div>
                <DropdownMenuSeparator className="bg-white/5 mx-1" />
                
                <DropdownMenuItem asChild>
                   <Link href="/profile/buyer-settings" className="px-3 py-2.5 text-[9px] font-display font-bold uppercase tracking-widest text-slate-400 hover:text-white cursor-pointer flex items-center gap-3">
                      <UserIcon className="w-3.5 h-3.5" /> Node Settings
                   </Link>
                </DropdownMenuItem>

                {isUserActive && (
                  <DropdownMenuItem asChild>
                     <Link href={isSupplier ? "/seller-dashboard" : "/buyer-dashboard"} className="px-3 py-2.5 text-[9px] font-display font-bold uppercase tracking-widest text-slate-400 hover:text-white cursor-pointer flex items-center gap-3">
                        <LayoutGrid className="w-3.5 h-3.5" /> Command
                     </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-white/5 mx-1" />
                
                {isUserActive ? (
                  <DropdownMenuItem onClick={handleLogout} className="px-3 py-2.5 text-[9px] font-display font-bold uppercase tracking-widest text-red-500/80 hover:text-white hover:bg-red-500 transition-all cursor-pointer flex items-center gap-3">
                    <LogOut className="w-3.5 h-3.5" /> Deactivate
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => setAuthModalOpen(true)} className="px-3 py-2.5 text-[9px] font-display font-bold uppercase tracking-widest text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all cursor-pointer flex items-center gap-3">
                      <Shield className="w-3.5 h-3.5" /> Supplier Entry
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setWalletSelectorOpen(true)} className="px-3 py-2.5 text-[9px] font-display font-bold uppercase tracking-widest text-emerald-400 hover:text-white hover:bg-emerald-600 transition-all cursor-pointer flex items-center gap-3">
                      <Zap className="w-3.5 h-3.5" /> Link Node
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </motion.div>
      </header>

      <StellarWalletSelector isOpen={walletSelectorOpen} onClose={() => setWalletSelectorOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* ── Mobile Navigation Overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[120] bg-[#020408]/95 backdrop-blur-2xl flex flex-col p-8 lg:hidden"
          >
            <div className="flex items-center justify-between mb-12">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                   <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-display font-black text-white tracking-[0.15em] uppercase italic">CHAINVERIFY</span>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-4">
              <div className="text-[10px] font-display font-black text-slate-600 uppercase tracking-[0.4em] mb-4 pl-4 italic">Protocol Directory</div>
              {[
                { href: "/marketplace", label: "Terminal Marketplace", icon: ShoppingBag },
                { href: "/transparency", label: "Flow Transparency", icon: Activity },
                { href: "/community", label: "Intel Hub", icon: Globe },
                { href: "/leaderboard", label: "Consensus Rank", icon: Zap },
                { href: "/bounty-board", label: "Bounty Layer", icon: Lock },
                { href: "/verify", label: "Oracle Audit", icon: Shield },
              ].map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-display font-black text-white uppercase tracking-widest">{item.label}</span>
                </Link>
              ))}

              {isUserActive && (
                <Link 
                  href={isSupplier ? "/seller-dashboard" : "/buyer-dashboard"} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 mt-8"
                >
                  <LayoutGrid className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-display font-black text-indigo-400 uppercase tracking-widest">Command Center</span>
                </Link>
              )}
            </nav>

            <div className="mt-8 pt-8 border-t border-white/[0.06]">
              {isUserActive ? (
                <button 
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="w-full h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3 text-red-500 font-display font-black text-[10px] uppercase tracking-[0.2em]"
                >
                  <LogOut className="w-4 h-4" /> Deactivate Node
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                    className="h-14 bg-indigo-600 rounded-2xl text-white font-display font-black text-[9px] uppercase tracking-[0.1em]"
                  >
                    Supplier Entry
                  </button>
                  <button 
                    onClick={() => { setWalletSelectorOpen(true); setMobileMenuOpen(false); }}
                    className="h-14 bg-emerald-600 rounded-2xl text-white font-display font-black text-[9px] uppercase tracking-[0.1em]"
                  >
                    Link Node
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
