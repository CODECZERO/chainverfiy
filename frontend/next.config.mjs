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
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://freighter.app https://albedo.link https://va.vercel-scripts.com https://vercel.live chrome-extension://* moz-extension://*; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 https://va.vercel-scripts.com *.stellar.org *.soroban.org https://*.onrender.com https://api.coingecko.com https://api.qrserver.com *.pinata.cloud *.mypinata.cloud https://vercel.live https://*.pusher.com https://*.vercel-analytics.com chrome-extension://* moz-extension://*; img-src 'self' http://localhost:8000 http://127.0.0.1:8000 https://api.qrserver.com *.pinata.cloud *.mypinata.cloud https://*.tile.openstreetmap.org https://unpkg.com https://*.basemaps.cartocdn.com blob: data: https://vercel.live https://*.vercel.com https://assets.vercel.com https://va.vercel-scripts.com https://freighter.app https://albedo.link https://*.vercel.app chrome-extension://* moz-extension://*; frame-src https://vercel.live; object-src 'none';",
          },
        ],
      },
    ]
  },
  // GS1 Digital Link rewrites — enables worldwide scanner compatibility
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    return [
      {
        // GS1 Digital Link: /01/{gtin}/21/{serial}?qr=CHV-XXXX
        source: '/01/:gtin/21/:serial',
        destination: `${apiUrl}/qr/resolve/:serial`,
      },
    ]
  },
}

export default nextConfig
