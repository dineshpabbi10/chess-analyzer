'use client'

import { useCallback, useState } from 'react'

export interface GameSummary {
  id: string
  url: string
  white: string
  black: string
  whiteElo: number | null
  blackElo: number | null
  result: string
  timeClass: string
  date: string | null
  pgn: string
}

type Platform = 'chesscom' | 'lichess'

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: 'chesscom', label: 'Chess.com' },
  { key: 'lichess', label: 'Lichess' },
]

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })
}

/** Which side did the searched user play, and did they win? */
function outcomeFor(g: GameSummary, user: string): 'win' | 'loss' | 'draw' | null {
  const u = user.trim().toLowerCase()
  const isWhite = g.white.toLowerCase() === u
  const isBlack = g.black.toLowerCase() === u
  if (!isWhite && !isBlack) return null
  if (g.result === '1/2-1/2') return 'draw'
  const whiteWon = g.result === '1-0'
  return whiteWon === isWhite ? 'win' : 'loss'
}

export function GamePicker({ onPick }: { onPick: (pgn: string) => void }) {
  const [platform, setPlatform] = useState<Platform>('chesscom')
  const [username, setUsername] = useState('')
  const [games, setGames] = useState<GameSummary[] | null>(null)
  const [loadedFor, setLoadedFor] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const user = username.trim()
    if (!user) return
    setBusy(true)
    setError(null)
    setGames(null)
    try {
      const res = await fetch(
        `/api/games?platform=${platform}&username=${encodeURIComponent(user)}&max=20`,
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load games.')
      if (!data.games?.length) throw new Error(`No recent games found for "${user}".`)
      setGames(data.games)
      setLoadedFor(user)
    } catch (e: any) {
      setError(e?.message || 'Could not load games.')
    } finally {
      setBusy(false)
    }
  }, [platform, username])

  return (
    <div className="picker">
      <div className="picker-head">Or load your recent games</div>
      <div className="chip-row picker-platforms">
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            className={`chip${platform === p.key ? ' on' : ''}`}
            onClick={() => {
              setPlatform(p.key)
              setGames(null)
              setError(null)
            }}
            disabled={busy}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="picker-row">
        <input
          type="text"
          placeholder={`Your ${platform === 'chesscom' ? 'Chess.com' : 'Lichess'} username`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !busy && load()}
          disabled={busy}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <button className="ghost" onClick={load} disabled={busy || !username.trim()}>
          {busy ? 'Loading…' : 'Load games'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {games && (
        <ul className="game-list">
          {games.map((g) => {
            const oc = outcomeFor(g, loadedFor)
            return (
              <li key={g.id || g.url}>
                <button className="game-row" onClick={() => onPick(g.pgn)}>
                  {oc && <span className={`oc oc-${oc}`}>{oc[0].toUpperCase()}</span>}
                  <span className="game-players">
                    {g.white}
                    {g.whiteElo ? ` (${g.whiteElo})` : ''} <span className="dim">vs</span> {g.black}
                    {g.blackElo ? ` (${g.blackElo})` : ''}
                  </span>
                  <span className="game-meta">
                    {g.timeClass} · {fmtDate(g.date)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
