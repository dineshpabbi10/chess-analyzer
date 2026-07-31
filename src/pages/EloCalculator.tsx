import { useMemo, useState } from 'react'
import { PageShell } from '../components/Nav'

// Standard Elo: expected score against one opponent, then delta = K * (score - expected).
function expectedScore(you: number, opp: number): number {
  return 1 / (1 + Math.pow(10, (opp - you) / 400))
}

const K_PRESETS = [
  { label: '10 (masters)', value: 10 },
  { label: '20 (standard)', value: 20 },
  { label: '32 (chess.com-ish)', value: 32 },
  { label: '40 (new / juniors)', value: 40 },
]

const OUTCOMES = [
  { key: 'win', label: 'Win', score: 1 },
  { key: 'draw', label: 'Draw', score: 0.5 },
  { key: 'loss', label: 'Loss', score: 0 },
] as const

function fmtDelta(d: number): string {
  const r = Math.round(d * 10) / 10
  return `${r > 0 ? '+' : r < 0 ? '' : '±'}${r.toFixed(1)}`
}

export function EloCalculator() {
  const [you, setYou] = useState(1200)
  const [opp, setOpp] = useState(1300)
  const [k, setK] = useState(20)

  const expected = useMemo(() => expectedScore(you, opp), [you, opp])

  return (
    <PageShell
      title="Elo Calculator"
      subtitle="See how a win, draw, or loss would move your rating — before you play."
    >
      <div className="tool-grid">
        <div className="card">
          <label className="field">
            <span>Your rating</span>
            <input
              type="number"
              value={you}
              min={100}
              max={3500}
              onChange={(e) => setYou(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Opponent rating</span>
            <input
              type="number"
              value={opp}
              min={100}
              max={3500}
              onChange={(e) => setOpp(Number(e.target.value))}
            />
          </label>
          <div className="field">
            <span>K-factor</span>
            <div className="chip-row">
              {K_PRESETS.map((p) => (
                <button
                  key={p.value}
                  className={`chip${k === p.value ? ' on' : ''}`}
                  onClick={() => setK(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <p className="muted-note">
            Rating difference <b>{opp - you > 0 ? '+' : ''}{opp - you}</b> → you're expected to
            score <b>{(expected * 100).toFixed(1)}%</b>.
          </p>
        </div>

        <div className="card">
          <div className="outcome-list">
            {OUTCOMES.map((o) => {
              const delta = k * (o.score - expected)
              const after = Math.round(you + delta)
              return (
                <div className={`outcome outcome-${o.key}`} key={o.key}>
                  <div className="outcome-label">{o.label}</div>
                  <div className="outcome-delta">{fmtDelta(delta)}</div>
                  <div className="outcome-after">→ {after}</div>
                </div>
              )
            })}
          </div>
          <p className="muted-note">
            Estimates use the standard Elo formula. Real sites vary the K-factor by rating,
            time control, and games played, so your actual change may differ slightly.
          </p>
        </div>
      </div>
    </PageShell>
  )
}
