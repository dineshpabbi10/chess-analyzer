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
