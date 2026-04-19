import sys

with open('frontend/app/buyer-dashboard/page.tsx', 'r') as f:
    lines = f.readlines()

new_header = """  const walletAddr = user?.stellarWallet || publicKey || ""

  return (
    <div className={`min-h-screen bg-[#05060A] text-slate-200 overflow-x-hidden selection:bg-indigo-500/30 ${inter.className}`}>
      {/* ── Background Elements (matching marketplace) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] -left-[10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[15%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-emerald-600/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-8">

          {/* ── Buyer Profile Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-10 bg-indigo-500/40" />
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">Shopping Hub</span>
              </div>
              <h1 className={`${outfit.className} text-4xl md:text-6xl font-bold tracking-tight text-white mb-6`}>
                Buyer <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">Dashboard</span>
              </h1>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-[0_10px_40px_rgba(99,102,241,0.35)] border border-white/20">
                  {String(user?.email || publicKey || "B")[0].toUpperCase()}
                </div>
                <div>
                  <div className={`${outfit.className} font-bold text-white text-lg tracking-tight`}>{String(user?.email?.split("@")[0] || "Buyer Account")}</div>
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[9px] uppercase tracking-widest">
                    <Shield className="w-3 h-3" /> Verified Buyer
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4 min-w-[320px]"
            >
              {/* Wallet Address Card */}
              {walletAddr && (
                <button
                  onClick={copyWallet}
                  className="w-full p-4 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-indigo-500/30 transition-all group text-left"
                  title="Click to copy full wallet address"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stellar Wallet</span>
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 ml-auto transition-colors" />
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-slate-300 break-all leading-relaxed">
                    {walletAddr}
                  </p>
                  {copied && <span className="text-[9px] text-emerald-400 font-bold uppercase mt-1 block">Copied to clipboard!</span>}
                </button>
              )}

              {/* Total Spent + Actions */}
              <div className="flex gap-3 items-stretch">
                <div className="flex-1 p-4 bg-white/[0.04] border border-white/10 rounded-2xl">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Spent</div>
                  <div className={`${outfit.className} text-2xl font-bold text-white tracking-tight`}>
                    ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mt-1">USDC</div>
                </div>
                <button
                  onClick={loadOrders}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-slate-500 hover:text-white hover:border-indigo-500/30 transition-all disabled:opacity-50 group text-[10px] font-bold uppercase tracking-widest"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : "group-hover:rotate-180 transition-transform duration-700"}`} />
                </button>
                <Link href="/marketplace">
                  <Button className="h-full px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-900/20 transition-all active:scale-95">
                    <ShoppingCart className="w-4 h-4 mr-2" /> Shop
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* ── Horizontal Tab Nav ── */}
          <div className="mb-12 overflow-x-auto pb-2 custom-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActive(n.id)}
                  className={`relative px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${
                    active === n.id
                      ? "text-indigo-400 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] ring-1 ring-indigo-500/20"
                      : "text-slate-500 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <n.icon className={`w-4 h-4 transition-transform duration-500 ${active === n.id ? "text-indigo-400" : "text-slate-600"}`} />
                  {n.label}
                  {n.id === "tracking" && activeOrders.length > 0 && (
                    <span className="ml-1 bg-indigo-500/20 text-indigo-400 text-[9px] font-bold px-2 py-0.5 rounded-full">{activeOrders.length}</span>
                  )}
                  {active === n.id && (
                    <motion.div
                      layoutId="buyer-active-glow"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-500 rounded-full blur-[2px] opacity-80"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Content Area ── */}
          <div className="relative">
           <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-12"
              >
"""

# The layout start to replace is lines 175 to 328 (indices 175 to 328)
# Line 176 is `return (` so index 175. Line 328 is `               </div>` so index 328.

lines_to_keep_before = lines[:175]
lines_to_keep_after = lines[328:]

with open('frontend/app/buyer-dashboard/page.tsx', 'w') as f:
    f.writelines(lines_to_keep_before)
    f.write(new_header)
    f.writelines(lines_to_keep_after)

print("Saved new layout header")
