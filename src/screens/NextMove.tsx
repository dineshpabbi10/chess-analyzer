'use client'

import { useCallback, useEffect, useState } from 'react'
import { Chess } from 'chess.js'
import { PageShell } from '../components/Nav'
import { Board } from '../components/Board'
import { getSharedEngine } from '../lib/engineSingleton'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

const DEPTHS = [
  { label: 'Fast', value: 12 },
  { label: 'Balanced', value: 16 },
  { label: 'Deep', value: 20 },
]

interface Result {
  bestUci: string
  bestSan: string
  evalText: string
  pvSan: string[]
  depth: number
  mover: 'White' | 'Black'
}

// Convert a UCI principal variation into readable SAN, played from `fen`.
function pvToSan(fen: string, pv: string[]): string[] {
  const c = new Chess(fen)
  const out: string[] = []
  for (const uci of pv) {
    try {
      const mv = c.move({
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        promotion: uci.length > 4 ? uci[4] : undefined,
      })
      if (!mv) break
      out.push(mv.san)
    } catch {
      break
    }
  }
  return out
}

function evalToText(cp: number | null, mate: number | null, whiteToMove: boolean): string {
  // Engine scores are side-to-move POV; show everything from White's POV.
  if (mate != null) {
    const whiteMates = whiteToMove ? mate > 0 : mate < 0
    return `Mate in ${Math.abs(mate)} for ${whiteMates ? 'White' : 'Black'}`
  }
  const white = whiteToMove ? (cp ?? 0) : -(cp ?? 0)
  const v = white / 100
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)} (White's POV)`
}

export function NextMove() {
  const [fen, setFen] = useState(START)
  const [depth, setDepth] = useState(16)
  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  // Read ?fen= on first load so positions are shareable.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('fen')
    if (q) setFen(q)
  }, [])

  const valid = (() => {
    try {
      new Chess(fen)
      return true
    } catch {
      return false
    }
  })()

  const run = useCallback(async () => {
    setError(null)
    setResult(null)
    let game: Chess
    try {
      game = new Chess(fen)
    } catch {
      setError('That FEN is not valid.')
      return
    }
    if (game.isGameOver()) {
      setError('This position is already over — no move to find.')
      return
    }
    setBusy(true)
    try {
      setPhase('Loading Stockfish…')
      const engine = await getSharedEngine()
      setPhase('Thinking…')
      const raw = await engine.analyze(fen, { depth })
      const whiteToMove = game.turn() === 'w'
      const bestUci = raw.bestMove || raw.pv[0] || ''
      const pvSan = pvToSan(fen, raw.pv.length ? raw.pv : bestUci ? [bestUci] : [])
      setResult({
        bestUci,
        bestSan: pvSan[0] || bestUci,
        evalText: evalToText(raw.scoreCp, raw.mate, whiteToMove),
        pvSan,
        depth: raw.depth,
        mover: whiteToMove ? 'White' : 'Black',
      })
    } catch (e: any) {
      setError(e?.message || 'The engine failed to analyze this position.')
    } finally {
      setBusy(false)
      setPhase('')
    }
  }, [fen, depth])

  const arrow =
    result && result.bestUci.length >= 4
      ? { from: result.bestUci.slice(0, 2), to: result.bestUci.slice(2, 4) }
      : null

  return (
    <PageShell
      title="Next Move Calculator"
      subtitle="Paste any FEN and get Stockfish's best move, the evaluation, and the line it expects."
    >
      <div className="tool-grid tool-grid-board">
        <div className="card card-board">
          <div className="board-stack">
            <Board fen={valid ? fen : START} bestArrow={arrow} lastMove={null} />
          </div>
        </div>

        <div className="card">
          <label className="field">
            <span>FEN</span>
            <textarea
              rows={3}
              value={fen}
              spellCheck={false}
              onChange={(e) => setFen(e.target.value.trim())}
            />
          </label>
          {!valid && <div className="error">That FEN is not valid.</div>}

          <div className="field">
            <span>Search depth</span>
            <div className="chip-row">
              {DEPTHS.map((d) => (
                <button
                  key={d.value}
                  className={`chip${depth === d.value ? ' on' : ''}`}
                  onClick={() => setDepth(d.value)}
                  disabled={busy}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="btn-row">
            <button className="primary" onClick={run} disabled={busy || !valid}>
              {busy ? phase || 'Working…' : 'Find best move'}
            </button>
            <button className="ghost" onClick={() => setFen(START)} disabled={busy}>
              Reset
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          {result && (
            <div className="result">
              <div className="result-row">
                <span className="result-label">Best move ({result.mover})</span>
                <span className="result-best">{result.bestSan}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Evaluation</span>
                <span className="result-val">{result.evalText}</span>
              </div>
              <div className="result-row">
                <span className="result-label">Depth</span>
                <span className="result-val">{result.depth}</span>
              </div>
              {result.pvSan.length > 1 && (
                <div className="result-pv">
                  <span className="result-label">Expected line</span>
                  <div className="pv-moves">{result.pvSan.join(' ')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  )
}
