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
  ShieldCheck, LogOut, User, 
  ChevronDown, Lock, LayoutGrid, ShoppingBag, 
  Wallet, Zap, Globe, Shield, Activity, Search
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

const StellarWalletSelector = dynamic(() => import("./stellar/wallet-selector").then(m => m.StellarWalletSelector), { ssr: false })
const AuthModal = dynamic(() => import("./auth-modal").then(m => m.AuthModal), { ssr: false })
const NotificationBell = dynamic(() => import("./notification-bell").then(m => m.NotificationBell), { ssr: false })
const USDCPriceTicker = dynamic(() => import("./usdc-price-ticker").then(m => m.USDCPriceTicker), { ssr: false })

export function Header() {
  const [walletSelectorOpen, setWalletSelectorOpen] = React.useState(false)
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useDispatch<AppDispatch>()

  const { isConnected, publicKey } = useSelector((state: RootState) => state.wallet)
  const { isAuthenticated, user } = useSelector((state: RootState) => state.userAuth)

  const isUserActive = isAuthenticated || isConnected
  const isSupplier = isAuthenticated && user?.role === "SUPPLIER"

  const handleLogout = () => {
    dispatch(logoutUser())
    dispatch(disconnectWallet())
    router.push('/')
  }

  return (
    <>
      <USDCPriceTicker />
      
      <header className="sticky top-0 z-[100] w-full border-b border-white/[0.06] bg-[#05060B]/80 backdrop-blur-3xl h-16">
        <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
          
          {/* ── Brand ── */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:scale-105 transition-all">
               <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black text-white tracking-widest uppercase italic">PRAMANIK</span>
          </Link>

          {/* ── Navigation ── */}
          <div className="hidden lg:flex items-center flex-1 justify-center px-8">
            <NavigationMenu>
              <NavigationMenuList className="gap-2">
                
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-slate-400 hover:text-white text-[10px] uppercase font-black tracking-widest italic h-10 px-4">
                    Markets
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-[#0A0D14] border-white/[0.08] shadow-3xl">
                      <NavigationMenuLink asChild>
                        <Link href="/marketplace" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-colors hover:bg-white/[0.03] hover:text-accent-foreground">
                          <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic mb-1 flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5" /> Terminal Marketplace
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">
                            Access decentralized repository of authenticated premium units.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/transparency" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-colors hover:bg-white/[0.03] hover:text-accent-foreground">
                          <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic mb-1 flex items-center gap-2">
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
                  <NavigationMenuTrigger className="bg-transparent text-slate-400 hover:text-white text-[10px] uppercase font-black tracking-widest italic h-10 px-4">
                    Network
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-2 p-4 bg-[#0A0D14] border-white/[0.08]">
                      {[
                        { href: "/community", label: "Intel Hub", icon: Globe, desc: "Decentralized discourse and node intelligence." },
                        { href: "/leaderboard", label: "Consensus Rank", icon: Zap, desc: "Top performing verification nodes and reputational metrics." },
                        { href: "/bounty-board", label: "Bounty Layer", icon: Lock, desc: "Strategic fund allocation for network verification." },
                        { href: "/verify", label: "Oracle Audit", icon: Shield, desc: "Mine Trust Tokens through decentralized consensus." },
                      ].map((item) => (
                        <NavigationMenuLink key={item.href} asChild>
                          <Link href={item.href} className="flex items-center gap-4 rounded-xl p-3 hover:bg-white/[0.03] transition-all group">
                             <div className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center group-hover:border-blue-500/30 transition-colors">
                               <item.icon className="w-4 h-4 text-blue-500/70" />
                             </div>
                             <div>
                               <div className="text-[10px] font-black uppercase tracking-widest text-white italic">{item.label}</div>
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
                      <NavigationMenuLink className="bg-transparent text-blue-400 hover:text-blue-300 text-[10px] uppercase font-black tracking-widest italic h-10 px-4 flex items-center gap-2 cursor-pointer">
                        <LayoutGrid className="w-3.5 h-3.5" /> Core Command
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}

              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* ── Operations Hub ── */}
          <div className="flex items-center gap-4">
            
            {/* Professional Search */}
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 transition-colors group-focus-within:text-blue-500" />
              <Input 
                placeholder="PROBE NETWORK..." 
                className="w-48 bg-white/[0.02] border-white/[0.06] rounded-xl h-9 pl-9 text-[9px] font-black uppercase tracking-widest italic focus-visible:w-64 transition-all"
              />
            </div>

            <div className="w-px h-6 bg-white/[0.08] hidden md:block" />

            {isUserActive && <NotificationBell />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] rounded-xl h-9 px-3 transition-all group outline-none">
                  {isAuthenticated && user ? (
                    <>
                      <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[8px] font-black text-white italic">
                        {String(user.email?.[0] || "U").toUpperCase()}
                      </div>
                      <span className="text-[9px] font-black text-white uppercase tracking-widest italic hidden sm:block">
                        {String(user.email || "").split("@")[0]}
                      </span>
                    </>
                  ) : isConnected ? (
                    <>
                      <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center">
                        <Wallet className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[9px] font-black text-white uppercase tracking-widest italic hidden sm:block">
                        {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Identity</span>
                    </>
                  )}
                  <ChevronDown className="w-3 h-3 text-slate-600 group-hover:text-white transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#0A0D14]/95 border-white/[0.1] rounded-2xl p-1 shadow-4xl backdrop-blur-3xl pt-2">
                <div className="px-3 py-2 mb-1">
                   <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 italic">Authorized Signal</div>
                   <div className="text-[10px] font-black text-white uppercase tracking-widest truncate italic">{user?.email || publicKey || "GUEST_PROTOCOL"}</div>
                </div>
                <DropdownMenuSeparator className="bg-white/5" />
                
                <DropdownMenuItem asChild>
                   <Link href="/profile/buyer-settings" className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest italic text-slate-400 hover:text-white cursor-pointer flex items-center gap-3">
                      <User className="w-3.5 h-3.5" /> Node Settings
                   </Link>
                </DropdownMenuItem>

                {isUserActive && (
                  <DropdownMenuItem asChild>
                     <Link href={isSupplier ? "/seller-dashboard" : "/buyer-dashboard"} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest italic text-slate-400 hover:text-white cursor-pointer flex items-center gap-3">
                        <LayoutGrid className="w-3.5 h-3.5" /> Command Center
                     </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-white/5" />
                
                {isUserActive ? (
                  <DropdownMenuItem onClick={handleLogout} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest italic text-red-500/80 hover:text-red-500 hover:bg-red-500/10 cursor-pointer flex items-center gap-3">
                    <LogOut className="w-3.5 h-3.5" /> Protocol Exit
                  </DropdownMenuItem>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => setAuthModalOpen(true)} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest italic text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-3">
                      <Shield className="w-3.5 h-3.5" /> Supplier Login
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setWalletSelectorOpen(true)} className="px-3 py-2.5 text-[9px] font-black uppercase tracking-widest italic text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-3">
                      <Zap className="w-3.5 h-3.5" /> Connect Node
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>

      <StellarWalletSelector isOpen={walletSelectorOpen} onClose={() => setWalletSelectorOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  )
}
