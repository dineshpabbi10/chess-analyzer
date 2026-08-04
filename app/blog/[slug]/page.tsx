import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageShell } from '../../../src/components/Nav'
import { formatDate, getPost, getPosts } from '../../../src/lib/blog'
import { SITE_URL } from '../../layout'

type Params = { params: Promise<{ slug: string }> }

/** Pre-render every post at build time. */
export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return { title: 'Post not found' }
  const url = `/blog/${post.slug}`
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.date,
      tags: post.tags,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
  }
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  // Article structured data helps Google understand and surface the post.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    author: { '@type': 'Organization', name: 'Fast Chess Analyzer' },
    publisher: { '@type': 'Organization', name: 'Fast Chess Analyzer' },
    ...(post.cover ? { image: `${SITE_URL}${post.cover}` } : {}),
  }

  return (
    <PageShell title={post.title} subtitle={post.description || undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="post-meta">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span>·</span>
        <span>{post.readingMinutes} min read</span>
      </div>

      {/* Markdown is authored by us / the CMS, so rendering it as HTML is intended. */}
      <article className="prose" dangerouslySetInnerHTML={{ __html: post.html }} />

      <div className="post-foot">
        <Link href="/blog" className="link">
          ← All posts
        </Link>
        <Link href="/" className="primary btn-link">
          Review one of your games
        </Link>
      </div>
    </PageShell>
  )
}
