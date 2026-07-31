import { useMemo, type ReactElement } from 'react'
import { META } from '../lib/classificationMeta'
import type { Classification } from '../lib/types'

interface Props {
  fen: string
  lastMove?: { from: string; to: string } | null
  classification?: Classification | null
  bestArrow?: { from: string; to: string } | null
  flipped?: boolean
  /** Interactive mode: click a square (used by the analysis board). */
  onSquareClick?: (square: string) => void
  /** Currently picked-up square. */
  selected?: string | null
  /** Legal destinations for the selected piece — rendered as dots. */
  targets?: string[]
}

function parseFen(fen: string): Map<string, string> {
  const map = new Map<string, string>()
  const rows = fen.split(' ')[0].split('/')
  for (let r = 0; r < 8; r++) {
    const rank = 8 - r
    let file = 0
    for (const ch of rows[r]) {
      if (ch >= '1' && ch <= '8') file += parseInt(ch, 10)
      else {
        map.set(String.fromCharCode(97 + file) + rank, ch)
        file++
      }
    }
  }
  return map
}

function centerPct(sq: string, flipped: boolean) {
  const f = sq.charCodeAt(0) - 97
  const r = parseInt(sq[1], 10) - 1
  const col = flipped ? 7 - f : f
  const rowTop = flipped ? r : 7 - r
  return { x: (col + 0.5) * 12.5, y: (rowTop + 0.5) * 12.5 }
}

export function Board({
  fen,
  lastMove,
  classification,
  bestArrow,
  flipped = false,
  onSquareClick,
  selected = null,
  targets,
}: Props) {
  const pieces = useMemo(() => parseFen(fen), [fen])
  const targetSet = useMemo(() => new Set(targets ?? []), [targets])
  const interactive = !!onSquareClick

  const squares: ReactElement[] = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const f = flipped ? 7 - col : col
      const rank = flipped ? row + 1 : 8 - row
      const sq = String.fromCharCode(97 + f) + rank
      const dark = (f + rank) % 2 === 0
      const piece = pieces.get(sq)
      const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq)
      const showBadge = classification && lastMove && lastMove.to === sq
      const cls =
        `sq ${dark ? 'dark' : 'light'}` +
        (isLast ? ' hl' : '') +
        (selected === sq ? ' sel' : '') +
        (interactive ? ' clickable' : '')
      const inner = (
        <>
          {col === 0 && <span className="coord rank">{rank}</span>}
          {row === 7 && <span className="coord file">{String.fromCharCode(97 + f)}</span>}
          {piece && (
            <img
              className="piece"
              draggable={false}
              src={`/pieces/${piece === piece.toUpperCase() ? 'w' : 'b'}${piece.toUpperCase()}.svg`}
              alt={piece}
            />
          )}
          {targetSet.has(sq) && <span className={`dot${piece ? ' dot-capture' : ''}`} />}
          {showBadge && (
            <span className="sq-badge" style={{ background: META[classification].color }}>
              {META[classification].glyph}
            </span>
          )}
        </>
      )
      squares.push(
        interactive ? (
          <button key={sq} className={cls} onClick={() => onSquareClick!(sq)} aria-label={sq}>
            {inner}
          </button>
        ) : (
          <div key={sq} className={cls}>
            {inner}
          </div>
        ),
      )
    }
  }

  const arrow = bestArrow
    ? (() => {
        const a = centerPct(bestArrow.from, flipped)
        const b = centerPct(bestArrow.to, flipped)
        return { a, b }
      })()
    : null

  return (
    <div className="board">
      {squares}
      {arrow && (
        <svg className="arrow-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <marker
              id="ah"
              markerWidth="4"
              markerHeight="4"
              refX="2"
              refY="2"
              orient="auto"
            >
              <path d="M0,0 L4,2 L0,4 z" fill="#e0a83e" />
            </marker>
          </defs>
          <line
            x1={arrow.a.x}
            y1={arrow.a.y}
            x2={arrow.b.x}
            y2={arrow.b.y}
            stroke="#e0a83e"
            strokeWidth="2.2"
            strokeLinecap="round"
            markerEnd="url(#ah)"
            opacity="0.85"
          />
        </svg>
      )}
    </div>
  )
}
