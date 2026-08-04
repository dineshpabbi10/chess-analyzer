'use client'

import { useCallback, useRef, useState } from 'react'
import { PageShell } from '../components/Nav'
import { ClassIcon } from '../components/ClassIcon'
import { META, SUMMARY_ORDER } from '../lib/classificationMeta'
import { analyzeStreaming, parseGame } from '../lib/analysis'
import { getSharedEngine } from '../lib/engineSingleton'
import { buildCoachReport, type CoachGame, type CoachReport } from '../lib/coach'
import type { GameSummary } from '../components/GamePicker'

type Platform = 'chesscom' | 'lichess'
type Stage = 'setup' | 'running' | 'report'

// Each position is capped at this many ms, so total time is predictable.
const MOVETIME = 180
const DEPTH = 14

const COUNTS = [5, 10, 20]

export function Coach() {
  const [platform, setPlatform] = useState<Platform>('chesscom')
  const [username, setUsername] = useState('')
  const [gameCount, setGameCount] = useState(5)
  const [stage, setStage] = useState<Stage>('setup')
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<CoachReport | null>(null)
  const [progress, setProgress] = useState({ game: 0, games: 0, pos: 0, positions: 0, phase: '' })
  const cancelRef = useRef(false)

  const run = useCallback(async () => {
    const user = username.trim()
    if (!user) return
    setError(null)
    setReport(null)
    setStage('running')
    cancelRef.current = false
    setProgress({ game: 0, games: gameCount, pos: 0, positions: 0, phase: 'Fetching your games…' })

    try {
      const res = await fetch(
        `/api/games?platform=${platform}&username=${encodeURIComponent(user)}&max=${gameCount}`,
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load your games.')
      const games: GameSummary[] = data.games ?? []
      if (!games.length) throw new Error(`No recent games found for "${user}".`)

      setProgress((p) => ({ ...p, games: games.length, phase: 'Loading engine…' }))
      const engine = await getSharedEngine()

      const analyzed: CoachGame[] = []
      for (let i = 0; i < games.length; i++) {
        if (cancelRef.current) break
        const g = games[i]
        let parsed
        try {
          parsed = parseGame(g.pgn)
        } catch {
          continue // skip anything unparseable (odd variants, empty games)
        }
        setProgress({
          game: i + 1,
          games: games.length,
          pos: 0,
          positions: parsed.positions.length,
          phase: `Analyzing game ${i + 1} of ${games.length}`,
        })
        await analyzeStreaming(parsed, engine, {
          depth: DEPTH,
          movetime: MOVETIME,
          onProgress: (done, total) =>
            setProgress((p) => ({ ...p, pos: done, positions: total })),
          isCancelled: () => cancelRef.current,
        })
        if (cancelRef.current) break

        const userIsWhite = (g.white || '').toLowerCase() === user.toLowerCase()
        // If the name doesn't match either side, fall back to White so the game
        // still contributes rather than being silently dropped.
        const opponent = userIsWhite ? g.black : g.white
        analyzed.push({
          report: parsed.report,
          userIsWhite,
          label: `vs ${opponent || '?'} · ${g.timeClass}`,
        })
      }

      if (!analyzed.length) throw new Error('None of those games could be analyzed.')
      setReport(buildCoachReport(analyzed))
      setStage('report')
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.')
      setStage('setup')
    }
  }, [platform, username, gameCount])

  const cancel = useCallback(() => {
    cancelRef.current = true
    setStage('setup')
  }, [])

  // ---------------- setup ----------------
  if (stage === 'setup') {
    const estMin = ((gameCount * 75 * MOVETIME) / 1000 / 60).toFixed(1)
    return (
      <PageShell
        title="Coach"
        subtitle="Analyze a batch of your recent games at once and see the patterns — which phase leaks points, when you blunder, and which openings hurt you."
      >
        <div className="card coach-setup">
          <div className="field">
            <span>Platform</span>
            <div className="chip-row">
              {(
                [
                  ['chesscom', 'Chess.com'],
                  ['lichess', 'Lichess'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  className={`chip${platform === k ? ' on' : ''}`}
                  onClick={() => setPlatform(k)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>Your username</span>
            <input
              className="coach-input"
              type="text"
              value={username}
              placeholder={platform === 'chesscom' ? 'Chess.com username' : 'Lichess username'}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>

          <div className="field">
            <span>How many recent games</span>
            <div className="chip-row">
              {COUNTS.map((n) => (
                <button
                  key={n}
                  className={`chip${gameCount === n ? ' on' : ''}`}
                  onClick={() => setGameCount(n)}
                >
                  {n} games
                </button>
              ))}
            </div>
          </div>

          <p className="muted-note">
            Roughly <b>{estMin} min</b> — analysis runs in your browser, so more games means more
            waiting. Each position gets {MOVETIME}ms, which is quicker (and rougher) than a full
            Game Review.
          </p>

          {error && <div className="error">{error}</div>}

          <div className="btn-row">
            <button className="primary" onClick={run} disabled={!username.trim()}>
              Analyze my games
            </button>
          </div>
        </div>
      </PageShell>
    )
  }

  // ---------------- running ----------------
  if (stage === 'running') {
    const pct = progress.positions ? (progress.pos / progress.positions) * 100 : 0
    const overall = progress.games
      ? ((progress.game - 1 + (progress.positions ? progress.pos / progress.positions : 0)) /
          progress.games) *
        100
      : 0
    return (
      <PageShell title="Coach" subtitle="Working through your games…">
        <div className="card">
          <div className="coach-phase">{progress.phase}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${overall}%` }} />
          </div>
          <div className="progress-count">
            Game {Math.max(1, progress.game)} of {progress.games} · position {progress.pos}/
            {progress.positions} ({pct.toFixed(0)}%)
          </div>
          <div className="btn-row">
            <button className="ghost" onClick={cancel}>
              Cancel
            </button>
          </div>
        </div>
      </PageShell>
    )
  }

  // ---------------- report ----------------
  const r = report!
  const phaseRows = [
    { key: 'opening', label: 'Opening (moves 1–10)' },
    { key: 'middlegame', label: 'Middlegame (11–30)' },
    { key: 'endgame', label: 'Endgame (31+)' },
  ] as const
  const worstPhaseAcc = Math.min(...phaseRows.map((p) => r.phases[p.key].accuracy || 100))
  const maxBlunder = Math.max(1, ...r.buckets.map((b) => b.blunderRate))

  return (
    <PageShell title="Coach report" subtitle={`${r.games} games · ${r.moves} of your moves analyzed`}>
      <div className="coach-top">
        <div className="pz-stat">
          <div className="pz-stat-num">{r.accuracy.toFixed(1)}%</div>
          <div className="pz-stat-lbl">Your accuracy</div>
        </div>
        <div className="pz-stat">
          <div className="pz-stat-num">{(r.acpl / 100).toFixed(2)}</div>
          <div className="pz-stat-lbl">Pawns lost / move</div>
        </div>
        <div className="pz-stat">
          <div className="pz-stat-num">
            {r.record.wins}–{r.record.losses}–{r.record.draws}
          </div>
          <div className="pz-stat-lbl">W–L–D</div>
        </div>
        <div className="pz-stat">
          <div className="pz-stat-num">{r.counts.blunder + r.counts.mistake}</div>
          <div className="pz-stat-lbl">Serious errors</div>
        </div>
      </div>

      <div className="card coach-brief">
        <div className="coach-brief-head">What the numbers say</div>
        <ul className="coach-insights">
          {r.insights.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
        <p className="muted-note">
          These notes are computed directly from the stats below — nothing here is invented.
        </p>
      </div>

      <div className="coach-grid">
        <div className="card">
          <div className="coach-sec">Accuracy by phase</div>
          {phaseRows.map((p) => {
            const s = r.phases[p.key]
            return (
              <div className="coach-row" key={p.key}>
                <div className="coach-row-label">{p.label}</div>
                <div className="coach-bar">
                  <div
                    className={`coach-bar-fill${s.accuracy === worstPhaseAcc && s.moves >= 10 ? ' weak' : ''}`}
                    style={{ width: `${Math.max(2, s.accuracy)}%` }}
                  />
                </div>
                <div className="coach-row-val">
                  {s.moves ? `${s.accuracy.toFixed(1)}%` : '—'}
                  <span className="coach-row-sub">{s.moves} moves</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <div className="coach-sec">Blunder rate over time</div>
          {r.buckets.map((b) => (
            <div className="coach-row" key={b.label}>
              <div className="coach-row-label">{b.label}</div>
              <div className="coach-bar">
                <div
                  className="coach-bar-fill danger"
                  style={{ width: `${(b.blunderRate / maxBlunder) * 100}%` }}
                />
              </div>
              <div className="coach-row-val">
                {b.moves ? `${b.blunderRate.toFixed(1)}%` : '—'}
                <span className="coach-row-sub">{b.moves} moves</span>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="coach-sec">Move quality</div>
          <table className="sum-table sum-counts">
            <tbody>
              {SUMMARY_ORDER.filter((c) => r.counts[c] > 0).map((c) => (
                <tr key={c}>
                  <td className="cnt-label" style={{ color: META[c].color }}>
                    {META[c].label}
                  </td>
                  <td className="cnt-icon">
                    <ClassIcon type={c} size={22} />
                  </td>
                  <td className="cnt-num" style={{ color: META[c].color }}>
                    {r.counts[c]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="coach-sec">Openings</div>
          <table className="coach-openings">
            <tbody>
              {r.openings.slice(0, 6).map((o) => (
                <tr key={o.name}>
                  <td className="co-name" title={o.name}>
                    {o.name}
                  </td>
                  <td className="co-games">{o.games}g</td>
                  <td className="co-score">
                    {o.points}/{o.games}
                  </td>
                  <td className="co-acc">{o.accuracy ? `${o.accuracy.toFixed(0)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {r.worst.length > 0 && (
        <div className="card coach-worst">
          <div className="coach-sec">Your costliest moments</div>
          <ul className="coach-worst-list">
            {r.worst.map((w, i) => (
              <li key={i}>
                <ClassIcon type={w.classification} size={20} />
                <span className="cw-move">
                  {w.moveNumber}
                  {w.color === 'w' ? '.' : '…'} {w.san}
                </span>
                {w.bestSan && (
                  <span className="cw-best">
                    instead of <b>{w.bestSan}</b>
                  </span>
                )}
                <span className="cw-loss">−{(w.cpLoss / 100).toFixed(2)}</span>
                <span className="cw-game">{w.gameLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="btn-row coach-actions">
        <button className="primary" onClick={() => setStage('setup')}>
          Analyze another batch
        </button>
      </div>
    </PageShell>
  )
}
