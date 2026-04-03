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
  ShoppingBag, 
  Activity, 
  Globe, 
  Zap, 
  Lock, 
  ChevronDown, 
  User as UserIcon, 
  LayoutGrid, 
  LogOut, 
  Shield, 
  Wallet, 
  Menu, 
  X, 
  ShieldCheck, 
  Bell, 
  Check, 
  MessageSquare,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Settings,
  Search,
  CheckCircle2,
  Users
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
            <div className="relative w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all">
               <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-tight group-hover:text-indigo-400 transition-colors">ChainVerify</span>
          </Link>

          {/* ── Navigation ── */}
          <div className="hidden lg:flex items-center flex-1 justify-center px-4">
            <NavigationMenu>
              <NavigationMenuList className="gap-1">
                
                {/* ── Marketplace Dropdown ── */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-slate-400 hover:text-white text-sm font-medium h-9 px-4 rounded-xl">
                    Marketplace
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-[#0A0C14]/95 backdrop-blur-3xl border border-white/[0.08] shadow-2xl rounded-2xl">
                      <NavigationMenuLink asChild>
                        <Link href="/marketplace" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/[0.04]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5" /> Product Marketplace
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">
                            Browse our decentralized collection of authenticated premium products.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link href="/transparency" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/[0.04]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> Network Transparency
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">
                            Real-time verification metrics and blockchain transaction volume.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* ── Verification Dropdown ── */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-slate-400 hover:text-white text-sm font-medium h-9 px-4 rounded-xl">
                    Verification
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-[#0A0C14]/95 backdrop-blur-3xl border border-white/[0.08] shadow-2xl rounded-2xl">
                      <NavigationMenuLink key="/bounty-board" asChild>
                        <Link href="/bounty-board" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/[0.04]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-2">
                             <Lock className="w-3.5 h-3.5" /> Bounty Board
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">Earn rewards by auditing origins and providing verification data.</p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink key="/verify" asChild>
                        <Link href="/verify" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/[0.04]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-2">
                             <ShieldCheck className="w-3.5 h-3.5" /> Verify & Earn
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">Securely verify product authenticity and earn community points.</p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink key="/leaderboard" asChild>
                        <Link href="/leaderboard" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/[0.04]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-2">
                             <Zap className="w-3.5 h-3.5" /> Top Contributors
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">View the ranking of our most active and trusted community members.</p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* ── Community Dropdown ── */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-slate-400 hover:text-white text-sm font-medium h-9 px-4 rounded-xl">
                    Community
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-[#0A0C14]/95 backdrop-blur-3xl border border-white/[0.08] shadow-2xl rounded-2xl">
                      <NavigationMenuLink key="/community" asChild>
                        <Link href="/community" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/[0.04]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" /> Discussion Hub
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">Join the collective discourse on product transparency and trust.</p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink key="/seller-directory" asChild>
                        <Link href="/marketplace" className="block select-none space-y-1 rounded-xl p-4 leading-none no-underline outline-none transition-all hover:bg-white/[0.04]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" /> Seller Directory
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-500">Explore authenticated suppliers with high-integrity trust scores.</p>
                        </Link>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {isUserActive && (
                  <NavigationMenuItem>
                    <Link href={isSupplier ? "/seller-dashboard" : "/buyer-dashboard"} legacyBehavior passHref>
                      <NavigationMenuLink className="bg-transparent text-indigo-400 hover:text-indigo-300 text-sm font-semibold h-9 px-4 flex items-center gap-2 cursor-pointer transition-colors">
                        <LayoutGrid className="w-4 h-4" /> Dashboard
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
                placeholder="Search..." 
                className="w-32 bg-white/[0.03] border-white/[0.06] rounded-xl h-9 pl-9 text-xs font-semibold focus-visible:w-48 transition-all focus:bg-white/[0.05]"
              />
            </div>

            {isUserActive && <NotificationBell />}

            <div className="flex items-center gap-4">
                  {!isConnected && (
                    <Button 
                      onClick={() => setWalletSelectorOpen(true)}
                      className="hidden md:flex h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all active:scale-95 border border-emerald-400/20"
                    >
                      <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-0 overflow-hidden hover:bg-white/[0.06] transition-all group active:scale-95">
                        <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10" />
                        {isAuthenticated ? (
                          <div className="w-full h-full flex items-center justify-center text-blue-400 font-bold text-sm">
                            {user.email?.[0].toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                             <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
                          </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[280px] mt-4 glass-premium bg-[#0A0D14]/95 border-white/[0.08] text-slate-200 p-2 rounded-2xl shadow-3xl">
                      {!isAuthenticated ? (
                        <>
                          <DropdownMenuItem asChild className="px-4 py-3 text-sm font-semibold hover:bg-white/[0.05] rounded-xl cursor-pointer flex items-center gap-3">
                            <Link href="/login"><LogIn className="w-4 h-4" /> Login Account</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="px-4 py-3 text-sm font-semibold hover:bg-white/[0.05] rounded-xl cursor-pointer flex items-center gap-3">
                            <Link href="/signup"><UserPlus className="w-4 h-4" /> Create Profile</Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-4 border-b border-white/[0.05]">
                            <div className="text-xs font-semibold text-slate-500 mb-1">Signed in as</div>
                            <div className="text-sm font-bold text-white truncate">{user.email}</div>
                          </div>
                          <DropdownMenuItem asChild className="px-4 py-3 mt-2 text-sm font-semibold hover:bg-white/[0.05] rounded-xl cursor-pointer flex items-center gap-3">
                            <Link href={isSupplier ? "/seller-dashboard" : "/buyer-dashboard"}>
                              <LayoutDashboard className="w-4 h-4" /> Dashboard
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="px-4 py-3 text-sm font-semibold hover:bg-white/[0.05] rounded-xl cursor-pointer flex items-center gap-3">
                            <Link href="/profile/buyer-settings"><Settings className="w-4 h-4" /> Account Settings</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={handleLogout} className="px-4 py-3 text-sm font-semibold text-red-500 hover:text-white hover:bg-red-500/20 rounded-xl cursor-pointer flex items-center gap-3">
                            <LogOut className="w-4 h-4" /> Sign Out
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <div className="h-px bg-white/[0.05] my-2" />
                      
                      {isConnected ? (
                        <div className="px-4 py-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                          <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Wallet Connected
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate leading-none">{publicKey}</div>
                        </div>
                      ) : (
                        <DropdownMenuItem onClick={() => setWalletSelectorOpen(true)} className="px-4 py-3 text-sm font-semibold text-emerald-400 hover:text-white hover:bg-emerald-600 rounded-xl transition-all cursor-pointer flex items-center gap-3">
                          <Wallet className="w-4 h-4" /> Connect Wallet
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

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
                <span className="text-base font-semibold text-white tracking-tight">ChainVerify</span>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white/[0.03] border border-white/[0.06] rounded-xl text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-4">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 pl-4 opacity-50">Marketplace</div>
                <div className="space-y-2">
                  {[
                    { href: "/marketplace", label: "Product Marketplace", icon: ShoppingBag },
                    { href: "/transparency", label: "Network Transparency", icon: Activity },
                  ].map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 pl-4 opacity-50">Verification</div>
                <div className="space-y-2">
                  {[
                    { href: "/bounty-board", label: "Bounty Board", icon: Lock },
                    { href: "/verify", label: "Verify & Earn", icon: Shield },
                    { href: "/leaderboard", label: "Top Contributors", icon: Zap },
                  ].map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 pl-4 opacity-50">Community</div>
                <div className="space-y-2">
                  {[
                    { href: "/community", label: "Discussion Hub", icon: Globe },
                    { href: "/marketplace", label: "Seller Directory", icon: Users },
                  ].map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <div className="mt-8 pt-8 border-t border-white/[0.06]">
              <div className="flex flex-col gap-2 pt-4">
                {!isConnected ? (
                  <Button 
                    onClick={() => { setWalletSelectorOpen(true); setMobileMenuOpen(false); }}
                    className="w-full h-14 rounded-xl bg-emerald-600 text-white font-bold text-sm"
                  >
                    <Wallet className="w-5 h-5 mr-3" /> Connect Wallet
                  </Button>
                ) : (
                  <div className="w-full p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 mb-4">
                    <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                    </div>
                    <div className="text-xs font-mono text-slate-400 truncate">{publicKey}</div>
                  </div>
                )}

                {!isAuthenticated ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Button asChild variant="outline" className="h-14 rounded-xl border-white/10 text-white font-bold" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild className="h-14 rounded-xl bg-indigo-600 text-white font-bold" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/signup">Join</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Signed in as</div>
                        <div className="text-sm font-bold text-white truncate">{user.email}</div>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full h-14 rounded-xl border-white/10 text-white font-bold justify-start px-6" onClick={() => setMobileMenuOpen(false)}>
                      <Link href={isSupplier ? "/seller-dashboard" : "/buyer-dashboard"}>
                        <LayoutDashboard className="w-5 h-5 mr-4 text-slate-400" /> Dashboard
                      </Link>
                    </Button>
                    <Button onClick={handleLogout} variant="ghost" className="w-full h-14 rounded-xl text-red-400 font-bold justify-start px-6 hover:bg-red-500/10" >
                      <LogOut className="w-5 h-5 mr-4 text-red-500" /> Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
