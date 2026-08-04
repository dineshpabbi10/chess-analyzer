import { useEffect, useState, type ReactNode } from 'react'
import { Link, useRoute } from '../lib/router'
import {
  IconBoard,
  IconBook,
  IconBulb,
  IconCalc,
  IconCoach,
  IconMore,
  IconPawn,
  IconPencil,
  IconPuzzle,
  IconReview,
} from './Icons'

interface Item {
  to: string
  label: string
  short: string
  icon: (p: { size?: number }) => ReactNode
}

/** Shown in the mobile tab bar and at the top of the desktop sidebar. */
const PRIMARY: Item[] = [
  { to: '/', label: 'Game Review', short: 'Review', icon: IconReview },
  { to: '/coach', label: 'Coach', short: 'Coach', icon: IconCoach },
  { to: '/puzzles', label: 'Puzzles', short: 'Puzzles', icon: IconPuzzle },
  { to: '/openings', label: 'Openings', short: 'Openings', icon: IconBook },
]

/** Secondary utilities — sidebar section on desktop, "More" sheet on mobile. */
const TOOLS: Item[] = [
  { to: '/tools/analysis', label: 'Analysis Board', short: 'Board', icon: IconBoard },
  { to: '/tools/next-move', label: 'Next Move', short: 'Next', icon: IconBulb },
  { to: '/tools/editor', label: 'Board Editor', short: 'Editor', icon: IconPencil },
  { to: '/tools/elo-calculator', label: 'Elo Calculator', short: 'Elo', icon: IconCalc },
]

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRoute()
  const [moreOpen, setMoreOpen] = useState(false)

  // Close the sheet on navigation, and let Escape dismiss it.
  useEffect(() => setMoreOpen(false), [path])
  useEffect(() => {
    if (!moreOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMoreOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [moreOpen])

  const toolActive = TOOLS.some((t) => t.to === path)

  return (
    <div className="shell">
      {/* ---------- desktop sidebar ---------- */}
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand">
          <span className="brand-mark">
            <IconPawn size={20} />
          </span>
          <span className="brand-text">
            Fast Chess
            <span className="brand-sub">Analyzer</span>
          </span>
        </Link>

        <nav className="sidebar-nav">
          {PRIMARY.map((it) => (
            <Link key={it.to} to={it.to} className={`side-link${path === it.to ? ' active' : ''}`}>
              <it.icon size={20} />
              <span>{it.label}</span>
            </Link>
          ))}

          <div className="side-section">Tools</div>
          {TOOLS.map((it) => (
            <Link key={it.to} to={it.to} className={`side-link${path === it.to ? ' active' : ''}`}>
              <it.icon size={20} />
              <span>{it.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-foot">Stockfish 18 · runs on your device</div>
      </aside>

      {/* ---------- mobile top bar ---------- */}
      <header className="mobilebar">
        <Link to="/" className="mobilebar-brand">
          <span className="brand-mark">
            <IconPawn size={17} />
          </span>
          Fast Chess Analyzer
        </Link>
      </header>

      <main className="shell-main">{children}</main>

      {/* ---------- mobile bottom tabs ---------- */}
      <nav className="tabbar" aria-label="Main">
        {PRIMARY.map((it) => (
          <Link key={it.to} to={it.to} className={`tab${path === it.to ? ' active' : ''}`}>
            <it.icon size={22} />
            <span>{it.short}</span>
          </Link>
        ))}
        <button
          className={`tab${toolActive || moreOpen ? ' active' : ''}`}
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
        >
          <IconMore size={22} />
          <span>Tools</span>
        </button>
      </nav>

      {/* ---------- mobile "Tools" sheet ---------- */}
      {moreOpen && (
        <div className="sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="sheet" role="dialog" aria-label="Tools" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grip" />
            <div className="sheet-title">Tools</div>
            <div className="sheet-grid">
              {TOOLS.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`sheet-item${path === it.to ? ' active' : ''}`}
                  onClick={() => setMoreOpen(false)}
                >
                  <it.icon size={24} />
                  <span>{it.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
