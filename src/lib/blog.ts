// Server-only blog source. Posts are Markdown files in /content/blog with YAML
// frontmatter — the same shape Decap CMS writes from /admin, so posts authored in
// the CMS and posts committed by hand are identical on disk.

import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string // ISO
  tags: string[]
  cover: string | null
  draft: boolean
}

export interface Post extends PostMeta {
  html: string
  readingMinutes: number
}

function slugFromFile(file: string) {
  return file.replace(/\.mdx?$/, '')
}

function toMeta(file: string, data: Record<string, any>): PostMeta {
  return {
    slug: typeof data.slug === 'string' && data.slug ? data.slug : slugFromFile(file),
    title: String(data.title ?? slugFromFile(file)),
    description: String(data.description ?? ''),
    // Decap writes an ISO datetime; normalise anything parseable.
    date: data.date ? new Date(data.date).toISOString() : new Date(0).toISOString(),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    cover: typeof data.cover === 'string' && data.cover ? data.cover : null,
    draft: data.draft === true,
  }
}

function readFiles(): string[] {
  try {
    return fs.readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f))
  } catch {
    return [] // no content directory yet
  }
}

/** All published posts, newest first. Drafts are excluded in production. */
export function getPosts(): PostMeta[] {
  const showDrafts = process.env.NODE_ENV !== 'production'
  return readFiles()
    .map((file) => {
      const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
      return toMeta(file, matter(raw).data)
    })
    .filter((p) => showDrafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPost(slug: string): Post | null {
  for (const file of readFiles()) {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')
    const { data, content } = matter(raw)
    const meta = toMeta(file, data)
    if (meta.slug !== slug) continue
    const words = content.trim().split(/\s+/).length
    return {
      ...meta,
      html: marked.parse(content, { async: false }) as string,
      readingMinutes: Math.max(1, Math.round(words / 200)),
    }
  }
  return null
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
