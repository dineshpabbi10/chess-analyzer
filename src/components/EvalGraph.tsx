'use client'

import { useMemo } from 'react'
import { winPercent } from '../lib/classify'
import { META } from '../lib/classificationMeta'
import type { Classification, GameReport } from '../lib/types'

const W = 1000
const H = 200
// Routine good moves don't get a dot — only the "eventful" ones, like chess.com.
const DOTLESS: Partial<Record<Classification, boolean>> = { best: true, excellent: true }

function whiteWin(cp: number | null, mate: number | null): number {
  const s = mate != null ? (mate > 0 ? 10000 : -10000) : (cp ?? 0)
  return winPercent(s)
}

export function EvalGraph({ report }: { report: GameReport }) {
  const { moves } = report

  const { areaPath, dots } = useMemo(() => {
    const n = moves.length
    if (n < 2) return { areaPath: '', dots: [] as { x: number; y: number; c: Classification }[] }

    let last = 50
    const pts = moves.map((m, i) => {
      if (m.evalAfter) last = whiteWin(m.evalAfter.cp, m.evalAfter.mate)
      const x = (i / (n - 1)) * W
      const y = H * (1 - last / 100)
      return { x, y }
    })

    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`
    d += ` L ${W} ${H} L 0 ${H} Z`

    const dots = moves
      .map((m, i) => ({ m, p: pts[i] }))
      .filter(({ m }) => m.classification && !DOTLESS[m.classification])
      .map(({ m, p }) => ({ x: p.x, y: p.y, c: m.classification as Classification }))

    return { areaPath: d, dots }
  }, [moves])

  if (!areaPath) return null

  return (
    <div className="eval-graph">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="eval-graph-svg">
        <rect x="0" y="0" width={W} height={H} fill="#403e3b" />
        <path d={areaPath} fill="#f5f4f0" />
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#8f8b85" strokeWidth="1.2" opacity="0.5" />
      </svg>
      {/* Dots in a non-stretched overlay so they stay round. */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="eval-graph-dots">
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r="7" fill={META[d.c].color} stroke="#2b2b2b" strokeWidth="1" />
        ))}
      </svg>
    </div>
  )
}
