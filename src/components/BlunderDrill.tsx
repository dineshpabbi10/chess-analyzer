import { useCallback, useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { Board } from './Board'
import { IconCheck, IconCross, IconNext, IconPrev } from './Icons'
import { getSharedEngine } from '../lib/engineSingleton'
import { scoreToCp } from '../lib/classify'
import { META } from '../lib/classificationMeta'
import type { AnalyzedMove, Classification } from '../lib/types'

/** Which mistakes are worth drilling. */
const DRILLABLE: Classification[] = ['blunder', 'mistake', 'miss']

// A guess within this much of the engine's best counts as solved — there is
// usually more than one good move, so demanding the exact engine choice would be
// needlessly harsh.
const GOOD_ENOUGH_CP = 50
const CLOSE_CP = 150

type Side = 'both' | 'w' | 'b'

interface Verdict {
  san: string
  lossCp: number
  tier: 'solved' | 'close' | 'wrong'
}

export function BlunderDrill({
  moves,
  whiteName,
  blackName,
  onClose,
}: {
  moves: AnalyzedMove[]
  whiteName: string
  blackName: string
  onClose: () => void
}) {
  const [side, setSide] = useState<Side>('both')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [checking, setChecking] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set())
  const [attemptedIds, setAttemptedIds] = useState<Set<number>>(new Set())

  const drills = useMemo(
    () =>
      moves.filter(
        (m) =>
          m.classification &&
          DRILLABLE.includes(m.classification) &&
          (side === 'both' || m.color === side) &&
          m.evalBefore, // needs an analyzed "before" position
      ),
    [moves, side],
  )

  // Reset progress when the filter changes the set.
  useEffect(() => {
    setIndex(0)
    setSelected(null)
    setVerdict(null)
    setRevealed(false)
  }, [side])

  const drill = drills[index]

  const game = useMemo(() => {
    if (!drill) return null
    try {
      return new Chess(drill.fenBefore)
    } catch {
      return null
    }
  }, [drill])

  const targets = useMemo(() => {
    if (!game || !selected) return []
    try {
      return game.moves({ square: selected as never, verbose: true }).map((m: any) => m.to)
    } catch {
      return []
    }
  }, [game, selected])

  const check = useCallback(
    async (from: string, to: string) => {
      if (!drill || !game) return
      let mv
      const c = new Chess(drill.fenBefore)
      try {
        mv = c.move({ from, to, promotion: 'q' })
      } catch {
        return
      }
      if (!mv) return

      setChecking(true)
      setAttemptedIds((prev) => new Set(prev).add(drill.ply))
      try {
        // Best available (mover's POV) comes from the review we already ran.
        const whitePov = scoreToCp(drill.evalBefore!.cp, drill.evalBefore!.mate)
        const bestForMover = drill.color === 'w' ? whitePov : -whitePov

        // What did their move lead to? Engine scores are side-to-move POV, and
        // after their move it's the opponent's turn — so negate.
        const engine = await getSharedEngine()
        const raw = await engine.analyze(c.fen(), { depth: 14, movetime: 900 })
        const theirsForMover = -scoreToCp(raw.scoreCp, raw.mate)

        const lossCp = Math.max(0, bestForMover - theirsForMover)
        const tier: Verdict['tier'] =
          lossCp <= GOOD_ENOUGH_CP ? 'solved' : lossCp <= CLOSE_CP ? 'close' : 'wrong'
        setVerdict({ san: mv.san, lossCp, tier })
        if (tier === 'solved') setSolvedIds((prev) => new Set(prev).add(drill.ply))
        setRevealed(true)
      } catch {
        setVerdict({ san: mv.san, lossCp: 0, tier: 'close' })
        setRevealed(true)
      } finally {
        setChecking(false)
      }
    },
    [drill, game],
  )

  const onSquareClick = useCallback(
    (sq: string) => {
      if (!game || checking || revealed) return
      const piece = game.get(sq as never)
      if (selected) {
        if (sq === selected) {
          setSelected(null)
          return
        }
        if (targets.includes(sq)) {
          setSelected(null)
          check(selected, sq)
          return
        }
        setSelected(piece && piece.color === game.turn() ? sq : null)
        return
      }
      if (piece && piece.color === game.turn()) setSelected(sq)
    },
    [game, selected, targets, checking, revealed, check],
  )

  const next = useCallback(() => {
    setSelected(null)
    setVerdict(null)
    setRevealed(false)
    setIndex((i) => Math.min(drills.length - 1, i + 1))
  }, [drills.length])

  const prev = useCallback(() => {
    setSelected(null)
    setVerdict(null)
    setRevealed(false)
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const bestArrow =
    revealed && drill?.evalBefore?.bestMove && drill.evalBefore.bestMove.length >= 4
      ? {
          from: drill.evalBefore.bestMove.slice(0, 2),
          to: drill.evalBefore.bestMove.slice(2, 4),
        }
      : null

  return (
    <div className="drill-overlay" role="dialog" aria-label="Mistake drill">
      <div className="drill">
        <header className="drill-head">
          <div>
            <div className="drill-title">Drill your mistakes</div>
            <div className="drill-sub">
              {drills.length
                ? `${index + 1} of ${drills.length} · solved ${solvedIds.size}/${attemptedIds.size || 0}`
                : 'Nothing to drill'}
            </div>
          </div>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="chip-row drill-sides">
          {(
            [
              ['both', 'Both sides'],
              ['w', whiteName],
              ['b', blackName],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={`chip${side === key ? ' on' : ''}`}
              onClick={() => setSide(key as Side)}
            >
              {label}
            </button>
          ))}
        </div>

        {!drill ? (
          <p className="drill-empty">
            No mistakes, misses or blunders for this selection — clean game!
          </p>
        ) : (
          <div className="drill-body">
            <div className="drill-board">
              <Board
                fen={drill.fenBefore}
                flipped={drill.color === 'b'}
                onSquareClick={onSquareClick}
                selected={selected}
                targets={targets}
                bestArrow={bestArrow}
              />
            </div>

            <div className="drill-side">
              <div className="drill-prompt">
                <span
                  className="drill-badge"
                  style={{ background: META[drill.classification!].color }}
                >
                  {META[drill.classification!].glyph}
                </span>
                <div>
                  <div className="drill-played">
                    {drill.moveNumber}
                    {drill.color === 'w' ? '.' : '…'} {drill.san} was a{' '}
                    {META[drill.classification!].label.toLowerCase()}
                  </div>
                  <div className="drill-ask">
                    {drill.color === 'w' ? 'White' : 'Black'} to move — find something better.
                  </div>
                </div>
              </div>

              {checking && <div className="drill-checking">Checking your move…</div>}

              {verdict && (
                <div className={`drill-verdict tier-${verdict.tier}`}>
                  <div className="drill-verdict-head">
                    {verdict.tier === 'solved' ? (
                      <>
                        <IconCheck size={17} /> {verdict.san} works!
                      </>
                    ) : verdict.tier === 'close' ? (
                      <>{verdict.san} is better, but not best</>
                    ) : (
                      <>
                        <IconCross size={17} /> {verdict.san} still gives too much away
                      </>
                    )}
                  </div>
                  <div className="drill-verdict-body">
                    {verdict.tier !== 'solved' && (
                      <>Costs {(verdict.lossCp / 100).toFixed(2)} vs the best move. </>
                    )}
                    {drill.bestMoveSan && (
                      <>
                        Engine prefers <b>{drill.bestMoveSan}</b>.
                      </>
                    )}
                  </div>
                </div>
              )}

              {!revealed && !checking && (
                <button
                  className="ghost drill-reveal"
                  onClick={() => {
                    setAttemptedIds((prev) => new Set(prev).add(drill.ply))
                    setRevealed(true)
                  }}
                >
                  Show me the answer
                </button>
              )}

              <div className="btn-row drill-nav">
                <button className="ghost" onClick={prev} disabled={index === 0}>
                  <IconPrev size={16} /> Previous
                </button>
                <button
                  className="primary"
                  onClick={next}
                  disabled={index >= drills.length - 1}
                >
                  Next <IconNext size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
