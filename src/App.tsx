'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Engine } from './lib/engine'
import { getSharedEngine, onEngineLoading } from './lib/engineSingleton'
import { analyzeStreaming, computeReports, parseGame } from './lib/analysis'
import type { GameReport } from './lib/types'
import { Board } from './components/Board'
import { GamePicker } from './components/GamePicker'
import { BlunderDrill } from './components/BlunderDrill'
import { EvalBar } from './components/EvalBar'
import { MoveList } from './components/MoveList'
import { ReviewSummary } from './components/ReviewSummary'
import { MoveDetails } from './components/MoveDetails'
import { IconFirst, IconFlip, IconLast, IconNext, IconPrev } from './components/Icons'

type View = 'input' | 'loading' | 'review'

const DEPTHS = [
  { label: 'Fast', value: 12 },
  { label: 'Balanced', value: 15 },
  { label: 'Deep', value: 18 },
]

const EXAMPLES = [
  { label: 'Lichess classic', url: 'https://lichess.org/q7ZvsdUF' },
  { label: 'Chess.com game', url: 'https://www.chess.com/game/live/2280058564' },
]

function looksLikePgn(s: string): boolean {
  return /\[Event\s|\n\s*1\.\s*[a-hNBRQKO]/.test(s)
}

export function App() {
  const [view, setView] = useState<View>('input')
  const [input, setInput] = useState('')
  const [depth, setDepth] = useState(15)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 0, phase: '' })
  const [report, setReport] = useState<GameReport | null>(null)
  const [current, setCurrent] = useState(-1)
  const [flipped, setFlipped] = useState(false)
  // Streaming state: whether analysis is still running + how far along.
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState({ done: 0, total: 0 })
  const [engineLoading, setEngineLoading] = useState(false)
  const [drilling, setDrilling] = useState(false)

  const cancelRef = useRef(false)

  // The engine is shared with the tool pages and created lazily on the first
  // Analyze (never eagerly on mount — booting a WASM worker during page load can
  // fail). A failed load isn't cached, so the next Analyze retries fresh.
  const getEngine = getSharedEngine
  useEffect(() => onEngineLoading(setEngineLoading), [])

  // Analyze a PGN we already have (used by the link/paste flow and by the
  // "recent games" picker).
  const analyzePgn = useCallback(
    async (pgn: string) => {
      setError(null)
      cancelRef.current = false
      try {
        // Build the skeleton and show the board immediately — before the engine
        // has even loaded. Classifications stream in move-by-move afterwards.
        const parsed = parseGame(pgn)
        setReport({ ...parsed.report })
        setCurrent(-1)
        setFlipped(false)
        setAnalyzing(true)
        setAnalyzed({ done: 0, total: parsed.positions.length })
        setView('review')

        const engine = await getEngine()
        await analyzeStreaming(parsed, engine, {
          depth,
          onProgress: (done, total) => setAnalyzed({ done, total }),
          onMove: () =>
            setReport((prev) =>
              prev ? { ...prev, moves: prev.moves.slice(), ...computeReports(prev.moves) } : prev,
            ),
          isCancelled: () => cancelRef.current,
        })
      } catch (e: any) {
        setError(e?.message || 'Something went wrong.')
        setView('input')
      } finally {
        setAnalyzing(false)
      }
    },
    [depth, getEngine],
  )

  const runAnalysis = useCallback(
    async (rawInput: string) => {
      setError(null)
      setView('loading')
      setProgress({ done: 0, total: 0, phase: 'Fetching game…' })
      try {
        let pgn: string
        if (looksLikePgn(rawInput)) {
          pgn = rawInput
        } else {
          const res = await fetch('/api/pgn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: rawInput.trim() }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Could not fetch that game.')
          pgn = data.pgn
        }
        await analyzePgn(pgn)
      } catch (e: any) {
        setError(e?.message || 'Something went wrong.')
        setView('input')
      }
    },
    [analyzePgn],
  )

  const backToInput = useCallback(() => {
    cancelRef.current = true
    setAnalyzing(false)
    setView('input')
  }, [])

  // Navigation
  const moves = report?.moves ?? []
  const go = useCallback(
    (idx: number) => setCurrent(Math.max(-1, Math.min(moves.length - 1, idx))),
    [moves.length],
  )

  useEffect(() => {
    if (view !== 'review') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(current - 1)
      else if (e.key === 'ArrowRight') go(current + 1)
      else if (e.key === 'Home') go(-1)
      else if (e.key === 'End') go(moves.length - 1)
      else if (e.key === 'f') setFlipped((f) => !f)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, current, go, moves.length])

  const curMove = current >= 0 ? moves[current] : null
  const startFen = moves[0]?.fenBefore
  const fen = curMove ? curMove.fenAfter : startFen ?? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  const evalObj = curMove ? curMove.evalAfter : moves[0]?.evalBefore
  const lastMove = curMove ? { from: curMove.uci.slice(0, 2), to: curMove.uci.slice(2, 4) } : null
  const bestArrow = useMemo(() => {
    if (!curMove || curMove.isBest || !curMove.evalBefore?.bestMove) return null
    const uci = curMove.evalBefore.bestMove
    return { from: uci.slice(0, 2), to: uci.slice(2, 4) }
  }, [curMove])

  const mistakeCount = useMemo(
    () =>
      moves.filter(
        (m) => m.classification === 'blunder' || m.classification === 'mistake' || m.classification === 'miss',
      ).length,
    [moves],
  )

  if (view === 'input' || view === 'loading') {
    return (
      <div className="landing">
        <div className="landing-card">
          <h1>Game Review</h1>
          <p className="subtitle">
            Paste a chess.com or lichess game link and get a full review — move classifications,
            accuracy, and the key mistakes, powered by Stockfish 18.
          </p>

          <div className="input-wrap">
            <input
              type="text"
              placeholder="https://www.chess.com/game/live/…  or  https://lichess.org/…  (or paste PGN)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && input.trim() && view === 'input' && runAnalysis(input)}
              disabled={view === 'loading'}
            />
            <button
              className="primary"
              disabled={!input.trim() || view === 'loading'}
              onClick={() => runAnalysis(input)}
            >
              {view === 'loading' ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>

          <div className="depth-row">
            <span>Engine depth:</span>
            {DEPTHS.map((d) => (
              <button
                key={d.value}
                className={`chip${depth === d.value ? ' on' : ''}`}
                onClick={() => setDepth(d.value)}
                disabled={view === 'loading'}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="examples">
            Try:{' '}
            {EXAMPLES.map((ex) => (
              <button key={ex.url} className="link" onClick={() => setInput(ex.url)} disabled={view === 'loading'}>
                {ex.label}
              </button>
            ))}
          </div>

          {error && <div className="error">{error}</div>}

          {view === 'input' && (
            <GamePicker
              onPick={(pgn) => {
                setView('loading')
                setProgress({ done: 0, total: 0, phase: 'Reading game…' })
                analyzePgn(pgn)
              }}
            />
          )}

          {view === 'loading' && (
            <div className="progress">
              <div className="progress-phase">{progress.phase}</div>
              {progress.total > 1 && (
                <>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(progress.done / progress.total) * 100}%` }}
                    />
                  </div>
                  <div className="progress-count">
                    {progress.done} / {progress.total} positions
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <footer className="foot">Runs entirely on your machine · Stockfish via WebAssembly</footer>
      </div>
    )
  }

  // review
  const rep = report!
  return (
    <div className="review">
      <header className="topbar">
        <div className="players">
          <span>{rep.headers.White || 'White'}</span>
          <span className="vs">vs</span>
          <span>{rep.headers.Black || 'Black'}</span>
        </div>
        <div className="topbar-actions">
          {mistakeCount > 0 && (
            <button className="ghost drill-open" onClick={() => setDrilling(true)}>
              Drill mistakes ({mistakeCount})
            </button>
          )}
          <button className="ghost" onClick={backToInput}>
            New game
          </button>
        </div>
      </header>

      {drilling && (
        <BlunderDrill
          moves={moves}
          whiteName={rep.headers.White || 'White'}
          blackName={rep.headers.Black || 'Black'}
          onClose={() => setDrilling(false)}
        />
      )}

      <div className="review-grid">
        <div className="board-col">
          {/* On mobile the move explanation sits above the board; on desktop it
              lives in the right column (see .mobile-details / .desktop-details). */}
          <div className="mobile-details">
            <MoveDetails move={curMove} />
          </div>
          <div className="board-stack">
            <EvalBar cp={evalObj?.cp ?? 0} mate={evalObj?.mate ?? null} flipped={flipped} />
            <Board
              fen={fen}
              lastMove={lastMove}
              classification={curMove?.classification ?? null}
              bestArrow={bestArrow}
              flipped={flipped}
            />
          </div>
          <div className="controls">
            <button onClick={() => go(-1)} title="Start (Home)" aria-label="Start">
              <IconFirst />
            </button>
            <button onClick={() => go(current - 1)} title="Previous (←)" aria-label="Previous move">
              <IconPrev />
            </button>
            <button onClick={() => go(current + 1)} title="Next (→)" aria-label="Next move">
              <IconNext />
            </button>
            <button onClick={() => go(moves.length - 1)} title="End (End)" aria-label="End">
              <IconLast />
            </button>
            <button onClick={() => setFlipped((f) => !f)} title="Flip board (f)" aria-label="Flip board">
              <IconFlip />
            </button>
          </div>
        </div>

        <div className="side-col">
          <ReviewSummary
            report={rep}
            progress={
              analyzing
                ? { done: analyzed.done, total: analyzed.total, loadingEngine: engineLoading }
                : null
            }
          />
          <div className="desktop-details">
            <MoveDetails move={curMove} />
          </div>
          <MoveList moves={moves} current={current} onSelect={go} />
        </div>
      </div>
    </div>
  )
}
