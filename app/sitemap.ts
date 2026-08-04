import type { MetadataRoute } from 'next'
import { getPosts } from '../src/lib/blog'
import { SITE_URL } from '../src/lib/site'

/** Static routes plus every published post, so crawlers can find everything. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1, freq: 'weekly' },
    { path: '/coach', priority: 0.9, freq: 'monthly' },
    { path: '/puzzles', priority: 0.9, freq: 'daily' },
    { path: '/openings', priority: 0.9, freq: 'monthly' },
    { path: '/blog', priority: 0.8, freq: 'weekly' },
    { path: '/tools/analysis', priority: 0.8, freq: 'monthly' },
    { path: '/tools/next-move', priority: 0.6, freq: 'monthly' },
    { path: '/tools/editor', priority: 0.6, freq: 'monthly' },
    { path: '/tools/elo-calculator', priority: 0.6, freq: 'monthly' },
  ]

  return [
    ...pages.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    })),
    ...getPosts().map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
  ]
}
