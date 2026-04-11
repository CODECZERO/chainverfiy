/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // Transpile packages that might have issues
  transpilePackages: ['react-is', 'lucide-react', '@creit.tech/stellar-wallets-kit'],
  // Security headers for wallet integration
  async headers() {
    return []
  },
  // GS1 Digital Link rewrites — enables worldwide scanner compatibility
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    return [
      {
        source: '/01/:gtin/21/:serial',
        destination: `${apiUrl}/qr/resolve/:serial`,
      },
      // Note: Removed /horizon edge rewrite to avoid Vercel WAF 403 blocks.
      // Now handled by a standard Next.js API Route in /app/api/horizon
    ]
  },
}

export default nextConfig
