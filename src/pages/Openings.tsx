import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { PageShell } from '../components/Nav'
import { Board } from '../components/Board'
import { IconCheck, IconNext } from '../components/Icons'
import {
  learnedCount,
  lineKey,
  loadOpeningProgress,
  markLineLearned,
  OPENINGS,
  type Opening,
  type OpeningProgress,
} from '../lib/openings'

type SideFilter = 'all' | 'w' | 'b'
type Phase = 'learner' | 'replying' | 'wrong' | 'done'

const REPLY_DELAY = 450 // ms — let the learner see their move land

export function Openings() {
  const [progress, setProgress] = useState<OpeningProgress>(() => loadOpeningProgress())
  const [sideFilter, setSideFilter] = useState<SideFilter>('all')
  const [opening, setOpening] = useState<Opening | null>(null)
  const [lineIndex, setLineIndex] = useState(0)

  // Board / trainer state
  const [fen, setFen] = useState('')
  const [ply, setPly] = useState(0)
  const [phase, setPhase] = useState<Phase>('learner')
  const [selected, setSelected] = useState<string | null>(null)
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)
  const [wrongTries, setWrongTries] = useState(0)
  const timerRef = useRef<number | null>(null)

  const line = opening?.lines[lineIndex] ?? null

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }
  useEffect(() => clearTimer, [])

  /** Rebuild the board at a given ply of the current line. */
  const positionAt = useCallback((moves: string[], upto: number) => {
    const c = new Chess()
    let last: { from: string; to: string } | null = null
    for (let i = 0; i < upto; i++) {
      const mv = c.move(moves[i])
      if (!mv) break
      last = { from: mv.from, to: mv.to }
    }
    return { fen: c.fen(), last }
  }, [])

  const startLine = useCallback(
    (op: Opening, idx: number) => {
      clearTimer()
      const moves = op.lines[idx].moves
      // If the learner is Black, White's first move is played for them.
      const startPly = op.side === 'w' ? 0 : 1
      const { fen: f, last } = positionAt(moves, startPly)
      setOpening(op)
      setLineIndex(idx)
      setFen(f)
      setPly(startPly)
      setLastMove(last)
      setPhase('learner')
      setSelected(null)
      setWrongTries(0)
    },
    [positionAt],
  )

  const game = useMemo(() => {
    try {
      return fen ? new Chess(fen) : null
    } catch {
      return null
    }
  }, [fen])

  const targets = useMemo(() => {
    if (!game || !selected) return []
    try {
      return game.moves({ square: selected as never, verbose: true }).map((m: any) => m.to)
    } catch {
      return []
    }
  }, [game, selected])

  /** Play the opponent's scripted move, then hand back to the learner. */
  const playReply = useCallback(
    (moves: string[], atPly: number) => {
      if (atPly >= moves.length) {
        setPhase('done')
        return
      }
      const { fen: f, last } = positionAt(moves, atPly + 1)
      setFen(f)
      setLastMove(last)
      const next = atPly + 1
      setPly(next)
      setPhase(next >= moves.length ? 'done' : 'learner')
    },
    [positionAt],
  )

  const tryMove = useCallback(
    (from: string, to: string) => {
      if (!opening || !line || phase !== 'learner' && phase !== 'wrong') return
      const expected = line.moves[ply]
      if (!expected) return

      const probe = new Chess(fen)
      let mv
      try {
        mv = probe.move({ from, to, promotion: 'q' })
      } catch {
        return
      }
      if (!mv) return

      if (mv.san !== expected) {
        setWrongTries((n) => n + 1)
        setPhase('wrong')
        return
      }

      // Correct — show it, then play the book reply.
      setFen(probe.fen())
      setLastMove({ from: mv.from, to: mv.to })
      setWrongTries(0)
      const afterLearner = ply + 1
      setPly(afterLearner)

      if (afterLearner >= line.moves.length) {
        setPhase('done')
        return
      }
      setPhase('replying')
      clearTimer()
      timerRef.current = window.setTimeout(() => playReply(line.moves, afterLearner), REPLY_DELAY)
    },
    [opening, line, phase, ply, fen, playReply],
  )

  // Mark learned once a line is completed.
  useEffect(() => {
    if (phase === 'done' && opening) {
      setProgress(markLineLearned(opening.id, lineIndex))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const onSquareClick = useCallback(
    (sq: string) => {
      if (!game || (phase !== 'learner' && phase !== 'wrong')) return
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
    [game, selected, targets, phase, tryMove],
  )

  const filtered = useMemo(
    () => OPENINGS.filter((o) => sideFilter === 'all' || o.side === sideFilter),
    [sideFilter],
  )

  // ---------------- list view ----------------
  if (!opening) {
    return (
      <PageShell
        title="Opening Trainer"
        subtitle="Learn an opening line by line. You play your side, the board answers back with theory."
      >
        <div className="chip-row op-filters">
          {(
            [
              ['all', 'All'],
              ['w', 'As White'],
              ['b', 'As Black'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              className={`chip${sideFilter === k ? ' on' : ''}`}
              onClick={() => setSideFilter(k)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="op-list">
          {filtered.map((o) => {
            const learned = learnedCount(o, progress)
            return (
              <div className="card op-card" key={o.id}>
                <div className="op-card-head">
                  <div>
                    <div className="op-name">{o.name}</div>
                    <div className="op-eco">
                      {o.eco} · <span className={`op-side op-side-${o.side}`}>
                        {o.side === 'w' ? 'White' : 'Black'}
                      </span>
                    </div>
                  </div>
                  <div className={`op-progress${learned === o.lines.length ? ' complete' : ''}`}>
                    {learned}/{o.lines.length}
                  </div>
                </div>
                <p className="op-summary">{o.summary}</p>
                <div className="op-tags">
                  {o.tags.map((t) => (
                    <span className="op-tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <button className="primary op-start" onClick={() => startLine(o, 0)}>
                  {learned ? 'Keep practising' : 'Start learning'}
                </button>
              </div>
            )
          })}
        </div>
      </PageShell>
    )
  }

  // ---------------- trainer view ----------------
  const movesDone = Math.max(0, ply - (opening.side === 'w' ? 0 : 1))
  const totalLearnerMoves = Math.ceil(
    (line!.moves.length - (opening.side === 'w' ? 0 : 1)) / 2,
  )
  const learnerMovesDone = Math.ceil(movesDone / 2)
  const isLast = lineIndex >= opening.lines.length - 1

  return (
    <PageShell title={opening.name} subtitle={line!.name}>
      <div className="op-trainer">
        <div className="op-board">
          <Board
            fen={fen}
            flipped={opening.side === 'b'}
            lastMove={lastMove}
            onSquareClick={onSquareClick}
            selected={selected}
            targets={targets}
          />
        </div>

        <div className="op-side-col">
          <div className={`card op-prompt phase-${phase}`}>
            {phase === 'learner' && (
              <>
                <div className="op-prompt-head">Your move</div>
                <div className="op-prompt-body">
                  Play the book move for {opening.side === 'w' ? 'White' : 'Black'} —{' '}
                  {learnerMovesDone} of {totalLearnerMoves} done.
                </div>
              </>
            )}
            {phase === 'replying' && (
              <>
                <div className="op-prompt-head">Good — book move</div>
                <div className="op-prompt-body">Waiting for the reply…</div>
              </>
            )}
            {phase === 'wrong' && (
              <>
                <div className="op-prompt-head op-bad">Not the book move</div>
                <div className="op-prompt-body">
                  {wrongTries >= 2 ? (
                    <>
                      The line goes <b>{line!.moves[ply]}</b>. Play it to continue.
                    </>
                  ) : (
                    <>Try again — think about the plan behind this opening.</>
                  )}
                </div>
              </>
            )}
            {phase === 'done' && (
              <>
                <div className="op-prompt-head op-good">Line complete ✔</div>
                <div className="op-prompt-body">{line!.idea}</div>
              </>
            )}
          </div>

          <div className="card">
            <div className="op-moves-head">Line</div>
            <div className="op-moves">
              {line!.moves.map((san, i) => (
                <span
                  key={i}
                  className={`op-move${i < ply ? ' played' : ''}${i === ply && phase !== 'done' ? ' current' : ''}`}
                >
                  {i % 2 === 0 && <span className="mt-num">{i / 2 + 1}.</span>}
                  {i < ply || phase === 'done' ? san : '···'}
                </span>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="btn-row">
              <button className="ghost" onClick={() => startLine(opening, lineIndex)}>
                Restart line
              </button>
              {!isLast && (
                <button className="primary" onClick={() => startLine(opening, lineIndex + 1)}>
                  Next line <IconNext size={16} />
                </button>
              )}
              <button className="ghost" onClick={() => setOpening(null)}>
                All openings
              </button>
            </div>
            <div className="op-line-picker">
              {opening.lines.map((l, i) => (
                <button
                  key={i}
                  className={`op-line-btn${i === lineIndex ? ' on' : ''}${progress[lineKey(opening.id, i)] ? ' learned' : ''}`}
                  onClick={() => startLine(opening, i)}
                >
                  {progress[lineKey(opening.id, i)] && <IconCheck size={15} />}
                  {l.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
