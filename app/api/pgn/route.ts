import { fetchPgn } from '../../../shared/fetchPgn.js'

/** POST /api/pgn { url } -> { pgn, source } — proxies chess.com/Lichess past CORS. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const result = await fetchPgn(body?.url)
    return Response.json(result)
  } catch (e: any) {
    return Response.json(
      { error: e?.message || 'Failed to fetch the game.' },
      { status: e?.status || 502 },
    )
  }
}
