import { useState } from 'react'
import { Link, useRoute } from '../lib/router'

const LINKS = [
  { to: '/', label: 'Game Review' },
  { to: '/coach', label: 'Coach' },
  { to: '/puzzles', label: 'Puzzles' },
  { to: '/openings', label: 'Openings' },
  { to: '/tools/analysis', label: 'Analysis Board' },
  { to: '/tools/next-move', label: 'Next Move' },
  { to: '/tools/editor', label: 'Board Editor' },
  { to: '/tools/elo-calculator', label: 'Elo Calculator' },
]

export function Nav() {
  const path = useRoute()
  const [open, setOpen] = useState(false)
  return (
    <header className="nav">
      <Link to="/" className="nav-brand" onClick={() => setOpen(false)}>
        ♟ Fast Chess Analyzer
      </Link>
      <button
        className="nav-toggle"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ☰
      </button>
      <nav className={`nav-links${open ? ' open' : ''}`}>
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`nav-link${path === l.to ? ' active' : ''}`}
            onClick={() => setOpen(false)}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export function PageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="page">
      <Nav />
      <main className="page-main">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
        {children}
      </main>
    </div>
  )
}
