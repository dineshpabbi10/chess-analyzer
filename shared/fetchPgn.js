// Shared PGN-resolution logic used by both the local dev proxy (server/index.js)
// and the Vercel serverless function (api/pgn.js). Resolves a chess.com or
// lichess game URL to a raw PGN string, sidestepping browser CORS. Node 18+.

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36'

export class PgnError extends Error {
  constructor(message, status = 502) {
    super(message)
    this.name = 'PgnError'
    this.status = status
  }
}

function detectSource(url) {
  const u = url.trim()
  if (/lichess\.org/i.test(u)) return 'lichess'
  if (/chess\.com/i.test(u)) return 'chesscom'
  return null
}

// ---- lichess ----
function lichessId(url) {
  const m = url.match(/lichess\.org\/([A-Za-z0-9]{8,12})/)
  return m ? m[1].slice(0, 8) : null
}

async function fetchLichess(url) {
  const id = lichessId(url)
  if (!id) throw new PgnError('Could not parse a lichess game id from that URL.', 400)
  const res = await fetch(
    `https://lichess.org/game/export/${id}?clocks=false&evals=false&literate=false`,
    { headers: { Accept: 'application/x-chess-pgn', 'User-Agent': UA } },
  )
  if (!res.ok) throw new PgnError(`Lichess returned ${res.status}. Is the game public?`)
  const pgn = await res.text()
  if (!/\[Event/i.test(pgn)) throw new PgnError('Lichess did not return a valid PGN.')
  return pgn
}

// ---- chess.com ----
function chesscomRef(url) {
  const m = url.match(/(live|daily)\/game\/(\d+)/) || url.match(/game\/(live|daily)\/(\d+)/)
  if (m) return { type: m[1], id: m[2] }
  const m2 = url.match(/\/(\d{6,})/)
  if (m2) return { type: 'live', id: m2[1] }
  return null
}

async function fetchArchivePgn(username, year, month, id) {
  const mm = String(month).padStart(2, '0')
  const res = await fetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/${year}/${mm}`,
    { headers: { 'User-Agent': UA } },
  )
  if (!res.ok) return null
  const data = await res.json()
  const g = (data.games || []).find((g) => (g.url || '').includes(String(id)))
  return g && g.pgn ? g.pgn : null
}

async function fetchChesscom(url) {
  const ref = chesscomRef(url)
  if (!ref) throw new PgnError('Could not parse a chess.com game id from that URL.', 400)
  const cb = await fetch(`https://www.chess.com/callback/${ref.type}/game/${ref.id}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  })
  if (!cb.ok) throw new PgnError(`chess.com returned ${cb.status} for game ${ref.id}.`)
  const json = await cb.json()
  const h = (json.game && json.game.pgnHeaders) || {}
  const date = h.Date
  if (!date || !/^\d{4}\.\d{2}/.test(date)) throw new PgnError('chess.com response missing game date.')
  const [year, month] = date.split('.')
  for (const user of [h.White, h.Black].filter(Boolean)) {
    const pgn = await fetchArchivePgn(user, year, month, ref.id)
    if (pgn) return pgn
  }
  throw new PgnError('Found the game but could not retrieve its PGN from the public archive.')
}

// Resolve a game URL to { pgn, source }. Throws PgnError (with .status) on failure.
export async function fetchPgn(url) {
  if (!url || typeof url !== 'string') throw new PgnError('Missing "url".', 400)
  const source = detectSource(url)
  if (!source) throw new PgnError('Only chess.com and lichess.org game links are supported.', 400)
  const pgn = source === 'lichess' ? await fetchLichess(url) : await fetchChesscom(url)
  return { pgn, source }
}

// ---------------------------------------------------------------------------
// Recent games by username (for the "load my games" picker).
// Returns a normalized list: { id, url, white, black, whiteElo, blackElo,
// result, timeClass, date, pgn }. PGN is included so picking a game analyzes
// immediately with no second round-trip.
// ---------------------------------------------------------------------------

const DRAW_RESULTS = new Set([
  'agreed',
  'repetition',
  'stalemate',
  'insufficient',
  '50move',
  'timevsinsufficient',
])

function chesscomResult(white, black) {
  if (white?.result === 'win') return '1-0'
  if (black?.result === 'win') return '0-1'
  if (DRAW_RESULTS.has(white?.result) || DRAW_RESULTS.has(black?.result)) return '1/2-1/2'
  return '*'
}

async function recentChesscom(username, max) {
  const user = encodeURIComponent(username.trim().toLowerCase())
  const archRes = await fetch(`https://api.chess.com/pub/player/${user}/games/archives`, {
    headers: { 'User-Agent': UA },
  })
  if (archRes.status === 404) throw new PgnError(`No chess.com player named "${username}".`, 404)
  if (!archRes.ok) throw new PgnError(`chess.com returned ${archRes.status}.`)
  const { archives = [] } = await archRes.json()
  if (!archives.length) throw new PgnError(`"${username}" has no games on chess.com yet.`, 404)

  // Walk back from the newest month until we have enough games (cap the work).
  const out = []
  for (const url of archives.slice(-3).reverse()) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) continue
    const { games = [] } = await res.json()
    for (const g of games) {
      if (!g.pgn) continue
      out.push({
        id: String(g.url || '').split('/').pop() || '',
        url: g.url || '',
        white: g.white?.username || '?',
        black: g.black?.username || '?',
        whiteElo: g.white?.rating ?? null,
        blackElo: g.black?.rating ?? null,
        result: chesscomResult(g.white, g.black),
        timeClass: g.time_class || 'unknown',
        date: g.end_time ? new Date(g.end_time * 1000).toISOString() : null,
        pgn: g.pgn,
      })
    }
    if (out.length >= max) break
  }
  out.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  return out.slice(0, max)
}

async function recentLichess(username, max) {
  const user = encodeURIComponent(username.trim())
  const url =
    `https://lichess.org/api/games/user/${user}` +
    `?max=${max}&pgnInJson=true&clocks=false&evals=false&opening=true`
  const res = await fetch(url, {
    headers: { Accept: 'application/x-ndjson', 'User-Agent': UA },
  })
  if (res.status === 404) throw new PgnError(`No lichess player named "${username}".`, 404)
  // Lichess allows only one concurrent request per IP and rate-limits hard.
  if (res.status === 429) {
    throw new PgnError('Lichess is rate-limiting us right now — wait a few seconds and retry.', 429)
  }
  if (!res.ok) throw new PgnError(`Lichess returned ${res.status}.`)

  const text = await res.text()
  const out = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    let g
    try {
      g = JSON.parse(trimmed)
    } catch {
      continue
    }
    if (g.error) throw new PgnError(String(g.error), 502)
    if (!g.pgn) continue
    const w = g.players?.white
    const b = g.players?.black
    out.push({
      id: g.id || '',
      url: g.id ? `https://lichess.org/${g.id}` : '',
      white: w?.user?.name || (w?.aiLevel ? `Stockfish lvl ${w.aiLevel}` : 'Anonymous'),
      black: b?.user?.name || (b?.aiLevel ? `Stockfish lvl ${b.aiLevel}` : 'Anonymous'),
      whiteElo: w?.rating ?? null,
      blackElo: b?.rating ?? null,
      result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2',
      timeClass: g.speed || 'unknown',
      date: g.createdAt ? new Date(g.createdAt).toISOString() : null,
      pgn: g.pgn,
    })
  }
  return out.slice(0, max)
}

/** List a player's recent games. Throws PgnError (with .status) on failure. */
export async function fetchRecentGames(platform, username, max = 20) {
  if (!username || typeof username !== 'string' || !username.trim()) {
    throw new PgnError('Missing "username".', 400)
  }
  const n = Math.max(1, Math.min(50, Number(max) || 20))
  if (platform === 'chesscom') return recentChesscom(username, n)
  if (platform === 'lichess') return recentLichess(username, n)
  throw new PgnError('platform must be "chesscom" or "lichess".', 400)
}
