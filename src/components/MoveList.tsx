'use client'

import { useEffect, useRef, type ReactElement } from 'react'
import { META } from '../lib/classificationMeta'
import type { AnalyzedMove } from '../lib/types'

interface Props {
  moves: AnalyzedMove[]
  current: number // index into moves, -1 = start
  onSelect: (index: number) => void
}

function Cell({ move, active, onClick }: { move?: AnalyzedMove; active: boolean; onClick: () => void }) {
  if (!move) return <span className="ml-cell empty" />
  const m = move.classification ? META[move.classification] : null
  return (
    <button className={`ml-cell${active ? ' active' : ''}`} onClick={onClick}>
      <span className="ml-dot" style={{ color: m ? m.color : 'var(--muted)' }}>
        {m ? m.glyph : '·'}
      </span>
      <span className="ml-san">{move.san}</span>
    </button>
  )
}

export function MoveList({ moves, current, onSelect }: Props) {
  const scroller = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const c = scroller.current
    const el = activeRef.current
    if (!c || !el) return
    // Scroll only WITHIN the move-list container — never the page. Using
    // scrollIntoView here would scroll the window too, which on mobile (stacked
    // layout) yanks the viewport away from the board on every move.
    const cr = c.getBoundingClientRect()
    const er = el.getBoundingClientRect()
    if (er.top < cr.top) c.scrollTop += er.top - cr.top
    else if (er.bottom > cr.bottom) c.scrollTop += er.bottom - cr.bottom
  }, [current])

  const rows: ReactElement[] = []
  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i]
    const black = moves[i + 1]
    const num = i / 2 + 1
    const isActiveRow = current === i || current === i + 1
    rows.push(
      <div className="ml-row" key={num} ref={isActiveRow ? activeRef : undefined}>
        <span className="ml-num">{num}.</span>
        <Cell move={white} active={current === i} onClick={() => onSelect(i)} />
        <Cell move={black} active={current === i + 1} onClick={() => onSelect(i + 1)} />
      </div>,
    )
  }

  return (
    <div className="movelist" ref={scroller}>
      {rows}
    </div>
  )
}
