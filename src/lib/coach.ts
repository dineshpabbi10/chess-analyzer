// Aggregates several analyzed games into a coaching report for ONE player.
//
// Everything here is deterministic arithmetic over the per-move analysis we
// already produce — the written "brief" is rule-based, not generated prose, so
// every sentence is backed by a number you can see on the dashboard.

import type { AnalyzedMove, Classification, GameReport } from './types'

export interface CoachGame {
  report: GameReport
  /** Which side the coached player had in this game. */
  userIsWhite: boolean
  label: string // e.g. "vs magnus · blitz"
}

export interface PhaseStat {
  moves: number
  accuracy: number
  blunders: number
  acpl: number
}

export interface WorstMoment {
  gameLabel: string
  moveNumber: number
  color: 'w' | 'b'
  san: string
  bestSan: string | null
  cpLoss: number
  classification: Classification
  fenBefore: string
}

export interface OpeningStat {
  name: string
  games: number
  points: number // 1 win, 0.5 draw
  accuracy: number
}

export interface CoachReport {
  games: number
  moves: number
  accuracy: number
  acpl: number
  record: { wins: number; losses: number; draws: number }
  counts: Record<Classification, number>
  phases: { opening: PhaseStat; middlegame: PhaseStat; endgame: PhaseStat }
  buckets: { label: string; moves: number; blunderRate: number }[]
  openings: OpeningStat[]
  worst: WorstMoment[]
  insights: string[]
}

// Phase boundaries by ply (0-based). Simple and predictable; documented in the UI.
const MIDDLEGAME_PLY = 20 // ~move 11
const ENDGAME_PLY = 60 // ~move 31

const EMPTY_COUNTS = (): Record<Classification, number> => ({
  brilliant: 0,
  great: 0,
  best: 0,
  excellent: 0,
  good: 0,
  book: 0,
  inaccuracy: 0,
  mistake: 0,
  miss: 0,
  blunder: 0,
})

const emptyPhase = (): PhaseStat => ({ moves: 0, accuracy: 0, blunders: 0, acpl: 0 })

/** Result of a game from the coached player's point of view. */
function outcome(headers: Record<string, string>, userIsWhite: boolean): 'w' | 'l' | 'd' | null {
  const r = headers.Result
  if (r === '1/2-1/2') return 'd'
  if (r === '1-0') return userIsWhite ? 'w' : 'l'
  if (r === '0-1') return userIsWhite ? 'l' : 'w'
  return null
}

function mean(total: number, n: number) {
  return n ? total / n : 0
}

export function buildCoachReport(games: CoachGame[]): CoachReport {
  const counts = EMPTY_COUNTS()
  const phases = {
    opening: emptyPhase(),
    middlegame: emptyPhase(),
    endgame: emptyPhase(),
  }
  // Accumulators (sums; averaged at the end)
  const phaseSums = {
    opening: { acc: 0, cp: 0 },
    middlegame: { acc: 0, cp: 0 },
    endgame: { acc: 0, cp: 0 },
  }
  const bucketDefs = [
    { label: 'Moves 1–10', min: 0, max: 19 },
    { label: 'Moves 11–20', min: 20, max: 39 },
    { label: 'Moves 21–30', min: 40, max: 59 },
    { label: 'Moves 31+', min: 60, max: Infinity },
  ]
  const buckets = bucketDefs.map((b) => ({ label: b.label, moves: 0, blunders: 0 }))

  const record = { wins: 0, losses: 0, draws: 0 }
  const openingMap = new Map<string, { games: number; points: number; accSum: number; accN: number }>()
  const worst: WorstMoment[] = []

  let totalAcc = 0
  let totalMoves = 0
  let totalCp = 0

  for (const g of games) {
    const side: 'w' | 'b' = g.userIsWhite ? 'w' : 'b'
    const mine: AnalyzedMove[] = g.report.moves.filter(
      (m) => m.color === side && m.classification,
    )

    const oc = outcome(g.report.headers, g.userIsWhite)
    if (oc === 'w') record.wins++
    else if (oc === 'l') record.losses++
    else if (oc === 'd') record.draws++

    // Opening bucket for this game (only counts once per game).
    const openingName = g.report.opening || 'Unknown'
    const gameAcc = mean(
      mine.reduce((s, m) => s + m.accuracy, 0),
      mine.length,
    )
    const op = openingMap.get(openingName) ?? { games: 0, points: 0, accSum: 0, accN: 0 }
    op.games++
    op.points += oc === 'w' ? 1 : oc === 'd' ? 0.5 : 0
    if (mine.length) {
      op.accSum += gameAcc
      op.accN++
    }
    openingMap.set(openingName, op)

    for (const m of mine) {
      counts[m.classification as Classification]++
      totalAcc += m.accuracy
      totalCp += m.cpLoss
      totalMoves++

      const phaseKey =
        m.ply < MIDDLEGAME_PLY ? 'opening' : m.ply < ENDGAME_PLY ? 'middlegame' : 'endgame'
      phases[phaseKey].moves++
      phaseSums[phaseKey].acc += m.accuracy
      phaseSums[phaseKey].cp += m.cpLoss
      if (m.classification === 'blunder') phases[phaseKey].blunders++

      const bi = bucketDefs.findIndex((b) => m.ply >= b.min && m.ply <= b.max)
      if (bi >= 0) {
        buckets[bi].moves++
        if (m.classification === 'blunder') buckets[bi].blunders++
      }

      if (
        m.classification === 'blunder' ||
        m.classification === 'mistake' ||
        m.classification === 'miss'
      ) {
        worst.push({
          gameLabel: g.label,
          moveNumber: m.moveNumber,
          color: m.color,
          san: m.san,
          bestSan: m.bestMoveSan,
          cpLoss: m.cpLoss,
          classification: m.classification,
          fenBefore: m.fenBefore,
        })
      }
    }
  }

  for (const k of ['opening', 'middlegame', 'endgame'] as const) {
    phases[k].accuracy = mean(phaseSums[k].acc, phases[k].moves)
    phases[k].acpl = mean(phaseSums[k].cp, phases[k].moves)
  }

  const openings: OpeningStat[] = [...openingMap.entries()]
    .map(([name, v]) => ({
      name,
      games: v.games,
      points: v.points,
      accuracy: mean(v.accSum, v.accN),
    }))
    .sort((a, b) => b.games - a.games || a.accuracy - b.accuracy)

  worst.sort((a, b) => b.cpLoss - a.cpLoss)

  const report: CoachReport = {
    games: games.length,
    moves: totalMoves,
    accuracy: mean(totalAcc, totalMoves),
    acpl: mean(totalCp, totalMoves),
    record,
    counts,
    phases,
    buckets: buckets.map((b) => ({
      label: b.label,
      moves: b.moves,
      blunderRate: b.moves ? (b.blunders / b.moves) * 100 : 0,
    })),
    openings,
    worst: worst.slice(0, 8),
    insights: [],
  }
  report.insights = deriveInsights(report)
  return report
}

/**
 * Rule-based coaching notes. Each one is a plain statement about a number that
 * is also visible on the dashboard — no invented narrative.
 */
export function deriveInsights(r: CoachReport): string[] {
  const out: string[] = []
  if (!r.moves) return ['No analyzed moves yet.']

  // 1. Weakest phase (only compare phases with enough data).
  const named = (['opening', 'middlegame', 'endgame'] as const)
    .map((k) => ({ k, ...r.phases[k] }))
    .filter((p) => p.moves >= 10)
  if (named.length >= 2) {
    const weakest = named.reduce((a, b) => (b.accuracy < a.accuracy ? b : a))
    const strongest = named.reduce((a, b) => (b.accuracy > a.accuracy ? b : a))
    if (strongest.accuracy - weakest.accuracy >= 4) {
      out.push(
        `Your ${weakest.k} is the weak spot: ${weakest.accuracy.toFixed(1)}% accuracy versus ` +
          `${strongest.accuracy.toFixed(1)}% in your ${strongest.k}. That is where the points are going.`,
      )
    }
  }

  // 2. Do blunders cluster late?
  const withData = r.buckets.filter((b) => b.moves >= 10)
  if (withData.length >= 2) {
    const worstB = withData.reduce((a, b) => (b.blunderRate > a.blunderRate ? b : a))
    const bestB = withData.reduce((a, b) => (b.blunderRate < a.blunderRate ? b : a))
    if (worstB.blunderRate >= 2 && worstB.blunderRate >= bestB.blunderRate * 2) {
      out.push(
        `Blunders cluster in "${worstB.label}" (${worstB.blunderRate.toFixed(1)}% of those moves) — ` +
          `far more than your best stretch (${bestB.blunderRate.toFixed(1)}%). Slow down there.`,
      )
    }
  }

  // 3. Missed wins.
  if (r.counts.miss >= 2) {
    out.push(
      `You had ${r.counts.miss} missed winning chance${r.counts.miss === 1 ? '' : 's'}. ` +
        `Converting even half of those changes results.`,
    )
  }

  // 4. Serious-error rate per game.
  const serious = r.counts.blunder + r.counts.mistake
  if (r.games > 0 && serious > 0) {
    const per = serious / r.games
    out.push(
      `${serious} serious error${serious === 1 ? '' : 's'} across ${r.games} game${r.games === 1 ? '' : 's'} ` +
        `— about ${per.toFixed(1)} per game (${r.counts.blunder} blunder${r.counts.blunder === 1 ? '' : 's'}).`,
    )
  }

  // 5. Weakest repeated opening.
  const repeated = r.openings.filter((o) => o.games >= 2)
  if (repeated.length) {
    const weak = repeated.reduce((a, b) => (b.accuracy < a.accuracy ? b : a))
    const scorePct = (weak.points / weak.games) * 100
    if (weak.accuracy < r.accuracy - 2 || scorePct < 40) {
      out.push(
        `"${weak.name}" is your worst repeated opening: ${weak.accuracy.toFixed(1)}% accuracy and ` +
          `${weak.points}/${weak.games} scored. Worth drilling in the Opening Trainer.`,
      )
    }
  }

  // 6. Overall framing.
  out.push(
    `Overall: ${r.accuracy.toFixed(1)}% accuracy, average ${(r.acpl / 100).toFixed(2)} pawns lost per move.`,
  )
  return out
}
