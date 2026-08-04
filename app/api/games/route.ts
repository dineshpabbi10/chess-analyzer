import { fetchRecentGames } from '../../../shared/fetchPgn.js'

/** GET /api/games?platform=&username=&max= -> { games } */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const games = await fetchRecentGames(
      searchParams.get('platform'),
      searchParams.get('username'),
      searchParams.get('max'),
    )
    return Response.json({ games })
  } catch (e: any) {
    return Response.json(
      { error: e?.message || 'Failed to list games.' },
      { status: e?.status || 502 },
    )
  }
}
