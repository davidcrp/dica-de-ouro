import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'dica-de-ouro.github.io' },
      { hostname: 'qwwncqvdzpzmgntxkulu.supabase.co' },
      { hostname: 'maps.googleapis.com' },
    ],
  },
}

export default nextConfig
