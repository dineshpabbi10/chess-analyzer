import { Chess } from 'chess.js'

// Puzzles come straight from the Lichess public puzzle API — no auth needed and
// it sends `Access-Control-Allow-Origin: *`, so we fetch from the browser. That
// means each user hits Lichess from their own IP (no shared rate limit for us)
// and we store no puzzle data at all.

export interface Puzzle {
  id: string
  fen: string // position to solve (derived from the game PGN — see normalize)
  solution: string[] // UCI moves, alternating: user, opponent, user, …
  rating: number
  themes: string[]
  /** Players/context from the source game, for flavour. */
  gameUrl: string | null
}

export type Difficulty = 'easiest' | 'easier' | 'normal' | 'harder' | 'hardest'

const API = 'https://lichess.org/api/puzzle'

function normalize(data: any): Puzzle {
  const p = data?.puzzle
  if (!p || !Array.isArray(p.solution) || !p.solution.length) {
    throw new Error('Lichess returned an unexpected puzzle shape.')
  }

  // /api/puzzle/daily includes `fen`, but /api/puzzle/next does NOT — there we
  // replay the source game's PGN up to `initialPly`. Verified convention:
  // history[initialPly].after is the position to solve (initialPly-1 is illegal).
  let fen: string | null = null
  if (typeof p.initialPly === 'number' && data?.game?.pgn) {
    try {
      const c = new Chess()
      c.loadPgn(data.game.pgn)
      const hist = c.history({ verbose: true })
      const node = hist[p.initialPly]
      if (node) fen = node.after
    } catch {
      /* fall through to p.fen */
    }
  }
  // Prefer the derived FEN (chess.js's own formatting, guaranteed self-consistent
  // with the moves we replay); fall back to the one Lichess supplies.
  if (!fen && typeof p.fen === 'string') fen = p.fen
  if (!fen) throw new Error('Could not work out the puzzle position.')

  return {
    id: String(p.id ?? ''),
    fen,
    solution: p.solution,
    rating: Number(p.rating) || 1500,
    themes: Array.isArray(p.themes) ? p.themes : [],
    gameUrl: data?.game?.id ? `https://lichess.org/${data.game.id}` : null,
  }
}

async function get(path: string): Promise<Puzzle> {
  let res: Response
  try {
    res = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } })
  } catch {
    throw new Error('Could not reach Lichess — check your connection.')
  }
  if (res.status === 429) {
    throw new Error('Lichess is rate-limiting requests. Wait a few seconds and try again.')
  }
  if (!res.ok) throw new Error(`Lichess returned ${res.status}.`)
  return normalize(await res.json())
}

/** Map our locally-tracked rating onto Lichess's relative difficulty buckets. */
export function difficultyForRating(rating: number): Difficulty {
  if (rating < 1000) return 'easiest'
  if (rating < 1400) return 'easier'
  if (rating < 1800) return 'normal'
  if (rating < 2200) return 'harder'
  return 'hardest'
}

export function fetchPuzzle(opts: { difficulty?: Difficulty; theme?: string } = {}) {
  const q = new URLSearchParams()
  if (opts.difficulty) q.set('difficulty', opts.difficulty)
  if (opts.theme) q.set('angle', opts.theme)
  const qs = q.toString()
  return get(`/next${qs ? `?${qs}` : ''}`)
}

export function fetchDailyPuzzle() {
  return get('/daily')
}

// ---------------------------------------------------------------------------
// Local progress (no account needed). Upgrade path: sync these to a DB later.
// ---------------------------------------------------------------------------

const KEY = 'fca.puzzles.v1'

export interface PuzzleProgress {
  rating: number
  solved: number
  failed: number
  streak: number // current daily-puzzle streak
  bestStreak: number
  lastDaily: string | null // YYYY-MM-DD of the last solved daily
  history: { id: string; rating: number; solved: boolean; delta: number }[]
}

export const DEFAULT_PROGRESS: PuzzleProgress = {
  rating: 1200,
  solved: 0,
  failed: 0,
  streak: 0,
  bestStreak: 0,
  lastDaily: null,
  history: [],
}

export function loadProgress(): PuzzleProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PROGRESS }
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROGRESS }
  }
}

export function saveProgress(p: PuzzleProgress) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...p, history: p.history.slice(-50) }))
  } catch {
    /* storage full or blocked — progress just won't persist */
  }
}

/**
 * Standard Elo against the puzzle's own rating. Because Lichess gives us the
 * puzzle rating, this is accurate even though we're unauthenticated.
 */
export function applyResult(prev: PuzzleProgress, puzzle: Puzzle, solved: boolean): PuzzleProgress {
  const expected = 1 / (1 + Math.pow(10, (puzzle.rating - prev.rating) / 400))
  const k = prev.solved + prev.failed < 20 ? 40 : 24 // settle faster at first
  const delta = Math.round(k * ((solved ? 1 : 0) - expected))
  return {
    ...prev,
    rating: Math.max(400, prev.rating + delta),
    solved: prev.solved + (solved ? 1 : 0),
    failed: prev.failed + (solved ? 0 : 1),
    history: [...prev.history, { id: puzzle.id, rating: puzzle.rating, solved, delta }],
  }
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayKey(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Record a solved daily puzzle, extending or resetting the streak. */
export function recordDaily(prev: PuzzleProgress): PuzzleProgress {
  const today = todayKey()
  if (prev.lastDaily === today) return prev // already counted
  const streak = prev.lastDaily === yesterdayKey() ? prev.streak + 1 : 1
  return {
    ...prev,
    streak,
    bestStreak: Math.max(prev.bestStreak, streak),
    lastDaily: today,
  }
}
