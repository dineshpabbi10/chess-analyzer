import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Engine } from './lib/engine'
import { analyzeGame } from './lib/analysis'
import type { GameReport } from './lib/types'
import { Board } from './components/Board'
import { EvalBar } from './components/EvalBar'
import { MoveList } from './components/MoveList'
import { ReviewSummary } from './components/ReviewSummary'
import { MoveDetails } from './components/MoveDetails'

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

  const engineRef = useRef<Engine | null>(null)

  const getEngine = useCallback(async () => {
    if (!engineRef.current) {
      setProgress((p) => ({ ...p, phase: 'Loading Stockfish engine…' }))
      const e = new Engine()
      await e.init()
      engineRef.current = e
    }
    return engineRef.current
  }, [])

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

        const engine = await getEngine()
        setProgress({ done: 0, total: 1, phase: 'Analyzing…' })
        const rep = await analyzeGame(pgn, engine, {
          depth,
          onProgress: (done, total) => setProgress({ done, total, phase: 'Analyzing…' }),
        })
        setReport(rep)
        setCurrent(-1)
        setFlipped(false)
        setView('review')
      } catch (e: any) {
        setError(e?.message || 'Something went wrong.')
        setView('input')
      }
    },
    [depth, getEngine],
  )

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
    if (!curMove || curMove.isBest || !curMove.evalBefore.bestMove) return null
    const uci = curMove.evalBefore.bestMove
    return { from: uci.slice(0, 2), to: uci.slice(2, 4) }
  }, [curMove])

  if (view === 'input' || view === 'loading') {
    return (
      <div className="landing">
        <div className="landing-card">
          <h1>♟ Chess Analyzer</h1>
          <p className="subtitle">
            Paste a chess.com or lichess game link and get a full Game Review — move classifications,
            accuracy, and the key mistakes, powered by Stockfish 16.
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
        <footer className="foot">Runs entirely on your machine · Stockfish 16 NNUE via WebAssembly</footer>
      </div>
    )
  }

  // review
  const rep = report!
  return (
    <div className="review">
      <header className="topbar">
        <div className="brand" onClick={() => setView('input')}>
          ♟ Chess Analyzer
        </div>
        <div className="players">
          <span>{rep.headers.White || 'White'}</span>
          <span className="vs">vs</span>
          <span>{rep.headers.Black || 'Black'}</span>
        </div>
        <button className="ghost" onClick={() => setView('input')}>
          New game
        </button>
      </header>

      <div className="review-grid">
        <div className="board-col">
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
            <button onClick={() => go(-1)} title="Start (Home)">⏮</button>
            <button onClick={() => go(current - 1)} title="Previous (←)">◀</button>
            <button onClick={() => go(current + 1)} title="Next (→)">▶</button>
            <button onClick={() => go(moves.length - 1)} title="End (End)">⏭</button>
            <button onClick={() => setFlipped((f) => !f)} title="Flip board (f)">⇅</button>
          </div>
        </div>

        <div className="side-col">
          <ReviewSummary report={rep} />
          <MoveDetails move={curMove} />
          <MoveList moves={moves} current={current} onSelect={go} />
        </div>
      </div>
    </div>
  )
}
