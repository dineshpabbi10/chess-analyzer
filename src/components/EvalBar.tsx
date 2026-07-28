import { winPercent } from '../lib/classify'

interface Props {
  cp: number | null
  mate: number | null
  flipped?: boolean
}

// Vertical evaluation bar (White = light fill). Mirrors chess.com's bar.
export function EvalBar({ cp, mate, flipped = false }: Props) {
  const whiteScore = mate != null ? (mate > 0 ? 10000 : -10000) : cp ?? 0
  const whiteWin = winPercent(whiteScore) // 0..100
  const label =
    mate != null
      ? `M${Math.abs(mate)}`
      : Math.abs((cp ?? 0) / 100) >= 0.05
        ? Math.abs((cp ?? 0) / 100).toFixed(1)
        : '0.0'

  // Fill grows from the White side. White is bottom unless flipped.
  const whiteAtBottom = !flipped
  const whitePct = whiteWin
  const whiteAdv = whiteScore >= 0

  return (
    <div className="evalbar" title={`${whiteAdv ? '+' : '-'}${label} (White ${whiteWin.toFixed(0)}%)`}>
      <div
        className="evalbar-white"
        style={{
          height: `${whitePct}%`,
          [whiteAtBottom ? 'bottom' : 'top']: 0,
        }}
      />
      <span className={`evalbar-label ${whiteAdv ? 'on-white' : 'on-black'}`}
        style={{ [whiteAdv === whiteAtBottom ? 'bottom' : 'top']: 2 } as React.CSSProperties}>
        {label}
      </span>
    </div>
  )
}
