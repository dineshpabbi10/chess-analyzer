export type Classification =
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'book'
  | 'inaccuracy'
  | 'mistake'
  | 'miss'
  | 'blunder'

export interface EngineEval {
  // Always from White's point of view (centipawns). Mate encoded as large value.
  cp: number | null // null when mate is set
  mate: number | null // + = white mates in N, - = black mates in N (signed, white POV)
  bestMove: string | null // uci
  pv: string[]
  depth: number
}

export interface AnalyzedMove {
  ply: number // 0-based
  moveNumber: number // full move number
  color: 'w' | 'b'
  san: string
  uci: string
  fenBefore: string
  fenAfter: string
  // null until this move has been analyzed (streaming: filled in move-by-move).
  classification: Classification | null
  cpLoss: number // centipawn loss (>=0), white/black normalized to the mover
  winBefore: number // win% for the mover before the move (0-100)
  winAfter: number // win% for the mover after the move (0-100)
  accuracy: number // 0-100 for this move
  evalBefore: EngineEval | null // eval of position before the move (white POV)
  evalAfter: EngineEval | null // eval of position after the move (white POV)
  bestMoveSan: string | null // engine's preferred move in this position (SAN)
  isBest: boolean
}

export interface PlayerReport {
  accuracy: number
  counts: Record<Classification, number>
  estimatedElo: number
}

export interface GameReport {
  headers: Record<string, string>
  moves: AnalyzedMove[]
  white: PlayerReport
  black: PlayerReport
  opening: string
}
