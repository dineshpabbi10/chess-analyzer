/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Stockfish worker + wasm and the piece SVGs live in /public and are
  // fetched at runtime by URL, so nothing here needs bundling them.
  async headers() {
    return [
      {
        // The engine and piece art are content-addressed by filename and never
        // change in place, so they can be cached hard.
        source: '/:dir(engine|pieces)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // The service worker must always be revalidated or clients get stuck.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
}

export default nextConfig
