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

export interface AnalyzeOptions {
  depth?: number
  onProgress?: (done: number, total: number) => void
}

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
  // Convert side-to-move POV -> White POV.
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

export async function analyzeGame(
  pgn: string,
  engine: Engine,
  opts: AnalyzeOptions = {},
): Promise<GameReport> {
  const depth = opts.depth ?? 14
  const game = new Chess()
  game.loadPgn(pgn) // throws on invalid PGN
  const headers = game.header()
  const history = game.history({ verbose: true })
  if (history.length === 0) throw new Error('This PGN has no moves to analyze.')

  // Positions: [startFEN, fenAfterMove0, fenAfterMove1, ...]
  const positions: string[] = [history[0].before]
  for (const m of history) positions.push(m.after)

  const total = positions.length
  const evals: RawEval[] = []
  for (let i = 0; i < positions.length; i++) {
    evals.push(await engine.analyze(positions[i], { depth }))
    opts.onProgress?.(i + 1, total)
  }

  const moves: AnalyzedMove[] = []
  let inBookPhase = true

  for (let i = 0; i < history.length; i++) {
    const mv = history[i]
    const moverIsWhite = mv.color === 'w'
    const fenBefore = positions[i]
    const fenAfter = positions[i + 1]
    const rawBefore = evals[i] // side-to-move = mover
    const rawAfter = evals[i + 1] // side-to-move = opponent

    // Mover-POV centipawns
    const bestEvalMover = scoreToCp(rawBefore.scoreCp, rawBefore.mate)
    const playedEvalMover = -scoreToCp(rawAfter.scoreCp, rawAfter.mate)
    const secondEvalMover = rawBefore.second
      ? scoreToCp(rawBefore.second.scoreCp, rawBefore.second.mate)
      : null

    const winBefore = winPercent(bestEvalMover)
    const winAfter = winPercent(playedEvalMover)
    const winLoss = Math.max(0, winBefore - winAfter)

    const isBest = !!rawBefore.bestMove && mv.lan === rawBefore.bestMove

    const nearBook = winLoss < 2.5
    const inBook = inBookPhase && i < 16 && nearBook
    if (!inBook) inBookPhase = false

    const classification = classify({
      ply: i,
      isBest,
      inBook,
      bestEvalMover,
      playedEvalMover,
      secondEvalMover,
      winBefore,
      winAfter,
      materialBefore: materialWhite(fenBefore),
      materialAfter: materialWhite(fenAfter),
      moverIsWhite,
    })

    moves.push({
      ply: i,
      moveNumber: Math.floor(i / 2) + 1,
      color: mv.color,
      san: mv.san,
      uci: mv.lan,
      fenBefore,
      fenAfter,
      classification,
      cpLoss: Math.max(0, bestEvalMover - playedEvalMover),
      winBefore,
      winAfter,
      accuracy: moveAccuracy(winBefore, winAfter),
      evalBefore: rawToWhiteEval(rawBefore, moverIsWhite),
      evalAfter: rawToWhiteEval(rawAfter, !moverIsWhite),
      bestMoveSan: uciToSan(fenBefore, rawBefore.bestMove),
      isBest,
    })
  }

  const report = (color: 'w' | 'b'): PlayerReport => {
    const list = moves.filter((m) => m.color === color)
    const counts = EMPTY_COUNTS()
    let accSum = 0
    for (const m of list) {
      counts[m.classification]++
      accSum += m.accuracy
    }
    const accuracy = list.length ? accSum / list.length : 0
    return { accuracy, counts, estimatedElo: estimateElo(accuracy) }
  }

  return {
    headers,
    moves,
    white: report('w'),
    black: report('b'),
    opening: prettyOpening(headers),
  }
}
