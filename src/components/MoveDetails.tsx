import { META } from '../lib/classificationMeta'
import type { AnalyzedMove } from '../lib/types'

function evalText(cp: number | null, mate: number | null): string {
  if (mate != null) return `#${Math.abs(mate)}${mate > 0 ? ' (White)' : ' (Black)'}`
  const v = (cp ?? 0) / 100
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
}

const REMARK: Record<string, string> = {
  brilliant: 'A brilliant move — a sacrifice that pays off.',
  great: 'A great move — the only way to keep the advantage.',
  best: 'The best move in the position.',
  excellent: 'An excellent move, essentially as good as the best.',
  good: 'A good, solid move.',
  book: 'A common opening move (book theory).',
  inaccuracy: 'An inaccuracy — a slightly better move was available.',
  mistake: 'A mistake that gives away some of the advantage.',
  miss: 'A missed opportunity — a much stronger move was available.',
  blunder: 'A blunder that seriously worsens the position.',
}

export function MoveDetails({ move }: { move: AnalyzedMove | null }) {
  if (!move) {
    return (
      <div className="details">
        <div className="details-empty">Starting position — step through the game to review each move.</div>
      </div>
    )
  }
  const m = META[move.classification]
  const mover = move.color === 'w' ? 'White' : 'Black'
  const showBest = !move.isBest && move.bestMoveSan
  return (
    <div className="details">
      <div className="details-head" style={{ borderColor: m.color }}>
        <span className="details-badge" style={{ background: m.color }}>
          {m.glyph}
        </span>
        <div>
          <div className="details-move">
            {move.moveNumber}
            {move.color === 'w' ? '.' : '...'} {move.san}
          </div>
          <div className="details-label" style={{ color: m.color }}>
            {m.label} · {mover}
          </div>
        </div>
        <div className="details-eval">{evalText(move.evalAfter.cp, move.evalAfter.mate)}</div>
      </div>

      <div className="details-body">
        <p>{REMARK[move.classification]}</p>
        {showBest && (
          <p className="details-best">
            Best was <b>{move.bestMoveSan}</b>
          </p>
        )}
        <div className="details-stats">
          <span>Accuracy {move.accuracy.toFixed(0)}%</span>
          {move.cpLoss > 0 && <span>Lost {(move.cpLoss / 100).toFixed(2)}</span>}
        </div>
      </div>
    </div>
  )
}
