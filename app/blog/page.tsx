import type { Metadata } from 'next'
import Link from 'next/link'
import { PageShell } from '../../src/components/Nav'
import { formatDate, getPosts } from '../../src/lib/blog'

export const metadata: Metadata = {
  title: 'Chess Improvement Blog',
  description:
    'Practical guides on analysing your own chess games: how to read an engine evaluation, what accuracy and centipawn loss actually mean, and how to turn your mistakes into training.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Chess Improvement Blog · Fast Chess Analyzer',
    description: 'Practical guides on analysing your own chess games and turning mistakes into training.',
    url: '/blog',
  },
}

export default function BlogIndex() {
  const posts = getPosts()

  return (
    <PageShell
      title="Blog"
      subtitle="Practical writing about analysing your own games and actually improving from them."
    >
      {posts.length === 0 ? (
        <div className="card">
          <p className="muted-note" style={{ margin: 0 }}>
            No posts yet. Add one at <code>/admin</code> or drop a Markdown file into{' '}
            <code>content/blog/</code>.
          </p>
        </div>
      ) : (
        <ul className="post-list">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="post-card">
                <div className="post-card-meta">
                  <time dateTime={p.date}>{formatDate(p.date)}</time>
                  {p.draft && <span className="post-draft">Draft</span>}
                </div>
                <h2 className="post-card-title">{p.title}</h2>
                {p.description && <p className="post-card-desc">{p.description}</p>}
                {p.tags.length > 0 && (
                  <div className="op-tags">
                    {p.tags.map((t) => (
                      <span className="op-tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
