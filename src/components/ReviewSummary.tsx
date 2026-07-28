import { ClassIcon } from './ClassIcon'
import { EvalGraph } from './EvalGraph'
import { META, SUMMARY_ORDER } from '../lib/classificationMeta'
import type { GameReport } from '../lib/types'

interface Progress {
  done: number
  total: number
  loadingEngine: boolean
}

function Avatar() {
  return (
    <div className="sum-avatar" aria-hidden>
      ♟
    </div>
  )
}

export function ReviewSummary({ report, progress }: { report: GameReport; progress?: Progress | null }) {
  const { white, black, headers } = report
  const whiteName = headers.White || 'White'
  const blackName = headers.Black || 'Black'
  const pct = progress && progress.total ? (progress.done / progress.total) * 100 : 0

  return (
    <div className="summary">
      <EvalGraph report={report} />

      {progress && (
        <div className="summary-progress">
          <div className="summary-progress-row">
            <span>
              {progress.loadingEngine
                ? 'Loading Stockfish engine…'
                : `Analyzing… ${progress.done}/${progress.total}`}
            </span>
            {!progress.loadingEngine && <span>{Math.round(pct)}%</span>}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <table className="sum-table">
        <tbody>
          <tr className="sum-names">
            <td />
            <td>{whiteName}</td>
            <td />
            <td>{blackName}</td>
          </tr>
          <tr className="sum-players">
            <td className="sum-label">Players</td>
            <td><Avatar /></td>
            <td />
            <td><Avatar /></td>
          </tr>
          <tr className="sum-accuracy">
            <td className="sum-label">Accuracy</td>
            <td><span className="pill pill-white">{white.accuracy.toFixed(1)}</span></td>
            <td />
            <td><span className="pill pill-dark">{black.accuracy.toFixed(1)}</span></td>
          </tr>
        </tbody>
      </table>

      <div className="sum-divider" />

      <table className="sum-table sum-counts">
        <tbody>
          {SUMMARY_ORDER.map((c) => (
            <tr key={c}>
              <td className="cnt-label" style={{ color: META[c].color }}>
                {META[c].label}
              </td>
              <td className="cnt-num" style={{ color: META[c].color }}>
                {white.counts[c]}
              </td>
              <td className="cnt-icon">
                <ClassIcon type={c} size={24} />
              </td>
              <td className="cnt-num" style={{ color: META[c].color }}>
                {black.counts[c]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sum-divider" />

      <table className="sum-table">
        <tbody>
          <tr className="sum-rating">
            <td className="sum-label">Game Rating</td>
            <td><span className="pill pill-white">{white.estimatedElo}</span></td>
            <td />
            <td><span className="pill pill-dark">{black.estimatedElo}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
