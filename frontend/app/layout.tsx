import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ReduxProvider } from "@/lib/redux-provider"
import { WalletStateManager } from "@/components/wallet-state-manager"
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from "@/lib/wallet-context"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
})

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
  display: 'swap',
})

export const metadata: Metadata = {
  title: "ChainVerify — Verified Marketplace on Stellar",
  description: "Secure, trustless marketplace for verified physical assets anchored to the Stellar blockchain.",
  generator: "chainverify.app",
  keywords: ["stellar", "blockchain", "verified marketplace", "ecommerce", "chainverify", "supply chain"],
  openGraph: {
    title: "ChainVerify — Verified Marketplace on Stellar",
    description: "Secure, trustless marketplace for verified physical assets. Blockchain-backed proof. Pay with XLM, USDC, or UPI.",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ReduxProvider>
            <QueryProvider>
              <WalletProvider>
                <ErrorBoundary>
                  <WalletStateManager />
                  {children}
                  <Toaster />
                  <Analytics />
                </ErrorBoundary>
              </WalletProvider>
            </QueryProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
