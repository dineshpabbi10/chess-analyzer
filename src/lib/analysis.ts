import { Chess } from 'chess.js'
import { Engine, type RawEval } from './engine'
import {
  classify,
  estimateElo,
  materialWhite,
  moveAccuracy,
  scoreToCp,
  winPercent,
} from './classify'
import type { AnalyzedMove, Classification, EngineEval, GameReport, PlayerReport } from './types'

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

export const emptyPlayerReport = (): PlayerReport => ({
  accuracy: 0,
  counts: EMPTY_COUNTS(),
  estimatedElo: 0,
})

function uciToSan(fen: string, uci: string | null): string | null {
  if (!uci) return null
  try {
    const c = new Chess(fen)
    const mv = c.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    })
    return mv ? mv.san : null
  } catch {
    return null
  }
}

function rawToWhiteEval(raw: RawEval, whiteToMove: boolean): EngineEval {
  const cp = raw.scoreCp == null ? null : whiteToMove ? raw.scoreCp : -raw.scoreCp
  const mate = raw.mate == null ? null : whiteToMove ? raw.mate : -raw.mate
  return { cp, mate, bestMove: raw.bestMove, pv: raw.pv, depth: raw.depth }
}

function prettyOpening(headers: Record<string, string>): string {
  if (headers.Opening && headers.Opening !== '?') return headers.Opening
  if (headers.ECOUrl) {
    const slug = headers.ECOUrl.split('/').pop() || ''
    const name = decodeURIComponent(slug).replace(/-/g, ' ').trim()
    if (name) return name
  }
  return headers.ECO || 'Unknown Opening'
}

export interface ParsedGame {
  headers: Record<string, string>
  opening: string
  positions: string[] // [startFEN, fenAfterMove0, ...]
  report: GameReport // skeleton: moves present, classifications null until analyzed
}

// Parse a PGN into a review skeleton — no engine needed, so the board and move
// list can render instantly while analysis streams in afterwards.
export function parseGame(pgn: string): ParsedGame {
  const game = new Chess()
  game.loadPgn(pgn) // throws on invalid PGN
  const headers = game.header()
  const history = game.history({ verbose: true })
  if (history.length === 0) throw new Error('This PGN has no moves to analyze.')

  const positions: string[] = [history[0].before]
  for (const m of history) positions.push(m.after)

  const moves: AnalyzedMove[] = history.map((mv, i) => ({
    ply: i,
    moveNumber: Math.floor(i / 2) + 1,
    color: mv.color,
    san: mv.san,
    uci: mv.lan,
    fenBefore: positions[i],
    fenAfter: positions[i + 1],
    classification: null,
    cpLoss: 0,
    winBefore: 0,
    winAfter: 0,
    accuracy: 0,
    evalBefore: null,
    evalAfter: null,
    bestMoveSan: null,
    isBest: false,
  }))

  const report: GameReport = {
    headers,
    opening: prettyOpening(headers),
    moves,
    white: emptyPlayerReport(),
    black: emptyPlayerReport(),
  }
  return { headers, opening: report.opening, positions, report }
}

// Recompute per-player accuracy/counts from whatever moves are analyzed so far.
export function computeReports(moves: AnalyzedMove[]): { white: PlayerReport; black: PlayerReport } {
  const build = (color: 'w' | 'b'): PlayerReport => {
    const list = moves.filter((m) => m.color === color && m.classification)
    const counts = EMPTY_COUNTS()
    let accSum = 0
    for (const m of list) {
      counts[m.classification as Classification]++
      accSum += m.accuracy
    }
    const accuracy = list.length ? accSum / list.length : 0
    return { accuracy, counts, estimatedElo: list.length ? estimateElo(accuracy) : 0 }
  }
  return { white: build('w'), black: build('b') }
}

export interface StreamOptions {
  depth?: number
  onMove?: (index: number, move: AnalyzedMove) => void
  onProgress?: (done: number, total: number) => void
  isCancelled?: () => boolean
}

// Evaluate every position in order. A move becomes final once the position
// *after* it has been evaluated, so classifications stream out one-by-one.
export async function analyzeStreaming(
  parsed: ParsedGame,
  engine: Engine,
  opts: StreamOptions = {},
): Promise<void> {
  const depth = opts.depth ?? 14
  const { positions, report } = parsed
  const moves = report.moves
  const evals: RawEval[] = []
  let inBookPhase = true

  const finalize = (i: number) => {
    const mv = moves[i]
    const moverIsWhite = mv.color === 'w'
    const rawBefore = evals[i]
    const rawAfter = evals[i + 1]

    const bestEvalMover = scoreToCp(rawBefore.scoreCp, rawBefore.mate)
    const playedEvalMover = -scoreToCp(rawAfter.scoreCp, rawAfter.mate)
    const secondEvalMover = rawBefore.second
      ? scoreToCp(rawBefore.second.scoreCp, rawBefore.second.mate)
      : null

    const winBefore = winPercent(bestEvalMover)
    const winAfter = winPercent(playedEvalMover)
    const winLoss = Math.max(0, winBefore - winAfter)
    const isBest = !!rawBefore.bestMove && mv.uci === rawBefore.bestMove

    const nearBook = winLoss < 2.5
    const inBook = inBookPhase && i < 16 && nearBook
    if (!inBook) inBookPhase = false

    mv.classification = classify({
      ply: i,
      isBest,
      inBook,
      bestEvalMover,
      playedEvalMover,
      secondEvalMover,
      winBefore,
      winAfter,
      materialBefore: materialWhite(mv.fenBefore),
      materialAfter: materialWhite(mv.fenAfter),
      moverIsWhite,
    })
    mv.cpLoss = Math.max(0, bestEvalMover - playedEvalMover)
    mv.winBefore = winBefore
    mv.winAfter = winAfter
    mv.accuracy = moveAccuracy(winBefore, winAfter)
    mv.evalBefore = rawToWhiteEval(rawBefore, moverIsWhite)
    mv.evalAfter = rawToWhiteEval(rawAfter, !moverIsWhite)
    mv.bestMoveSan = uciToSan(mv.fenBefore, rawBefore.bestMove)
    mv.isBest = isBest

    opts.onMove?.(i, mv)
  }

  const total = positions.length
  for (let p = 0; p < total; p++) {
    if (opts.isCancelled?.()) return
    evals[p] = await engine.analyze(positions[p], { depth })
    opts.onProgress?.(p + 1, total)
    if (p >= 1) finalize(p - 1) // move (p-1) needs evals[p-1] and evals[p]
  }
}
