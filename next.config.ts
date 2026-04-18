import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.freejpg.com.ar' },
      { protocol: 'https', hostname: 'en.freejpg.com.ar' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'static.pexels.com' },
      { protocol: 'https', hostname: 'ik.imagekit.io' },
      { protocol: 'https', hostname: '**.digitaloceanspaces.com' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ...securityHeaders,
        ],
      },
      {
        source: '/:path*.(svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
          ...securityHeaders,
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
})
