import { ClassBadge } from './ClassBadge'
import { META, SUMMARY_ORDER } from '../lib/classificationMeta'
import type { GameReport } from '../lib/types'

export function ReviewSummary({ report }: { report: GameReport }) {
  const { white, black, headers } = report
  const whiteName = headers.White || 'White'
  const blackName = headers.Black || 'Black'

  return (
    <div className="summary">
      <div className="summary-head">
        <div className="summary-title">Game Review</div>
        <div className="summary-opening">{report.opening}</div>
      </div>

      <div className="acc-row">
        <div className="acc-col">
          <div className="acc-num">{white.accuracy.toFixed(1)}</div>
          <div className="acc-lbl">{whiteName}</div>
        </div>
        <div className="acc-mid">Accuracy</div>
        <div className="acc-col">
          <div className="acc-num">{black.accuracy.toFixed(1)}</div>
          <div className="acc-lbl">{blackName}</div>
        </div>
      </div>

      <table className="counts">
        <tbody>
          {SUMMARY_ORDER.map((c) => {
            const w = white.counts[c]
            const b = black.counts[c]
            if (w === 0 && b === 0) return null
            return (
              <tr key={c}>
                <td className="c-w">{w}</td>
                <td className="c-mid">
                  <ClassBadge type={c} size={16} />
                  <span style={{ color: META[c].color }}>{META[c].label}</span>
                </td>
                <td className="c-b">{b}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="elo-row">
        <div>
          <div className="elo-num">{white.estimatedElo}</div>
          <div className="elo-lbl">Est. performance</div>
        </div>
        <div>
          <div className="elo-num">{black.estimatedElo}</div>
          <div className="elo-lbl">Est. performance</div>
        </div>
      </div>
    </div>
  )
}
