import type { Classification } from './types'

// A mate is worth more than any material score. Encode as a large centipawn value
// that saturates the win% curve while preserving "mate in fewer = better".
export function scoreToCp(cp: number | null, mate: number | null): number {
  if (mate != null) {
    const base = 10000 - Math.min(Math.abs(mate), 40) * 10
    return mate > 0 ? base : -base
  }
  return cp ?? 0
}

// chess.com / lichess win-probability model. Input: centipawns from the given
// side's point of view. Output: 0..100.
export function winPercent(cpForSide: number): number {
  const v = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cpForSide)) - 1)
  return Math.max(0, Math.min(100, v))
}

// Per-move accuracy from the drop in win probability (chess.com formula).
export function moveAccuracy(winBefore: number, winAfter: number): number {
  const loss = Math.max(0, winBefore - winAfter)
  const acc = 103.1668 * Math.exp(-0.04354 * loss) - 3.1669
  return Math.max(0, Math.min(100, acc))
}

const PIECE_VAL: Record<string, number> = { p: 100, n: 300, b: 300, r: 500, q: 900, k: 0 }

// Material balance from White's POV (centipawns) given a FEN.
export function materialWhite(fen: string): number {
  const board = fen.split(' ')[0]
  let sum = 0
  for (const ch of board) {
    if (ch >= 'A' && ch <= 'Z') sum += PIECE_VAL[ch.toLowerCase()] ?? 0
    else if (ch >= 'a' && ch <= 'z') sum -= PIECE_VAL[ch] ?? 0
  }
  return sum
}

export interface ClassifyInput {
  ply: number
  isBest: boolean
  inBook: boolean
  // all evals in centipawns, from the MOVER's point of view
  bestEvalMover: number // eval of the best move (position before, best play)
  playedEvalMover: number // eval after the move actually played
  secondEvalMover: number | null // eval of the engine's 2nd-best move (mover POV), if known
  winBefore: number // win% for mover before (from bestEvalMover)
  winAfter: number // win% for mover after (from playedEvalMover)
  // material, White POV
  materialBefore: number
  materialAfter: number
  moverIsWhite: boolean
}

export function classify(i: ClassifyInput): Classification {
  const winLoss = Math.max(0, i.winBefore - i.winAfter)

  if (i.inBook) return 'book'

  // --- Brilliant: a sound sacrifice that is (near) the best move ---
  // Mover invested material yet the position is not lost and the move is top-tier.
  const moverSign = i.moverIsWhite ? 1 : -1
  const investedMaterial = moverSign * (i.materialBefore - i.materialAfter) // >0 = gave up material
  if (
    winLoss < 2 &&
    investedMaterial >= 180 && // ~ a minor piece or more, net
    i.playedEvalMover > -60 && // still holding / winning
    i.winBefore < 98 && // not already trivially won
    i.winAfter > 12 // the sac didn't just lose
  ) {
    return 'brilliant'
  }

  // --- Great: the only move that keeps the advantage (alternatives much worse) ---
  if (
    winLoss < 2.5 &&
    i.secondEvalMover != null &&
    i.isBest &&
    i.winBefore > 15 &&
    i.winBefore < 98
  ) {
    const secondWin = winPercent(i.secondEvalMover)
    if (winPercent(i.bestEvalMover) - secondWin >= 10) return 'great'
  }

  // --- The rest keys off win% loss ---
  if (winLoss < 2) return i.isBest ? 'best' : 'excellent'
  if (winLoss < 5) return 'good'

  // Miss: had a clearly winning chance (or mate) and let most of it slip.
  const missedWin = i.bestEvalMover >= 300 || i.bestEvalMover >= 9000
  if (winLoss >= 10 && i.winBefore >= 55 && missedWin && i.playedEvalMover < i.bestEvalMover - 250) {
    return 'miss'
  }

  if (winLoss < 10) return 'inaccuracy'
  if (winLoss < 20) return 'mistake'
  return 'blunder'
}

// Rough estimated performance rating from average accuracy.
export function estimateElo(accuracy: number): number {
  const elo = Math.round(accuracy * 25 - 350)
  return Math.max(100, Math.min(3000, elo))
}
