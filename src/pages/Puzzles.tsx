import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { PageShell } from '../components/Nav'
import { Board } from '../components/Board'
import {
  applyResult,
  difficultyForRating,
  fetchDailyPuzzle,
  fetchPuzzle,
  loadProgress,
  recordDaily,
  saveProgress,
  todayKey,
  type Puzzle,
  type PuzzleProgress,
} from '../lib/puzzles'

type Mode = 'rated' | 'daily'
type Status = 'solving' | 'wrong' | 'solved' | 'revealed'

const THEMES = [
  { key: '', label: 'Any' },
  { key: 'mateIn1', label: 'Mate in 1' },
  { key: 'mateIn2', label: 'Mate in 2' },
  { key: 'fork', label: 'Forks' },
  { key: 'pin', label: 'Pins' },
  { key: 'endgame', label: 'Endgames' },
]

export function Puzzles() {
  const [mode, setMode] = useState<Mode>('rated')
  const [theme, setTheme] = useState('')
  const [progress, setProgress] = useState<PuzzleProgress>(() => loadProgress())
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Live board state while solving.
  const [fen, setFen] = useState('')
  const [step, setStep] = useState(0) // how many solution moves have been played
  const [status, setStatus] = useState<Status>('solving')
  const [selected, setSelected] = useState<string | null>(null)
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [ratingDelta, setRatingDelta] = useState<number | null>(null)

  const scoredRef = useRef(false) // don't score the same puzzle twice

  const persist = useCallback((p: PuzzleProgress) => {
    setProgress(p)
    saveProgress(p)
    return p
  }, [])

  const startPuzzle = useCallback((p: Puzzle) => {
    setPuzzle(p)
    setFen(p.fen)
    setStep(0)
    setStatus('solving')
    setSelected(null)
    setLastMove(null)
    setRatingDelta(null)
    scoredRef.current = false
  }, [])

  const load = useCallback(
    async (which: Mode, themeKey: string, rating: number) => {
      setLoading(true)
      setError(null)
      try {
        const p =
          which === 'daily'
            ? await fetchDailyPuzzle()
            : await fetchPuzzle({
                difficulty: difficultyForRating(rating),
                theme: themeKey || undefined,
              })
        startPuzzle(p)
      } catch (e: any) {
        setError(e?.message || 'Could not load a puzzle.')
        setPuzzle(null)
      } finally {
        setLoading(false)
      }
    },
    [startPuzzle],
  )

  // First load / mode & theme changes.
  useEffect(() => {
    load(mode, theme, progress.rating)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, theme])

  const game = useMemo(() => {
    try {
      return fen ? new Chess(fen) : null
    } catch {
      return null
    }
  }, [fen])

  /** The side the solver plays is whoever is to move in the puzzle's start FEN. */
  const solverColor = useMemo(() => (puzzle ? puzzle.fen.split(' ')[1] : 'w'), [puzzle])

  const targets = useMemo(() => {
    if (!game || !selected) return []
    try {
      return game.moves({ square: selected as never, verbose: true }).map((m: any) => m.to)
    } catch {
      return []
    }
  }, [game, selected])

  const finish = useCallback(
    (solved: boolean) => {
      if (!puzzle || scoredRef.current) return
      scoredRef.current = true
      let next = applyResult(progress, puzzle, solved)
      const delta = next.rating - progress.rating
      if (solved && mode === 'daily') next = recordDaily(next)
      persist(next)
      setRatingDelta(delta)
    },
    [puzzle, progress, mode, persist],
  )

  const tryMove = useCallback(
    (from: string, to: string) => {
      if (!puzzle || !game || status !== 'solving') return
      const expected = puzzle.solution[step]
      if (!expected) return

      // Validate legality (and get SAN) before judging.
      const probe = new Chess(fen)
      let mv
      try {
        mv = probe.move({ from, to, promotion: 'q' })
      } catch {
        return
      }
      if (!mv) return

      const playedUci = mv.lan
      // Accept the expected move; also accept a different move that still
      // delivers immediate mate (a legitimate alternative solution).
      const isExpected = playedUci === expected
      const isMate = probe.isCheckmate()
      if (!isExpected && !isMate) {
        setStatus('wrong')
        setLastMove({ from, to })
        setFen(probe.fen()) // show their move so the mistake is visible
        finish(false)
        return
      }

      // Correct. Play it, then the opponent's scripted reply (if any).
      let nextStep = step + 1
      let nextFen = probe.fen()
      setLastMove({ from, to })

      if (isMate || nextStep >= puzzle.solution.length) {
        setFen(nextFen)
        setStep(nextStep)
        setStatus('solved')
        finish(true)
        return
      }

      const reply = puzzle.solution[nextStep]
      const c2 = new Chess(nextFen)
      try {
        const r = c2.move({
          from: reply.slice(0, 2),
          to: reply.slice(2, 4),
          promotion: reply.length > 4 ? reply[4] : undefined,
        })
        if (r) {
          nextFen = c2.fen()
          nextStep += 1
          setLastMove({ from: reply.slice(0, 2), to: reply.slice(2, 4) })
        }
      } catch {
        /* solution list ended early — treat as solved below */
      }

      setFen(nextFen)
      setStep(nextStep)
      if (nextStep >= puzzle.solution.length) {
        setStatus('solved')
        finish(true)
      }
    },
    [puzzle, game, status, step, fen, finish],
  )

  const onSquareClick = useCallback(
    (sq: string) => {
      if (!game || status !== 'solving') return
      const piece = game.get(sq as never)
      if (selected) {
        if (sq === selected) {
          setSelected(null)
          return
        }
        if (targets.includes(sq)) {
          setSelected(null)
          tryMove(selected, sq)
          return
        }
        setSelected(piece && piece.color === game.turn() ? sq : null)
        return
      }
      if (piece && piece.color === game.turn()) setSelected(sq)
    },
    [game, selected, targets, status, tryMove],
  )

  /** Play out the whole solution so the user can see it. */
  const reveal = useCallback(() => {
    if (!puzzle) return
    finish(false)
    const c = new Chess(puzzle.fen)
    let last: { from: string; to: string } | null = null
    for (const uci of puzzle.solution) {
      try {
        const mv = c.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: uci.length > 4 ? uci[4] : undefined,
        })
        if (!mv) break
        last = { from: uci.slice(0, 2), to: uci.slice(2, 4) }
      } catch {
        break
      }
    }
    setFen(c.fen())
    setLastMove(last)
    setStep(puzzle.solution.length)
    setStatus('revealed')
  }, [puzzle, finish])

  const retry = useCallback(() => {
    if (puzzle) {
      setFen(puzzle.fen)
      setStep(0)
      setStatus('solving')
      setSelected(null)
      setLastMove(null)
    }
  }, [puzzle])

  const solutionSan = useMemo(() => {
    if (!puzzle || (status !== 'revealed' && status !== 'solved' && status !== 'wrong')) return ''
    const c = new Chess(puzzle.fen)
    const out: string[] = []
    for (const uci of puzzle.solution) {
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
    return out.join(' ')
  }, [puzzle, status])

  const dailyDoneToday = progress.lastDaily === todayKey()
  const movesLeft = puzzle ? Math.ceil((puzzle.solution.length - step) / 2) : 0

  return (
    <PageShell
      title="Puzzles"
      subtitle="Rated tactics from the Lichess puzzle database — unlimited, no account needed. Your rating is kept on this device."
    >
      <div className="pz-stats">
        <div className="pz-stat">
          <div className="pz-stat-num">{progress.rating}</div>
          <div className="pz-stat-lbl">Your rating</div>
        </div>
        <div className="pz-stat">
          <div className="pz-stat-num">{progress.solved}</div>
          <div className="pz-stat-lbl">Solved</div>
        </div>
        <div className="pz-stat">
          <div className="pz-stat-num">{progress.failed}</div>
          <div className="pz-stat-lbl">Missed</div>
        </div>
        <div className="pz-stat">
          <div className="pz-stat-num">
            {progress.streak}
            {progress.bestStreak > progress.streak && (
              <span className="pz-best"> / {progress.bestStreak}</span>
            )}
          </div>
          <div className="pz-stat-lbl">Daily streak</div>
        </div>
      </div>

      <div className="pz-controls">
        <div className="chip-row">
          <button className={`chip${mode === 'rated' ? ' on' : ''}`} onClick={() => setMode('rated')}>
            Rated practice
          </button>
          <button className={`chip${mode === 'daily' ? ' on' : ''}`} onClick={() => setMode('daily')}>
            Daily puzzle{dailyDoneToday ? ' ✔' : ''}
          </button>
        </div>
        {mode === 'rated' && (
          <div className="chip-row pz-themes">
            {THEMES.map((t) => (
              <button
                key={t.key}
                className={`chip${theme === t.key ? ' on' : ''}`}
                onClick={() => setTheme(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="error">
          {error}{' '}
          <button className="link" onClick={() => load(mode, theme, progress.rating)}>
            Retry
          </button>
        </div>
      )}

      {loading && <div className="pz-loading">Loading a puzzle…</div>}

      {puzzle && !loading && (
        <div className="pz-grid">
          <div className="pz-board">
            <Board
              fen={fen}
              flipped={solverColor === 'b'}
              lastMove={lastMove}
              onSquareClick={status === 'solving' ? onSquareClick : undefined}
              selected={selected}
              targets={targets}
            />
          </div>

          <div className="pz-side">
            <div className={`card pz-prompt status-${status}`}>
              {status === 'solving' && (
                <>
                  <div className="pz-turn">
                    {solverColor === 'w' ? 'White' : 'Black'} to play
                  </div>
                  <div className="pz-hint">
                    Find the best move
                    {movesLeft > 1 ? ` — ${movesLeft} moves to find` : ''}.
                  </div>
                </>
              )}
              {status === 'solved' && (
                <>
                  <div className="pz-turn pz-good">Solved! 🎉</div>
                  <div className="pz-hint">
                    {ratingDelta != null && (
                      <>
                        Rating {ratingDelta >= 0 ? '+' : ''}
                        {ratingDelta} → <b>{progress.rating}</b>.{' '}
                      </>
                    )}
                    {solutionSan && <>Line: {solutionSan}</>}
                  </div>
                </>
              )}
              {status === 'wrong' && (
                <>
                  <div className="pz-turn pz-bad">Not quite</div>
                  <div className="pz-hint">
                    {ratingDelta != null && (
                      <>
                        Rating {ratingDelta >= 0 ? '+' : ''}
                        {ratingDelta} → <b>{progress.rating}</b>.{' '}
                      </>
                    )}
                    Try again, or reveal the answer.
                  </div>
                </>
              )}
              {status === 'revealed' && (
                <>
                  <div className="pz-turn">Solution</div>
                  <div className="pz-hint">{solutionSan}</div>
                </>
              )}
            </div>

            <div className="card">
              <div className="pz-meta">
                <span>
                  Puzzle rating <b>{puzzle.rating}</b>
                </span>
                {puzzle.themes.length > 0 && (
                  <span className="pz-themes-list">{puzzle.themes.slice(0, 4).join(', ')}</span>
                )}
              </div>
              <div className="btn-row">
                {status === 'wrong' && (
                  <button className="ghost" onClick={retry}>
                    Try again
                  </button>
                )}
                {(status === 'solving' || status === 'wrong') && (
                  <button className="ghost" onClick={reveal}>
                    Show solution
                  </button>
                )}
                {mode === 'rated' ? (
                  <button
                    className="primary"
                    onClick={() => load('rated', theme, progress.rating)}
                    disabled={loading}
                  >
                    Next puzzle
                  </button>
                ) : (
                  <button className="ghost" onClick={() => setMode('rated')}>
                    Practice more
                  </button>
                )}
              </div>
              {puzzle.gameUrl && (
                <p className="muted-note">
                  From a real game on{' '}
                  <a className="link" href={puzzle.gameUrl} target="_blank" rel="noreferrer">
                    Lichess
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
