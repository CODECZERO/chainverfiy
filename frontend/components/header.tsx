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
  ShoppingBag, Activity, Globe, Zap, Lock, ChevronDown, User as UserIcon, 
  LayoutGrid, LogOut, Shield, Wallet, Menu, X, ShieldCheck, 
  LogIn, UserPlus, LayoutDashboard, Settings, Search, Users
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"

const StellarWalletSelector = dynamic(() => import("./stellar/wallet-selector").then(m => m.StellarWalletSelector), { ssr: false })
const AuthModal = dynamic(() => import("./auth-modal").then(m => m.AuthModal), { ssr: false })
const NotificationBell = dynamic(() => import("./notification-bell").then(m => m.NotificationBell), { ssr: false })
const USDCPriceTicker = dynamic(() => import("./usdc-price-ticker").then(m => m.USDCPriceTicker), { ssr: false })

const FLAT_NAV = [
  { href: "/marketplace", label: "Shop", icon: ShoppingBag },
  { href: "/transparency", label: "Network", icon: Activity },
  { href: "/bounty-board", label: "Rewards", icon: Lock },
  { href: "/verify", label: "Verify", icon: ShieldCheck },
  { href: "/leaderboard", label: "Leaders", icon: Zap },
  { href: "/community", label: "Hub", icon: Globe },
]

const NAV_SECTIONS = [
  {
    label: "Marketplace",
    items: [
      { href: "/marketplace", label: "Product Marketplace", icon: ShoppingBag, description: "Browse our decentralized collection of authenticated premium products.", subLabel: "Product Marketplace" },
      { href: "/transparency", label: "Network Transparency", icon: Activity, description: "Real-time verification metrics and blockchain transaction volume.", subLabel: "Network Transparency" },
    ]
  },
  {
    label: "Verification",
    items: [
      { href: "/bounty-board", label: "Rewards Board", icon: Lock, description: "Earn rewards by auditing origins and providing verification data.", subLabel: "Rewards Board" },
      { href: "/verify", label: "Verify & Earn", icon: ShieldCheck, description: "Securely verify product authenticity and earn community points.", subLabel: "Verify & Earn" },
      { href: "/leaderboard", label: "Top Contributors", icon: Zap, description: "View the ranking of our most active and trusted community members.", subLabel: "Top Contributors" },
    ]
  },
  {
    label: "Community",
    items: [
      { href: "/community", label: "Discussion Hub", icon: Globe, description: "Join the collective discourse on product transparency and trust.", subLabel: "Discussion Hub" },
      { href: "/marketplace", label: "Seller Directory", icon: Users, description: "Explore authenticated suppliers with high-integrity trust scores.", subLabel: "Seller Directory" },
    ]
  }
]

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
  const dashboardUrl = isSupplier ? "/seller-dashboard" : "/buyer-dashboard"

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

      <header role="banner" className="fixed top-8 left-0 right-0 z-[100] px-4 md:px-8 py-3 pointer-events-none transition-all duration-500">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "mx-auto max-w-7xl h-12 md:h-14 glass-premium rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-between px-4 md:px-8 pointer-events-auto transition-all duration-500 shadow-2xl shadow-indigo-500/10",
            isScrolled ? "scale-95 translate-y-1 opacity-95" : "scale-100"
          )}
        >
          {/* Logo */}
          <Link href="/" aria-label="ChainVerify Home" className="flex items-center gap-2 group shrink-0">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
               <ShieldCheck aria-hidden="true" className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors hidden sm:block">ChainVerify</span>
          </Link>

          {/* Desktop Navigation - Single Line Structure */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center flex-1 justify-center px-4">
            <div className="flex items-center gap-1 xl:gap-2">
              {FLAT_NAV.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    aria-label={`Go to ${item.label}`}
                    className={cn(
                      "group relative px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                      isActive 
                        ? "text-indigo-400 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/20" 
                        : "text-slate-500 hover:text-white hover:bg-white/[0.04]"
                    )}
                  >
                    <item.icon aria-hidden="true" className={cn(
                       "w-3.5 h-3.5 transition-transform duration-500 group-hover:scale-110",
                       isActive ? "text-indigo-400" : "text-slate-600 group-hover:text-indigo-400"
                    )} />
                    {item.label}
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active-glow"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-500 rounded-full blur-[2px] opacity-80"
                      />
                    )}
                  </Link>
                )
              })}

              {(isAuthenticated || isConnected) && (
                <Link 
                  href={dashboardUrl}
                  aria-label="Go to Dashboard"
                  className={cn(
                    "group relative px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                    pathname.includes("dashboard")
                      ? "text-indigo-400 bg-indigo-500/5 ring-1 ring-indigo-500/20"
                      : "text-indigo-500/80 hover:text-white hover:bg-white/[0.04]"
                  )}
                >
                  <LayoutGrid aria-hidden="true" className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
              )}
            </div>
          </nav>

          {/* Actions Hub */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="hidden md:flex relative group">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 transition-colors group-focus-within:text-indigo-500" />
              <Input 
                placeholder="Search..." 
                aria-label="Search products"
                className="w-32 bg-white/[0.03] border-white/[0.06] rounded-xl h-9 pl-9 text-xs font-semibold focus-visible:w-48 transition-all focus:bg-white/[0.05] focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            {isUserActive && <NotificationBell />}

            <div className="flex items-center gap-2">
              {!isConnected && (
                <Button 
                  onClick={() => setWalletSelectorOpen(true)}
                  className="hidden md:flex h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 border border-emerald-400/20 shadow-lg shadow-emerald-900/20"
                >
                  <Wallet className="w-4 h-4 mr-2" /> Connect
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    aria-label="User profile and settings"
                    className="relative h-10 w-10 md:h-12 md:w-12 rounded-xl bg-white/[0.03] border border-white/[0.08] p-0 overflow-hidden hover:bg-white/[0.06] transition-all group active:scale-95"
                  >
                    <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10" />
                    {isAuthenticated && user ? (
                      <div className="w-full h-full flex items-center justify-center text-indigo-400 font-bold text-sm">
                        {(user.email || 'U')[0].toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 group-hover:text-slate-300">
                         <UserIcon aria-hidden="true" className="w-5 h-5" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[280px] mt-2 bg-[#0A0D14]/98 border-white/[0.08] text-slate-200 p-2 rounded-2xl shadow-3xl backdrop-blur-3xl ring-1 ring-white/10">
                  {!isAuthenticated ? (
                    <div className="p-1 space-y-1">
                      <DropdownMenuItem asChild className="px-4 py-3 text-sm font-semibold hover:bg-white/[0.05] rounded-xl cursor-pointer flex items-center gap-3">
                        <Link href="/login"><LogIn className="w-4 h-4 text-indigo-400" /> Login Account</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="px-4 py-3 text-sm font-semibold hover:bg-white/[0.05] rounded-xl cursor-pointer flex items-center gap-3">
                        <Link href="/signup"><UserPlus className="w-4 h-4 text-emerald-400" /> Create Profile</Link>
                      </DropdownMenuItem>
                    </div>
                  ) : (
                    <div className="p-1 space-y-1">
                      <div className="px-4 py-4 border-b border-white/[0.05] mb-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Signed in as</div>
                        <div className="text-sm font-bold text-white truncate">{user?.email || 'Authenticated User'}</div>
                      </div>
                      <DropdownMenuItem asChild className="px-4 py-3 text-sm font-semibold hover:bg-white/[0.05] rounded-xl cursor-pointer flex items-center gap-3">
                        <Link href={dashboardUrl}><LayoutDashboard className="w-4 h-4 text-indigo-400" /> Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="px-4 py-3 text-sm font-semibold hover:bg-white/[0.05] rounded-xl cursor-pointer flex items-center gap-3">
                        <Link href="/profile/buyer-settings"><Settings className="w-4 h-4 text-slate-400" /> Settings</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.05]" />
                      <DropdownMenuItem onSelect={handleLogout} className="px-4 py-3 text-sm font-semibold text-red-500 hover:text-white hover:bg-red-500 rounded-xl cursor-pointer flex items-center gap-3">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </DropdownMenuItem>
                    </div>
                  )}
                  
                  {isConnected ? (
                    <div className="p-1 mt-2">
                      <div className="px-4 py-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 mb-1">
                        <div className="flex items-center gap-2 text-emerald-400 text-[9px] font-bold uppercase mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Wallet Connected
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate tracking-tighter">{publicKey}</div>
                      </div>
                      <DropdownMenuItem 
                        onClick={() => dispatch(disconnectWallet())} 
                        className="px-4 py-3 text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/10 rounded-xl cursor-pointer flex items-center gap-3"
                      >
                        <Wallet className="w-4 h-4" /> Disconnect Wallet
                      </DropdownMenuItem>
                    </div>
                  ) : (
                    <div className="p-1 mt-1">
                      <DropdownMenuItem onClick={() => setWalletSelectorOpen(true)} className="px-4 py-3 text-sm font-bold text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-xl transition-all cursor-pointer flex items-center gap-3">
                        <Wallet className="w-4 h-4" /> Connect Wallet
                      </DropdownMenuItem>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
      </header>

      <StellarWalletSelector isOpen={walletSelectorOpen} onClose={() => setWalletSelectorOpen(false)} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="fixed inset-0 z-[120] bg-[#020408]/98 backdrop-blur-2xl flex flex-col p-6 lg:hidden"
          >
            <div className="flex items-center justify-between mb-10">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-indigo-500/20 shadow-lg">
                   <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-white tracking-tight italic">ChainVerify</span>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
              {NAV_SECTIONS.map((section) => (
                <div key={section.label}>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 opacity-50 pl-2">{section.label}</div>
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <Link 
                        key={item.href} 
                        href={item.href} 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all hover:translate-x-1 active:scale-98"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-white">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-white/[0.06] space-y-4">
              {isConnected ? (
                <div className="w-full p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase mb-1 tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Wallet Synced
                  </div>
                  <div className="text-xs font-mono text-slate-400 truncate">{publicKey}</div>
                </div>
              ) : (
                <Button 
                  onClick={() => { setWalletSelectorOpen(true); setMobileMenuOpen(false); }}
                  className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-900/20"
                >
                  <Wallet className="w-5 h-5 mr-3" /> Connect Wallet
                </Button>
              )}

              {!isAuthenticated ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="h-14 rounded-2xl border-white/10 text-white font-bold" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="h-14 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-900/20" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/signup">Join Now</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button asChild variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white font-bold justify-start px-6 bg-white/[0.02]" onClick={() => setMobileMenuOpen(false)}>
                    <Link href={dashboardUrl} className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 mr-4 flex items-center justify-center font-black">
                        {(user?.email || 'U')[0].toUpperCase()}
                      </div>
                      Dashboard
                    </Link>
                  </Button>
                  <Button onClick={handleLogout} variant="ghost" className="w-full h-14 rounded-2xl text-red-400 font-bold justify-start px-6 hover:bg-red-500/10 transition-all" >
                    <LogOut className="w-5 h-5 mr-4 text-red-500" /> Disconnect Account
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
