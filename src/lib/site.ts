/**
 * Canonical origin for the site, used for canonical URLs, OpenGraph, the sitemap
 * and JSON-LD. Override with NEXT_PUBLIC_SITE_URL when running on another domain.
 *
 * Kept out of app/layout.tsx because Next only permits a fixed set of exports
 * from a layout file.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://chess-analyzer-ruddy.vercel.app'
).replace(/\/+$/, '')
