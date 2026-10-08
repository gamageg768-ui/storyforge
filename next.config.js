const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /\/api\/stories\/\d+\/chapters\/\d+$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'chapter-api',
        expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 },
        networkTimeoutSeconds: 3,
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  images: { unoptimized: true },
}

module.exports = withPWA(nextConfig)
